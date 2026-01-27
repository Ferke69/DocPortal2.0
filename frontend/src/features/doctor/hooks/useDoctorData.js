/**
 * Doctor Hooks - Custom hooks for doctor-specific state and logic
 */
import { useState, useEffect, useCallback } from 'react';
import doctorService from '../services/doctorService';

/**
 * Hook for doctor dashboard data
 */
export const useDoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    monthlyIncome: 0,
    appointmentsToday: 0,
    appointmentsWeek: 0,
    pendingNotes: 0,
    activeClients: 0,
    messagesUnread: 0,
    upcomingAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await doctorService.getDashboardStats();
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
 * Hook for doctor's patients list
 */
export const useDoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await doctorService.getPatients();
      setPatients(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return { patients, loading, error, refetch: fetchPatients };
};

/**
 * Hook for doctor's appointments
 */
export const useDoctorAppointments = (date = null, status = null) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await doctorService.getAppointments({ date, status });
      setAppointments(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [date, status]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, error, refetch: fetchAppointments };
};

/**
 * Hook for today's appointments
 */
export const useTodayAppointments = () => {
  const today = new Date().toISOString().split('T')[0];
  return useDoctorAppointments(today);
};

/**
 * Hook for doctor's messages
 */
export const useDoctorMessages = (patientId = null) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await doctorService.getMessages(patientId);
      setMessages(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const sendMessage = async (message) => {
    try {
      const response = await doctorService.sendMessage(message);
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

export default {
  useDoctorDashboard,
  useDoctorPatients,
  useDoctorAppointments,
  useTodayAppointments,
  useDoctorMessages
};
