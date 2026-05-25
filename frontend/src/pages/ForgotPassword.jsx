// pages/ForgotPassword.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong");
      setMsg(data.message || "Reset link sent!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-form-page">
      <div className="simple-form-card">
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div className="auth-card__logo-icon" style={{ display: "inline-flex", marginBottom: 8 }}>🔑</div>
        </div>
        <h2>Forgot password?</h2>
        <p className="auth-card__sub" style={{ textAlign: "center" }}>
          Enter your email and we'll send a reset link.
        </p>

        {error && <div className="flash flash--error">{error}</div>}
        {msg   && <div className="flash flash--success">{msg}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
          <button type="submit" className="btn btn--blue" disabled={loading}>
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        <button className="btn btn--ghost" onClick={() => navigate("/login")}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;