import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks, POSE_CONNECTIONS } from "@mediapipe/drawing_utils";

// --- 1. Comprehensive Exercise Configuration ---
// Customizing Reps, Sets, and Rest for each rehab movement
const EXERCISE_RULES = {
  "Elbow Flexion Left": {
    joints: [11, 13, 15], range: { min: 40, max: 150 }, type: "min",
    targetReps: 12, targetSets: 3, restDuration: 30
  },
  "Elbow Flexion Right": {
    joints: [12, 14, 16], range: { min: 40, max: 150 }, type: "min",
    targetReps: 12, targetSets: 3, restDuration: 30
  },
  "Shoulder Flexion Left": {
    joints: [23, 11, 13], range: { min: 40, max: 160 }, type: "max",
    targetReps: 10, targetSets: 3, restDuration: 45
  },
  "Shoulder Flexion Right": {
    joints: [24, 12, 14], range: { min: 40, max: 160 }, type: "max",
    targetReps: 10, targetSets: 3, restDuration: 45
  },
  "Shoulder Abduction Left": {
    joints: [23, 11, 13], range: { min: 30, max: 90 }, type: "max",
    holdTime: 3000, targetReps: 8, targetSets: 3, restDuration: 60
  },
  "Shoulder Abduction Right": {
    joints: [24, 12, 14], range: { min: 30, max: 90 }, type: "max",
    holdTime: 3000, targetReps: 8, targetSets: 3, restDuration: 60
  },
  "Shoulder Forward Elevation": {
    joints: [24, 12, 14], range: { min: 40, max: 160 }, type: "max",
    holdTime: 2000, targetReps: 10, targetSets: 3, restDuration: 45
  },
  "Side Tap Left": {
    joints: [23, 25, 27], range: { min: 140, max: 175 }, type: "min",
    targetReps: 15, targetSets: 2, restDuration: 20
  },
  "Side Tap Right": {
    joints: [24, 26, 28], range: { min: 140, max: 175 }, type: "min",
    targetReps: 15, targetSets: 2, restDuration: 20
  },
  "Cat-Cow Stretch": {
    joints: [11, 23, 25],
    range: { min: 70, max: 140 },
    type: "max",
    targetReps: 10,
    targetSets: 2,
    restDuration: 30,
  },

  "Knee to Chest Stretch": {
    joints: [23, 25, 27],
    range: { min: 40, max: 100 },
    type: "min",
    holdTime: 3000,
    targetReps: 8,
    targetSets: 2,
    restDuration: 30,
  },

  "Bird Dog": {
    joints: [11, 23, 25],
    range: { min: 150, max: 180 },
    type: "max",
    holdTime: 4000,
    targetReps: 10,
    targetSets: 2,
    restDuration: 40,
  },

  "Glute Bridge": {
    joints: [11, 23, 25],
    range: { min: 150, max: 180 },
    type: "max",
    holdTime: 3000,
    targetReps: 12,
    targetSets: 3,
    restDuration: 40,
  },

  "Child's Pose Stretch": {
    joints: [11, 23, 25],
    range: { min: 50, max: 100 },
    type: "min",
    holdTime: 5000,
    targetReps: 5,
    targetSets: 2,
    restDuration: 30,
  },

  // ================= KNEE RECOVERY =================

  "Quad Sets": {
    joints: [23, 25, 27],
    range: { min: 160, max: 180 },
    type: "max",
    holdTime: 3000,
    targetReps: 10,
    targetSets: 2,
    restDuration: 20,
  },

  "Straight Leg Raise": {
    joints: [23, 25, 27],
    range: { min: 40, max: 90 },
    type: "min",
    targetReps: 10,
    targetSets: 3,
    restDuration: 30,
  },

  "Heel Slides": {
    joints: [23, 25, 27],
    range: { min: 50, max: 130 },
    type: "min",
    targetReps: 12,
    targetSets: 2,
    restDuration: 25,
  },

  "Seated Knee Extension": {
    joints: [23, 25, 27],
    range: { min: 150, max: 180 },
    type: "max",
    targetReps: 10,
    targetSets: 2,
    restDuration: 25,
  },

  "Mini Squats": {
    joints: [23, 25, 27],
    range: { min: 70, max: 130 },
    type: "min",
    targetReps: 15,
    targetSets: 3,
    restDuration: 35,
  },

  "Step-Ups": {
    joints: [23, 25, 27],
    range: { min: 80, max: 140 },
    type: "min",
    targetReps: 12,
    targetSets: 3,
    restDuration: 35,
  },

  "Hamstring Curls": {
    joints: [23, 25, 27],
    range: { min: 40, max: 110 },
    type: "min",
    targetReps: 12,
    targetSets: 2,
    restDuration: 30,
  },

  "Lunges": {
    joints: [23, 25, 27],
    range: { min: 70, max: 120 },
    type: "min",
    targetReps: 10,
    targetSets: 3,
    restDuration: 40,
  },

  "Single Leg Balance": {
    joints: [23, 25, 27],
    range: { min: 160, max: 180 },
    type: "max",
    holdTime: 5000,
    targetReps: 5,
    targetSets: 2,
    restDuration: 30,
  },
};

