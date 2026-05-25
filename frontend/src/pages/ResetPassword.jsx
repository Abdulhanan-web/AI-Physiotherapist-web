// pages/ResetPassword.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

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
      <button type="button" className="password-toggle" onClick={() => setShow((s) => !s)}>
        <EyeIcon visible={show} />
      </button>
    </div>
  );
};

const validatePassword = (pw) => {
  const rx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  return rx.test(pw) ? null : "Must be 8+ chars with uppercase, lowercase, number & special char.";
};

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Password reset failed");
      setMsg(data.message || "Password reset successful");
      setTimeout(() => navigate("/login"), 2000);
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
          <div className="auth-card__logo-icon" style={{ display: "inline-flex", marginBottom: 8 }}>🔒</div>
        </div>
        <h2>Reset password</h2>
        <p className="auth-card__sub" style={{ textAlign: "center" }}>Choose a strong new password.</p>

        {error && <div className="flash flash--error">{error}</div>}
        {msg   && <div className="flash flash--success">{msg}</div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <PasswordInput placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <PasswordInput placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <div className="password-hint">
            8+ chars · uppercase &amp; lowercase · number · special char
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>

        <button className="btn btn--ghost" onClick={() => navigate("/login")}>
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;