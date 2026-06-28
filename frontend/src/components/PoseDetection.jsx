// components/PoseDetection.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks, POSE_CONNECTIONS } from "@mediapipe/drawing_utils";

const EXERCISE_RULES = {
  "Elbow Flexion Left": { joints: [11, 13, 15], range: { min: 40, max: 150 }, type: "min", targetReps: 12, targetSets: 3, restDuration: 30 },
  "Elbow Flexion Right": { joints: [12, 14, 16], range: { min: 40, max: 150 }, type: "min", targetReps: 12, targetSets: 3, restDuration: 30 },
  "Shoulder Flexion Left": { joints: [23, 11, 13], range: { min: 40, max: 160 }, type: "max", targetReps: 10, targetSets: 3, restDuration: 45 },
  "Shoulder Flexion Right": { joints: [24, 12, 14], range: { min: 40, max: 160 }, type: "max", targetReps: 10, targetSets: 3, restDuration: 45 },
  "Shoulder Abduction Left": { joints: [23, 11, 13], range: { min: 30, max: 90 }, type: "max", holdTime: 3000, targetReps: 8, targetSets: 3, restDuration: 60 },
  "Shoulder Abduction Right": { joints: [24, 12, 14], range: { min: 30, max: 90 }, type: "max", holdTime: 3000, targetReps: 8, targetSets: 3, restDuration: 60 },
  "Shoulder Forward Elevation": { joints: [24, 12, 14], range: { min: 40, max: 160 }, type: "max", holdTime: 2000, targetReps: 10, targetSets: 3, restDuration: 45 },
  "Side Tap Left": { joints: [23, 25, 27], range: { min: 140, max: 175 }, type: "min", targetReps: 15, targetSets: 2, restDuration: 20 },
  "Side Tap Right": { joints: [24, 26, 28], range: { min: 140, max: 175 }, type: "min", targetReps: 15, targetSets: 2, restDuration: 20 },
  "Cat-Cow Stretch": { joints: [20, 1, 0], range: { min: 150, max: 175 }, type: "both", targetReps: 10, targetSets: 2, restDuration: 30 },
  "Knee to Chest Stretch": { joints: [23, 25, 27], range: { min: 40, max: 100 }, type: "min", holdTime: 3000, targetReps: 8, targetSets: 2, restDuration: 30 },
  "Bird Dog": { joints: [11, 23, 25], range: { min: 150, max: 180 }, type: "max", holdTime: 4000, targetReps: 10, targetSets: 2, restDuration: 40 },
  "Glute Bridge": { joints: [11, 23, 25], range: { min: 150, max: 180 }, type: "max", holdTime: 3000, targetReps: 12, targetSets: 3, restDuration: 40 },
  "Child's Pose Stretch": { joints: [11, 23, 25], range: { min: 50, max: 100 }, type: "min", holdTime: 5000, targetReps: 5, targetSets: 2, restDuration: 30 },
  "Quad Sets": { joints: [23, 25, 27], range: { min: 160, max: 180 }, type: "max", holdTime: 3000, targetReps: 10, targetSets: 2, restDuration: 20 },
  "Straight Leg Raise": { joints: [23, 25, 27], range: { min: 40, max: 90 }, type: "min", targetReps: 10, targetSets: 3, restDuration: 30 },
  "Heel Slides": { joints: [23, 25, 27], range: { min: 50, max: 130 }, type: "min", targetReps: 12, targetSets: 2, restDuration: 25 },
  "Seated Knee Extension": { joints: [23, 25, 27], range: { min: 150, max: 180 }, type: "max", targetReps: 10, targetSets: 2, restDuration: 25 },
  "Mini Squats": { joints: [23, 25, 27], range: { min: 70, max: 130 }, type: "min", targetReps: 15, targetSets: 3, restDuration: 35 },
  "Step-Ups": { joints: [23, 25, 27], range: { min: 80, max: 140 }, type: "min", targetReps: 12, targetSets: 3, restDuration: 35 },
  "Hamstring Curls": { joints: [23, 25, 27], range: { min: 40, max: 110 }, type: "min", targetReps: 12, targetSets: 2, restDuration: 30 },
  "Lunges": { joints: [23, 25, 27], range: { min: 70, max: 120 }, type: "min", targetReps: 10, targetSets: 3, restDuration: 40 },
  "Single Leg Balance": { joints: [23, 25, 27], range: { min: 160, max: 180 }, type: "max", holdTime: 5000, targetReps: 5, targetSets: 2, restDuration: 30 },
};

