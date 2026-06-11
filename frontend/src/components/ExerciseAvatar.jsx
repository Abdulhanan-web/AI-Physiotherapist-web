//components/ExerciseAvatar.jsx
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

function CameraController() {
    const { camera } = useThree();

    useEffect(() => {
        // EXACT FRONT VIEW
        camera.position.set(0, 0, 3);
        camera.lookAt(0, 0, 0);
    }, [camera]);

    return null;
}

function Avatar() {
    const group = useRef();

    const { scene, animations } = useGLTF(
        "/models/side_tap_left.glb"
    );

    const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (actions) {
            Object.values(actions).forEach((action) => {
                action.reset();

                // BOOMERANG / PING-PONG ANIMATION
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
                position={[0, -0.75, 0]}   // moved up so feet are visible
            />
        </group>
    );
}

export default function ExerciseAvatar() {
    return (
        <div
            style={{
                width: "100%",
                height: "450px",
                background: "#f5f5f5",
                borderRadius: "15px",
                overflow: "hidden",
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 3], fov: 40 }}
                style={{ pointerEvents: "none" }} // disables user control
            >
                <ambientLight intensity={2} />
                <directionalLight position={[5, 5, 5]} intensity={1.5} />

                <CameraController />
                <Avatar />
            </Canvas>
        </div>
    );
}