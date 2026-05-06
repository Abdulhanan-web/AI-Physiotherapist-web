import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const EyeIcon = ({ visible }) =>
  visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

const PasswordInput = ({ placeholder, value, onChange, style, ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", marginBottom: style?.marginBottom ?? "15px" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
        style={{
          padding: "10px 40px 10px 10px",
          borderRadius: "5px",
          border: "none",
          width: "100%",
          boxSizing: "border-box",
          ...style,
          marginBottom: 0,
        }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#888",
          display: "flex",
          alignItems: "center",
          padding: 0,
        }}
        aria-label={show ? "Hide password" : "Show password"}
      >
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
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || "Login failed");

      login(data.access_token);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ backgroundColor: "#1a1a1a", minHeight: "100vh", color: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <form onSubmit={handleLogin} style={{ background: "#333", padding: "40px", borderRadius: "10px", width: "300px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h2>

        {error && <p style={{ color: "#e74c3c", fontSize: "12px", textAlign: "center" }}>{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "10px", marginBottom: "15px", borderRadius: "5px", border: "none" }}
          required
        />

        <PasswordInput
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: "20px" }}
          required
        />

        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const res = await fetch("http://localhost:8000/google-login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: credentialResponse.credential }),
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.detail || "Google login failed. Please try again.");
              return;
            }
            login(data.access_token);
            navigate("/");
          }}
          onError={() => console.log("Google Login Failed")}
        />

        <p style={{ textAlign: "center" }}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <button type="submit" style={{ padding: "10px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
          Sign In
        </button>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#aaa" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#3498db", textDecoration: "none" }}>Sign up here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;