/**
 * Patient Services - API calls exclusively for patient/client role
 * All endpoints are prefixed with /api/client/
 * Backend enforces role validation on every request
 */
import api from '../../../services/api';

const PATIENT_API_PREFIX = '/client';

export const patientService = {
  // Dashboard
  getDashboardStats: () => api.get(`${PATIENT_API_PREFIX}/dashboard`),
  
  // Provider (assigned doctor)
  getMyDoctor: () => api.get(`${PATIENT_API_PREFIX}/provider`),
  getAvailableDoctors: () => api.get('/auth/users/providers'),
  
  // Appointments
  getAppointments: (status = null) => {
    const params = {};
    if (status) params.status = status;
    return api.get(`${PATIENT_API_PREFIX}/appointments`, { params });
  },
  getUpcomingAppointments: () => api.get(`${PATIENT_API_PREFIX}/appointments`, { params: { status: 'confirmed' } }),
  bookAppointment: (appointment) => api.post('/appointments', appointment),
  cancelAppointment: (appointmentId) => api.delete(`/appointments/${appointmentId}`),
  
  // Messages (scoped to patient's provider)
  getMessages: (doctorId = null) => {
    const params = {};
    if (doctorId) params.conversationWith = doctorId;
    return api.get('/messages', { params });
  },
  sendMessage: (message) => api.post('/messages', message),
  markMessageAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),
  
  // Billing (Patient view - payments)
  getInvoices: () => api.get('/billing/invoices'),
  getInvoice: (invoiceId) => api.get(`/billing/invoices/${invoiceId}`),
  createPaymentIntent: (amount) => api.post('/billing/create-payment-intent', { amount }),
  confirmPayment: (paymentIntentId) => api.post('/billing/confirm-payment', { paymentIntentId }),
  
  // Health Records (Patient's own records - read only)
  getHealthRecords: () => api.get(`${PATIENT_API_PREFIX}/health-records`),
  getPrescriptions: () => api.get(`${PATIENT_API_PREFIX}/prescriptions`),
  
  // Profile
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data)
};

export default patientService;
