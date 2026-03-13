import React from "react";
import { useParams } from "react-router-dom";
import PoseDetection from "../components/PoseDetection";

const ExercisePage = () => {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  return (
    <div style={{ backgroundColor: "#1a1a1a", minHeight: "100vh", color: "white", padding: "20px" }}>
      <button 
        onClick={() => window.history.back()} 
        style={{ marginBottom: "20px", background: "none", border: "1px solid white", color: "white", padding: "5px 15px", borderRadius: "5px", cursor: "pointer" }}
      >
        ← Back
      </button>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>{decodedName}</h2>
      <PoseDetection exerciseName={decodedName} />
    </div>
  );
};

export default ExercisePage;