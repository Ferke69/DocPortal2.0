import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processGoogleAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session_id found in URL');
          navigate('/provider/login', { state: { error: 'Authentication failed' } });
          return;
        }

        // Get intended user type and invite code from sessionStorage
        const intendedUserType = sessionStorage.getItem('intended_user_type') || 'client';
        const inviteCode = sessionStorage.getItem('invite_code') || null;
        
        // Clean up sessionStorage
        sessionStorage.removeItem('intended_user_type');
        sessionStorage.removeItem('invite_code');

        // Exchange session_id for user data
        const result = await loginWithGoogle(sessionId, intendedUserType, inviteCode);

        if (result.success) {
          // Navigate based on user type
          if (result.user.userType === 'provider') {
            navigate('/provider/dashboard', { replace: true });
          } else {
            navigate('/client/dashboard', { replace: true });
          }
        } else {
          // Navigate to appropriate login page based on intended user type
          const loginPath = intendedUserType === 'provider' ? '/provider/login' : '/client/login';
          navigate(loginPath, { state: { error: result.error } });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/provider/login', { state: { error: 'Authentication failed' } });
      }
    };

    processGoogleAuth();
  }, [location, navigate, loginWithGoogle]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
