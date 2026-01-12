import { App as CapacitorApp } from '@capacitor/app';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import React, { Suspense, lazy, useEffect } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';
import MobileNav from './components/MobileNav';
import UpdateChecker from './components/UpdateChecker';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const Profile = lazy(() => import('./pages/Profile'));
const Users = lazy(() => import('./pages/Users'));
const Messages = lazy(() => import('./pages/Messages'));
const RecoverPassword = lazy(() => import('./pages/RecoverPassword'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

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

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'var(--bg-dark)',
    gap: '1.5rem'
  }}>
    <div className="loader-rings" style={{ scale: '1.5' }}></div>
    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '0.1em' }}>
      SYNCING X-POZ
    </div>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let backListener;
    const setupListener = async () => {
      backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (location.pathname === '/' || location.pathname === '/auth') {
          CapacitorApp.exitApp();
        } else {
          navigate('/');
        }
      });
    };
    setupListener();

    return () => {
      if (backListener) backListener.remove();
    };
  }, [location, navigate]);

  const showFooter = !location.pathname.startsWith('/messages');

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/recover" element={<RecoverPassword />} />
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
      {showFooter && <Footer />}
      <MobileNav />
    </Suspense>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <UpdateChecker />
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
