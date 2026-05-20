import React from "react";
import { useParams } from "react-router-dom";
import PoseDetection from "../components/PoseDetection";

const ExercisePage = () => {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  return (
    <div style={{ backgroundColor: "#1a1a1a", minHeight: "100vh", color: "white", padding: "20px", width: "96vw" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
        <button 
          onClick={() => window.history.back()} 
          style={{ background: "none", border: "1px solid white", color: "white", padding: "5px 15px", borderRadius: "5px", cursor: "pointer" }}
        >
          ← Back
        </button>
        <h2 style={{ margin: 0, flex: 1, textAlign: "center" }}>{decodedName}</h2>
      </div>
      <PoseDetection exerciseName={decodedName} />
    </div>
  );
};

export default ExercisePage;