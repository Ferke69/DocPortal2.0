import React, { useState } from 'react';
import { Calendar as CalendarIcon, ArrowLeft, Clock, Video, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { mockAppointments, mockClients, mockProviders, mockTimeSlots } from '../mockData';
import { toast } from '../hooks/use-toast';

const AppointmentBooking = ({ userType, userId, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(mockProviders[0]);
  const [appointmentType, setAppointmentType] = useState('Initial Consultation');

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select both date and time.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Appointment booked!",
      description: `Your appointment on ${selectedDate.toLocaleDateString()} at ${selectedTime} has been confirmed.`,
    });

    // Reset form
    setSelectedTime(null);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const appointmentTypes = [
    { value: 'Initial Consultation', duration: 60, price: 150 },
    { value: 'Follow-up Session', duration: 60, price: 150 },
    { value: 'Therapy Session', duration: 60, price: 150 },
    { value: 'Medication Management', duration: 30, price: 100 },
  ];

  const selectedAppointmentType = appointmentTypes.find(apt => apt.value === appointmentType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="text-gray-600 mt-1">Schedule your next session</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Select Provider */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Select Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockProviders.map((provider) => (
                    <div
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedProvider.id === provider.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={provider.avatar} alt={provider.name} />
                          <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{provider.name}</div>
                          <div className="text-sm text-gray-600">{provider.specialty}</div>
                          <div className="text-sm text-green-600 font-medium mt-1">
                            ${provider.hourlyRate}/hour
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Select Appointment Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
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
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{apt.value}</div>
                      <div className="text-sm text-gray-600 mt-1">{apt.duration} minutes</div>
                      <div className="text-sm text-blue-600 font-medium mt-1">${apt.price}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Select Date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Select Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-600" />
                  Available Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {mockTimeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => setSelectedTime(time)}
                      className={selectedTime === time ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provider Info */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Provider</div>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={selectedProvider.avatar} alt={selectedProvider.name} />
                      <AvatarFallback>{getInitials(selectedProvider.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900">{selectedProvider.name}</div>
                      <div className="text-sm text-gray-600">{selectedProvider.specialty}</div>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">Appointment Type</div>
                  <div className="font-medium text-gray-900">{appointmentType}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedAppointmentType?.duration} minutes
                  </div>
                </div>

                {/* Date & Time */}
                {selectedDate && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Date</div>
                    <div className="font-medium text-gray-900">
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
                    <div className="text-sm text-gray-600 mb-2">Time</div>
                    <div className="font-medium text-gray-900">{selectedTime}</div>
                  </div>
                )}

                {/* Price */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${selectedAppointmentType?.price}
                    </div>
                  </div>
                </div>

                {/* Video Session Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Video className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-blue-900">Video Session</div>
                      <div className="text-xs text-blue-700 mt-1">
                        A secure video link will be provided before your appointment
                      </div>
                    </div>
                  </div>
                </div>

                {/* Book Button */}
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6" 
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime}
                >
                  Book Appointment
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Payment will be processed after the appointment. You can cancel up to 24 hours in advance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;
