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
  const [reportLoading, setReportLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(null); // null = loading
  const menuRef = useRef(null);

  useEffect(() => {
    fetchUserScore();
    fetchStreaks();
    fetchProfile();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const fetchUserScore = async () => {
    try {
      const response = await fetch("http://localhost:8000/user-score", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTotalScore(data.total_score);
      }
    } catch (error) {
      console.error("Error fetching user score:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreaks = async () => {
    try {
      const response = await fetch("http://localhost:8000/streaks", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const streakMap = {};
        data.forEach((streak) => {
          streakMap[streak.exercise_name] = streak;
        });
        setStreaks(streakMap);
      }
    } catch (error) {
      console.error("Error fetching streaks:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch("http://localhost:8000/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfileCompleted(data.profile_completed);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfileCompleted(false);
    }
  };

  const generateReport = async () => {
    try {
      setReportLoading(true);
      setMenuOpen(false);
      const response = await fetch("http://localhost:8000/generate-report", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to generate report");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "health_report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error generating report");
    } finally {
      setReportLoading(false);
    }
  };

  const getStreakDisplay = (exerciseName) => {
    const streak = streaks[exerciseName];
    if (!streak) return { count: 0, hasWarning: false, isBroken: false };
    return {
      count: streak.current_streak,
      hasWarning: streak.has_warning,
      isBroken: streak.is_broken,
    };
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        color: "white",
        padding: "40px 60px",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Overlay ── */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          zIndex: 998,
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "all" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* ── Side Menu ── */}
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "300px",
          backgroundColor: "#111827",
          zIndex: 999,
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: menuOpen ? "6px 0 30px rgba(0,0,0,0.5)" : "none",
          borderRight: "1px solid #1f2937",
        }}
      >
        {/* Menu Header */}
        <div
          style={{
            padding: "28px 24px 20px",
            borderBottom: "1px solid #1f2937",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2ecc71, #3498db)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
              }}
            >
              🏥
            </div>
            <span style={{ fontWeight: "700", fontSize: "1rem", color: "#f9fafb" }}>
              RehabPanel
            </span>
          </div>
          {/* Close button */}
          <button
            onClick={() => setMenuOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "1.3rem",
              lineHeight: 1,
              padding: "4px",
              borderRadius: "6px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#f9fafb")}
            onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Score pill inside menu */}
        <div style={{ padding: "20px 24px" }}>
          <div
            style={{
              backgroundColor: "#1f2937",
              borderRadius: "12px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#9ca3af", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>
              Total Score
            </span>
            <span style={{ color: "#2ecc71", fontSize: "1.8rem", fontWeight: "900" }}>
              {loading ? "…" : totalScore}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", backgroundColor: "#1f2937", margin: "0 24px" }} />

        {/* Menu Actions */}
        <nav style={{ padding: "16px 16px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          {/* Generate Report */}
          <MenuButton
            icon="📄"
            label={reportLoading ? "Generating…" : "Generate Health Report"}
            onClick={generateReport}
            disabled={reportLoading}
            color="#9b59b6"
            hoverColor="#8e44ad"
          />

          {/* Profile button — changes based on completion status */}
          {profileCompleted === false && (
            <MenuButton
              icon="👤"
              label="Complete User Profile"
              onClick={() => {
                setMenuOpen(false);
                navigate("/profile");
              }}
              color="#3498db"
              hoverColor="#2980b9"
            />
          )}
          {profileCompleted === true && (
            <MenuButton
              icon="✏️"
              label="Update Profile Info"
              onClick={() => {
                setMenuOpen(false);
                navigate("/profile");
              }}
              color="#27ae60"
              hoverColor="#219150"
            />
          )}
        </nav>

        {/* Logout — pinned to bottom */}
        <div style={{ padding: "16px 16px 28px" }}>
          <div style={{ height: "1px", backgroundColor: "#1f2937", marginBottom: "16px" }} />
          <MenuButton
            icon="🚪"
            label="Log Out"
            onClick={() => {
              setMenuOpen(false);
              logout();
              navigate("/login");
            }}
            color="#e74c3c"
            hoverColor="#c0392b"
          />
        </div>
      </div>

      {/* ── Hamburger Button ── */}
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 997,
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "10px",
          width: "46px",
          height: "46px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#374151")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#1f2937")}
      >
        <span style={{ display: "block", width: "20px", height: "2px", background: "#f9fafb", borderRadius: "2px" }} />
        <span style={{ display: "block", width: "20px", height: "2px", background: "#f9fafb", borderRadius: "2px" }} />
        <span style={{ display: "block", width: "20px", height: "2px", background: "#f9fafb", borderRadius: "2px" }} />
      </button>

      {/* ── Header Section ── */}
      <div style={{ textAlign: "center", marginBottom: "50px", paddingTop: "10px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "10px" }}>
          Rehabilitation Exercise Control Panel
        </h1>
        <p style={{ color: "#aaa" }}>Select an exercise to begin your session</p>

        {/* Score Card (center, no buttons here anymore) */}
        <div style={{ marginTop: "30px", display: "flex", justifyContent: "center" }}>
          <div
            style={{
              padding: "20px 40px",
              backgroundColor: "#2c3e50",
              borderRadius: "14px",
              display: "inline-block",
              boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
            }}
          >
            <p style={{ margin: 0, color: "#bdc3c7", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>
              TOTAL SCORE
            </p>
            <h2 style={{ margin: "10px 0 0 0", color: "#2ecc71", fontSize: "2.8rem", fontWeight: "900" }}>
              {loading ? "..." : totalScore}
            </h2>
          </div>
        </div>
      </div>

      {/* ── Exercise Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "25px",
          maxWidth: "100vw",
          margin: "40px auto",
        }}
      >
        {exercises.map((ex, index) => {
          const { count, hasWarning, isBroken } = getStreakDisplay(ex);
          return (
            <div
              key={index}
              style={{
                padding: "30px",
                background: "#ffffff",
                borderRadius: "16px",
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "flex-start",
                transition: "transform 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-5px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                  }}
                >
                  <h3 style={{ color: "#2d3436", margin: "0", fontSize: "1.25rem", fontWeight: "600" }}>
                    {ex}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: isBroken ? "#dc3545" : hasWarning ? "#ff6b00" : "#28a745",
                      }}
                    >
                      {count}
                    </span>
                    <span style={{ fontSize: "1.3rem", filter: isBroken ? "grayscale(1) opacity(0.5)" : "none" }}>
                      🔥
                    </span>
                    {hasWarning && !isBroken && (
                      <span style={{ fontSize: "1.2rem", marginLeft: "2px" }}>⏳</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/exercise/${encodeURIComponent(ex)}`)}
                style={{
                  backgroundColor: "#2ecc71",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: "1rem",
                  transition: "background 0.3s ease",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#27ae60")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#2ecc71")}
              >
                Start Exercise
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Specialty Rehabilitation Section ── */}
      <div style={{ marginTop: "70px", maxWidth: "1200px", marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "700", color: "#f1c40f", marginBottom: "10px" }}>
            Specialty Rehabilitation
          </h2>
          <p style={{ color: "#aaa", fontSize: "1rem" }}>
            Select your condition to access guided rehabilitation programs.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px" }}>
          {Object.keys(specialtyPrograms).map((condition, index) => (
            <div
              key={index}
              style={{
                background: "#2c3e50",
                borderRadius: "18px",
                padding: "30px",
                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-5px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <h3 style={{ marginBottom: "15px", fontSize: "1.4rem", color: "#fff" }}>{condition}</h3>
              <p style={{ color: "#bdc3c7", marginBottom: "25px", lineHeight: "1.5" }}>
                Personalized rehabilitation exercises and recovery phases.
              </p>
              <button
                onClick={() => navigate(`/specialty/${encodeURIComponent(condition)}`)}
                style={{
                  width: "100%",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  padding: "14px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  transition: "background 0.3s ease",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#2980b9")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#3498db")}
              >
                View Recovery Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Reusable menu button ── */
const MenuButton = ({ icon, label, onClick, disabled = false, color, hoverColor }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "13px 16px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: hovered ? color : "transparent",
        color: hovered ? "#fff" : "#d1d5db",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "0.95rem",
        fontWeight: "500",
        textAlign: "left",
        transition: "background-color 0.2s, color 0.2s",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: "1.1rem", minWidth: "22px", textAlign: "center" }}>{icon}</span>
      {label}
    </button>
  );
};

export default Dashboard;
