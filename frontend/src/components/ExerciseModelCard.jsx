// components/ExerciseModelCard.jsx
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

function CameraController() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

function Avatar({ model }) {
  const group = useRef();
  const { scene, animations } = useGLTF(`/models/${model}`);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        action.reset();
        action.setLoop(THREE.LoopPingPong, Infinity);
        action.clampWhenFinished = false;
        action.fadeIn(0.3);
        action.play();
      });
    }
  }, [actions]);

  return (
    <group ref={group}>
      <primitive object={scene} scale={0.8} position={[0, -0.75, 0]} />
    </group>
  );
}

export default function ExerciseModelCard({ model, title, onStart, streak }) {
  const s = streak || { count: 0, hasWarning: false, isBroken: false };

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: 16,
        padding: 15,
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border)",
        transition: "background 0.3s, box-shadow 0.3s",
        position: "relative",
      }}
    >
      {/* ── Streak badge ── */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "var(--bg-surface)",
          border: "none",
          borderBottomLeftRadius: 12,
          padding: "4px 10px",
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 550,
            fontSize: "1.25rem",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {s.count}
        </span>

        <span
          style={{
            fontSize: "1rem",
            filter: s.isBroken ? "grayscale(1) opacity(0.35)" : "none",
          }}
        >
          🔥
        </span>

        {s.hasWarning && !s.isBroken && (
          <span style={{ fontSize: "0.9rem" }}>⏳</span>
        )}
      </div>

      {/* ── 3-D canvas ── */}
      <div
        style={{
          height: 250,
          background: "var(--bg-card)",
          borderRadius: 12,
          overflow: "hidden",
          transition: "background 0.3s",
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 3], fov: 40 }}
          style={{ pointerEvents: "none" }}
        >
          <ambientLight intensity={2} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <CameraController />
          <Avatar model={model} />
        </Canvas>
      </div>

      <h3
        style={{
          marginTop: 15,
          marginBottom: 10,
          textAlign: "center",
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          transition: "color 0.3s",
        }}
      >
        {title}
      </h3>

      <button
        className="btn btn--primary"
        style={{ width: "100%" }}
        onClick={onStart}
      >
        Start Exercise
      </button>
    </div>
  );
}