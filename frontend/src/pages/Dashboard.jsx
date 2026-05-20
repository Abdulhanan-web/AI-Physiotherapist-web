import React, { useState, useEffect } from "react";
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

  // NEW STATE
  const [profileCompleted, setProfileCompleted] = useState(true);

  useEffect(() => {
    fetchUserScore();
    fetchStreaks();
    fetchProfileStatus();
  }, []);

  // ---------------- FETCH PROFILE STATUS ----------------
  const fetchProfileStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setProfileCompleted(data.profile_completed);

    } catch (error) {
      console.error("Error fetching profile status:", error);
    }
  };

  // ---------------- FETCH USER SCORE ----------------
  const fetchUserScore = async () => {
    try {
      const response = await fetch("http://localhost:8000/user-score", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTotalScore(data.total_score);
      } else {
        console.error("Failed to fetch user score");
      }
    } catch (error) {
      console.error("Error fetching user score:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH STREAKS ----------------
  const fetchStreaks = async () => {
    try {
      const response = await fetch("http://localhost:8000/streaks", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        const streakMap = {};

        data.forEach((streak) => {
          streakMap[streak.exercise_name] = streak;
        });

        setStreaks(streakMap);

      } else {
        console.error("Failed to fetch streaks");
      }

    } catch (error) {
      console.error("Error fetching streaks:", error);
    }
  };

  // ---------------- STREAK DISPLAY ----------------
  const getStreakDisplay = (exerciseName) => {
    const streak = streaks[exerciseName];

    if (!streak) {
      return {
        count: 0,
        hasWarning: false,
        isBroken: false,
      };
    }

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
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Rehabilitation Exercise Control Panel
        </h1>

        <p style={{ color: "#aaa" }}>
          Select an exercise to begin your session
        </p>

        {/* SCORE DISPLAY */}
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#2c3e50",
            borderRadius: "10px",
            display: "inline-block",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#bdc3c7",
              fontSize: "0.9rem",
              textTransform: "uppercase",
            }}
          >
            TOTAL SCORE
          </p>

          <h2
            style={{
              margin: "10px 0 0 0",
              color: "#2ecc71",
              fontSize: "2.5rem",
              fontWeight: "900",
            }}
          >
            {loading ? "..." : totalScore}
          </h2>
        </div>

        {/* COMPLETE PROFILE BUTTON */}
        {!profileCompleted && (
          <div style={{ marginTop: "30px" }}>
            <button
              onClick={() => navigate("/profile-setup")}
              style={{
                backgroundColor: "#f39c12",
                color: "white",
                border: "none",
                padding: "15px 30px",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                transition: "0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "#e67e22")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "#f39c12")
              }
            >
              Complete Your Profile
            </button>
          </div>
        )}
      </div>

      {/* LOGOUT BUTTON */}
      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        style={{
          padding: "8px 16px",
          backgroundColor: "#e74c3c",
          color: "white",
          borderRadius: "5px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Log Out
      </button>

      {/* EXERCISE GRID */}
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
          const { count, hasWarning, isBroken } =
            getStreakDisplay(ex);

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
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform =
                  "translateY(-5px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform =
                  "translateY(0)")
              }
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
                  <h3
                    style={{
                      color: "#2d3436",
                      margin: "0",
                      fontSize: "1.25rem",
                      fontWeight: "600",
                    }}
                  >
                    {ex}
                  </h3>

                  {/* STREAK DISPLAY */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: isBroken
                          ? "#dc3545"
                          : hasWarning
                          ? "#ff6b00"
                          : "#28a745",
                      }}
                    >
                      {count}
                    </span>

                    <span
                      style={{
                        fontSize: "1.3rem",
                        filter: isBroken
                          ? "grayscale(1) opacity(0.5)"
                          : "none",
                      }}
                    >
                      🔥
                    </span>

                    {hasWarning && !isBroken && (
                      <span
                        style={{
                          fontSize: "1.2rem",
                          marginLeft: "2px",
                        }}
                      >
                        ⏳
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* START BUTTON */}
              <button
                onClick={() =>
                  navigate(`/exercise/${encodeURIComponent(ex)}`)
                }
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
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#27ae60")
                }
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor = "#2ecc71")
                }
              >
                Start Exercise
              </button>
            </div>
          );
        })}
      </div>

      {/* SPECIALTY REHABILITATION */}
      <div
        style={{
          marginTop: "70px",
          maxWidth: "1200px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#f1c40f",
              marginBottom: "10px",
            }}
          >
            Specialty Rehabilitation
          </h2>

          <p style={{ color: "#aaa", fontSize: "1rem" }}>
            Select your condition to access guided rehabilitation
            programs.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "25px",
          }}
        >
          {Object.keys(specialtyPrograms).map(
            (condition, index) => (
              <div
                key={index}
                style={{
                  background: "#2c3e50",
                  borderRadius: "18px",
                  padding: "30px",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform =
                    "translateY(-5px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform =
                    "translateY(0)")
                }
              >
                <h3
                  style={{
                    marginBottom: "15px",
                    fontSize: "1.4rem",
                    color: "#fff",
                  }}
                >
                  {condition}
                </h3>

                <p
                  style={{
                    color: "#bdc3c7",
                    marginBottom: "25px",
                    lineHeight: "1.5",
                  }}
                >
                  Personalized rehabilitation exercises and
                  recovery phases.
                </p>

                <button
                  onClick={() =>
                    navigate(
                      `/specialty/${encodeURIComponent(
                        condition
                      )}`
                    )
                  }
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
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor =
                      "#2980b9")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor =
                      "#3498db")
                  }
                >
                  View Recovery Plan
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;