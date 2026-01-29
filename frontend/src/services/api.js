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
      // Redirect based on current path
      const isClientPath = window.location.pathname.includes('/client');
      window.location.href = isClientPath ? '/client/login' : '/provider/login';
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
  getClinicalNote: (appointmentId) => api.get(`/provider/clinical-notes/${appointmentId}`),
  getWorkingHours: () => api.get('/provider/working-hours'),
  updateWorkingHours: (hours) => api.put('/provider/working-hours', hours),
  getAvailableSlots: (date) => api.get(`/provider/available-slots/${date}`)
};

// Client API
export const clientApi = {
  getDashboard: () => api.get('/client/dashboard'),
  getProvider: () => api.get('/client/provider'),
  getAppointments: (status = null) => {
    const params = {};
    if (status) params.status = status;
    return api.get('/client/appointments', { params });
  },
  getAvailableSlots: (date) => api.get(`/client/provider/available-slots/${date}`)
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
  createPaymentIntent: (amount) => api.post('/billing/create-payment-intent', { amount }),
  confirmPayment: (paymentIntentId) => api.post('/billing/confirm-payment', { paymentIntentId })
};

// Payments API
export const paymentsApi = {
  getConfig: () => api.get('/payments/config'),
  createPaymentIntent: (appointmentId, amount) => api.post('/payments/create-payment-intent', { appointmentId, amount }),
  confirmPayment: (paymentIntentId, appointmentId) => api.post('/payments/confirm-payment', { paymentIntentId, appointmentId }),
  getAppointmentPayment: (appointmentId) => api.get(`/payments/appointment/${appointmentId}`)
};

// Pending Items API
export const pendingItemsApi = {
  getSummary: () => api.get('/provider/pending-items/summary'),
  getAll: (params = {}) => {
    const queryParams = {};
    if (params.status) queryParams.status = params.status;
    if (params.type) queryParams.type = params.type;
    if (params.sortBy) queryParams.sort_by = params.sortBy;
    if (params.sortOrder) queryParams.sort_order = params.sortOrder;
    return api.get('/provider/pending-items', { params: queryParams });
  },
  create: (item) => api.post('/provider/pending-items', item),
  update: (id, data) => api.put(`/provider/pending-items/${id}`, data),
  delete: (id) => api.delete(`/provider/pending-items/${id}`),
  markPaid: (id) => api.post(`/provider/pending-items/${id}/mark-paid`),
  markUnpaid: (id) => api.post(`/provider/pending-items/${id}/mark-unpaid`)
};

// Users API
export const usersApi = {
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data)
};

export default api;
