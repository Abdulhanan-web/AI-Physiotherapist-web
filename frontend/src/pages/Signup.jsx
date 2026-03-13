import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      // Success! Redirect to login
      alert("Account created successfully! Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#1a1a1a", minHeight: "100vh", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <form onSubmit={handleSignup} style={{ background: "#333", padding: "40px", borderRadius: "10px", width: "350px", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Create Account</h2>
        <p style={{ textAlign: "center", color: "#aaa", fontSize: "14px", marginBottom: "20px" }}>Join the AI Physio platform</p>
        
        {error && <p style={{ color: "#e74c3c", fontSize: "13px", textAlign: "center", marginBottom: "15px" }}>{error}</p>}
        
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #444", backgroundColor: "#222", color: "white" }} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ padding: "12px", marginBottom: "15px", borderRadius: "5px", border: "1px solid #444", backgroundColor: "#222", color: "white" }} 
          required 
        />
        <input 
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          style={{ padding: "12px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #444", backgroundColor: "#222", color: "white" }} 
          required 
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: "12px", backgroundColor: loading ? "#7f8c8d" : "#2ecc71", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "0.3s" }}
        >
          {loading ? "Registering..." : "Sign Up"}
        </button>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#aaa" }}>
          Already have an account? <Link to="/login" style={{ color: "#3498db", textDecoration: "none" }}>Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;