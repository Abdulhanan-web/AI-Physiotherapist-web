// pages/Dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { specialtyPrograms } from "../data/specialtyPrograms";
import AppSidebar from "../components/AppSidebar";
import AppNavbar from "../components/AppNavbar";
import ExerciseModelCard from "../components/ExerciseModelCard";
import AppFooter from "../components/AppFooter";


const exerciseModels = [
  {
    title: "Elbow Flexion Left",
    model: "elbow_flexion_left.glb",
  },
  {
    title: "Elbow Flexion Right",
    model: "elbow_flexion_right.glb",
  },
  {
    title: "Shoulder Flexion Left",
    model: "shoulder_flexion_left.glb",
  },
  {
    title: "Shoulder Flexion Right",
    model: "shoulder_flexion_right.glb",
  },
  {
    title: "Shoulder Abduction Left",
    model: "shoulder_abduction_left.glb",
  },
  {
    title: "Shoulder Abduction Right",
    model: "shoulder_abduction_right.glb",
  },
  {
    title: "Shoulder Forward Elevation",
    model: "shoulder_forward_elevation.glb",
  },
  {
    title: "Side Tap Left",
    model: "side_tap_left.glb",
  },
  {
    title: "Side Tap Right",
    model: "side_tap_right.glb",
  },
];


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

const EXERCISE_INFO = {
  "Elbow Flexion Left": {
    description:
      "Builds bicep strength and restores elbow range of motion on the left side. Ideal for post-injury rehabilitation of the elbow joint.",
    steps: [
      "Stand or sit upright with your left arm at your side, palm facing forward.",
      "Keeping your elbow close to your torso, slowly curl your forearm upward.",
      "Pause at the top when your forearm is nearly vertical — avoid swinging your shoulder.",
      "Lower the arm back down in a controlled, slow motion (3–4 seconds).",
      "Stop if you feel sharp pain; mild muscle fatigue is normal.",
    ],
  },
  "Elbow Flexion Right": {
    description:
      "Builds bicep strength and restores elbow range of motion on the right side. Mirror exercise of the left for balanced rehabilitation.",
    steps: [
      "Stand or sit upright with your right arm at your side, palm facing forward.",
      "Keeping your elbow close to your torso, slowly curl your forearm upward.",
      "Pause at the top when your forearm is nearly vertical — avoid swinging your shoulder.",
      "Lower the arm back down in a controlled, slow motion (3–4 seconds).",
      "Stop if you feel sharp pain; mild muscle fatigue is normal.",
    ],
  },
  "Shoulder Flexion Left": {
    description:
      "Improves shoulder mobility and anterior deltoid strength on the left side. Commonly prescribed after rotator cuff injuries.",
    steps: [
      "Stand tall with your left arm straight at your side, thumb pointing forward.",
      "Slowly raise your arm in front of you to shoulder height or as high as comfortable.",
      "Hold for 1–2 seconds at the top; do not shrug your shoulder upward.",
      "Lower slowly back to the starting position.",
      "Keep your core engaged and avoid leaning your torso back.",
    ],
  },
  "Shoulder Flexion Right": {
    description:
      "Improves shoulder mobility and anterior deltoid strength on the right side. Mirror exercise for balanced shoulder rehabilitation.",
    steps: [
      "Stand tall with your right arm straight at your side, thumb pointing forward.",
      "Slowly raise your arm in front of you to shoulder height or as high as comfortable.",
      "Hold for 1–2 seconds at the top; do not shrug your shoulder upward.",
      "Lower slowly back to the starting position.",
      "Keep your core engaged and avoid leaning your torso back.",
    ],
  },
  "Shoulder Abduction Left": {
    description:
      "Strengthens the middle deltoid and supraspinatus. Restores sideways lifting capacity of the left shoulder after injury or surgery.",
    steps: [
      "Stand with your left arm at your side, palm facing inward.",
      "Slowly raise your arm out to the side, leading with your elbow slightly bent.",
      "Stop at 90° (shoulder height) unless your physiotherapist has cleared you for higher.",
      "Hold the position for 3 seconds, then lower slowly.",
      "Avoid tilting your head or hiking your shoulder — movement should be isolated.",
    ],
  },
  "Shoulder Abduction Right": {
    description:
      "Strengthens the middle deltoid and supraspinatus on the right side for balanced upper-body rehabilitation.",
    steps: [
      "Stand with your right arm at your side, palm facing inward.",
      "Slowly raise your arm out to the side, leading with your elbow slightly bent.",
      "Stop at 90° (shoulder height) unless your physiotherapist has cleared you for higher.",
      "Hold the position for 3 seconds, then lower slowly.",
      "Avoid tilting your head or hiking your shoulder — movement should be isolated.",
    ],
  },
  "Shoulder Forward Elevation": {
    description:
      "Full-range anterior shoulder mobility exercise. Helps recover overhead reach and targets the anterior deltoid and upper trapezius.",
    steps: [
      "Stand upright, arm straight at your side with thumb pointing up.",
      "Raise your arm forward and upward in a smooth arc toward the ceiling.",
      "Go as high as comfortable — aim for full overhead reach over time.",
      "Hold at the top for 2 seconds with a relaxed shoulder blade.",
      "Lower in a slow, controlled motion and repeat.",
    ],
  },
  "Side Tap Left": {
    description:
      "A low-impact balance and coordination drill that activates the left hip abductor and improves lateral stability.",
    steps: [
      "Stand with feet hip-width apart, hands lightly resting on a surface if needed for balance.",
      "Shift your weight onto your right foot and tap your left foot out to the side.",
      "Return the left foot back to centre with control — don't let it drop.",
      "Keep your torso upright; avoid leaning sideways.",
      "Perform at a steady, rhythmic pace rather than rushing.",
    ],
  },
  "Side Tap Right": {
    description:
      "A low-impact balance and coordination drill that activates the right hip abductor and improves lateral stability.",
    steps: [
      "Stand with feet hip-width apart, hands lightly resting on a surface if needed for balance.",
      "Shift your weight onto your left foot and tap your right foot out to the side.",
      "Return the right foot back to centre with control — don't let it drop.",
      "Keep your torso upright; avoid leaning sideways.",
      "Perform at a steady, rhythmic pace rather than rushing.",
    ],
  },
};

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
      <div className="rp-hero">
        {/* Sliding background images */} 
        <div className="rp-hero-slides">
          <img src="/images/image1.png" alt="" aria-hidden="true" />
          <img src="/images/image2.png" alt="" aria-hidden="true" />
          <img src="/images/image3.png" alt="" aria-hidden="true" />
          <img src="/images/image4.png" alt="" aria-hidden="true" />
        </div>
        {/* <div className="rp-hero-bg"></div>
        <div className="rp-hero-pattern"></div> */}

        <div className="rp-hero-content">
          <div className="rp-hero-tag">AI PHYSIOTHERAPIST AND HEALTH ASSISTANT</div>

          <div className="rp-hero-h1">
            Personalised Care.<br />
            <em>Proven Results.</em>
          </div>

          <div className="rp-hero-sub">
            Every recovery journey is unique. RehabPanel uses real-time AI pose
            detection to guide you through clinically validated exercises.
          </div>

          <div className="rp-hero-cta">
            <button className="rp-hero-btn">
              Begin Your Recovery →
            </button>

            <button className="rp-hero-btn-outline">
              How It Works
            </button>
          </div>
        </div>

        <div className="rp-hero-stats">
          <div className="rp-hero-stat">
            <div className="rp-hero-stat-val">{exercises.length}</div>
            <div className="rp-hero-stat-label">EXERCISES</div>
          </div>

          <div className="rp-hero-stat">
            <div className="rp-hero-stat-val">
              {Object.keys(specialtyPrograms).length}
            </div>
            <div className="rp-hero-stat-label">PROGRAMS</div>
          </div>

          <div className="rp-hero-stat">
            <div className="rp-hero-stat-val">AI</div>
            <div className="rp-hero-stat-label">FEEDBACK</div>
          </div>
        </div>
      </div>

      {/* Intro Strip */}
      <div className="rp-intro">
        <div className="rp-intro-text">
          At RehabPanel, every exercise plan is personalised,
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
                    streak={getStreakDisplay(item.title)}
                    onStart={() =>
                      navigate(
                        `/exercise/${encodeURIComponent(item.title)}`
                      )
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