const EXERCISE_MET = {
  "Elbow Flexion Left": 3.0, "Elbow Flexion Right": 3.0,
  "Shoulder Flexion Left": 3.5, "Shoulder Flexion Right": 3.5,
  "Shoulder Abduction Left": 3.5, "Shoulder Abduction Right": 3.5,
  "Shoulder Forward Elevation": 3.5,
  "Side Tap Left": 3.0, "Side Tap Right": 3.0,
  "Cat-Cow Stretch": 2.5, "Knee to Chest Stretch": 2.5,
  "Bird Dog": 3.0, "Glute Bridge": 3.0,
  "Child's Pose Stretch": 2.0, "Quad Sets": 2.5,
  "Straight Leg Raise": 3.0, "Heel Slides": 2.5,
  "Seated Knee Extension": 2.5, "Mini Squats": 4.0,
  "Step-Ups": 5.0, "Hamstring Curls": 3.5,
  "Lunges": 4.5, "Single Leg Balance": 2.8,
};

const getAccuracyLabel = (pct) => {
  if (pct >= 85) return { label: "Excellent", color: "#00c853" };
  if (pct >= 65) return { label: "Good", color: "#64b5f6" };
  if (pct >= 45) return { label: "Fair", color: "#ffd600" };
  return { label: "Needs Work", color: "#ff5252" };
};

const getAIFeedback = (pct, name) => {
  if (pct >= 85) return `Outstanding form on ${name}! Your movement control and range of motion are excellent. Keep up this quality.`;
  if (pct >= 65) return `Good effort on ${name}. Your form is developing well — focus on maintaining consistent range of motion each rep.`;
  if (pct >= 45) return `Decent attempt at ${name}. Try to slow down and ensure full extension/flexion on every repetition.`;
  return `Keep practicing ${name}. Review the technique and prioritise controlled, deliberate movements over speed.`;
};

// ─── Camera Error States ──────────────────────────────────────────────────────
const CAMERA_STATES = {
  INITIALIZING: "initializing",
  READY: "ready",
  ERROR_PERMISSION: "error_permission",
  ERROR_NOT_FOUND: "error_not_found",
  ERROR_MEDIAPIPE: "error_mediapipe",
  ERROR_UNKNOWN: "error_unknown",
};

