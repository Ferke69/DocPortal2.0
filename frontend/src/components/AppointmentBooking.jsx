import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ArrowLeft, Clock, Video, User, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { appointmentsApi, clientApi, paymentsApi } from '../services/api';
import { toast } from '../hooks/use-toast';
import ThemeToggle from './ThemeToggle';

const AppointmentBooking = ({ userType, userId, onBack }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [appointmentType, setAppointmentType] = useState('Initial Consultation');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [noProvider, setNoProvider] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);

  const appointmentTypes = [
    { value: 'Initial Consultation', duration: 60, price: 150 },
    { value: 'Follow-up Session', duration: 60, price: 150 },
    { value: 'Therapy Session', duration: 60, price: 150 },
    { value: 'Medication Management', duration: 30, price: 100 },
  ];

  useEffect(() => {
    fetchProvider();
    fetchPaymentConfig();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedProvider) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, selectedProvider]);

  const fetchProvider = async () => {
    try {
      setLoading(true);
      const response = await clientApi.getProvider();
      if (response.data) {
        setSelectedProvider(response.data);
        setNoProvider(false);
      } else {
        setNoProvider(true);
      }
    } catch (err) {
      console.error('Error fetching provider:', err);
      setNoProvider(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const response = await paymentsApi.getConfig();
      setPaymentConfig(response.data);
    } catch (err) {
      console.error('Error fetching payment config:', err);
    }
  };

  const fetchAvailableSlots = async (date) => {
    if (!date) return;
    
    try {
      setLoadingSlots(true);
      setSelectedTime(null);
      setSlotsMessage('');
      
      const dateStr = date.toISOString().split('T')[0];
      const response = await clientApi.getAvailableSlots(dateStr);
      
      if (response.data.slots) {
        setAvailableSlots(response.data.slots);
        if (response.data.slots.length === 0) {
          setSlotsMessage(response.data.message || 'No available slots for this date');
        }
      } else {
        setAvailableSlots([]);
        setSlotsMessage(response.data.message || 'No available slots');
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setAvailableSlots([]);
      setSlotsMessage('Could not load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select both date and time.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedProvider) {
      toast({
        title: "No provider assigned",
        description: "You don't have an assigned provider yet.",
        variant: "destructive"
      });
      return;
    }

    try {
      setBooking(true);
      
      const selectedAppointmentType = appointmentTypes.find(apt => apt.value === appointmentType);
      
      const appointmentData = {
        clientId: user?.user_id,
        providerId: selectedProvider.user_id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        duration: selectedAppointmentType?.duration || 60,
        type: appointmentType,
        amount: selectedAppointmentType?.price || 150,
        notes: '',
        paymentStatus: 'pending'
      };

      const response = await appointmentsApi.create(appointmentData);
      
      // Store appointment and proceed to payment
      setCreatedAppointment(response.data);
      setPaymentStep(true);
      
      toast({
        title: "Appointment created",
        description: "Please complete payment to confirm your booking.",
      });
      
    } catch (err) {
      console.error('Error booking appointment:', err);
      toast({
        title: "Booking failed",
        description: err.response?.data?.detail || "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBooking(false);
    }
  };

  const handlePayment = async () => {
    if (!createdAppointment) return;

    try {
      setPaymentProcessing(true);
      const selectedAppointmentType = appointmentTypes.find(apt => apt.value === appointmentType);
      const amount = selectedAppointmentType?.price || 150;

      // Create payment intent
      const paymentResponse = await paymentsApi.createPaymentIntent(createdAppointment._id, amount);
      
      if (paymentResponse.data.mockMode) {
        // Mock mode - simulate payment
        toast({
          title: "Demo Mode",
          description: "Stripe not configured. Simulating payment...",
        });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      // Confirm payment
      const confirmResponse = await paymentsApi.confirmPayment(
        paymentResponse.data.paymentIntentId,
        createdAppointment._id
      );
      
      toast({
        title: "Payment successful!",
        description: `Your appointment on ${selectedDate.toLocaleDateString()} at ${selectedTime} is confirmed.`,
      });

      // Reset and go back
      setPaymentStep(false);
      setCreatedAppointment(null);
      setSelectedTime(null);
      setSelectedDate(null);
      
      // Refresh available slots
      if (selectedDate) {
        fetchAvailableSlots(selectedDate);
      }
      
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: "Payment failed",
        description: err.response?.data?.detail || "Payment could not be processed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleCancelPayment = async () => {
    // Cancel the pending appointment
    if (createdAppointment) {
      try {
        await appointmentsApi.updateStatus(createdAppointment._id, 'cancelled');
      } catch (err) {
        console.error('Error cancelling appointment:', err);
      }
    }
    setPaymentStep(false);
    setCreatedAppointment(null);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const selectedAppointmentType = appointmentTypes.find(apt => apt.value === appointmentType);

  // Disable dates in the past
  const disabledDays = { before: new Date() };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-4 dark:text-gray-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Book an Appointment</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Schedule your next session</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Your Provider */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-white">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Your Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                {noProvider ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="mb-2">No provider assigned to your account.</p>
                    <p className="text-sm">Please contact your healthcare provider for an invite code to connect your account.</p>
                  </div>
                ) : selectedProvider ? (
                  <div className="p-4 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/30">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedProvider.avatar} alt={selectedProvider.name} />
                        <AvatarFallback>{getInitials(selectedProvider.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">{selectedProvider.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{selectedProvider.specialty || 'Healthcare Provider'}</div>
                        <div className="text-sm text-green-600 font-medium mt-1">
                          ${selectedProvider.hourlyRate || 150}/hour
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    Loading provider information...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Select Appointment Type */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-white">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Appointment Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointmentTypes.map((apt) => (
                    <div
                      key={apt.value}
                      onClick={() => setAppointmentType(apt.value)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        appointmentType === apt.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">{apt.value}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{apt.duration} minutes</div>
                      <div className="text-sm text-blue-600 font-medium mt-1">${apt.price}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Select Date */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-white">
                  <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={disabledDays}
                  className="rounded-md border dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Select a date to see available time slots based on provider schedule
                </p>
              </CardContent>
            </Card>

            {/* Select Time */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-white">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  Available Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedDate ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Please select a date first to see available time slots</p>
                  </div>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading available slots...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        onClick={() => setSelectedTime(slot.time)}
                        className={selectedTime === slot.time ? 'bg-green-600 hover:bg-green-700' : 'dark:border-gray-600 dark:text-gray-300'}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-orange-400" />
                    <p className="text-gray-600 dark:text-gray-400">{slotsMessage || 'No available slots for this date'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Try selecting a different date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provider Info */}
                {selectedProvider && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Provider</div>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={selectedProvider.avatar} alt={selectedProvider.name} />
                        <AvatarFallback>{getInitials(selectedProvider.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{selectedProvider.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{selectedProvider.specialty || 'Healthcare Provider'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointment Details */}
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Appointment Type</div>
                  <div className="font-medium text-gray-900 dark:text-white">{appointmentType}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedAppointmentType?.duration} minutes
                  </div>
                </div>

                {/* Date & Time */}
                {selectedDate && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Date</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                )}

                {selectedTime && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Time</div>
                    <div className="font-medium text-gray-900 dark:text-white">{selectedTime}</div>
                  </div>
                )}

                {/* Price */}
                <div className="pt-4 border-t dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${selectedAppointmentType?.price}
                    </div>
                  </div>
                </div>

                {/* Video Session Info */}
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Video className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-200">Video Session</div>
                      <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        A secure video link will be provided after booking
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Step */}
                {paymentStep && createdAppointment ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">Appointment Reserved</span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Complete payment to confirm your booking
                      </p>
                    </div>

                    {paymentConfig && !paymentConfig.configured && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            Demo mode: Payment will be simulated. See STRIPE_SETUP_GUIDE.md to enable real payments.
                          </p>
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6" 
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      {paymentProcessing ? 'Processing...' : `Pay $${selectedAppointmentType?.price}`}
                    </Button>

                    <Button 
                      variant="outline"
                      className="w-full dark:border-gray-600 dark:text-gray-300" 
                      onClick={handleCancelPayment}
                      disabled={paymentProcessing}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Book Button */}
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-lg py-6" 
                      onClick={handleBookAppointment}
                      disabled={!selectedDate || !selectedTime || !selectedProvider || booking}
                    >
                      {booking ? 'Creating Appointment...' : 'Book & Pay'}
                    </Button>

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Payment is required to confirm your appointment. You can cancel up to 24 hours in advance.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
