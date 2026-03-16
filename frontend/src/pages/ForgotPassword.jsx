import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const res = await fetch("http://localhost:8000/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setMsg(data.message || data.detail);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Forgot Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px", marginRight: "10px" }}
        />

        <button type="submit">Send Reset Link</button>
      </form>

      {msg && <p style={{ marginTop: "15px" }}>{msg}</p>}

      <button
        onClick={() => navigate("/login")}
        style={{ marginTop: "20px", padding: "8px 15px" }}
      >
        Back to Login
      </button>
    </div>
  );
}

export default ForgotPassword;