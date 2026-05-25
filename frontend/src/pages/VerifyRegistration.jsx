// pages/VerifyRegistration.jsx
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const VerifyRegistration = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/verify-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Verification failed");
      setSuccess("Account verified! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--auth">
      <div className="auth-card">
        <div className="auth-card__logo">
          <div className="auth-card__logo-icon">✉️</div>
        </div>
        <h2>Verify email</h2>
        <p className="auth-card__sub">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>

        {error   && <div className="flash flash--error">{error}</div>}
        {success && <div className="flash flash--success">{success}</div>}

        <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            className="form-input"
            style={{ textAlign: "center", fontSize: "1.6rem", letterSpacing: "0.4em" }}
          />
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <button className="btn btn--ghost" onClick={() => navigate("/login")}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default VerifyRegistration;