const PoseDetection = ({ exerciseName }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sequenceRef = useRef([]);

  // Find rule or fallback to a default
  const activeRule = EXERCISE_RULES[exerciseName] || EXERCISE_RULES["Elbow Flexion Left"];

  // State
  const [reps, setReps] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(activeRule.restDuration);
  const [holdProgress, setHoldProgress] = useState(0);
  const [feedback, setFeedback] = useState("Align yourself...");
  const [confidence, setConfidence] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [accuracyValues, setAccuracyValues] = useState([]);

  // Refs to manage internal logic without triggering re-renders
  const stageRef = useRef("down");
  const holdStartRef = useRef(null);
  const hasCountedHoldRef = useRef(false);
  const isRestingRef = useRef(false);
  const currentSetRef = useRef(1);  // Track current set to avoid stale closure

  // Keep currentSetRef in sync with state
  useEffect(() => {
    currentSetRef.current = currentSet;
  }, [currentSet]);

  // --- REST TIMER ---
  useEffect(() => {
    let timer;
    if (isResting && restTimeLeft > 0) {
      timer = setInterval(() => setRestTimeLeft(t => t - 1), 1000);
    } else if (restTimeLeft === 0 && isResting) {
      setIsResting(false);
      isRestingRef.current = false;
      setReps(0);
      setCurrentSet(s => s + 1);
      setFeedback("Rest Over! Start Next Set.");
    }
    return () => clearInterval(timer);
  }, [isResting, restTimeLeft]);

  // --- ANGLE CALCULATION ---
  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    return angle > 180.0 ? 360 - angle : angle;
  };

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

    pose.onResults(async (results) => {
      if (!canvasRef.current) return;
      const canvasCtx = canvasRef.current.getContext("2d");

      canvasRef.current.width = results.image.width;
      canvasRef.current.height = results.image.height;

      canvasCtx.save();
      canvasCtx.translate(canvasRef.current.width, 0);
      canvasCtx.scale(-1, 1);
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
        drawLandmarks(canvasCtx, results.poseLandmarks, { color: "#FF0000", radius: 2 });

        // Skip logic if resting or finished
        if (isRestingRef.current || sessionComplete) {
          canvasCtx.restore();
          return;
        }

        // --- 1. Rep/Hold Tracker ---
        const [p1, p2, p3] = activeRule.joints.map(i => results.poseLandmarks[i]);
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

        // --- 2. AI Form Inference ---
        const keypoints = results.poseLandmarks.map(lm => ({ ...lm, x: 1 - lm.x })).flatMap(j => [j.x, j.y, j.z]).slice(0, 75);
        sequenceRef.current.push(keypoints);

        if (sequenceRef.current.length === 30) {
          const currentSeq = [...sequenceRef.current];
          sequenceRef.current = [];
          fetch(`http://localhost:8000/predict/${exerciseName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sequence: currentSeq }),
          })
            .then(res => res.json())
            .then(data => {
              const accuracyPercent = (data.confidence * 100).toFixed(1);
              setFeedback(data.correct ? "Good Form! ✅" : "Adjust your position ❌");
              setConfidence(accuracyPercent);
              // Store accuracy values for calculating average
              setAccuracyValues(prev => [...prev, parseFloat(data.confidence)]);
            }).catch(() => { });
        }
      }
      canvasCtx.restore();
    });

    const incrementRep = () => {
      setReps((prev) => {
        const nextReps = prev + 1;
        if (nextReps >= activeRule.targetReps) {
          // Use the ref to get the current set value (avoids stale closure)
          if (currentSetRef.current >= activeRule.targetSets) {
            setSessionComplete(true);
          } else {
            setIsResting(true);
            isRestingRef.current = true;
            setRestTimeLeft(activeRule.restDuration);
            setFeedback("Set Complete! Take a break.");
          }
        }
        return nextReps;
      });
    };

    const camera = new Camera(videoRef.current, {
      onFrame: async () => { await pose.send({ image: videoRef.current }); },
      width: 640, height: 480,
    });
    camera.start();
    return () => camera.stop();
  }, [exerciseName, currentSet, sessionComplete, activeRule]);

  // Handle score submission when session is complete
  useEffect(() => {
    if (sessionComplete && accuracyValues.length > 0) {
      const avgAccuracy = accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length;
      submitScore(avgAccuracy);
    }
  }, [sessionComplete]);

  const submitScore = async (avgAccuracy) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch('http://localhost:8000/update-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          exercise_name: exerciseName,
          sets: activeRule.targetSets,
          reps: activeRule.targetReps,
          avg_accuracy: avgAccuracy,
        }),
      });

      const data = await response.json();
      console.log('Score submitted:', data);

      // Record exercise completion for streak
      const completionResponse = await fetch('http://localhost:8000/complete-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          exercise_name: exerciseName,
        }),
      });

      const completionData = await completionResponse.json();
      console.log('Exercise completed:', completionData);
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  return (
    <div style={{ maxWidth: "70vw", margin: "30px auto", fontFamily: "system-ui" }}>
      <div style={{ position: "relative", backgroundColor: "#111", borderRadius: "15px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        <video ref={videoRef} style={{ display: "none" }} />
        <canvas ref={canvasRef} style={{ width: "100%", height: "550px", display: "block", filter: isResting ? "blur(8px) brightness(0.5)" : "none" }} />

        {isResting && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 10 }}>
            <h2 style={{ letterSpacing: "2px", opacity: 0.8 }}>REST TIME</h2>
            <div style={{ fontSize: "6rem", fontWeight: "900", color: "#3498db" }}>{restTimeLeft}</div>
            <p>Ready for Set {currentSet + 1}?</p>
          </div>
        )}

        {sessionComplete && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(46, 204, 113, 0.95)", color: "#fff", zIndex: 20 }}>
            <h1 style={{ fontSize: "3rem", margin: 0 }}>EXCELLENT! 🏆</h1>
            <p style={{ fontSize: "1.2rem", margin: "10px 0 30px 0" }}>Workout Goals Met.</p>
            <button
              onClick={() => navigate('/')}
              style={{ padding: "15px 40px", fontSize: "1rem", border: "none", borderRadius: "50px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", backgroundColor: "#fff", color: "#2ecc71", transition: "all 0.3s ease" }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f0f0f0";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#fff";
                e.target.style.transform = "scale(1)";
              }}
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* UI Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginTop: "20px" }}>
        <DataBox label="CURRENT SET" value={`${currentSet} / ${activeRule.targetSets}`} />
        <DataBox
          label="REPS DONE"
          value={`${reps} / ${activeRule.targetReps}`}
          color="#2ecc71"
          progress={holdProgress}
        />
        <DataBox label="AI ANALYSIS" value={feedback} size="14px" />
        <DataBox label="FORM ACCURACY" value={`${confidence}%`} />
      </div>
    </div>
  );
};

// Sub-component for clean UI
const DataBox = ({ label, value, color = "#2c3e50", size = "22px", progress = 0 }) => (
  <div style={{ background: "#fff", padding: "15px", borderRadius: "12px", textAlign: "center", border: "1px solid #eee" }}>
    <p style={{ margin: 0, fontSize: "10px", fontWeight: "800", color: "#bdc3c7", textTransform: "uppercase" }}>{label}</p>
    <h3 style={{ margin: "8px 0", color: color, fontSize: size }}>{value}</h3>
    {progress > 0 && (
      <div style={{ width: "100%", height: "6px", background: "#f1f2f6", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "#3498db", transition: "width 0.1s linear" }} />
      </div>
    )}
  </div>
);

export default PoseDetection;