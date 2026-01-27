/**
 * Shared Services - Generic functions used by both roles
 * Only truly role-agnostic functionality belongs here
 */
import api from '../../../services/api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  googleAuth: (code, userType) => api.post('/auth/google', { code, userType })
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all')
};

// Health check and system status
export const systemService = {
  healthCheck: () => api.get('/health')
};

export default {
  auth: authService,
  notification: notificationService,
  system: systemService
};
