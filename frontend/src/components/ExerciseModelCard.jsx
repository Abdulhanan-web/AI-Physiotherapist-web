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
      <primitive
        object={scene}
        scale={0.8}
        position={[0, -0.75, 0]}
      />
    </group>
  );
}

export default function ExerciseModelCard({
  model,
  title,
  onStart,
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 15,
        boxShadow: "0 5px 20px rgba(0,0,0,.08)",
      }}
    >
      <div
        style={{
          height: 250,
          background: "#f5f5f5",
          borderRadius: 12,
          overflow: "hidden",
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