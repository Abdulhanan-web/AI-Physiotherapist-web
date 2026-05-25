// components/PoseDetection.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks, POSE_CONNECTIONS } from "@mediapipe/drawing_utils";

const EXERCISE_RULES = {
  "Elbow Flexion Left":        { joints:[11,13,15], range:{min:40,max:150}, type:"min", targetReps:12, targetSets:3, restDuration:30 },
  "Elbow Flexion Right":       { joints:[12,14,16], range:{min:40,max:150}, type:"min", targetReps:12, targetSets:3, restDuration:30 },
  "Shoulder Flexion Left":     { joints:[23,11,13], range:{min:40,max:160}, type:"max", targetReps:10, targetSets:3, restDuration:45 },
  "Shoulder Flexion Right":    { joints:[24,12,14], range:{min:40,max:160}, type:"max", targetReps:10, targetSets:3, restDuration:45 },
  "Shoulder Abduction Left":   { joints:[23,11,13], range:{min:30,max:90},  type:"max", holdTime:3000, targetReps:8,  targetSets:3, restDuration:60 },
  "Shoulder Abduction Right":  { joints:[24,12,14], range:{min:30,max:90},  type:"max", holdTime:3000, targetReps:8,  targetSets:3, restDuration:60 },
  "Shoulder Forward Elevation":{ joints:[24,12,14], range:{min:40,max:160}, type:"max", holdTime:2000, targetReps:10, targetSets:3, restDuration:45 },
  "Side Tap Left":             { joints:[23,25,27], range:{min:140,max:175},type:"min", targetReps:15, targetSets:2, restDuration:20 },
  "Side Tap Right":            { joints:[24,26,28], range:{min:140,max:175},type:"min", targetReps:15, targetSets:2, restDuration:20 },
  "Cat-Cow Stretch":           { joints:[11,23,25], range:{min:70,max:140}, type:"max", targetReps:10, targetSets:2, restDuration:30 },
  "Knee to Chest Stretch":     { joints:[23,25,27], range:{min:40,max:100}, type:"min", holdTime:3000, targetReps:8,  targetSets:2, restDuration:30 },
  "Bird Dog":                  { joints:[11,23,25], range:{min:150,max:180},type:"max", holdTime:4000, targetReps:10, targetSets:2, restDuration:40 },
  "Glute Bridge":              { joints:[11,23,25], range:{min:150,max:180},type:"max", holdTime:3000, targetReps:12, targetSets:3, restDuration:40 },
  "Child's Pose Stretch":      { joints:[11,23,25], range:{min:50,max:100}, type:"min", holdTime:5000, targetReps:5,  targetSets:2, restDuration:30 },
  "Quad Sets":                 { joints:[23,25,27], range:{min:160,max:180},type:"max", holdTime:3000, targetReps:10, targetSets:2, restDuration:20 },
  "Straight Leg Raise":        { joints:[23,25,27], range:{min:40,max:90},  type:"min", targetReps:10, targetSets:3, restDuration:30 },
  "Heel Slides":               { joints:[23,25,27], range:{min:50,max:130}, type:"min", targetReps:12, targetSets:2, restDuration:25 },
  "Seated Knee Extension":     { joints:[23,25,27], range:{min:150,max:180},type:"max", targetReps:10, targetSets:2, restDuration:25 },
  "Mini Squats":               { joints:[23,25,27], range:{min:70,max:130}, type:"min", targetReps:15, targetSets:3, restDuration:35 },
  "Step-Ups":                  { joints:[23,25,27], range:{min:80,max:140}, type:"min", targetReps:12, targetSets:3, restDuration:35 },
  "Hamstring Curls":           { joints:[23,25,27], range:{min:40,max:110}, type:"min", targetReps:12, targetSets:2, restDuration:30 },
  "Lunges":                    { joints:[23,25,27], range:{min:70,max:120}, type:"min", targetReps:10, targetSets:3, restDuration:40 },
  "Single Leg Balance":        { joints:[23,25,27], range:{min:160,max:180},type:"max", holdTime:5000, targetReps:5,  targetSets:2, restDuration:30 },
};

