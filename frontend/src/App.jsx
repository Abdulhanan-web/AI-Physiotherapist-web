import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ExercisePage from "./pages/ExercisePage";
import Login from "./pages/Login"; 
import Signup from "./pages/Signup";
import { AuthProvider, useAuth } from "./context/AuthContext";

// This logic prevents users from seeing the dashboard if not logged in
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Add the Login Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* 2. Wrap Dashboard in ProtectedRoute */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* 3. Wrap Exercise in ProtectedRoute */}
          <Route 
            path="/exercise/:name" 
            element={
              <ProtectedRoute>
                <ExercisePage />
              </ProtectedRoute>
            } 
          />

          {/* 4. Catch-all: redirect any unknown pages to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;