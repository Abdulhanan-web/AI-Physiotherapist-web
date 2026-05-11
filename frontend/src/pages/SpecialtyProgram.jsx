import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { specialtyPrograms } from "../data/specialtyPrograms";

const SpecialtyProgram = () => {
    const { condition } = useParams();
    const navigate = useNavigate();

    const decodedCondition = decodeURIComponent(condition);

    const selectedProgram =
        specialtyPrograms[decodedCondition];

    if (!selectedProgram) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#1a1a1a",
                    color: "white",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                }}
            >
                <h1>Program Not Found</h1>

                <button
                    onClick={() => navigate("/")}
                    style={{
                        marginTop: "20px",
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                    }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#1a1a1a",
                color: "white",
                padding: "40px 20px",
                fontFamily: "'Segoe UI', sans-serif",
            }}
        >
            {/* Header */}
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    marginBottom: "40px",
                }}
            >
                <button
                    onClick={() => navigate("/")}
                    style={{
                        marginBottom: "20px",
                        background: "none",
                        border: "1px solid white",
                        color: "white",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        cursor: "pointer",
                    }}
                >
                    ← Back
                </button>

                <h1
                    style={{
                        fontSize: "3rem",
                        marginBottom: "10px",
                    }}
                >
                    {decodedCondition}
                </h1>

                <p
                    style={{
                        color: "#b2bec3",
                        fontSize: "1.1rem",
                    }}
                >
                    Personalized rehabilitation exercises
                    designed for recovery and mobility
                    improvement.
                </p>
            </div>

            {/* Phases */}
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                }}
            >
                {selectedProgram.phases.map(
                    (phaseData, phaseIndex) => (
                        <div
                            key={phaseIndex}
                            style={{
                                marginBottom: "50px",
                            }}
                        >
                            {/* Phase Title */}
                            <div
                                style={{
                                    marginBottom: "25px",
                                }}
                            >
                                <h2
                                    style={{
                                        color: "#f1c40f",
                                        fontSize: "2rem",
                                        marginBottom: "8px",
                                    }}
                                >
                                    {phaseData.phase}
                                </h2>

                                <div
                                    style={{
                                        width: "80px",
                                        height: "4px",
                                        backgroundColor: "#f1c40f",
                                        borderRadius: "5px",
                                    }}
                                />
                            </div>

                            {/* Exercise Grid */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(300px, 1fr))",
                                    gap: "25px",
                                }}
                            >
                                {phaseData.exercises.map(
                                    (exercise, exerciseIndex) => (
                                        <div
                                            key={exerciseIndex}
                                            style={{
                                                background: "#ffffff",
                                                color: "#2d3436",
                                                borderRadius: "18px",
                                                padding: "25px",
                                                boxShadow:
                                                    "0 10px 20px rgba(0,0,0,0.2)",
                                                transition: "transform 0.2s ease",
                                            }}
                                            onMouseEnter={(e) =>
                                            (e.currentTarget.style.transform =
                                                "translateY(-5px)")
                                            }
                                            onMouseLeave={(e) =>
                                            (e.currentTarget.style.transform =
                                                "translateY(0)")
                                            }
                                        >
                                            <h3
                                                style={{
                                                    marginBottom: "15px",
                                                    fontSize: "1.4rem",
                                                }}
                                            >
                                                {exercise.name}
                                            </h3>

                                            <p
                                                style={{
                                                    color: "#636e72",
                                                    lineHeight: "1.6",
                                                    minHeight: "70px",
                                                }}
                                            >
                                                {exercise.description}
                                            </p>

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/exercise/${encodeURIComponent(exercise.name)}`
                                                    )
                                                }
                                                style={{
                                                    width: "100%",
                                                    marginTop: "20px",
                                                    backgroundColor: "#2ecc71",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "14px",
                                                    borderRadius: "10px",
                                                    cursor: "pointer",
                                                    fontWeight: "bold",
                                                    fontSize: "1rem",
                                                }}
                                            >
                                                Start Exercise
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default SpecialtyProgram;