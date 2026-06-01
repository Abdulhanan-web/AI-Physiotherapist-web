// pages/SpecialtyProgram.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { specialtyPrograms } from "../data/specialtyPrograms";

// Description + safe-practice steps for every specialty exercise
const SPECIALTY_EXERCISE_INFO = {
  // ── Lower Back Pain ──────────────────────────────────────────────────────
  "Cat-Cow Stretch": {
    description:
      "A gentle spinal mobility exercise that alternates between flexion and extension. Relieves lower back stiffness, improves posture, and warms up the vertebral joints.",
    steps: [
      "Start on all fours with wrists under shoulders and knees under hips.",
      "Inhale: drop your belly toward the floor, lift your head and tailbone (Cow position).",
      "Exhale: round your spine toward the ceiling, tuck your chin and pelvis (Cat position).",
      "Move slowly and in sync with your breath — never force the range of motion.",
      "Stop if you feel sharp or radiating pain down your legs.",
    ],
  },
  "Knee to Chest Stretch": {
    description:
      "Gently decompresses the lumbar spine and stretches the glutes and lower back. Reduces morning stiffness and nerve tension.",
    steps: [
      "Lie flat on your back on a firm, comfortable surface.",
      "Bend one knee and use both hands to gently pull it toward your chest.",
      "Hold for 20–30 seconds, breathing steadily — do not hold your breath.",
      "Lower the leg slowly and repeat with the other side.",
      "Keep the opposite leg flat or slightly bent for comfort.",
    ],
  },
  "Bird Dog": {
    description:
      "A core-stabilisation exercise that strengthens the lower back, glutes, and deep abdominal muscles while challenging balance.",
    steps: [
      "Begin on all fours, spine neutral, core gently engaged.",
      "Simultaneously extend your right arm forward and left leg backward until both are parallel to the floor.",
      "Hold for 3–4 seconds without rotating your hips or arching your back.",
      "Return slowly to the start and switch sides.",
      "Move with control — speed reduces effectiveness and increases injury risk.",
    ],
  },
  "Glute Bridge": {
    description:
      "Activates the glutes and hamstrings to support the lumbar spine. Reduces lower back pain caused by weak posterior chain muscles.",
    steps: [
      "Lie on your back with knees bent, feet flat on the floor hip-width apart.",
      "Press through your heels and lift your hips until your body forms a straight line from shoulders to knees.",
      "Squeeze your glutes at the top and hold for 2–3 seconds.",
      "Lower your hips slowly back to the floor.",
      "Avoid pushing through your lower back — power should come from your glutes.",
    ],
  },
  "Child's Pose Stretch": {
    description:
      "A restorative yoga-derived stretch that gently elongates the spine and releases tension in the lower back, hips, and shoulders.",
    steps: [
      "Kneel on the floor, sit back toward your heels, and extend your arms forward on the mat.",
      "Rest your forehead on the surface and let your chest relax toward the floor.",
      "Hold for 30–60 seconds, breathing deeply into your lower back.",
      "Walk your hands to one side to add a lateral stretch if needed.",
      "Come out slowly by pressing your palms down and rolling up vertebra by vertebra.",
    ],
  },

  // ── Knee Recovery — Phase 1 ───────────────────────────────────────────────
  "Quad Sets": {
    description:
      "An isometric quadriceps activation exercise performed without joint movement. Essential in early knee recovery to prevent muscle atrophy.",
    steps: [
      "Sit or lie with your leg straight on a flat surface.",
      "Place a small rolled towel under your knee for support.",
      "Tighten the thigh muscle (quadriceps) by pressing the back of your knee gently into the towel.",
      "Hold the contraction for 5–10 seconds, then fully relax.",
      "Do not hold your breath; breathe normally throughout.",
    ],
  },
  "Straight Leg Raise": {
    description:
      "Strengthens the quadriceps and hip flexors without bending the knee, making it safe during early post-operative or post-injury recovery.",
    steps: [
      "Lie on your back with the unaffected knee bent and foot flat on the floor.",
      "Tighten the quadriceps of the straight leg before lifting.",
      "Raise the straight leg to the height of the opposite bent knee (roughly 45°).",
      "Hold for 2 seconds at the top, then lower slowly.",
      "Keep your lower back in contact with the floor throughout.",
    ],
  },
  "Heel Slides": {
    description:
      "Restores knee flexion range of motion by gently bending and straightening the knee in a low-load position.",
    steps: [
      "Lie on your back with both legs straight.",
      "Slowly slide the heel of the affected leg toward your buttocks, bending the knee.",
      "Go only as far as is comfortable — never force the bend.",
      "Hold for 3–5 seconds, then slowly slide back to the starting position.",
      "Use a smooth surface or wear a sock to reduce friction.",
    ],
  },
  "Seated Knee Extension": {
    description:
      "Isolates the quadriceps through a controlled range of motion while seated. Rebuilds strength in the front of the thigh.",
    steps: [
      "Sit upright in a chair with your back supported and both feet flat.",
      "Slowly straighten the affected leg until it is fully extended or as comfortable.",
      "Hold for 2–3 seconds at full extension, then lower slowly.",
      "Do not swing the leg — control the movement throughout.",
      "If using ankle weights, start very light and progress gradually.",
    ],
  },

  // ── Knee Recovery — Phase 2 ───────────────────────────────────────────────
  "Mini Squats": {
    description:
      "A partial-range squat that builds lower limb strength and knee control without placing excessive load on the joint.",
    steps: [
      "Stand with feet shoulder-width apart, holding a stable surface lightly for balance.",
      "Bend your knees to about 30–40° — a quarter of a full squat depth.",
      "Keep your knees aligned over your second toe and your weight in your heels.",
      "Pause briefly at the bottom, then push through your heels to stand.",
      "Never let your knees cave inward — maintain alignment throughout.",
    ],
  },
  "Step-Ups": {
    description:
      "A functional strengthening exercise that mimics stair climbing. Improves quad and glute strength while challenging knee stability.",
    steps: [
      "Stand in front of a low step (15–20 cm to begin with).",
      "Step up with the affected leg, pressing through the heel to bring your full weight onto the step.",
      "Bring the other foot up to join it, then step back down one foot at a time.",
      "Lead with the stronger leg going down.",
      "Keep your torso upright — avoid leaning forward or hiking your hip.",
    ],
  },
  "Hamstring Curls": {
    description:
      "Strengthens the hamstrings to balance quad dominance and support the knee joint from behind.",
    steps: [
      "Stand behind a chair, holding the backrest lightly for balance.",
      "Slowly bend the knee of the affected leg, bringing the heel toward your buttocks.",
      "Hold at the top for 2 seconds — do not rotate the hip outward.",
      "Lower the foot slowly back to the floor.",
      "Use an ankle weight only when bodyweight alone becomes easy.",
    ],
  },

  // ── Knee Recovery — Phase 3 ───────────────────────────────────────────────
  "Lunges": {
    description:
      "An advanced functional movement that builds single-leg strength, balance, and knee control for return to daily activities.",
    steps: [
      "Stand tall with feet hip-width apart.",
      "Step forward with one foot and lower your back knee toward the floor, stopping before it touches.",
      "Keep your front knee directly above your ankle — never beyond your toes.",
      "Push through the front heel to return to standing.",
      "Start with a short stride length and increase as strength and confidence improve.",
    ],
  },
  "Single Leg Balance": {
    description:
      "Challenges proprioception and neuromuscular control — essential for preventing re-injury and restoring confident movement.",
    steps: [
      "Stand near a wall or sturdy surface for safety.",
      "Shift your weight onto the affected leg and lift the other foot slightly off the ground.",
      "Hold the position for 5–30 seconds, maintaining a soft bend in the standing knee.",
      "Focus your gaze on a fixed point to help with balance.",
      "Progress to eyes closed or an unstable surface only when fully comfortable.",
    ],
  },

  // ── Stroke / Paralysis Recovery — Phase 1 ────────────────────────────────
  "Wrist Extension/Flexion": {
    description:
      "Restores wrist mobility and re-establishes neural pathways for hand movement following stroke or neurological injury.",
    steps: [
      "Sit at a table with your forearm resting on the surface, hand hanging over the edge.",
      "Slowly bend your wrist upward (extension), hold for 2 seconds.",
      "Then slowly bend it downward (flexion), hold for 2 seconds.",
      "Use your unaffected hand to assist if the movement is very limited.",
      "Perform slowly and deliberately — quality of movement matters more than speed.",
    ],
  },
  "Finger Open/Close": {
    description:
      "Retrains fine motor control and grip by practising the fundamental open-and-close pattern of the hand.",
    steps: [
      "Rest your affected hand on a flat surface, palm facing down.",
      "Slowly spread all fingers as wide as comfortable (open).",
      "Hold for 2–3 seconds, then slowly curl all fingers into a loose fist (close).",
      "Use your other hand to gently assist fingers that do not move independently.",
      "Avoid gripping too tightly — focus on the control of the movement.",
    ],
  },

  // ── Stroke / Paralysis Recovery — Phase 2 ────────────────────────────────
  "Seated Marching": {
    description:
      "Re-establishes reciprocal leg movement and hip flexor activation while seated, improving coordination for walking.",
    steps: [
      "Sit upright in a chair with feet flat on the floor.",
      "Lift one knee upward as if marching, then lower it back down.",
      "Alternate legs at a slow, controlled pace.",
      "Keep your torso upright — do not lean back or to the side.",
      "Use your hands on the chair seat for light support if needed.",
    ],
  },
  "Sit-to-Stand": {
    description:
      "One of the most important functional recovery exercises. Rebuilds the strength and confidence needed for independent standing.",
    steps: [
      "Sit at the edge of a sturdy chair with feet flat, hip-width apart.",
      "Lean forward slightly from the hips — 'nose over toes'.",
      "Press through your feet and use your legs (not your arms) to stand.",
      "Straighten fully at the top before sitting back down slowly.",
      "Place your hands on your thighs for assistance only as needed — aim to reduce reliance over time.",
    ],
  },
  "Weight Shifting": {
    description:
      "Improves dynamic balance and postural control by practising deliberate weight transfers between the two sides of the body.",
    steps: [
      "Stand with feet hip-width apart, lightly holding a surface in front of you.",
      "Slowly shift your weight to the right foot, then back to centre.",
      "Then shift to the left foot, then back to centre.",
      "Increase the range of shift gradually as balance improves.",
      "Keep your eyes level and look straight ahead throughout.",
    ],
  },

  // ── Shoulder Rehab — Frozen Shoulder ────────────────────────────────────
  "Pendulum Exercise": {
    description:
      "A gravity-assisted shoulder mobility exercise that uses gentle circular motion to reduce stiffness and improve range of motion with minimal pain.",
    steps: [
      "Lean forward and support yourself with your unaffected arm on a table.",
      "Let the affected arm hang freely toward the floor — completely relaxed.",
      "Using your body momentum (not shoulder muscles), swing the arm in small circles clockwise.",
      "Repeat in the opposite direction.",
      "Keep circles small (the size of a dinner plate) and the shoulder completely passive.",
    ],
  },
  "Wall Climb Exercise": {
    description:
      "Progressively restores shoulder flexion range of motion using a wall for guided support and feedback.",
    steps: [
      "Stand facing a wall, arm's length away.",
      "Place the fingers of the affected arm on the wall at waist height.",
      "Walk your fingers slowly up the wall as high as comfortable.",
      "Hold at the highest point for 5 seconds, then walk fingers back down.",
      "Mark your highest point and try to go slightly further each session.",
    ],
  },
  "Shoulder External Rotation": {
    description:
      "Strengthens the infraspinatus and teres minor — the key external rotators of the rotator cuff — essential for shoulder stability.",
    steps: [
      "Lie on your side with the affected arm on top, elbow bent to 90° and tucked to your side.",
      "Slowly rotate your forearm upward (away from the floor), keeping the elbow fixed.",
      "Stop when you feel resistance — do not force the range.",
      "Hold for 2 seconds, then lower slowly.",
      "Alternatively, perform seated with a resistance band anchored at elbow height.",
    ],
  },
  "Shoulder Internal Rotation Stretch": {
    description:
      "Stretches the posterior capsule and internal rotators to improve overall shoulder range of motion and reduce impingement.",
    steps: [
      "Lie on your side with the affected shoulder down, arm in front at 90°.",
      "Use the other hand to gently press the affected wrist toward the floor.",
      "Hold the gentle stretch for 20–30 seconds — you should feel a mild pull, not pain.",
      "Release slowly and repeat.",
      "Never force the stretch — this exercise works on the posterior capsule which is very sensitive.",
    ],
  },

  // ── Shoulder Rehab — Rotator Cuff ────────────────────────────────────────
  "Scaption": {
    description:
      "Raises the arm in the scapular plane (30–45° in front of the body), the safest arc for the shoulder joint. Targets the supraspinatus and serratus anterior.",
    steps: [
      "Stand with arms at your sides, thumbs pointing upward.",
      "Raise both arms simultaneously in a Y-shape (30–45° in front of the body, not directly to the side).",
      "Lift to shoulder height or as high as pain-free.",
      "Hold for 2 seconds at the top, then lower slowly.",
      "Do not shrug your shoulders — keep them pressed down throughout.",
    ],
  },
  "Resistance Band Rows": {
    description:
      "Strengthens the middle trapezius and rhomboids to improve posture and reduce the shoulder impingement caused by rounded shoulders.",
    steps: [
      "Anchor a resistance band at chest height on a door or post.",
      "Hold an end in each hand, step back until there is light tension in the band.",
      "Pull both handles toward your lower ribcage, squeezing your shoulder blades together.",
      "Hold for 2 seconds, then slowly extend your arms back to the start.",
      "Keep your elbows at 45° from your body — not flared out at 90°.",
    ],
  },
};

