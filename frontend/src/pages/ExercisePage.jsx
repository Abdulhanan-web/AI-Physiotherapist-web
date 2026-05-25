// pages/ExercisePage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import PoseDetection from "../components/PoseDetection";

const ExercisePage = () => {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);

  return (
    <div className="page exercise-page">
      <div className="exercise-page__header">
        <button className="btn-back" onClick={() => window.history.back()}>← Back</button>
        <h2 className="exercise-page__title">{decodedName}</h2>
        {/* spacer to keep title centred */}
        <div style={{ width: 80 }} />
      </div>
      <PoseDetection exerciseName={decodedName} />
    </div>
  );
};

export default ExercisePage;