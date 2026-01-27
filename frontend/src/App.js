import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from './components/ui/toaster';

// Import components
import LandingPage from './components/LandingPage';
import ProviderLogin from './components/ProviderLogin';
import ClientLogin from './components/ClientLogin';
import ProviderRegister from './components/ProviderRegister';
import ClientRegister from './components/ClientRegister';
import AuthCallback from './components/AuthCallback';
import ProviderDashboard from './components/ProviderDashboard';
import ClientPortal from './components/ClientPortal';
import MessagingCenter from './components/MessagingCenter';
import AppointmentBooking from './components/AppointmentBooking';
import BillingPayments from './components/BillingPayments';

// Keep old Login/Register for backward compatibility during transition
import Login from './components/Login';
import Register from './components/Register';

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
    // Redirect to appropriate login based on required type
    if (requiredType === 'provider') {
      return <Navigate to="/provider/login" replace />;
    }
    return <Navigate to="/client/login" replace />;
  }

  if (requiredType && user.userType !== requiredType) {
    return <Navigate to={user.userType === 'provider' ? '/provider/dashboard' : '/client/dashboard'} replace />;
  }

  return children;
};

// Dashboard Router Component - redirects to appropriate dashboard
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return user.userType === 'provider' 
    ? <Navigate to="/provider/dashboard" replace />
    : <Navigate to="/client/dashboard" replace />;
};

// AppRouter - Detects session_id synchronously during render (prevents race conditions)
function AppRouter() {
  const location = useLocation();
  
  // CRITICAL: Check URL fragment for session_id synchronously during render
  // This must happen BEFORE useEffect runs to prevent race conditions
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return <AppRoutes />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={user ? <DashboardRouter /> : <LandingPage />} 
      />
      
      {/* New Separate Login Routes */}
      <Route path="/provider/login" element={user ? <DashboardRouter /> : <ProviderLogin />} />
      <Route path="/client/login" element={user ? <DashboardRouter /> : <ClientLogin />} />
      <Route path="/provider/register" element={user ? <DashboardRouter /> : <ProviderRegister />} />
      <Route path="/client/register" element={user ? <DashboardRouter /> : <ClientRegister />} />
      
      {/* Legacy routes - redirect to new routes */}
      <Route path="/login" element={<Navigate to="/provider/login" replace />} />
      <Route path="/register" element={<Navigate to="/provider/register" replace />} />
      
      {/* Dashboard redirect */}
      <Route path="/dashboard" element={<DashboardRouter />} />
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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="App">
            <AppRouter />
            <Toaster />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