// ─── Shared portal overlay (identical pattern to Dashboard) ──────────────────
const ExpandedCardPortal = ({ exercise, info, originRect, onClose, onStart }) => {
  const [phase, setPhase] = useState("entering");

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = useCallback(() => {
    setPhase("closing");
    setTimeout(onClose, 380);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardCx = originRect.left + originRect.width / 2;
  const cardCy = originRect.top + originRect.height / 2;
  const dx = cardCx - vw / 2;
  const dy = cardCy - vh / 2;

  const isOpen = phase === "open";
  const expandedWidth = Math.min(520, vw - 32);

  const cardStyle = {
    position: "fixed",
    top: "50%",
    left: "50%",
    width: expandedWidth,
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
      : `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${
          originRect.width / expandedWidth
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
      <div style={backdropStyle} onClick={handleClose} />

      <div style={cardStyle}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <h3
            style={{
              fontFamily: "var(--font-display, 'Syne', sans-serif)",
              fontSize: "1.35rem",
              fontWeight: 800,
              margin: 0,
              color: "#1a1f2e",
              letterSpacing: "-0.02em",
              flex: 1,
            }}
          >
            {exercise.name}
          </h3>

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

        {/* Steps label */}
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

        {/* Steps list */}
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
          onClick={() => onStart(exercise.name)}
        >
          Start Exercise
        </button>
      </div>
    </>,
    document.body
  );
};

// ─── Collapsed specialty exercise card ───────────────────────────────────────
const SpecialtyExerciseCard = ({ exercise, onStart }) => {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef(null);
  const [originRect, setOriginRect] = useState(null);

  const info = SPECIALTY_EXERCISE_INFO[exercise.name] || {
    description: exercise.description || "A rehabilitation exercise to aid your recovery.",
    steps: ["Follow the on-screen pose guidance during the session."],
  };

  const handleClick = () => {
    if (cardRef.current) {
      setOriginRect(cardRef.current.getBoundingClientRect());
    }
    setExpanded(true);
  };

  return (
    <>
      <div
        ref={cardRef}
        className="specialty-exercise-card"
        style={{
          cursor: "pointer",
          userSelect: "none",
          minHeight: "unset",
          justifyContent: "flex-start",
          transition: "transform 0.25s ease, opacity 0.25s ease",
          opacity: expanded ? 0.45 : 1,
        }}
        onClick={handleClick}
      >
        {/* Name */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>{exercise.name}</h3>

          {/* Expand hint */}
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
              flexShrink: 0,
            }}
          >
            ⤢
          </span>
        </div>

        {/* Teaser description */}
        <p style={{ fontSize: "0.83rem", color: "#555", margin: 0, lineHeight: 1.5 }}>
          {exercise.description}
        </p>

        <p style={{ fontSize: "0.78rem", color: "#999", marginTop: 12, marginBottom: 0 }}>
          Tap to view details &amp; start →
        </p>
      </div>

      {/* Portal overlay */}
      {expanded && originRect && (
        <ExpandedCardPortal
          exercise={exercise}
          info={info}
          originRect={originRect}
          onClose={() => setExpanded(false)}
          onStart={onStart}
        />
      )}
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const SpecialtyProgram = () => {
  const { condition } = useParams();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(condition);
  const program = specialtyPrograms[decoded];

  if (!program) {
    return (
      <div
        className="page"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 24,
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 className="page-title">Program Not Found</h1>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate("/")}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="page specialty-page">
      <button className="btn-back" onClick={() => navigate("/")}>
        ← Dashboard
      </button>

      <div style={{ marginTop: 32, marginBottom: 52 }}>
        <h1 className="page-title">{decoded}</h1>
        <p className="page-subtitle" style={{ marginTop: 10, maxWidth: 700 }}>
          Personalised rehabilitation exercises designed for recovery and mobility
          improvement. Click any card to view details and safe-practice steps before starting.
        </p>
      </div>

      {program.phases.map((phaseData, pi) => (
        <div key={pi} style={{ marginBottom: 60 }}>
          <span className="phase-label">{phaseData.phase}</span>
          <div className="phase-underline" />

          <div className="grid--auto">
            {phaseData.exercises.map((ex, ei) => (
              <SpecialtyExerciseCard
                key={ei}
                exercise={ex}
                onStart={(name) => navigate(`/exercise/${encodeURIComponent(name)}`)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SpecialtyProgram;