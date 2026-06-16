import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";

const AppNavbar = ({ activePage, specialtyPrograms }) => {
  const navigate = useNavigate();
  const { logout, token } = useAuth();

  const [dropdown, setDropdown] = useState(false);
  const [programMenu, setProgramMenu] = useState(false);
  const [reportMenu, setReportMenu] = useState(false);

  const [totalScore, setTotalScore] = useState(0);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  const menuRef = useRef(null);
  const programRef = useRef(null);
  const reportRef = useRef(null);

  // Theme sync
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Fetch user score
  useEffect(() => {
    const fetchScore = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/user-score",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTotalScore(data.total_score);
        }
      } catch (error) {
        console.error("Failed to fetch score:", error);
      }
    };

    if (token) {
      fetchScore();
    }
  }, [token]);

  // Outside click handler
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdown(false);
      }

      if (programRef.current && !programRef.current.contains(e.target)) {
        setProgramMenu(false);
      }

      if (reportRef.current && !reportRef.current.contains(e.target)) {
        setReportMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Google Fit connect
  const connectGoogleFit = useGoogleLogin({
    flow: "auth-code",
    scope:
      "https://www.googleapis.com/auth/fitness.activity.read " +
      "https://www.googleapis.com/auth/fitness.body.read " +
      "https://www.googleapis.com/auth/fitness.heart_rate.read " +
      "https://www.googleapis.com/auth/fitness.location.read " +
      "openid profile email",
    prompt: "consent",

    onSuccess: async (codeResponse) => {
      try {
        await fetch("http://localhost:8000/google-fit/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            code: codeResponse.code,
          }),
        });

        setDropdown(false);
      } catch (error) {
        console.error("Google Fit connection failed:", error);
      }
    },
  });

  return (
    <header className="app-navbar">

      {/* LOGO */}
      <div
        className="navbar-logo"
        onClick={() => navigate("/")}
      >
        🏥 RehabPanel
      </div>

      {/* CENTER NAV */}
      <nav className="navbar-center">

        <button
          className={activePage === "dashboard" ? "nav-active" : ""}
          onClick={() => navigate("/")}
        >
          Dashboard
        </button>

        {/* PROGRAMS DROPDOWN */}
        <div
          className="program-menu"
          ref={programRef}
        >
          <button
            className={activePage === "program" ? "nav-active" : ""}
            onClick={() => setProgramMenu((prev) => !prev)}
          >
            Programs ▾
          </button>

          {programMenu && (
            <div className="program-dropdown">
              {Object.keys(specialtyPrograms || {}).map((program) => (
                <button
                  key={program}
                  onClick={() => {
                    navigate(
                      `/specialty/${encodeURIComponent(program)}`
                    );
                    setProgramMenu(false);
                  }}
                >
                  {program}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className={activePage === "nutrition" ? "nav-active" : ""}
          onClick={() => navigate("/nutrition")}
        >
          Nutrition Plan
        </button>

        {/* REPORT DROPDOWN */}
        <div
          className="program-menu"
          ref={reportRef}
        >
          <button
            className={activePage === "report" ? "nav-active" : ""}
            onClick={() => setReportMenu((prev) => !prev)}
          >
            Health Report ▾
          </button>

          {reportMenu && (
            <div className="program-dropdown">

              <button
                className="dropdown-item"
                onClick={() => {
                  navigate("/report/weekly");
                  setReportMenu(false);
                }}
              >
                <span>📅</span>
                <span>Weekly Report</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  navigate("/report/monthly");
                  setReportMenu(false);
                }}
              >
                <span>🗓️</span>
                <span>Monthly Report</span>
              </button>

            </div>
          )}
        </div>

      </nav>

      {/* PROFILE */}
      <div
        className="navbar-profile"
        ref={menuRef}
      >

        <button
          className="profile-btn"
          onClick={() => setDropdown(!dropdown)}
        >
          👤
        </button>

        {dropdown && (
          <div className="profile-dropdown">

            {/* TOTAL SCORE */}
            <div className="sidebar__score">
              <span className="sidebar__score-label">
                Total Score
              </span>

              <span className="sidebar__score-value">
                {totalScore}
              </span>
            </div>

            <div className="navbar-divider"></div>

            <button
              className="dropdown-item"
              onClick={() => navigate("/profile")}
            >
              <span>👤</span>
              <span>Update Profile</span>
            </button>

            <button
              className="dropdown-item"
              onClick={() => connectGoogleFit()}
            >
              <span>🏃</span>
              <span>Connect Google Fit</span>
            </button>

            <button
              className="dropdown-item"
              onClick={toggleTheme}
            >
              <span>
                {theme === "dark" ? "☀️" : "🌙"}
              </span>

              <span>
                {theme === "dark"
                  ? "Light Mode"
                  : "Dark Mode"}
              </span>
            </button>

            <hr />

            <button
              className="dropdown-item logout-btn"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>

          </div>
        )}

      </div>

    </header>
  );
};

export default AppNavbar;