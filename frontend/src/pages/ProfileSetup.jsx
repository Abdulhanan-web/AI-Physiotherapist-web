// pages/ProfileSetup.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppSidebar from "../components/AppSidebar";
import AppNavbar from "../components/AppNavbar";
import { specialtyPrograms } from "../data/specialtyPrograms";

const injuryOptions = [
  "Lower Back Pain", "Knee Recovery", "Left Stroke Recovery", "Right Stroke Recovery",
  "Left Paralysis Recovery", "Right Paralysis Recovery", "Left Shoulder Rehab", "Right Shoulder Rehab",
];
const fitnessGoals = [
  "Pain Reduction", "Improve Mobility", "Increase Strength", "Post Surgery Recovery",
  "Post Stroke Rehabilitation", "Improve Balance", "Improve Flexibility", "Daily Activity Independence",
];
const activityLevels = ["Sedentary", "Lightly Active", "Moderately Active", "Very Active"];
const medicalHistoryOptions = [
  "None", "Diabetes", "Hypertension", "Arthritis", "Heart Disease",
  "Previous Surgery", "Osteoporosis",
];

const emptyForm = {
  full_name: "", age: "", gender: "", height: "", weight: "",
  injury_type: "", fitness_goal: "", activity_level: "", medical_history: "",
};

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [isExisting, setIsExisting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:8000/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile_completed && data.profile) {
            const p = data.profile;
            setFormData({
              full_name: p.full_name || "",
              age: p.age || "",
              gender: p.gender || "",
              height: p.height || "",
              weight: p.weight || "",
              injury_type: p.injury_type || "",
              fitness_goal: p.fitness_goal || "",
              activity_level: p.activity_level || "",
              medical_history: p.medical_history || "",
            });
            setIsExisting(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/profile", {
        method: isExisting ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert(isExisting ? "Profile updated!" : "Profile saved!");
        navigate("/");
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to save profile");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) return <div className="page-loading">Loading profile…</div>;

  return (
    <div className="page">
      <AppNavbar
        activePage="profile"
        specialtyPrograms={specialtyPrograms}
      />
      <AppSidebar activePage="profile" />

      <div className="profile-page" style={{ paddingTop: "72px" }}>

        <div style={{ maxWidth: 800, margin: "32px auto 0" }}>
          <h1
            className="page-title"
            style={{ color: isExisting ? "var(--accent-green-dim)" : "var(--accent-green)" }}
          >
            {isExisting ? "Update Health Profile" : "Complete Health Profile"}
          </h1>
          <p className="page-subtitle" style={{ marginTop: 8 }}>
            {isExisting
              ? "Update your information to refine your personalised plan."
              : "Fill in your details to receive a tailored rehabilitation plan."}
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div className="profile-form-grid">
              <input
                name="full_name"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="form-input"
              />
              <input
                name="age"
                type="number"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="profile-form-grid">
              <select name="gender" value={formData.gender} onChange={handleChange} required className="form-select">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input
                name="height"
                type="number"
                placeholder="Height (cm)"
                value={formData.height}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="profile-form-grid">
              <input
                name="weight"
                type="number"
                placeholder="Weight (kg)"
                value={formData.weight}
                onChange={handleChange}
                required
                className="form-input"
              />
              <select name="injury_type" value={formData.injury_type} onChange={handleChange} required className="form-select">
                <option value="">Select Injury Type</option>
                {injuryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="profile-form-grid">
              <select name="fitness_goal" value={formData.fitness_goal} onChange={handleChange} required className="form-select">
                <option value="">Select Fitness Goal</option>
                {fitnessGoals.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <select name="activity_level" value={formData.activity_level} onChange={handleChange} required className="form-select">
                <option value="">Select Activity Level</option>
                {activityLevels.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <select
              name="medical_history"
              value={formData.medical_history}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select Medical History (optional)</option>
              {medicalHistoryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>

            <button
              type="submit"
              className={`btn ${isExisting ? "btn--blue" : "btn--primary"}`}
              disabled={submitting}
              style={{ marginTop: 8 }}
            >
              {submitting ? "Saving…" : isExisting ? "Update Profile" : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;