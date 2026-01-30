import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, X, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { clientApi, appointmentsApi, refundsApi } from '../services/api';
import { toast } from '../hooks/use-toast';
import RefundRequestModal from './RefundRequestModal';

const ClientAppointments = ({ onBack, onBookNew }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const [pendingRes, confirmedRes, cancelledRes, completedRes] = await Promise.all([
        clientApi.getAppointments('pending'),
        clientApi.getAppointments('confirmed'),
        clientApi.getAppointments('cancelled'),
        clientApi.getAppointments('completed')
      ]);
      
      const allAppointments = [
        ...(pendingRes.data || []),
        ...(confirmedRes.data || []),
        ...(cancelledRes.data || []),
        ...(completedRes.data || [])
      ];
      
      setAppointments(allAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointment) => {
    const appointmentId = appointment._id || appointment.id;
    
    // Check if appointment is 3+ days away for refund eligibility
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    const daysUntil = Math.ceil((appointmentDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil >= 3 && appointment.amount > 0) {
      // Show refund modal for paid appointments that are 3+ days away
      setSelectedAppointment(appointment);
      setShowRefundModal(true);
    } else {
      // Direct cancellation without refund
      if (!window.confirm(
        daysUntil < 3 
          ? `This appointment is in ${daysUntil} day(s). Cancellations less than 3 days before are not eligible for refund. Continue?`
          : 'Are you sure you want to cancel this appointment?'
      )) {
        return;
      }
      
      try {
        setCancellingId(appointmentId);
        await appointmentsApi.cancel(appointmentId);
        toast({
          title: "Appointment Cancelled",
          description: "Your appointment has been cancelled."
        });
        await fetchAppointments();
      } catch (err) {
        console.error('Error cancelling appointment:', err);
        toast({
          title: "Error",
          description: err.response?.data?.detail || "Failed to cancel appointment",
          variant: "destructive"
        });
      } finally {
        setCancellingId(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    ['pending', 'confirmed'].includes(apt.status)
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastAppointments = appointments.filter(apt => 
    ['completed', 'cancelled'].includes(apt.status)
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Appointments</h2>
          <p className="text-gray-600 dark:text-gray-400">View and manage your appointments</p>
        </div>
        <Button onClick={onBookNew} className="bg-green-600 hover:bg-green-700">
          <Calendar className="h-4 w-4 mr-2" />
          Book New
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'border-green-600 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Upcoming ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'past'
              ? 'border-green-600 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Past ({pastAppointments.length})
        </button>
      </div>

      {/* Upcoming Appointments */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Upcoming Appointments</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">You don&apos;t have any scheduled appointments.</p>
                <Button onClick={onBookNew} className="bg-green-600 hover:bg-green-700">
                  Book Your First Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map((apt) => {
              const appointmentId = apt._id || apt.id;
              const appointmentDate = new Date(apt.date);
              const today = new Date();
              const daysUntil = Math.ceil((appointmentDate - today) / (1000 * 60 * 60 * 24));
              const canGetRefund = daysUntil >= 3 && apt.amount > 0;

              return (
                <Card key={appointmentId} className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Appointment Info */}
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{apt.type}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {apt.date} at {apt.time}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            {getStatusBadge(apt.status)}
                            {apt.amount > 0 && (
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                €{apt.amount?.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {daysUntil <= 1 && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {daysUntil === 0 ? 'Today!' : 'Tomorrow!'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {apt.status === 'confirmed' && apt.videoLink && (
                          <Button 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => window.open(apt.videoLink, '_blank')}
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Join Video
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                          onClick={() => handleCancelAppointment(apt)}
                          disabled={cancellingId === appointmentId}
                        >
                          {canGetRefund ? (
                            <>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Cancel & Refund
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              {cancellingId === appointmentId ? 'Cancelling...' : 'Cancel'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Refund eligibility info */}
                    {canGetRefund && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-700 dark:text-green-300 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Eligible for full refund (3+ days before appointment)
                        </p>
                      </div>
                    )}
                    {!canGetRefund && apt.amount > 0 && daysUntil < 3 && daysUntil >= 0 && (
                      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Cancellation without refund (less than 3 days before appointment)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Past Appointments */}
      {activeTab === 'past' && (
        <div className="space-y-4">
          {pastAppointments.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Past Appointments</h3>
                <p className="text-gray-500 dark:text-gray-400">Your completed and cancelled appointments will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            pastAppointments.map((apt) => {
              const appointmentId = apt._id || apt.id;
              return (
                <Card key={appointmentId} className="dark:bg-gray-800 dark:border-gray-700 opacity-75">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        apt.status === 'completed' 
                          ? 'bg-blue-100 dark:bg-blue-900/30' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Calendar className={`h-6 w-6 ${
                          apt.status === 'completed' ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{apt.type}</h3>
                          {getStatusBadge(apt.status)}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {apt.date} at {apt.time}
                          </span>
                        </div>
                        {apt.cancellationReason && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Cancelled: {apt.cancellationReason}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && selectedAppointment && (
        <RefundRequestModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedAppointment(null);
          }}
          onSuccess={() => {
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
};

export default ClientAppointments;
