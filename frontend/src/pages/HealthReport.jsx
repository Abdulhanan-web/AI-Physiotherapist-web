// pages/HealthReport.jsx
import React, { useEffect, useState } from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { specialtyPrograms } from "../data/specialtyPrograms";
import AppSidebar from "../components/AppSidebar";
import AppNavbar from "../components/AppNavbar";

/* ─── palette pulled from your design system ─── */
const ACCENT_BLUE   = "#3B82F6";
const ACCENT_GREEN  = "#34D399";
const ACCENT_YELLOW = "#FBBF24";
const ACCENT_PURPLE = "#A78BFA";
const ACCENT_RED    = "#F87171";
const ACCENT_SKY    = "#93C5FD";
const PIE_COLORS    = [
  ACCENT_BLUE, ACCENT_GREEN, ACCENT_YELLOW,
  ACCENT_PURPLE, ACCENT_RED, ACCENT_SKY,
  "#FB923C", "#38BDF8", "#4ADE80", "#F472B6",
];

/* ─── shared recharts tooltip style ─── */
const tooltipStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: "0.82rem",
};

/* ─── section wrapper ─── */
const ChartSection = ({ title, subtitle, children }) => (
  <div className="chart-section" style={{ marginTop: 32 }}>
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {subtitle && (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: 4 }}>
          {subtitle}
        </p>
      )}
    </div>
    {children}
  </div>
);

/* ─── empty-state ─── */
const Empty = () => (
  <div style={{
    height: 180, display: "flex", alignItems: "center",
    justifyContent: "center", color: "var(--text-muted)",
    fontSize: "0.85rem", fontFamily: "var(--font-mono)",
  }}>
    No data available for this period
  </div>
);

/* ─── custom pie label ─── */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.04) return null;
  const R = innerRadius + (outerRadius - innerRadius) * 0.5;
  const rad = (midAngle * Math.PI) / 180;
  const x = cx + R * Math.cos(-rad);
  const y = cy + R * Math.sin(-rad);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */
