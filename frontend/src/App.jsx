import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Dashboard from "./pages/Dashboard";
import ExercisePage from "./pages/ExercisePage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyRegistration from "./pages/VerifyRegistration";
import SpecialtyProgram from "./pages/SpecialtyProgram";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProfileSetup from "./pages/ProfileSetup";
import ReportViewer from "./pages/ReportViewer";
import HealthReport from "./pages/HealthReport";
import NutritionPlan from "./pages/NutritionPlan";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-registration" element={<VerifyRegistration />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exercise/:name"
              element={
                <ProtectedRoute>
                  <ExercisePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/specialty/:condition"
              element={
                <ProtectedRoute>
                  <SpecialtyProgram />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/report-viewer"
              element={
                <ProtectedRoute>
                  <ReportViewer />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/report/:type"
              element={
                <ProtectedRoute>
                  <HealthReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nutrition"
              element={
                <ProtectedRoute>
                  <NutritionPlan />
                </ProtectedRoute>
              }
            />
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;