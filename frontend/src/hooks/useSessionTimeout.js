import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

export const useSessionTimeout = () => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  const resetTimeout = useCallback(() => {
    // Check if "Keep me logged in" is enabled
    const keepLoggedIn = localStorage.getItem('keepLoggedIn') === 'true';
    
    if (keepLoggedIn) {
      // Don't set timeout if user wants to stay logged in
      return;
    }

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set new timeout for auto-logout
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated) {
        // Clear session data
        localStorage.removeItem('token');
        localStorage.removeItem('keepLoggedIn');
        localStorage.removeItem('lastActivity');
        
        // Show alert and logout
        alert('Your session has expired due to inactivity. Please log in again.');
        logout();
        
        // Redirect to appropriate login page
        const isClientPath = window.location.pathname.includes('/client');
        window.location.href = isClientPath ? '/client/login' : '/provider/login';
      }
    }, INACTIVITY_TIMEOUT);

    // Update last activity timestamp
    localStorage.setItem('lastActivity', Date.now().toString());
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timeouts when not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      return;
    }

    // Check if session should have expired while page was closed
    const keepLoggedIn = localStorage.getItem('keepLoggedIn') === 'true';
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (!keepLoggedIn && lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        // Session expired while away
        localStorage.removeItem('token');
        localStorage.removeItem('lastActivity');
        logout();
        const isClientPath = window.location.pathname.includes('/client');
        window.location.href = isClientPath ? '/client/login' : '/provider/login';
        return;
      }
    }

    // Set initial timeout
    resetTimeout();

    // Add event listeners for user activity
    const handleActivity = () => {
      resetTimeout();
    };

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [isAuthenticated, resetTimeout, logout]);

  return { resetTimeout };
};

export default useSessionTimeout;
