// pages/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { specialtyPrograms } from "../data/specialtyPrograms";
import exerciseModels from "../data/exerciseModels";
import EXERCISE_INFO from "../data/exerciseInfo";
import exercises from "../data/exercises";
import AppSidebar from "../components/AppSidebar";
import AppNavbar from "../components/AppNavbar";
import HeroSection from "../components/HeroSection";
import ExerciseModelCard from "../components/ExerciseModelCard";
import AppFooter from "../components/AppFooter";

// ─── Portal-based expanded card overlay ──────────────────────────────────────
const ExpandedCardPortal = ({ name, streak, info, originRect, onClose, onStart }) => {
  const [phase, setPhase] = useState("entering"); // entering → open → closing
  const overlayRef = useRef(null);

  const { count, hasWarning, isBroken } = streak;
  const streakClass = isBroken
    ? "streak-count--broken"
    : hasWarning
      ? "streak-count--warn"
      : "streak-count--ok";

  // Animate in on mount
  useEffect(() => {
    // Frame 1: start at card's position (entering)
    // Frame 2: animate to center (open)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Close with reverse animation
  const handleClose = useCallback(() => {
    setPhase("closing");
    setTimeout(onClose, 380);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  // Computed origin transform so card animates FROM the clicked card's position
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardCx = originRect.left + originRect.width / 2;
  const cardCy = originRect.top + originRect.height / 2;
  const dx = cardCx - vw / 2;
  const dy = cardCy - vh / 2;

  const isOpen = phase === "open";

  const cardStyle = {
    position: "fixed",
    top: "50%",
    left: "50%",
    width: Math.min(520, vw - 32),
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: 18,
    padding: "28px 28px 24px",
    boxShadow: isOpen
      ? "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(41,121,255,0.25)"
      : "0 8px 24px rgba(0,0,0,0.3)",
    zIndex: 10000,
    transform: isOpen
      ? "translate(-50%, -50%) scale(1)"
      : `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${originRect.width / Math.min(520, vw - 32)
      })`,
    transformOrigin: "center center",
    transition: isOpen
      ? "transform 0.42s cubic-bezier(0.34,1.18,0.64,1), box-shadow 0.4s ease, opacity 0.3s ease"
      : "transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease, opacity 0.25s ease",
    opacity: isOpen ? 1 : 0,
    color: "#1a1f2e",
  };

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(10,15,30,0.7)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    zIndex: 9999,
    opacity: isOpen ? 1 : 0,
    transition: "opacity 0.35s ease",
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div style={backdropStyle} onClick={handleClose} />

      {/* Expanded card */}
      <div style={cardStyle}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontFamily: "var(--font-display, 'Syne', sans-serif)",
                fontSize: "1.35rem",
                fontWeight: 800,
                margin: 0,
                color: "#1a1f2e",
                letterSpacing: "-0.02em",
              }}
            >
              {name}
            </h3>
            {/* Streak badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <span className={`streak-count ${streakClass}`} style={{ fontSize: "1rem" }}>{count}</span>
              <span style={{ fontSize: "1rem", filter: isBroken ? "grayscale(1) opacity(0.4)" : "none" }}>🔥</span>
              {hasWarning && !isBroken && <span style={{ fontSize: "0.9rem" }}>⏳</span>}
              <span style={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                day streak
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              background: "#f0f2f5",
              border: "none",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1rem",
              color: "#555",
              flexShrink: 0,
              marginLeft: 12,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#dde1e7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f0f2f5")}
          >
            ✕
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(26,31,46,0.1)", marginBottom: 18 }} />

        {/* Description */}
        <p style={{ fontSize: "0.9rem", color: "#444", lineHeight: 1.7, marginBottom: 20 }}>
          {info.description}
        </p>

        {/* Steps */}
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#2979ff",
            marginBottom: 10,
          }}
        >
          How to perform safely
        </p>
        <ol style={{ paddingLeft: 20, margin: "0 0 24px" }}>
          {info.steps.map((step, i) => (
            <li
              key={i}
              style={{
                fontSize: "0.86rem",
                color: "#333",
                lineHeight: 1.65,
                marginBottom: i < info.steps.length - 1 ? 8 : 0,
              }}
            >
              {step}
            </li>
          ))}
        </ol>

        {/* Start button */}
        <button
          className="btn btn--primary"
          style={{ width: "100%", marginTop: 4 }}
          onClick={() => onStart(name)}
        >
          Start Exercise
        </button>
      </div>
    </>,
    document.body
  );
};

