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
                    width: "100%",
                    backgroundColor: "#1a1a1a",
                    color: "white",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    padding: "20px",
                    boxSizing: "border-box",
                    textAlign: "center",
                }}
            >
                <h1
                    style={{
                        fontSize: "clamp(2rem, 5vw, 3rem)",
                        marginBottom: "20px",
                    }}
                >
                    Program Not Found
                </h1>

                <button
                    onClick={() => navigate("/")}
                    style={{
                        padding: "12px 24px",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "bold",
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
                width: "99vw",
                backgroundColor: "#1a1a1a",
                color: "white",
                padding: "30px 0",
                fontFamily: "'Segoe UI', sans-serif",
                boxSizing: "border-box",
                overflowX: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    width: "100%",
                    padding: "0 clamp(15px, 4vw, 50px)",
                    marginBottom: "50px",
                    boxSizing: "border-box",
                }}
            >
                <button
                    onClick={() => navigate("/")}
                    style={{
                        marginBottom: "25px",
                        background: "transparent",
                        border: "1px solid white",
                        color: "white",
                        padding: "12px 20px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        transition: "0.2s ease",
                    }}
                >
                    ← Back
                </button>

                <h1
                    style={{
                        fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
                        marginBottom: "15px",
                        lineHeight: "1.2",
                        wordBreak: "break-word",
                    }}
                >
                    {decodedCondition}
                </h1>

                <p
                    style={{
                        color: "#b2bec3",
                        fontSize: "clamp(1rem, 2vw, 1.2rem)",
                        lineHeight: "1.8",
                        maxWidth: "900px",
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
                    width: "100%",
                    padding: "0 clamp(15px, 4vw, 50px)",
                    boxSizing: "border-box",
                }}
            >
                {selectedProgram.phases.map(
                    (phaseData, phaseIndex) => (
                        <div
                            key={phaseIndex}
                            style={{
                                marginBottom: "60px",
                                width: "100%",
                            }}
                        >
                            {/* Phase Title */}
                            <div
                                style={{
                                    marginBottom: "30px",
                                }}
                            >
                                <h2
                                    style={{
                                        color: "#f1c40f",
                                        fontSize:
                                            "clamp(1.8rem, 4vw, 2.8rem)",
                                        marginBottom: "10px",
                                    }}
                                >
                                    {phaseData.phase}
                                </h2>

                                <div
                                    style={{
                                        width: "90px",
                                        height: "4px",
                                        backgroundColor: "#f1c40f",
                                        borderRadius: "10px",
                                    }}
                                />
                            </div>

                            {/* Exercise Grid */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(280px, 1fr))",
                                    gap: "24px",
                                    width: "100%",
                                }}
                            >
                                {phaseData.exercises.map(
                                    (exercise, exerciseIndex) => (
                                        <div
                                            key={exerciseIndex}
                                            style={{
                                                background: "#ffffff",
                                                color: "#2d3436",
                                                borderRadius: "20px",
                                                padding: "24px",
                                                boxShadow:
                                                    "0 10px 25px rgba(0,0,0,0.25)",
                                                transition:
                                                    "transform 0.25s ease",
                                                width: "100%",
                                                boxSizing: "border-box",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent:
                                                    "space-between",
                                                minHeight: "260px",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.transform =
                                                    "translateY(-6px)")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.transform =
                                                    "translateY(0)")
                                            }
                                        >
                                            <div>
                                                <h3
                                                    style={{
                                                        marginBottom: "15px",
                                                        fontSize:
                                                            "clamp(1.2rem, 2vw, 1.5rem)",
                                                        lineHeight: "1.4",
                                                        wordBreak:
                                                            "break-word",
                                                    }}
                                                >
                                                    {exercise.name}
                                                </h3>

                                                <p
                                                    style={{
                                                        color: "#636e72",
                                                        lineHeight: "1.7",
                                                        fontSize: "0.96rem",
                                                    }}
                                                >
                                                    {
                                                        exercise.description
                                                    }
                                                </p>
                                            </div>

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/exercise/${encodeURIComponent(
                                                            exercise.name
                                                        )}`
                                                    )
                                                }
                                                style={{
                                                    width: "100%",
                                                    marginTop: "25px",
                                                    backgroundColor:
                                                        "#2ecc71",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "14px",
                                                    borderRadius: "12px",
                                                    cursor: "pointer",
                                                    fontWeight: "bold",
                                                    fontSize: "1rem",
                                                    transition:
                                                        "0.2s ease",
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