// ─── Camera Initializing Overlay ─────────────────────────────────────────────
const CameraStatusOverlay = ({ state, onRetry }) => {
  if (state === CAMERA_STATES.READY) return null;

  const configs = {
    [CAMERA_STATES.INITIALIZING]: {
      icon: "📷",
      title: "Initializing Camera",
      desc: "Loading MediaPipe pose model and requesting camera access…",
      showSpinner: true,
      showRetry: false,
    },
    [CAMERA_STATES.ERROR_PERMISSION]: {
      icon: "🔒",
      title: "Camera Access Denied",
      desc: "Please allow camera access in your browser settings and try again.",
      showSpinner: false,
      showRetry: true,
    },
    [CAMERA_STATES.ERROR_NOT_FOUND]: {
      icon: "🚫",
      title: "No Camera Found",
      desc: "We couldn't detect a webcam. Please connect one and try again.",
      showSpinner: false,
      showRetry: true,
    },
    [CAMERA_STATES.ERROR_MEDIAPIPE]: {
      icon: "⚠️",
      title: "Model Load Failed",
      desc: "Could not load the pose detection model. Check that /mediapipe/pose/ assets are served correctly.",
      showSpinner: false,
      showRetry: true,
    },
    [CAMERA_STATES.ERROR_UNKNOWN]: {
      icon: "❌",
      title: "Something Went Wrong",
      desc: "An unexpected error occurred while starting the camera.",
      showSpinner: false,
      showRetry: true,
    },
  };

  const cfg = configs[state] || configs[CAMERA_STATES.INITIALIZING];

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 20,
      background: "rgba(10,15,30,0.96)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 16, padding: 24, textAlign: "center",
    }}>
      <div style={{ fontSize: "3rem" }}>{cfg.icon}</div>

      <p style={{ margin: 0, fontWeight: 700, fontSize: "1.1rem", color: "#fff" }}>
        {cfg.title}
      </p>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", maxWidth: 320, lineHeight: 1.6 }}>
        {cfg.desc}
      </p>

      {cfg.showSpinner && (
        <div style={{
          width: 36, height: 36,
          border: "3px solid rgba(100,181,246,0.2)",
          borderTop: "3px solid #64b5f6",
          borderRadius: "50%",
          animation: "spin 0.9s linear infinite",
        }} />
      )}

      {cfg.showRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 8, padding: "10px 28px",
            background: "linear-gradient(135deg,#1565c0,#0288d1)",
            color: "#fff", border: "none", borderRadius: 50,
            fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
          }}
        >
          🔄 Retry
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── Post-session Report Overlay ─────────────────────────────────────────────
const SessionReport = ({ report, onGoHome, onRetry }) => {
  const { exerciseName, sets, reps, avgAccuracy, caloriesBurned, durationMinutes, pointsEarned } = report;
  const accuracyPct = Math.round(avgAccuracy * 100);
  const { label: accLabel, color: accColor } = getAccuracyLabel(accuracyPct);
  const aiFeedback = getAIFeedback(accuracyPct, exerciseName);

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: "linear-gradient(160deg, #0a0f1e 0%, #0d1b2e 50%, #0a1628 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-start", overflowY: "auto",
      padding: "32px 20px 40px",
      animation: "fadeSlideUp 0.5s cubic-bezier(0.22,1,0.36,1) both",
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(40px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes scoreCount {
          from { opacity:0; transform:scale(0.6); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes barFill { from { width:0%; } }
        .report-stat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: background 0.2s;
        }
        .report-stat-card:hover { background: rgba(255,255,255,0.07); }
        .report-btn {
          padding: 14px 32px; border: none; border-radius: 50px;
          font-weight: 700; font-size: 0.95rem; cursor: pointer;
          letter-spacing: 0.5px; transition: transform 0.15s, box-shadow 0.15s;
        }
        .report-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.35); }
        .report-btn:active { transform:translateY(0); }
      `}</style>

      {/* Trophy + title */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 8, filter: "drop-shadow(0 0 20px rgba(255,215,0,0.6))" }}>🏆</div>
        <h2 style={{
          margin: 0, fontSize: "1.9rem", fontWeight: 800,
          background: "linear-gradient(90deg,#64b5f6,#00e676)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: "-0.5px",
        }}>Session Complete!</h2>
        <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", letterSpacing: "2px", textTransform: "uppercase" }}>
          {exerciseName}
        </p>
      </div>

      {/* Points badge */}
      {pointsEarned > 0 && (
        <div style={{
          background: "linear-gradient(135deg,#ffd600,#ff6f00)",
          borderRadius: 50, padding: "8px 24px", marginBottom: 24,
          animation: "scoreCount 0.6s 0.3s cubic-bezier(0.22,1,0.36,1) both",
          boxShadow: "0 4px 20px rgba(255,214,0,0.35)",
        }}>
          <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0a0f1e" }}>
            +{pointsEarned} pts earned
          </span>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 480, marginBottom: 20 }}>
        <StatCard icon="🔁" label="Sets Completed" value={`${sets} sets`} />
        <StatCard icon="💪" label="Reps Completed" value={`${reps} reps`} />
        <StatCard icon="⏱️" label="Duration" value={`${durationMinutes} min`} />
        <StatCard icon="🔥" label="Calories Burned" value={`~${caloriesBurned} kcal`} />
      </div>

      {/* Accuracy bar */}
      <div style={{
        width: "100%", maxWidth: 480, marginBottom: 20,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "18px 20px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "1.5px" }}>
            Average Accuracy
          </span>
          <span style={{ fontWeight: 800, fontSize: "1.3rem", color: accColor }}>{accuracyPct}%</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${accuracyPct}%`, borderRadius: 99,
            background: `linear-gradient(90deg,${accColor}88,${accColor})`,
            animation: "barFill 1s 0.4s cubic-bezier(0.22,1,0.36,1) both",
          }} />
        </div>
        <div style={{ marginTop: 8, textAlign: "right" }}>
          <span style={{
            display: "inline-block", padding: "2px 12px", borderRadius: 99,
            background: `${accColor}22`, color: accColor,
            fontSize: "0.78rem", fontWeight: 700,
          }}>{accLabel}</span>
        </div>
      </div>

      {/* AI Feedback */}
      <div style={{
        width: "100%", maxWidth: 480, marginBottom: 28,
        background: "rgba(100,181,246,0.06)", border: "1px solid rgba(100,181,246,0.18)",
        borderRadius: 16, padding: "18px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: "1.1rem" }}>🤖</span>
          <span style={{ color: "#64b5f6", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px" }}>
            AI Feedback
          </span>
        </div>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {aiFeedback}
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 480 }}>
        <button className="report-btn" onClick={onRetry}
          style={{ background: "rgba(255,255,255,0.08)", color: "#fff", flex: 1, minWidth: 140 }}>
          🔄 Try Again
        </button>
        <button className="report-btn" onClick={onGoHome}
          style={{ background: "linear-gradient(135deg,#1565c0,#0288d1)", color: "#fff", flex: 1, minWidth: 140 }}>
          🏠 Dashboard
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="report-stat-card">
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: "1rem" }}>{icon}</span>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1.2px" }}>{label}</span>
    </div>
    <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "#fff", marginTop: 2 }}>{value}</div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PoseDetection = ({ exerciseName }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);   // keep camera instance for retry cleanup
  const poseRef = useRef(null);     // keep pose instance for retry cleanup

  const activeRule = EXERCISE_RULES[exerciseName] || EXERCISE_RULES["Elbow Flexion Left"];

  // ── refs that must survive across renders without causing re-renders ──
  const sequenceRef = useRef([]);
  const sessionStartRef = useRef(Date.now());
  const accuracyValuesRef = useRef([]);
  const stageRef = useRef("down");
  const holdStartRef = useRef(null);
  const hasCountedHoldRef = useRef(false);
  const isRestingRef = useRef(false);
  const currentSetRef = useRef(1);
  const sessionDoneRef = useRef(false);

  // ── React state (UI only) ──
  const [reps, setReps] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(activeRule.restDuration);
  const [holdProgress, setHoldProgress] = useState(0);
  const [feedback, setFeedback] = useState("Align yourself…");
  const [confidence, setConfidence] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionReport, setSessionReport] = useState(null);

  // ── NEW: camera initialisation state ──
  const [cameraState, setCameraState] = useState(CAMERA_STATES.INITIALIZING);
  const [retryKey, setRetryKey] = useState(0); // increment to re-run the effect

  useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);

  // ── Rest timer ──
  useEffect(() => {
    let timer;
    if (isResting && restTimeLeft > 0) {
      timer = setInterval(() => setRestTimeLeft((t) => t - 1), 1000);
    } else if (restTimeLeft === 0 && isResting) {
      setIsResting(false);
      isRestingRef.current = false;
      setReps(0);
      setCurrentSet((s) => s + 1);
      setFeedback("Rest Over! Start Next Set.");
    }
    return () => clearInterval(timer);
  }, [isResting, restTimeLeft]);

  // ── Angle helper ──
  const calculateAngle = (a, b, c) => {
    const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((r * 180) / Math.PI);
    return angle > 180 ? 360 - angle : angle;
  };

  // ── Stop any running camera/pose cleanly ──
  const stopCameraAndPose = () => {
    try { cameraRef.current?.stop(); } catch (_) { }
    try { poseRef.current?.close(); } catch (_) { }
    cameraRef.current = null;
    poseRef.current = null;

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  // ── MediaPipe + Camera ──
  useEffect(() => {
    // Guard: video element must be in the DOM
    if (!videoRef.current) return;

    // Reset status every time this effect runs (including on retry)
    setCameraState(CAMERA_STATES.INITIALIZING);
    sessionStartRef.current = Date.now();
    accuracyValuesRef.current = [];
    sessionDoneRef.current = false;

    // ── 1. Check browser camera support first ──
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState(CAMERA_STATES.ERROR_NOT_FOUND);
      return;
    }

    // ── 2. Proactively request permission so we surface the error early ──
    let permissionAborted = false;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        // Permission granted — stop this test stream immediately;
        // MediaPipe Camera will open its own stream.
        stream.getTracks().forEach((t) => t.stop());

        if (permissionAborted) return;

        // ── 3. Init MediaPipe Pose ──
        let pose;
        try {
          pose = new Pose({
            locateFile: (file) => `/mediapipe/pose/${file}`,
          });
        } catch (err) {
          console.error("Pose constructor failed:", err);
          setCameraState(CAMERA_STATES.ERROR_MEDIAPIPE);
          return;
        }

        poseRef.current = pose;

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        // Surface MediaPipe model-load errors
        // (MediaPipe doesn't expose a standard .catch, so we rely on the
        //  onResults never firing as a secondary indicator handled below)

        const incrementRep = () => {
          setReps((prev) => {
            const next = prev + 1;
            if (next >= activeRule.targetReps) {
              if (currentSetRef.current >= activeRule.targetSets) {
                if (!sessionDoneRef.current) {
                  sessionDoneRef.current = true;
                  buildAndSubmitReport();
                }
              } else {
                setIsResting(true);
                isRestingRef.current = true;
                setRestTimeLeft(activeRule.restDuration);
                setFeedback("Set Complete! Take a break.");
              }
            }
            return next;
          });
        };

        pose.onResults(async (results) => {
          if (!canvasRef.current) return;

          // Mark camera as ready on the very first results callback
          setCameraState(CAMERA_STATES.READY);

          const ctx = canvasRef.current.getContext("2d");
          canvasRef.current.width = results.image.width;
          canvasRef.current.height = results.image.height;
          ctx.save();
          ctx.translate(canvasRef.current.width, 0);
          ctx.scale(-1, 1);
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

          if (results.poseLandmarks) {
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#00e676", lineWidth: 2 });
            drawLandmarks(ctx, results.poseLandmarks, { color: "#ff1744", radius: 2 });

            if (!isRestingRef.current && !sessionDoneRef.current) {
              const [p1, p2, p3] = activeRule.joints.map((i) => results.poseLandmarks[i]);
              if (p1.visibility > 0.5 && p2.visibility > 0.5 && p3.visibility > 0.5) {
                const angle = calculateAngle(p1, p2, p3);
                const inAction = activeRule.type === "min" ? angle < activeRule.range.min : angle > activeRule.range.max;
                const inRest = activeRule.type === "min" ? angle > activeRule.range.max : angle < activeRule.range.min;

                if (inRest) {
                  stageRef.current = "down";
                  holdStartRef.current = null;
                  hasCountedHoldRef.current = false;
                  setHoldProgress(0);
                }
                if (inAction && stageRef.current === "down") {
                  if (activeRule.holdTime) {
                    if (!holdStartRef.current) holdStartRef.current = Date.now();
                    const elapsed = Date.now() - holdStartRef.current;
                    setHoldProgress(Math.min((elapsed / activeRule.holdTime) * 100, 100));
                    if (elapsed >= activeRule.holdTime && !hasCountedHoldRef.current) {
                      incrementRep();
                      hasCountedHoldRef.current = true;
                      stageRef.current = "up";
                    }
                  } else {
                    incrementRep();
                    stageRef.current = "up";
                  }
                }
              }

              // Collect keypoints and send to ML model every 30 frames
              const keypoints = results.poseLandmarks
                .map((lm) => ({ ...lm, x: 1 - lm.x }))
                .flatMap((j) => [j.x, j.y, j.z])
                .slice(0, 75);
              sequenceRef.current.push(keypoints);

              if (sequenceRef.current.length === 30) {
                const seq = [...sequenceRef.current];
                sequenceRef.current = [];
                fetch(`http://localhost:8000/predict/${exerciseName}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sequence: seq }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    setFeedback(d.correct ? "Good Form! ✅" : "Adjust your position ❌");
                    setConfidence((d.confidence * 100).toFixed(1));
                    accuracyValuesRef.current.push(parseFloat(d.confidence));
                  })
                  .catch(() => { });
              }
            }
          }
          ctx.restore();
        });

        // ── 4. Init Camera — only after video ref is confirmed ──
        let camera;
        try {
          camera = new Camera(videoRef.current, {
            onFrame: async () => {
              // Only send a frame when the video element actually has data
              if (
                videoRef.current &&
                videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
              ) {
                await pose.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });
          cameraRef.current = camera;
        } catch (err) {
          console.error("Camera constructor failed:", err);
          setCameraState(CAMERA_STATES.ERROR_UNKNOWN);
          return;
        }

        // ── 5. Start camera with explicit error handling ──
        camera.start()
          .then(() => {
            // Camera is streaming — onResults will flip state to READY
            console.log("✅ Camera started successfully");
          })
          .catch((err) => {
            console.error("❌ camera.start() error:", err);
            const name = err?.name || "";
            if (name === "NotAllowedError" || name === "PermissionDeniedError") {
              setCameraState(CAMERA_STATES.ERROR_PERMISSION);
            } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
              setCameraState(CAMERA_STATES.ERROR_NOT_FOUND);
            } else {
              setCameraState(CAMERA_STATES.ERROR_UNKNOWN);
            }
          });
      })
      .catch((err) => {
        if (permissionAborted) return;
        console.error("❌ getUserMedia permission error:", err);
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setCameraState(CAMERA_STATES.ERROR_PERMISSION);
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setCameraState(CAMERA_STATES.ERROR_NOT_FOUND);
        } else {
          setCameraState(CAMERA_STATES.ERROR_UNKNOWN);
        }
      });

    return () => {
      permissionAborted = true;
      stopCameraAndPose();
    };
    // retryKey is included so that clicking Retry re-runs this entire effect
  }, [exerciseName, activeRule, retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build report + submit — reads from refs so values are always fresh ──
  const buildAndSubmitReport = () => {
    const values = accuracyValuesRef.current;
    const avgAccuracy = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    const durationMinutes = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 60000));
    const met = EXERCISE_MET[exerciseName] || 3.0;
    const caloriesBurned = Math.round(met * 70 * (durationMinutes / 60));
    const totalReps = activeRule.targetReps * activeRule.targetSets;
    const pointsEarned = Math.round(
      ((activeRule.targetSets * totalReps) * 5) + (avgAccuracy * 100 * 2) + 50
    );

    setSessionReport({
      exerciseName,
      sets: activeRule.targetSets,
      reps: totalReps,
      avgAccuracy,
      caloriesBurned,
      durationMinutes,
      pointsEarned,
    });
    setSessionComplete(true);

    submitSession(avgAccuracy, durationMinutes, caloriesBurned);
  };

  const submitSession = async (avgAccuracy, durationMinutes, caloriesBurned) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("⚠️ No token found — skipping score submission.");
        return;
      }

      const scorePayload = {
        exercise_name: exerciseName,
        sets: activeRule.targetSets,
        reps: activeRule.targetReps,
        avg_accuracy: parseFloat(avgAccuracy.toFixed(4)),
      };
      await fetch("http://localhost:8000/update-score", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(scorePayload),
      });

      const sessionPayload = {
        exercise_name: exerciseName,
        duration_minutes: parseInt(durationMinutes, 10),
        calories_burned: parseInt(caloriesBurned, 10),
        avg_accuracy: parseFloat((avgAccuracy * 100).toFixed(2)),
        fitness_level: "Intermediate",
      };
      const res = await fetch("http://localhost:8000/complete-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(sessionPayload),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("❌ /complete-exercise error:", err);
      } else {
        console.log("✅ /complete-exercise success");
      }
    } catch (err) {
      console.error("❌ submitSession network error:", err);
    }
  };

  // ── Retry camera — stop everything cleanly, then re-trigger the effect ──
  const handleCameraRetry = () => {
    stopCameraAndPose();
    setCameraState(CAMERA_STATES.INITIALIZING);
    setRetryKey((k) => k + 1);
  };

  // ── Retry exercise session (already working, now also resets camera state) ──
  const handleRetry = () => {
    setReps(0);
    setCurrentSet(1);
    setIsResting(false);
    isRestingRef.current = false;
    setRestTimeLeft(activeRule.restDuration);
    setHoldProgress(0);
    setFeedback("Align yourself…");
    setConfidence(0);
    setSessionComplete(false);
    setSessionReport(null);
    sessionStartRef.current = Date.now();
    accuracyValuesRef.current = [];
    stageRef.current = "down";
    holdStartRef.current = null;
    hasCountedHoldRef.current = false;
    currentSetRef.current = 1;
    sessionDoneRef.current = false;
    // Also re-trigger the camera effect in case it failed
    setCameraState(CAMERA_STATES.INITIALIZING);
    setRetryKey((k) => k + 1);
  };

  // ── Render ──
  return (
    <div className="pose-container">
      <div className="pose-canvas-wrap" style={{ position: "relative" }}>
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "min(55vw, 520px)",
            display: "block",
            // Keep blur only during rest; camera status overlay handles other states
            filter: isResting ? "blur(8px) brightness(0.4)" : "none",
            // Prevent a white flash while canvas is 0×0 before first frame
            background: "#0a0f1e",
          }}
        />

        {/* Camera status overlay (initializing / errors) — hidden once READY */}
        {!sessionComplete && (
          <CameraStatusOverlay
            state={cameraState}
            onRetry={handleCameraRetry}
          />
        )}

        {/* Rest overlay */}
        {isResting && cameraState === CAMERA_STATES.READY && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 10,
          }}>
            <p style={{ letterSpacing: "3px", fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Rest Time
            </p>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "7rem", fontWeight: 800, color: "var(--accent-blue)", lineHeight: 1 }}>
              {restTimeLeft}
            </div>
            <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>
              Ready for Set {currentSet + 1}?
            </p>
          </div>
        )}

        {/* Session report overlay */}
        {sessionComplete && sessionReport && (
          <SessionReport
            report={sessionReport}
            onGoHome={() => navigate("/")}
            onRetry={handleRetry}
          />
        )}

        {/* Preparing report spinner */}
        {sessionComplete && !sessionReport && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "rgba(10,15,30,0.92)", color: "#fff", zIndex: 20, gap: 16,
          }}>
            <div style={{ fontSize: "2rem" }}>⏳</div>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>Preparing your report…</p>
          </div>
        )}
      </div>

      {/* Live stats bar */}
      <div className="pose-stats">
        <DataBox label="Current Set" value={`${currentSet} / ${activeRule.targetSets}`} />
        <DataBox label="Reps Done" value={`${reps} / ${activeRule.targetReps}`} progress={holdProgress} />
        <DataBox label="AI Analysis" value={feedback} small />
        <DataBox label="Form Accuracy" value={`${confidence}%`} />
      </div>
    </div>
  );
};

const DataBox = ({ label, value, progress = 0, small }) => (
  <div className="pose-data-box">
    <div className="pose-data-box__label">{label}</div>
    <div className="pose-data-box__value" style={{ fontSize: small ? "0.82rem" : undefined }}>{value}</div>
    {progress > 0 && (
      <div style={{ width: "100%", height: 5, background: "#f1f2f6", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent-blue)", transition: "width 0.1s linear" }} />
      </div>
    )}
  </div>
);

export default PoseDetection;