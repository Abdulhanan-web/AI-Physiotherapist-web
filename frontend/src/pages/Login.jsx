// pages/Login.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    try {
      const res = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      login(data.access_token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page page--auth">
      <div className="auth-card">
        <div className="auth-card__logo">
          <div className="auth-card__logo-icon">🏥</div>
        </div>
        <h2>Welcome back</h2>
        <p className="auth-card__sub">Sign in to your RehabPanel account</p>

        {error && <div className="flash flash--error">{error}</div>}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Link to="/forgot-password" style={{ fontSize: "0.82rem", textAlign: "right", marginTop: -4 }}>
            Forgot password?
          </Link>

          <button type="submit" className="btn btn--primary" style={{ marginTop: 4 }}>
            Sign In
          </button>
        </form>

        <div className="divider">or continue with</div>

        <div className="google-btn-wrap">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              const res = await fetch("http://localhost:8000/google-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: credentialResponse.credential }),
              });
              const data = await res.json();
              if (!res.ok) { setError(data.detail || "Google login failed"); return; }
              login(data.access_token);
              navigate("/");
            }}
            onError={() => setError("Google login failed")}
          />
        </div>

        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link to="/signup">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;