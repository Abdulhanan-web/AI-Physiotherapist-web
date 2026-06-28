//components/AppFooter.jsx
import { useNavigate } from "react-router-dom";

const AppFooter = () => {
  const navigate = useNavigate();

  return (
    <footer className="app-footer">
      <div className="footer-grid">

        {/* Description */}
        <div className="footer-section">
          <h3>RehabPanel</h3>

          <p>
            AI Physiotherapist & Health Assistant that provides
            personalized rehabilitation exercises, posture analysis,
            nutrition guidance, and recovery tracking.
          </p>
        </div>

        {/* Links */}
        <div className="footer-section">
          <h4>Links</h4>

          <button onClick={() => navigate("/")}>Dashboard</button>
          <button onClick={() => navigate("/nutrition")}>Nutrition Plan</button>
          <button onClick={() => navigate("/report/weekly")}>Health Reports</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
        </div>

        {/* Features */}
        <div className="footer-section">
          <h4>Features</h4>

          <p>AI Pose Detection</p>
          <p>Exercise Library</p>
          <p>Recovery Programs</p>
          <p>Progress Tracking</p>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h4>Support</h4>

          <p>Email</p>
          <p>support@rehabpanel.com</p>

          <p style={{ marginTop: "12px" }}>
            Version 1.0
          </p>
        </div>

      </div>

      <div className="footer-divider"></div>

      <div className="footer-disclaimer">
        <strong>Disclaimer:</strong> RehabPanel is an AI-assisted rehabilitation
        platform intended for educational and supportive purposes only. It is
        not a substitute for professional medical advice, diagnosis, or
        treatment. Always consult a qualified healthcare professional before
        beginning any rehabilitation program.
      </div>

      <div className="footer-bottom">
        © 2026 RehabPanel • AI Physiotherapist & Health Assistant • Final Year Project
      </div>
    </footer>
  );
};

export default AppFooter;