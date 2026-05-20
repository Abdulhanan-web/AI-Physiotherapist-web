import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const injuryOptions = [
  "Lower Back Pain",
  "Knee Recovery",
  "Left Stroke Recovery",
  "Right Stroke Recovery",
  "Left Paralysis Recovery",
  "Right Paralysis Recovery",
  "Left Shoulder Rehab",
  "Right Shoulder Rehab",
];

const fitnessGoals = [
  "Pain Reduction",
  "Improve Mobility",
  "Increase Strength",
  "Post Surgery Recovery",
  "Post Stroke Rehabilitation",
  "Improve Balance",
  "Improve Flexibility",
  "Daily Activity Independence",
];

const activityLevels = [
  "Sedentary",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
];

const medicalHistoryOptions = [
  "None",
  "Diabetes",
  "Hypertension",
  "Arthritis",
  "Heart Disease",
  "Previous Surgery",
  "Osteoporosis",
];

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    injury_type: "",
    fitness_goal: "",
    activity_level: "",
    medical_history: "",
  });

  const inputStyle = {
    padding: "14px",
    borderRadius: "8px",
    border: "none",
    fontSize: "1rem",
    backgroundColor: "#2c3e50",
    color: "white",
    outline: "none",
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Profile completed successfully!");
        navigate("/");
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to save profile");
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          backgroundColor: "#222",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "30px",
            color: "#2ecc71",
          }}
        >
          Complete Your Health Profile
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          {/* Full Name */}
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          {/* Age */}
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          {/* Gender */}
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          {/* Height */}
          <input
            type="number"
            name="height"
            placeholder="Height (cm)"
            value={formData.height}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          {/* Weight */}
          <input
            type="number"
            name="weight"
            placeholder="Weight (kg)"
            value={formData.weight}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          {/* Injury Type */}
          <select
            name="injury_type"
            value={formData.injury_type}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            <option value="">Select Injury Type</option>

            {injuryOptions.map((injury, index) => (
              <option key={index} value={injury}>
                {injury}
              </option>
            ))}
          </select>

          {/* Fitness Goal */}
          <select
            name="fitness_goal"
            value={formData.fitness_goal}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            <option value="">Select Fitness Goal</option>

            {fitnessGoals.map((goal, index) => (
              <option key={index} value={goal}>
                {goal}
              </option>
            ))}
          </select>

          {/* Activity Level */}
          <select
            name="activity_level"
            value={formData.activity_level}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            <option value="">Select Activity Level</option>

            {activityLevels.map((level, index) => (
              <option key={index} value={level}>
                {level}
              </option>
            ))}
          </select>

          {/* Medical History */}
          <select
            name="medical_history"
            value={formData.medical_history}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select Medical History</option>

            {medicalHistoryOptions.map((history, index) => (
              <option key={index} value={history}>
                {history}
              </option>
            ))}
          </select>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              padding: "15px",
              backgroundColor: "#2ecc71",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "10px",
              transition: "0.3s ease",
            }}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "#27ae60")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "#2ecc71")
            }
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;