// ─── Collapsed exercise card (ghost placeholder) ──────────────────────────────
const ExerciseCard = ({ name, streak, onStart }) => {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);
  const [originRect, setOriginRect] = useState(null);

  const info = EXERCISE_INFO[name] || {
    description: "A rehabilitation exercise to aid your recovery.",
    steps: ["Follow the on-screen pose guidance during the session."],
  };

  const { count, hasWarning, isBroken } = streak;
  const streakClass = isBroken
    ? "streak-count--broken"
    : hasWarning
      ? "streak-count--warn"
      : "streak-count--ok";

  const handleClick = () => {
    if (cardRef.current) {
      setOriginRect(cardRef.current.getBoundingClientRect());
    }
    setExpanded(true);
  };

  return (
    <>
      {/* Always-visible card tile */}
      <div
        ref={cardRef}
        className="exercise-card"
        style={{
          cursor: "pointer",
          userSelect: "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease",
          opacity: expanded ? 0.45 : 1,
        }}
        onClick={handleClick}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="exercise-card__name" style={{ flex: 1 }}>{name}</h3>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span className={`streak-count ${streakClass}`}>{count}</span>
            <span style={{ fontSize: "1.2rem", filter: isBroken ? "grayscale(1) opacity(0.4)" : "none" }}>🔥</span>
            {hasWarning && !isBroken && <span style={{ fontSize: "1.1rem" }}>⏳</span>}

            {/* Expand hint icon */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "#e8eaf0",
                color: "#1a1f2e",
                fontSize: "0.75rem",
                marginLeft: 4,
                flexShrink: 0,
              }}
            >
              ⤢
            </span>
          </div>
        </div>

        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 10, lineHeight: 1.5 }}>
          Tap to view details &amp; start →
        </p>
      </div>

      {/* Portal overlay — only when expanded */}
      {expanded && originRect && (
        <ExpandedCardPortal
          name={name}
          streak={streak}
          info={info}
          originRect={originRect}
          onClose={() => setExpanded(false)}
          onStart={onStart}
        />
      )}
    </>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streaks, setStreaks] = useState({});

  useEffect(() => {
    fetchUserScore();
    fetchStreaks();
  }, []);

  const fetchUserScore = async () => {
    try {
      const response = await fetch("http://localhost:8000/user-score", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTotalScore(data.total_score);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreaks = async () => {
    try {
      const response = await fetch("http://localhost:8000/streaks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const map = {};
        data.forEach((s) => { map[s.exercise_name] = s; });
        setStreaks(map);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStreakDisplay = (name) => {
    const s = streaks[name];
    if (!s) return { count: 0, hasWarning: false, isBroken: false };
    return { count: s.current_streak, hasWarning: s.has_warning, isBroken: s.is_broken };
  };

  return (
    <div className="page">
      <AppNavbar
        activePage="dashboard"
        specialtyPrograms={specialtyPrograms}
      />
      <AppSidebar activePage="dashboard" />
      {/* Hero Banner */}
      <HeroSection
        exercisesCount={exercises.length}
        programsCount={Object.keys(specialtyPrograms).length}
      />

      {/* Intro Strip */}
      <div className="rp-intro">
        <div className="rp-intro-text">
          At SpineSense, every exercise plan is personalised,
          every session is AI-monitored, and every outcome is measurable.
        </div>

        <div className="rp-intro-quote">
          Because healing isn't about temporary relief —
          it's about restoring life to its fullest potential.
        </div>
      </div>


      <div className="page--app" style={{ paddingTop: "20px" }}>
        {/* Header */}
        <header className="dashboard-header">
          <div className="rp-section">
            <div className="exercise-divider">
              <span className="exercise-divider__line"></span>

              <h2 className="exercise-divider__title">
                EXERCISE LIBRARY
              </h2>

              <span className="exercise-divider__line"></span>
            </div>

            <div className="rp-section-title">
              Start your session today
            </div>

            <div className="rp-section-sub">
              Choose from clinically validated rehabilitation exercises
              with real-time AI form correction and streak tracking.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 28,
              gap: 20,
            }}
          >

            <div
              style={{
                width: "100%",
                marginTop: 20,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
                  gap: 20,
                }}
              >
                {exerciseModels.map((item) => (
                  <ExerciseModelCard
                    key={item.title}
                    model={item.model}
                    title={item.title}
                    description={EXERCISE_INFO[item.title]?.description}
                    steps={EXERCISE_INFO[item.title]?.steps}
                    streak={getStreakDisplay(item.title)}
                    onStart={() =>
                      navigate(`/exercise/${encodeURIComponent(item.title)}`)
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Specialty Section */}
        <section className="specialty-section">
          <div className="specialty-header">

            <div className="exercise-divider">
              <span className="exercise-divider__line"></span>

              <h2 className="exercise-divider__title">
                SPECIALTY REHABILITATION
              </h2>

              <span className="exercise-divider__line"></span>
            </div>

            <p className="specialty-header__subtitle">
              Select your condition to access guided recovery programs.
            </p>

          </div>

          <div className="grid--auto">
            {Object.keys(specialtyPrograms).map((condition) => (
              <div key={condition} className="specialty-card">
                <div className="specialty-card__content">
                  <h3 className="specialty-card__title">{condition}</h3>
                  <p className="specialty-card__desc">
                    Personalized rehabilitation exercises and recovery phases.
                  </p>
                </div>
                <button
                  className="btn btn--blue"
                  onClick={() => navigate(`/specialty/${encodeURIComponent(condition)}`)}
                >
                  View Recovery Plan
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
      <AppFooter />
    </div>

  );
};

export default Dashboard;