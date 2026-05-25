// pages/HealthReport.jsx
import React, { useEffect, useState } from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppSidebar from "../components/AppSidebar";

const HealthReport = () => {
  const { type } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      const res = await fetch(`http://localhost:8000/generate-report-data/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const tooltipStyle = {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: "0.82rem",
  };

  return (
    <div className="page">
      <AppSidebar activePage="report" />

      <div className="report-page" style={{ paddingTop: "72px" }}>
        <button className="btn-back" onClick={() => navigate("/")}>← Dashboard</button>

        <h1 style={{ marginTop: 24 }}>
          <span style={{
            color: "var(--text-secondary)",
            fontWeight: 400,
            fontSize: "0.7em",
            display: "block",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            {type} report
          </span>
          Health Overview
        </h1>

        {/* Summary Cards */}
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

        {/* Line Chart */}
        <div className="chart-section">
          <h2>Recovery Progress</h2>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={report.report_data}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="avg_accuracy"
                stroke="var(--accent-green)"
                strokeWidth={3}
                dot={{ fill: "var(--accent-green)", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="chart-section">
          <h2>Calories Burned</h2>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={report.report_data}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="period" stroke="var(--text-muted)" tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="calories" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <button
          className="btn btn--primary"
          style={{ maxWidth: 280, marginTop: 8 }}
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