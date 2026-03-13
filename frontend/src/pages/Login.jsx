import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new URLSearchParams();
        formData.append('username', email); // FastAPI OAuth2 expects 'username' and 'password'
        formData.append('password', password);

        try {
            const response = await fetch("http://localhost:8000/login", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData,
            });

            if (!response.ok) throw new Error("Invalid credentials");

            const data = await response.json();
            login(data.access_token);
            navigate("/"); // Redirect to dashboard
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
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "none" }}
                    required
                />
                <button type="submit" style={{ padding: "10px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                    Sign In
                </button>
                <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#aaa" }}>
                    Don't have an account? <Link to="/signup" style={{ color: "#3498db", textDecoration: "none" }}>Sign up here</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;