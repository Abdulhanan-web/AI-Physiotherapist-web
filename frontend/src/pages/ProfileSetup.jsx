import React, { useState, useEffect } from "react";
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

const emptyForm = {
  full_name: "",
  age: "",
  gender: "",
  height: "",
  weight: "",
  injury_type: "",
  fitness_goal: "",
  activity_level: "",
  medical_history: "",
};

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState(emptyForm);
  const [isExisting, setIsExisting] = useState(false); // true = update mode
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // On mount: check if profile exists and pre-fill form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:8000/profile", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.profile_completed && data.profile) {
            const p = data.profile;
            setFormData({
              full_name:      p.full_name      || "",
              age:            p.age            || "",
              gender:         p.gender         || "",
              height:         p.height         || "",
              weight:         p.weight         || "",
              injury_type:    p.injury_type    || "",
              fitness_goal:   p.fitness_goal   || "",
              activity_level: p.activity_level || "",
              medical_history: p.medical_history || "",
            });
            setIsExisting(true);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = isExisting ? "PUT" : "POST";

      const response = await fetch("http://localhost:8000/profile", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(isExisting ? "Profile updated successfully!" : "Profile completed successfully!");
        navigate("/");
      } else {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to save profile");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#1a1a1a",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.2rem",
          color: "#aaa",
        }}
      >
        Loading profile...
      </div>
    );
  }

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
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
            fontSize: "0.9rem",
            marginBottom: "20px",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
        >
          ← Back to Dashboard
        </button>

        <h1
          style={{
            textAlign: "center",
            marginBottom: "8px",
            color: isExisting ? "#27ae60" : "#2ecc71",
          }}
        >
          {isExisting ? "Update Your Health Profile" : "Complete Your Health Profile"}
        </h1>

        <p style={{ textAlign: "center", color: "#888", marginBottom: "30px", fontSize: "0.9rem" }}>
          {isExisting
            ? "Make changes to your profile information below."
            : "Fill in your details to get a personalized rehabilitation plan."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>

          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            style={inputStyle}
            required
          />

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

          <input
            type="number"
            name="height"
            placeholder="Height (cm)"
            value={formData.height}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <input
            type="number"
            name="weight"
            placeholder="Weight (kg)"
            value={formData.weight}
            onChange={handleChange}
            style={inputStyle}
            required
          />

          <select
            name="injury_type"
            value={formData.injury_type}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            <option value="">Select Injury Type</option>
            {injuryOptions.map((injury, index) => (
              <option key={index} value={injury}>{injury}</option>
            ))}
          </select>

          <select
            name="fitness_goal"
            value={formData.fitness_goal}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            <option value="">Select Fitness Goal</option>
            {fitnessGoals.map((goal, index) => (
              <option key={index} value={goal}>{goal}</option>
            ))}
          </select>

          <select
            name="activity_level"
            value={formData.activity_level}
            onChange={handleChange}
            style={inputStyle}
            required
          >
            <option value="">Select Activity Level</option>
            {activityLevels.map((level, index) => (
              <option key={index} value={level}>{level}</option>
            ))}
          </select>

          <select
            name="medical_history"
            value={formData.medical_history}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select Medical History</option>
            {medicalHistoryOptions.map((history, index) => (
              <option key={index} value={history}>{history}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "15px",
              backgroundColor: isExisting ? "#27ae60" : "#2ecc71",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: submitting ? "not-allowed" : "pointer",
              marginTop: "10px",
              transition: "0.3s ease",
              opacity: submitting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.target.style.backgroundColor = isExisting ? "#219150" : "#27ae60";
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.target.style.backgroundColor = isExisting ? "#27ae60" : "#2ecc71";
            }}
          >
            {submitting
              ? "Saving..."
              : isExisting
              ? "Update Profile"
              : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;