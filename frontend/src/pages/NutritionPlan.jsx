// pages/NutritionPlan.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { specialtyPrograms } from "../data/specialtyPrograms";
import AppSidebar from "../components/AppSidebar";
import AppNavbar from "../components/AppNavbar";

const NutritionPlan = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNutritionPlan = async () => {
      try {
        const res = await fetch("http://localhost:8000/nutrition-plan", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch nutrition plan");
        setData(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNutritionPlan();
  }, [token]);

  if (loading) return <div className="page-loading">Loading nutrition plan…</div>;
  if (error)   return <div className="page-loading" style={{ color: "var(--accent-red)" }}>{error}</div>;

  return (
    <div className="page">
      <AppNavbar activePage="nutrition"
      specialtyPrograms={specialtyPrograms}
       />
      <AppSidebar activePage="nutrition" />

      <div className="nutrition-page" style={{ paddingTop: "72px" }}>

        <h1 style={{ marginTop: 24 }}>🥗 Nutrition Plan</h1>
        <p className="page-subtitle" style={{ marginTop: 8 }}>Your personalised daily nutrition guide.</p>

        {/* Top stat cards */}
        <div className="nutrition-top-cards">
          <div className="nutrition-card">
            <h3>Daily Calories</h3>
            <h2>{data.calories}</h2>
          </div>
          <div className="nutrition-card">
            <h3>Diet Type</h3>
            <h2 className="accent">{data.diet_type}</h2>
          </div>
        </div>

        {/* Meals */}
        <h2 className="section-title" style={{ marginTop: 48, marginBottom: 16 }}>🍽 Meals</h2>
        <div className="meal-grid">
          {data.meals?.map((meal, i) => (
            <div key={i} className="meal-card">
              <h3>{meal.title}</h3>
              <p>Ready in: {meal.readyInMinutes} mins</p>
              <p>Servings: {meal.servings}</p>
              {meal.sourceUrl && (
                <a href={meal.sourceUrl} target="_blank" rel="noreferrer">
                  View Recipe →
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Nutrients */}
        <h2 className="section-title" style={{ marginTop: 48, marginBottom: 16 }}>⚡ Daily Nutrients</h2>
        <div className="nutrients-card">
          {[
            { label: "Calories", value: data.nutrients?.calories },
            { label: "Protein",  value: data.nutrients?.protein },
            { label: "Fat",      value: data.nutrients?.fat },
            { label: "Carbs",    value: data.nutrients?.carbohydrates },
          ].map(({ label, value }) => (
            <div key={label} className="nutrient-item">
              <div className="nutrient-item__label">{label}</div>
              <div className="nutrient-item__value">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NutritionPlan;