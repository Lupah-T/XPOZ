import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Messages from './pages/Messages';
import RecoverPassword from './pages/RecoverPassword'; // Import RecoverPassword
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/auth" />;
  return children;
};

// Simple Admin Route Guard (Client-side only visual check, real check is DB/API)
// In a real app we would check user.role here too.
const AdminRoute = ({ children }) => {
  const { token, user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/admin/login" />;
  // Rely on API to 403 if not admin, or check user.role if loaded
  if (user && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

const App = () => {
  const ShowBottomNav = () => {
    const { token } = useAuth();
    const shouldHide = window.location.pathname === '/auth' ||
      window.location.pathname === '/admin/login' ||
      window.location.pathname.startsWith('/admin/dashboard');

    return token && !shouldHide ? <BottomNav /> : null;
  };

  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/recover" element={<RecoverPassword />} /> {/* Add Route */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <ShowBottomNav />
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