const HealthReport = () => {
  const { type } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      const res = await fetch(
        `http://localhost:8000/generate-report-data/${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setReport(data);
    };
    fetchReport();
  }, [type, token]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`http://localhost:8000/generate-report/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { alert("Failed to download report"); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_health_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error downloading PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (!report) return <div className="page-loading">Generating report…</div>;

  /* ── derived data ── */
  const daily       = report.daily_breakdown   || [];  // [{date, exercise_count, time_spent, calories}]
  const wearable    = report.wearable_daily    || [];  // [{date, steps, heart_rate, distance}]
  const exercisePie = report.exercise_totals   || [];  // [{exercise_name, count}]

  const hasDaily    = daily.length > 0;
  const hasWearable = wearable.length > 0;
  const hasPie      = exercisePie.length > 0;

  return (
    <div className="page">
      <AppSidebar activePage="report" />
      <AppNavbar activePage="report" specialtyPrograms={specialtyPrograms} />

      <div className="report-page" style={{ paddingTop: 72 }}>

        {/* ── Header ── */}
        <h1 style={{ marginTop: 24 }}>
          <span style={{
            color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.7em",
            display: "block", textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            {type} report
          </span>
          Health Overview
        </h1>

        {/* ── Summary cards ── */}
        <div className="report-summary">
          {[
            { label: "Sessions",        value: report.summary.total_sessions },
            { label: "Calories Burned", value: report.summary.total_calories },
            { label: "Minutes Active",  value: report.summary.total_minutes },
            { label: "Avg. Accuracy",   value: `${report.summary.average_accuracy}%` },
          ].map(({ label, value }) => (
            <div key={label} className="report-summary-card">
              <div className="report-summary-card__label">{label}</div>
              <div className="report-summary-card__value">{value}</div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════
            1. EXERCISES DONE DAILY — bar chart
            ══════════════════════════════════════ */}
        <ChartSection
          title="Exercises Done Per Day"
          subtitle="Total number of exercise sessions completed each day"
        >
          {hasDaily ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={daily} barCategoryGap="30%">
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
                  allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="exercise_count" name="Exercises" fill={ACCENT_BLUE}
                  radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartSection>

        {/* ══════════════════════════════════════
            2. TIME SPENT DAILY — line chart
            ══════════════════════════════════════ */}
        <ChartSection
          title="Time Spent on Exercises Daily"
          subtitle="Total minutes of rehabilitation exercise per day"
        >
          {hasDaily ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={daily}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} min`, "Time Spent"]} />
                <Line type="monotone" dataKey="time_spent" name="Minutes"
                  stroke={ACCENT_GREEN} strokeWidth={3}
                  dot={{ fill: ACCENT_GREEN, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartSection>

        {/* ══════════════════════════════════════
            3. ACCURACY TREND — line chart
            ══════════════════════════════════════ */}
        <ChartSection
          title="Recovery Accuracy Trend"
          subtitle="Average pose accuracy per session period"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={report.report_data}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="period" stroke="var(--text-muted)"
                tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)"
                tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Accuracy"]} />
              <Line type="monotone" dataKey="avg_accuracy" name="Accuracy"
                stroke={ACCENT_YELLOW} strokeWidth={3}
                dot={{ fill: ACCENT_YELLOW, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* ══════════════════════════════════════
            4. EXERCISE BREAKDOWN — pie chart
            ══════════════════════════════════════ */}
        <ChartSection
          title={`Exercise Breakdown — ${type === "weekly" ? "This Week" : "This Month"}`}
          subtitle="How your sessions are distributed across different exercises"
        >
          {hasPie ? (
            <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
              <ResponsiveContainer width={340} height={300}>
                <PieChart>
                  <Pie
                    data={exercisePie}
                    dataKey="count"
                    nameKey="exercise_name"
                    cx="50%" cy="50%"
                    outerRadius={120}
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {exercisePie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle}
                    formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>

              {/* custom legend */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 200 }}>
                {exercisePie.map((ex, i) => (
                  <div key={ex.exercise_name}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                      background: PIE_COLORS[i % PIE_COLORS.length],
                    }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem",
                      color: "var(--text-secondary)", flex: 1 }}>
                      {ex.exercise_name}
                    </span>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700,
                      fontSize: "0.9rem", color: "var(--text-primary)" }}>
                      {ex.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty />}
        </ChartSection>

        {/* ══════════════════════════════════════
            5. CALORIES BURNED — bar chart
            ══════════════════════════════════════ */}
        <ChartSection
          title="Calories Burned"
          subtitle="Total calories burned per session period"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={report.report_data} barCategoryGap="30%">
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="period" stroke="var(--text-muted)"
                tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)"
                tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kcal`, "Calories"]} />
              <Bar dataKey="calories" name="Calories" fill={ACCENT_PURPLE}
                radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* ── Wearable section header (only if data exists) ── */}
        {hasWearable && (
          <div style={{
            marginTop: 48, marginBottom: 8,
            paddingBottom: 16,
            borderBottom: "1px solid var(--border)",
          }}>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: "0.7rem",
              textTransform: "uppercase", letterSpacing: "0.12em",
              color: "var(--text-muted)", marginBottom: 4,
            }}>
              Google Fit · Wearable Data
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "1.6rem",
              fontWeight: 800, letterSpacing: "-0.02em",
            }}>
              Activity Tracking
            </h2>
          </div>
        )}

        {/* ══════════════════════════════════════
            6. DAILY STEPS — bar chart
            ══════════════════════════════════════ */}
        {hasWearable && (
          <ChartSection
            title="Daily Steps"
            subtitle="Steps tracked via Google Fit each day"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wearable} barCategoryGap="30%">
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v) => [v.toLocaleString(), "Steps"]} />
                <Bar dataKey="steps" name="Steps" fill={ACCENT_GREEN}
                  radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {/* ══════════════════════════════════════
            7. HEART RATE — bar chart
            ══════════════════════════════════════ */}
        {hasWearable && (
          <ChartSection
            title="Daily Heart Rate"
            subtitle="Average heart rate (bpm) per day from Google Fit"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wearable} barCategoryGap="30%">
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
                  domain={["auto", "auto"]} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v) => [`${v} bpm`, "Heart Rate"]} />
                <Bar dataKey="heart_rate" name="Heart Rate" fill={ACCENT_RED}
                  radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {/* ══════════════════════════════════════
            8. DISTANCE — line chart
            ══════════════════════════════════════ */}
        {hasWearable && (
          <ChartSection
            title="Daily Distance Travelled"
            subtitle="Distance (km) covered each day via Google Fit"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={wearable}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)"
                  tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v) => [`${v.toFixed(2)} km`, "Distance"]} />
                <Line type="monotone" dataKey="distance" name="Distance"
                  stroke={ACCENT_SKY} strokeWidth={3}
                  dot={{ fill: ACCENT_SKY, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {/* ── Wearable not connected notice ── */}
        {!hasWearable && (
          <div style={{
            marginTop: 32, padding: "20px 24px",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: "1.4rem" }}>⌚</span>
            <div>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>
                No wearable data available
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Connect Google Fit to see steps, heart rate, and distance charts.
              </p>
            </div>
          </div>
        )}

        {/* ── Download button ── */}
        <button
          className="btn btn--primary"
          style={{ maxWidth: 280, marginTop: 40, marginBottom: 48 }}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? "Generating PDF…" : "⬇ Download PDF Report"}
        </button>

      </div>
    </div>
  );
};

export default HealthReport;