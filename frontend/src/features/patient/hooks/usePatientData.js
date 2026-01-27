/**
 * Patient Hooks - Custom hooks for patient-specific state and logic
 */
import { useState, useEffect, useCallback } from 'react';
import patientService from '../services/patientService';

/**
 * Hook for patient dashboard data
 */
export const usePatientDashboard = () => {
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    pendingPayments: 0,
    unreadMessages: 0,
    completedSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientService.getDashboardStats();
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

/**
 * Hook for patient's assigned doctor
 */
export const useMyDoctor = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctor = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientService.getMyDoctor();
      setDoctor(response.data);
    } catch (err) {
      // 404 is expected if no provider assigned
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || 'Failed to load doctor info');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  return { doctor, loading, error, refetch: fetchDoctor };
};

/**
 * Hook for available doctors (for booking)
 */
export const useAvailableDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientService.getAvailableDoctors();
      setDoctors(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  return { doctors, loading, error, refetch: fetchDoctors };
};

/**
 * Hook for patient's appointments
 */
export const usePatientAppointments = (status = null) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientService.getAppointments(status);
      setAppointments(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [status]);

  const bookAppointment = async (appointment) => {
    try {
      const response = await patientService.bookAppointment(appointment);
      await fetchAppointments(); // Refresh list
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to book appointment');
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      await patientService.cancelAppointment(appointmentId);
      await fetchAppointments(); // Refresh list
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to cancel appointment');
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, error, refetch: fetchAppointments, bookAppointment, cancelAppointment };
};

/**
 * Hook for patient's messages
 */
export const usePatientMessages = (doctorId = null) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientService.getMessages(doctorId);
      setMessages(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const sendMessage = async (message) => {
    try {
      const response = await patientService.sendMessage(message);
      setMessages(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to send message');
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, error, refetch: fetchMessages, sendMessage };
};

/**
 * Hook for patient's invoices
 */
export const usePatientInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientService.getInvoices();
      setInvoices(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, []);

  const payInvoice = async (invoice) => {
    try {
      await patientService.createPaymentIntent(invoice.amount);
      await fetchInvoices(); // Refresh list
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Payment failed');
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, loading, error, refetch: fetchInvoices, payInvoice };
};

export default {
  usePatientDashboard,
  useMyDoctor,
  useAvailableDoctors,
  usePatientAppointments,
  usePatientMessages,
  usePatientInvoices
};
