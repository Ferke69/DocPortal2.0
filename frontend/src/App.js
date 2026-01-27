import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/toaster';

// Import components
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import AuthCallback from './components/AuthCallback';
import ProviderDashboard from './components/ProviderDashboard';
import ClientPortal from './components/ClientPortal';
import MessagingCenter from './components/MessagingCenter';
import AppointmentBooking from './components/AppointmentBooking';
import BillingPayments from './components/BillingPayments';

// Protected Route Component
const ProtectedRoute = ({ children, requiredType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredType && user.userType !== requiredType) {
    return <Navigate to={user.userType === 'provider' ? '/provider/dashboard' : '/client/dashboard'} replace />;
  }

  return children;
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.userType === 'provider' 
    ? <Navigate to="/provider/dashboard" replace />
    : <Navigate to="/client/dashboard" replace />;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={user ? <DashboardRouter /> : <LandingPage onSelectPortal={(type) => window.location.href = '/login'} />} 
      />
      <Route path="/login" element={user ? <DashboardRouter /> : <Login />} />
      <Route path="/register" element={user ? <DashboardRouter /> : <Register />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Provider Routes */}
      <Route 
        path="/provider/dashboard" 
        element={
          <ProtectedRoute requiredType="provider">
            <ProviderDashboard onNavigate={(path) => window.location.href = `/provider/${path}`} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/provider/clients" 
        element={
          <ProtectedRoute requiredType="provider">
            <ProviderDashboard onNavigate={(path) => window.location.href = `/provider/${path}`} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/provider/calendar" 
        element={
          <ProtectedRoute requiredType="provider">
            <AppointmentBooking 
              userType="provider" 
              userId={user?.user_id}
              onBack={() => window.location.href = '/provider/dashboard'} 
            />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/provider/messages" 
        element={
          <ProtectedRoute requiredType="provider">
            <MessagingCenter 
              userType="provider" 
              userId={user?.user_id}
              onBack={() => window.location.href = '/provider/dashboard'} 
            />
          </ProtectedRoute>
        } 
      />

      {/* Client Routes */}
      <Route 
        path="/client/dashboard" 
        element={
          <ProtectedRoute requiredType="client">
            <ClientPortal onNavigate={(path) => window.location.href = `/client/${path}`} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/client/book-appointment" 
        element={
          <ProtectedRoute requiredType="client">
            <AppointmentBooking 
              userType="client" 
              userId={user?.user_id}
              onBack={() => window.location.href = '/client/dashboard'} 
            />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/client/messages" 
        element={
          <ProtectedRoute requiredType="client">
            <MessagingCenter 
              userType="client" 
              userId={user?.user_id}
              onBack={() => window.location.href = '/client/dashboard'} 
            />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/client/billing" 
        element={
          <ProtectedRoute requiredType="client">
            <BillingPayments 
              userType="client" 
              userId={user?.user_id}
              onBack={() => window.location.href = '/client/dashboard'} 
            />
          </ProtectedRoute>
        } 
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <AppRoutes />
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