const PoseDetection = ({ exerciseName }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sequenceRef = useRef([]);
  const activeRule = EXERCISE_RULES[exerciseName] || EXERCISE_RULES["Elbow Flexion Left"];

  const [reps, setReps] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(activeRule.restDuration);
  const [holdProgress, setHoldProgress] = useState(0);
  const [feedback, setFeedback] = useState("Align yourself…");
  const [confidence, setConfidence] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [accuracyValues, setAccuracyValues] = useState([]);

  const stageRef = useRef("down");
  const holdStartRef = useRef(null);
  const hasCountedHoldRef = useRef(false);
  const isRestingRef = useRef(false);
  const currentSetRef = useRef(1);

  useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);

  useEffect(() => {
    let timer;
    if (isResting && restTimeLeft > 0) {
      timer = setInterval(() => setRestTimeLeft((t) => t - 1), 1000);
    } else if (restTimeLeft === 0 && isResting) {
      setIsResting(false); isRestingRef.current = false;
      setReps(0); setCurrentSet((s) => s + 1);
      setFeedback("Rest Over! Start Next Set.");
    }
    return () => clearInterval(timer);
  }, [isResting, restTimeLeft]);

  const calculateAngle = (a, b, c) => {
    const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((r * 180) / Math.PI);
    return angle > 180 ? 360 - angle : angle;
  };

  useEffect(() => {
    const pose = new Pose({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
    pose.setOptions({ modelComplexity:1, smoothLandmarks:true, minDetectionConfidence:0.5, minTrackingConfidence:0.5 });

    const incrementRep = () => {
      setReps((prev) => {
        const next = prev + 1;
        if (next >= activeRule.targetReps) {
          if (currentSetRef.current >= activeRule.targetSets) {
            setSessionComplete(true);
          } else {
            setIsResting(true); isRestingRef.current = true;
            setRestTimeLeft(activeRule.restDuration);
            setFeedback("Set Complete! Take a break.");
          }
        }
        return next;
      });
    };

    pose.onResults(async (results) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width  = results.image.width;
      canvasRef.current.height = results.image.height;
      ctx.save();
      ctx.translate(canvasRef.current.width, 0);
      ctx.scale(-1, 1);
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color:"#00e676", lineWidth:2 });
        drawLandmarks(ctx, results.poseLandmarks, { color:"#ff1744", radius:2 });

        if (!isRestingRef.current && !sessionComplete) {
          const [p1, p2, p3] = activeRule.joints.map((i) => results.poseLandmarks[i]);
          if (p1.visibility > 0.5 && p2.visibility > 0.5 && p3.visibility > 0.5) {
            const angle = calculateAngle(p1, p2, p3);
            const inAction = activeRule.type === "min" ? angle < activeRule.range.min : angle > activeRule.range.max;
            const inRest   = activeRule.type === "min" ? angle > activeRule.range.max : angle < activeRule.range.min;

            if (inRest) {
              stageRef.current = "down"; holdStartRef.current = null;
              hasCountedHoldRef.current = false; setHoldProgress(0);
            }
            if (inAction && stageRef.current === "down") {
              if (activeRule.holdTime) {
                if (!holdStartRef.current) holdStartRef.current = Date.now();
                const elapsed = Date.now() - holdStartRef.current;
                setHoldProgress(Math.min((elapsed / activeRule.holdTime) * 100, 100));
                if (elapsed >= activeRule.holdTime && !hasCountedHoldRef.current) {
                  incrementRep(); hasCountedHoldRef.current = true; stageRef.current = "up";
                }
              } else {
                incrementRep(); stageRef.current = "up";
              }
            }
          }

          const keypoints = results.poseLandmarks.map((lm) => ({ ...lm, x: 1 - lm.x }))
            .flatMap((j) => [j.x, j.y, j.z]).slice(0, 75);
          sequenceRef.current.push(keypoints);
          if (sequenceRef.current.length === 30) {
            const seq = [...sequenceRef.current]; sequenceRef.current = [];
            fetch(`http://localhost:8000/predict/${exerciseName}`, {
              method:"POST",
              headers:{"Content-Type":"application/json"},
              body: JSON.stringify({ sequence: seq }),
            }).then((r) => r.json()).then((d) => {
              setFeedback(d.correct ? "Good Form! ✅" : "Adjust your position ❌");
              setConfidence((d.confidence * 100).toFixed(1));
              setAccuracyValues((prev) => [...prev, parseFloat(d.confidence)]);
            }).catch(() => {});
          }
        }
      }
      ctx.restore();
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => { await pose.send({ image: videoRef.current }); },
      width:640, height:480,
    });
    camera.start();
    return () => camera.stop();
  }, [exerciseName, sessionComplete, activeRule]);

  useEffect(() => {
    if (sessionComplete && accuracyValues.length > 0) {
      const avg = accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length;
      submitScore(avg);
    }
  }, [sessionComplete]);

  const submitScore = async (avgAccuracy) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await fetch("http://localhost:8000/update-score", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body: JSON.stringify({ exercise_name:exerciseName, sets:activeRule.targetSets, reps:activeRule.targetReps, avg_accuracy:avgAccuracy }),
      });
      await fetch("http://localhost:8000/complete-exercise", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body: JSON.stringify({ exercise_name:exerciseName }),
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="pose-container">
      <div className="pose-canvas-wrap">
        <video ref={videoRef} style={{ display:"none" }} />
        <canvas
          ref={canvasRef}
          style={{ width:"100%", height:"min(55vw, 520px)", display:"block", filter: isResting ? "blur(8px) brightness(0.4)" : "none" }}
        />

        {isResting && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#fff", zIndex:10 }}>
            <p style={{ letterSpacing:"3px", fontSize:"0.85rem", color:"var(--text-secondary)", textTransform:"uppercase" }}>Rest Time</p>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"7rem", fontWeight:800, color:"var(--accent-blue)", lineHeight:1 }}>{restTimeLeft}</div>
            <p style={{ color:"var(--text-secondary)", marginTop:8 }}>Ready for Set {currentSet + 1}?</p>
          </div>
        )}

        {sessionComplete && (
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(0,200,83,0.95)", color:"#fff", zIndex:20, gap:16 }}>
            <div style={{ fontSize:"3rem" }}>🏆</div>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:"2.5rem", fontWeight:800, margin:0 }}>EXCELLENT!</h2>
            <p style={{ color:"rgba(255,255,255,0.8)", margin:0 }}>All workout goals met.</p>
            <button
              onClick={() => navigate("/")}
              style={{ marginTop:8, padding:"14px 36px", background:"#fff", color:"#00c853", border:"none", borderRadius:"50px", fontWeight:700, cursor:"pointer", fontFamily:"var(--font-display)", fontSize:"1rem" }}
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>

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
      <div style={{ width:"100%", height:5, background:"#f1f2f6", borderRadius:3, overflow:"hidden", marginTop:8 }}>
        <div style={{ width:`${progress}%`, height:"100%", background:"var(--accent-blue)", transition:"width 0.1s linear" }} />
      </div>
    )}
  </div>
);

export default PoseDetection;