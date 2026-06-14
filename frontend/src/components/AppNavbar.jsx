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

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  const menuRef = useRef(null);
  const programRef = useRef(null);
  const reportRef = useRef(null);

  // theme sync
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // outside click handler
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
    return () => document.removeEventListener("mousedown", handler);
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
    },
  });

  return (
    <header className="app-navbar">

      {/* LOGO */}
      <div className="navbar-logo" onClick={() => navigate("/")}>
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
        <div className="program-menu" ref={programRef}>
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
                    navigate(`/specialty/${encodeURIComponent(program)}`);
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

        {/* HEALTH REPORT DROPDOWN (NEW) */}
        <div className="program-menu" ref={reportRef}>
          <button
            className={activePage === "report" ? "nav-active" : ""}
            onClick={() => setReportMenu((prev) => !prev)}
          >
            Health Report ▾
          </button>

          {reportMenu && (
            <div className="program-dropdown">

              <button
                onClick={() => {
                  navigate("/report/weekly");
                  setReportMenu(false);
                }}
              >
                Weekly Report
              </button>

              <button
                onClick={() => {
                  navigate("/report/monthly");
                  setReportMenu(false);
                }}
              >
                Monthly Report
              </button>

            </div>
          )}
        </div>

      </nav>

      {/* PROFILE */}
      <div className="navbar-profile" ref={menuRef}>

        <button
          className="profile-btn"
          onClick={() => setDropdown(!dropdown)}
        >
          👤
        </button>

        {dropdown && (
          <div className="profile-dropdown">

            <button onClick={() => navigate("/profile")}>
              Update / Complete Profile
            </button>

            <button onClick={() => connectGoogleFit()}>
              Connect Google Fit
            </button>

            <button onClick={toggleTheme}>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>

            <hr />

            <button
              className="logout-btn"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>

          </div>
        )}

      </div>

    </header>
  );
};

export default AppNavbar;