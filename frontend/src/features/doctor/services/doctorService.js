/**
 * Doctor Services - API calls exclusively for doctor/provider role
 * All endpoints are prefixed with /api/provider/
 * Backend enforces role validation on every request
 */
import api from '../../../services/api';

const DOCTOR_API_PREFIX = '/provider';

export const doctorService = {
  // Dashboard
  getDashboardStats: () => api.get(`${DOCTOR_API_PREFIX}/dashboard`),
  
  // Patients/Clients Management
  getPatients: () => api.get(`${DOCTOR_API_PREFIX}/clients`),
  getPatient: (patientId) => api.get(`${DOCTOR_API_PREFIX}/clients/${patientId}`),
  
  // Appointments
  getAppointments: (params = {}) => {
    const queryParams = {};
    if (params.date) queryParams.date = params.date;
    if (params.status) queryParams.status = params.status;
    return api.get(`${DOCTOR_API_PREFIX}/appointments`, { params: queryParams });
  },
  getTodayAppointments: () => {
    const today = new Date().toISOString().split('T')[0];
    return api.get(`${DOCTOR_API_PREFIX}/appointments`, { params: { date: today } });
  },
  updateAppointmentStatus: (appointmentId, status) => 
    api.patch(`${DOCTOR_API_PREFIX}/appointments/${appointmentId}`, { status }),
  
  // Clinical Notes (Doctor-only feature)
  getClinicalNotes: (patientId) => api.get(`${DOCTOR_API_PREFIX}/clinical-notes`, { params: { patientId } }),
  getClinicalNote: (noteId) => api.get(`${DOCTOR_API_PREFIX}/clinical-notes/${noteId}`),
  createClinicalNote: (note) => api.post(`${DOCTOR_API_PREFIX}/clinical-notes`, note),
  updateClinicalNote: (noteId, note) => api.put(`${DOCTOR_API_PREFIX}/clinical-notes/${noteId}`, note),
  
  // Messages (scoped to doctor's patients)
  getMessages: (patientId = null) => {
    const params = {};
    if (patientId) params.conversationWith = patientId;
    return api.get('/messages', { params });
  },
  sendMessage: (message) => api.post('/messages', message),
  markMessageAsRead: (messageId) => api.patch(`/messages/${messageId}/read`),
  
  // Billing (Doctor view - earnings)
  getEarnings: () => api.get(`${DOCTOR_API_PREFIX}/earnings`),
  getInvoices: () => api.get('/billing/invoices'),
  createInvoice: (invoice) => api.post('/billing/invoices', invoice),
  
  // Schedule Management
  getAvailability: () => api.get(`${DOCTOR_API_PREFIX}/availability`),
  updateAvailability: (availability) => api.put(`${DOCTOR_API_PREFIX}/availability`, availability),
  
  // Profile
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data)
};

export default doctorService;
