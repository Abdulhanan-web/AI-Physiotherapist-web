// pages/SpecialtyProgram.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { specialtyPrograms } from "../data/specialtyPrograms";

const SpecialtyProgram = () => {
  const { condition } = useParams();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(condition);
  const program = specialtyPrograms[decoded];

  if (!program) {
    return (
      <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 24, textAlign: "center", padding: 24 }}>
        <h1 className="page-title">Program Not Found</h1>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate("/")}>← Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="page specialty-page">
      <button className="btn-back" onClick={() => navigate("/")}>← Dashboard</button>

      <div style={{ marginTop: 32, marginBottom: 52 }}>
        <h1 className="page-title">{decoded}</h1>
        <p className="page-subtitle" style={{ marginTop: 10, maxWidth: 700 }}>
          Personalised rehabilitation exercises designed for recovery and mobility improvement.
        </p>
      </div>

      {program.phases.map((phaseData, pi) => (
        <div key={pi} style={{ marginBottom: 60 }}>
          <span className="phase-label">{phaseData.phase}</span>
          <div className="phase-underline" />

          <div className="grid--auto">
            {phaseData.exercises.map((ex, ei) => (
              <div key={ei} className="specialty-exercise-card">
                <div>
                  <h3>{ex.name}</h3>
                  <p>{ex.description}</p>
                </div>
                <button
                  className="btn btn--primary"
                  style={{ marginTop: 24 }}
                  onClick={() => navigate(`/exercise/${encodeURIComponent(ex.name)}`)}
                >
                  Start Exercise
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SpecialtyProgram;