import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#1a1a1a", // Matching your dark theme
      color: "white",
      padding: "40px 20px",
      fontFamily: "'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "700", marginBottom: "10px" }}>
          Rehabilitation Exercise Control Panel
        </h1>
        <p style={{ color: "#aaa" }}>Select an exercise to begin your session</p>
      </div>

      <button onClick={() => { logout(); navigate("/login"); }} style={{ padding: "8px 16px", backgroundColor: "#e74c3c", color: "white", borderRadius: "5px", border: "none", cursor: "pointer" }}>
        Log Out
      </button>

      {/* Centered Grid Container */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "25px",
        maxWidth: "1200px",
        margin: "0 auto" // This centers the entire grid
      }}>
        {exercises.map((ex, index) => (
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
            // Simple hover effect logic
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <h3 style={{
              color: "#2d3436",
              margin: "0 0 20px 0",
              fontSize: "1.25rem",
              fontWeight: "600"
            }}>
              {ex}
            </h3>

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
                transition: "background 0.3s ease"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#27ae60"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#2ecc71"}
            >
              Start Exercise
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;