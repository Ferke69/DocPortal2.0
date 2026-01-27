import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Provider API
export const providerApi = {
  getDashboard: () => api.get('/provider/dashboard'),
  getClients: () => api.get('/provider/clients'),
  getAppointments: (date = null, status = null) => {
    const params = {};
    if (date) params.date = date;
    if (status) params.status = status;
    return api.get('/provider/appointments', { params });
  },
  createClinicalNote: (note) => api.post('/provider/clinical-notes', note),
  getClinicalNote: (appointmentId) => api.get(`/provider/clinical-notes/${appointmentId}`)
};

// Client API
export const clientApi = {
  getDashboard: () => api.get('/client/dashboard'),
  getProvider: () => api.get('/client/provider'),
  getAppointments: (status = null) => {
    const params = {};
    if (status) params.status = status;
    return api.get('/client/appointments', { params });
  }
};

// Appointments API
export const appointmentsApi = {
  create: (appointment) => api.post('/appointments', appointment),
  get: (id) => api.get(`/appointments/${id}`),
  update: (id, data) => api.patch(`/appointments/${id}`, data),
  cancel: (id) => api.delete(`/appointments/${id}`),
  join: (id) => api.post(`/appointments/${id}/join`)
};

// Messages API
export const messagesApi = {
  getAll: (conversationWith = null) => {
    const params = {};
    if (conversationWith) params.conversationWith = conversationWith;
    return api.get('/messages', { params });
  },
  send: (message) => api.post('/messages', message),
  markAsRead: (id) => api.patch(`/messages/${id}/read`)
};

// Billing API
export const billingApi = {
  getInvoices: () => api.get('/billing/invoices'),
  createPaymentIntent: (invoiceId) => api.post('/billing/create-payment-intent', { invoiceId }),
  confirmPayment: (paymentIntentId) => api.post('/billing/confirm-payment', { paymentIntentId })
};

// Users API
export const usersApi = {
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  getProviders: () => api.get('/auth/users/providers')
};

export default api;
