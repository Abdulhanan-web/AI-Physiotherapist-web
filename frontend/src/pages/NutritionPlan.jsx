import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const NutritionPlan = () => {
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNutritionPlan();
  }, []);

  const fetchNutritionPlan = async () => {
    try {
      const response = await fetch("http://localhost:8000/nutrition-plan", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch nutrition plan");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        Loading nutrition plan...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", color: "white", background: "#111" }}>
      <h1>🥗 Nutrition Plan</h1>

      {/* Calories + Diet */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div style={cardStyle}>
          <h3>Daily Calories</h3>
          <h2>{data.calories}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Diet Type</h3>
          <h2 style={{ color: "#2ecc71" }}>{data.diet_type}</h2>
        </div>
      </div>

      {/* Meals */}
      <h2 style={{ marginTop: "40px" }}>🍽 Meals</h2>

      <div style={{ display: "grid", gap: "15px" }}>
        {data.meals?.map((meal, index) => (
          <div key={index} style={mealCard}>
            <h3>{meal.title}</h3>
            <p>Ready in: {meal.readyInMinutes} mins</p>
            <p>Servings: {meal.servings}</p>

            {meal.sourceUrl && (
              <a
                href={meal.sourceUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#3498db" }}
              >
                View Recipe
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Nutrients */}
      <h2 style={{ marginTop: "40px" }}>⚡ Nutrients</h2>

      <div style={cardStyle}>
        <p>Calories: {data.nutrients?.calories}</p>
        <p>Protein: {data.nutrients?.protein}</p>
        <p>Fat: {data.nutrients?.fat}</p>
        <p>Carbs: {data.nutrients?.carbohydrates}</p>
      </div>
    </div>
  );
};

const cardStyle = {
  background: "#1f1f1f",
  padding: "20px",
  borderRadius: "10px",
  minWidth: "200px",
};

const mealCard = {
  background: "#222",
  padding: "15px",
  borderRadius: "10px",
};

export default NutritionPlan;