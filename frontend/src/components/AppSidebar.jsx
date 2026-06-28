// components/AppSidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import logo from "../assets/logo.png";

const SidebarBtn = ({ icon, label, onClick, danger, active }) => (
  <button
    className={`sidebar__menu-btn
      ${danger ? " sidebar__menu-btn--danger" : ""}
      ${active ? " sidebar__menu-btn--active-custom" : ""}
    `}
    onClick={onClick}
  >
    <span className="sidebar__menu-btn__icon">{icon}</span>
    {label}
  </button>
);

const AppSidebar = ({ activePage }) => {
  const { logout, token } = useAuth();
  const navigate = useNavigate();

  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(null);
  const [menuOpen, setMenuOpen] = useState({
    sidebar: false,
    reportDropdown: false,
  });

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) =>
      prev === "dark" ? "light" : "dark"
    );
  };

  const menuRef = useRef(null);

  useEffect(() => {
    fetchUserScore();
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen({ sidebar: false, reportDropdown: false });
      }
    };

    if (menuOpen.sidebar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
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

  const closeMenu = () =>
    setMenuOpen({ sidebar: false, reportDropdown: false });

  const generateReport = (type) => {
    closeMenu();
    navigate(`/report/${type}`);
  };

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
        const res = await fetch(
          "http://localhost:8000/google-fit/connect",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              code: codeResponse.code,
            }),
          }
        );

        const data = await res.json();
        console.log(data);

        closeMenu();
      } catch (err) {
        console.error(err);
      }
    },

    onError: () => {
      console.log("Google Fit connection failed");
    },
  });

  return (
    <>
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
        style={{
          transform: menuOpen.sidebar
            ? "translateX(0)"
            : "translateX(-100%)",
        }}
      >
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <img
              src={logo}
              alt="RehabPanel Logo"
              className="sidebar-logo"
            />
            <span className="sidebar__brand-name">
              RehabPanel
            </span>
          </div>
          <button
            className="sidebar__close"
            onClick={closeMenu}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="sidebar__score">
          <span className="sidebar__score-label">Total Score</span>
          <span className="sidebar__score-value">
            {loading ? "…" : totalScore}
          </span>
        </div>

        <div className="sidebar__divider" />

        <nav className="sidebar__nav">
          {/* Dashboard */}
          <SidebarBtn
            icon="📊"
            label="Dashboard"
            active={activePage === "dashboard"}
            onClick={() => {
              closeMenu();
              navigate("/");
            }}
          />

          {/* Generate Health Report */}
          <div style={{ position: "relative" }}>
            <button
              className={`sidebar__menu-btn ${activePage === "report"
                ? "sidebar__menu-btn--active-custom"
                : ""
                }`}
              onClick={() =>
                setMenuOpen((p) => ({
                  ...p,
                  reportDropdown: !p.reportDropdown,
                }))
              }
              style={{
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <span className="sidebar__menu-btn__icon">📄</span>
                Generate Health Report
              </span>

              {/* Dropdown arrow */}
              <span
                style={{
                  fontSize: "0.75rem",
                  transition: "0.2s ease",
                  transform: menuOpen.reportDropdown
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                }}
              >
                ▼
              </span>
            </button>

            {menuOpen.reportDropdown && (
              <div className="report-dropdown">
                <button
                  className="report-dropdown__item"
                  onClick={() => generateReport("weekly")}
                >
                  📅 Weekly Report
                </button>
                <button
                  className="report-dropdown__item"
                  onClick={() => generateReport("monthly")}
                >
                  🗓️ Monthly Report
                </button>
              </div>
            )}
          </div>

          {/* Profile */}
          {profileCompleted === false && (
            <SidebarBtn
              icon="👤"
              label="Complete User Profile"
              active={activePage === "profile"}
              onClick={() => {
                closeMenu();
                navigate("/profile");
              }}
            />
          )}

          {profileCompleted === true && (
            <SidebarBtn
              icon="✏️"
              label="Update Profile Info"
              active={activePage === "profile"}
              onClick={() => {
                closeMenu();
                navigate("/profile");
              }}
            />
          )}

          {/* Nutrition */}
          <SidebarBtn
            icon="🥗"
            label="Nutrition Plan"
            active={activePage === "nutrition"}
            onClick={() => {
              closeMenu();
              navigate("/nutrition");
            }}
          />
          <SidebarBtn
            icon="🏃"
            label="Connect Google Fit"
            onClick={() => connectGoogleFit()}
          />

          {/* Theme Toggle */}
          <SidebarBtn
            icon={theme === "dark" ? "☀️" : "🌙"}
            label={
              theme === "dark"
                ? "Light Mode"
                : "Dark Mode"
            }
            onClick={toggleTheme}
          />
        </nav>

        <div className="sidebar__footer">
          <SidebarBtn
            icon="🚪"
            label="Log Out"
            danger
            onClick={() => {
              closeMenu();
              logout();
              navigate("/login");
            }}
          />
        </div>
      </div>

      {/* Hamburger */}
      <button
        className="hamburger"
        onClick={() =>
          setMenuOpen((p) => ({ ...p, sidebar: true }))
        }
        aria-label="Open menu"
      >
        <span className="hamburger__bar" />
        <span className="hamburger__bar" />
        <span className="hamburger__bar" />
      </button>
    </>
  );
};

export default AppSidebar;