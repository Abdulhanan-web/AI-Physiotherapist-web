// pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { specialtyPrograms } from "../data/specialtyPrograms";
import GoogleFitConnect from "./GoogleFitConnect";
import AppSidebar from "../components/AppSidebar";

const exercises = [
  "Elbow Flexion Left",
  "Elbow Flexion Right",
  "Shoulder Flexion Left",
  "Shoulder Flexion Right",
  "Shoulder Abduction Left",
  "Shoulder Abduction Right",
  "Shoulder Forward Elevation",
  "Side Tap Left",
  "Side Tap Right",
];

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
        data.forEach((s) => {
          map[s.exercise_name] = s;
        });
        setStreaks(map);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStreakDisplay = (name) => {
    const s = streaks[name];
    if (!s) return { count: 0, hasWarning: false, isBroken: false };
    return {
      count: s.current_streak,
      hasWarning: s.has_warning,
      isBroken: s.is_broken,
    };
  };

  return (
    <div className="page">
      <AppSidebar activePage="dashboard" />

      <div className="page--app" style={{ paddingTop: "72px" }}>
        {/* Header */}
        <header className="dashboard-header">
          <h1 className="page-title">Rehabilitation Control Panel</h1>
          <p className="page-subtitle" style={{ marginTop: 8 }}>
            Select an exercise to begin your session
          </p>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
            <div className="stat-card">
              <div className="stat-card__label">Total Score</div>
              <div className="stat-card__value">
                {loading ? "…" : totalScore}
              </div>
            </div>
          </div>
        </header>
        <GoogleFitConnect />

        {/* Exercise Grid */}
        <section style={{ marginTop: 40 }}>
          <div className="grid--auto">
            {exercises.map((ex) => {
              const { count, hasWarning, isBroken } = getStreakDisplay(ex);

              const streakClass = isBroken
                ? "streak-count--broken"
                : hasWarning
                ? "streak-count--warn"
                : "streak-count--ok";

              return (
                <div key={ex} className="exercise-card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 20,
                    }}
                  >
                    <h3 className="exercise-card__name">{ex}</h3>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={`streak-count ${streakClass}`}>
                        {count}
                      </span>
                      <span
                        style={{
                          fontSize: "1.2rem",
                          filter: isBroken
                            ? "grayscale(1) opacity(0.4)"
                            : "none",
                        }}
                      >
                        🔥
                      </span>
                      {hasWarning && !isBroken && (
                        <span style={{ fontSize: "1.1rem" }}>⏳</span>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn btn--primary"
                    onClick={() =>
                      navigate(`/exercise/${encodeURIComponent(ex)}`)
                    }
                  >
                    Start Exercise
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Specialty Section */}
        <section className="specialty-section">
          <div style={{ marginBottom: 28 }}>
            <h2
              className="section-title"
              style={{ color: "var(--accent-yellow)" }}
            >
              Specialty Rehabilitation
            </h2>
            <p className="page-subtitle" style={{ marginTop: 8 }}>
              Select your condition to access guided recovery programs.
            </p>
          </div>

          <div className="grid--auto">
            {Object.keys(specialtyPrograms).map((condition) => (
              <div key={condition} className="specialty-card">
                {/* ✅ Content wrapper added */}
                <div className="specialty-card__content">
                  <h3 className="specialty-card__title">{condition}</h3>
                  <p className="specialty-card__desc">
                    Personalized rehabilitation exercises and recovery phases.
                  </p>
                </div>

                <button
                  className="btn btn--blue"
                  onClick={() =>
                    navigate(`/specialty/${encodeURIComponent(condition)}`)
                  }
                >
                  View Recovery Plan
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;