// pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { specialtyPrograms } from "../data/specialtyPrograms";

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
  const { logout, token } = useAuth();
  const navigate = useNavigate();

  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [streaks, setStreaks] = useState({});
  const [menuOpen, setMenuOpen] = useState({ sidebar: false, reportDropdown: false });
  const [profileCompleted, setProfileCompleted] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchUserScore();
    fetchStreaks();
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen({ sidebar: false, reportDropdown: false });
      }
    };
    if (menuOpen.sidebar) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen.sidebar]);

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
    } catch (err) { console.error(err); }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("http://localhost:8000/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileCompleted(data.profile_completed);
      }
    } catch {
      setProfileCompleted(false);
    }
  };

  const closeMenu = () => setMenuOpen({ sidebar: false, reportDropdown: false });

  const generateReport = (type) => {
    closeMenu();
    navigate(`/report/${type}`);
  };

  const getStreakDisplay = (name) => {
    const s = streaks[name];
    if (!s) return { count: 0, hasWarning: false, isBroken: false };
    return { count: s.current_streak, hasWarning: s.has_warning, isBroken: s.is_broken };
  };

  return (
    <div className="page">
      {/* Overlay */}
      {menuOpen.sidebar && (
        <div
          className="sidebar-overlay"
          onClick={closeMenu}
          style={{ opacity: 1, pointerEvents: "all" }}
        />
      )}

      {/* Sidebar */}
      <div
        ref={menuRef}
        className="sidebar"
        style={{ transform: menuOpen.sidebar ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__brand-icon">🏥</div>
            <span className="sidebar__brand-name">RehabPanel</span>
          </div>
          <button className="sidebar__close" onClick={closeMenu} aria-label="Close">✕</button>
        </div>

        <div className="sidebar__score">
          <span className="sidebar__score-label">Total Score</span>
          <span className="sidebar__score-value">{loading ? "…" : totalScore}</span>
        </div>

        <div className="sidebar__divider" />

        <nav className="sidebar__nav">
          {/* Report dropdown */}
          <div style={{ position: "relative" }}>
            <button
              className="sidebar__menu-btn"
              style={{ background: "var(--accent-purple)", color: "#fff", borderRadius: "var(--r-sm)", justifyContent: "space-between" }}
              onClick={() => setMenuOpen((p) => ({ ...p, reportDropdown: !p.reportDropdown }))}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="sidebar__menu-btn__icon">📄</span> Generate Health Report
              </span>
              <span style={{ fontSize: "0.75rem" }}>▼</span>
            </button>

            {menuOpen.reportDropdown && (
              <div className="report-dropdown">
                <button className="report-dropdown__item" onClick={() => generateReport("weekly")}>
                  📅 Weekly Report
                </button>
                <button className="report-dropdown__item" onClick={() => generateReport("monthly")}>
                  🗓️ Monthly Report
                </button>
              </div>
            )}
          </div>

          {/* Profile */}
          {profileCompleted === false && (
            <SidebarBtn icon="👤" label="Complete User Profile" color="var(--accent-blue)"
              onClick={() => { closeMenu(); navigate("/profile"); }} />
          )}
          {profileCompleted === true && (
            <SidebarBtn icon="✏️" label="Update Profile Info" color="var(--accent-green)"
              onClick={() => { closeMenu(); navigate("/profile"); }} />
          )}

          <SidebarBtn icon="🥗" label="Nutrition Plan" color="var(--accent-orange)"
            onClick={() => { closeMenu(); navigate("/nutrition"); }} />
        </nav>

        <div className="sidebar__footer">
          <SidebarBtn icon="🚪" label="Log Out" danger
            onClick={() => { closeMenu(); logout(); navigate("/login"); }} />
        </div>
      </div>

      {/* Hamburger */}
      <button className="hamburger" onClick={() => setMenuOpen((p) => ({ ...p, sidebar: true }))} aria-label="Open menu">
        <span className="hamburger__bar" />
        <span className="hamburger__bar" />
        <span className="hamburger__bar" />
      </button>

      {/* Main Content */}
      <div className="page--app" style={{ paddingTop: "72px" }}>
        {/* Header */}
        <header className="dashboard-header">
          <h1 className="page-title">Rehabilitation Control Panel</h1>
          <p className="page-subtitle" style={{ marginTop: 8 }}>Select an exercise to begin your session</p>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
            <div className="stat-card">
              <div className="stat-card__label">Total Score</div>
              <div className="stat-card__value">{loading ? "…" : totalScore}</div>
            </div>
          </div>
        </header>

        {/* Exercise Grid */}
        <section style={{ marginTop: 40 }}>
          <div className="grid--auto">
            {exercises.map((ex) => {
              const { count, hasWarning, isBroken } = getStreakDisplay(ex);
              const streakClass = isBroken ? "streak-count--broken" : hasWarning ? "streak-count--warn" : "streak-count--ok";
              return (
                <div key={ex} className="exercise-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <h3 className="exercise-card__name">{ex}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span className={`streak-count ${streakClass}`}>{count}</span>
                      <span style={{ fontSize: "1.2rem", filter: isBroken ? "grayscale(1) opacity(0.4)" : "none" }}>🔥</span>
                      {hasWarning && !isBroken && <span style={{ fontSize: "1.1rem" }}>⏳</span>}
                    </div>
                  </div>
                  <button
                    className="btn btn--primary"
                    onClick={() => navigate(`/exercise/${encodeURIComponent(ex)}`)}
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
            <h2 className="section-title" style={{ color: "var(--accent-yellow)" }}>Specialty Rehabilitation</h2>
            <p className="page-subtitle" style={{ marginTop: 8 }}>Select your condition to access guided recovery programs.</p>
          </div>
          <div className="grid--auto">
            {Object.keys(specialtyPrograms).map((condition) => (
              <div key={condition} className="specialty-card">
                <div>
                  <h3 className="specialty-card__title">{condition}</h3>
                  <p className="specialty-card__desc">Personalized rehabilitation exercises and recovery phases.</p>
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
    </div>
  );
};

const SidebarBtn = ({ icon, label, onClick, danger }) => (
  <button
    className={`sidebar__menu-btn${danger ? " sidebar__menu-btn--danger" : ""}`}
    onClick={onClick}
  >
    <span className="sidebar__menu-btn__icon">{icon}</span>
    {label}
  </button>
);

export default Dashboard;