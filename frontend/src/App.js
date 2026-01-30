import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import AuthCallback from './pages/AuthCallback';
import Navbar from './components/Navbar';
import Pricing from './pages/Pricing';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;

  return children;
};

function AppContent() {
    const location = useLocation();
    // Check URL fragment for session_id to prevent race conditions
    if (location.hash?.includes('session_id=')) {
        return <AuthCallback />;
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans antialiased">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/editor" element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster />
        </div>
    );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
