// pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const EyeIcon = ({ visible }) =>
  visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

const PasswordInput = ({ placeholder, value, onChange, required }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="password-wrapper">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="form-input"
      />
      <button type="button" className="password-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide" : "Show"}>
        <EyeIcon visible={show} />
      </button>
    </div>
  );
};

const validatePassword = (pw) => {
  const rx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  return rx.test(pw) ? null : "Must be 8+ chars with uppercase, lowercase, number & special char.";
};

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);
    if (password !== confirmPassword) return setError("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send verification code");
      setSuccess("Verification code sent to your email");
      setTimeout(() => navigate(`/verify-registration?email=${encodeURIComponent(email)}`), 1500);
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
          <div className="auth-card__logo-icon">🏥</div>
        </div>
        <h2>Create account</h2>
        <p className="auth-card__sub">Start your rehabilitation journey today</p>

        {error && <div className="flash flash--error">{error}</div>}
        {success && <div className="flash flash--success">{success}</div>}

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />

          <PasswordInput placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <PasswordInput placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

          <div className="password-hint">
            8+ chars · uppercase &amp; lowercase · number · special char (@$!%*?&amp;)
          </div>

          <button type="submit" className="btn btn--primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Sending…" : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;