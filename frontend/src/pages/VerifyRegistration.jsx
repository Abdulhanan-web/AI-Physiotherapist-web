// pages/VerifyRegistration.jsx
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const VerifyRegistration = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:8000/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Verification failed");

      setSuccess("Account verified! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ backgroundColor: "#1a1a1a", minHeight: "100vh", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <form onSubmit={handleVerify} style={{ background: "#333", padding: "40px", borderRadius: "10px", width: "350px", display: "flex", flexDirection: "column" }}>
        
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Verify Email</h2>

        {error && <p style={{ color: "#e74c3c", textAlign: "center" }}>{error}</p>}
        {success && <p style={{ color: "#2ecc71", textAlign: "center" }}>{success}</p>}

        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          style={{ marginBottom: "20px", padding: "10px" }}
        />

        <button type="submit">Verify</button>

      </form>
    </div>
  );
};

export default VerifyRegistration;