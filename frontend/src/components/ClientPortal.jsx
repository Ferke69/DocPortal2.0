import React, { useState } from 'react';
import { Calendar, CreditCard, MessageSquare, Video, FileText, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { mockClients, mockAppointments, mockInvoices, mockProviders, mockDashboardStats } from '../mockData';

const ClientPortal = ({ onNavigate }) => {
  const client = mockClients[0];
  const provider = mockProviders[0];
  const stats = mockDashboardStats.client;
  const upcomingAppointments = mockAppointments.filter(apt => apt.clientId === client.id && apt.status !== 'completed');
  const pendingInvoices = mockInvoices.filter(inv => inv.clientId === client.id && inv.status === 'pending');

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-green-600">SimplePractice</div>
              <Badge variant="secondary" className="text-xs">Client Portal</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('book-appointment')}>
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('messages')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
                {stats.unreadMessages > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{stats.unreadMessages}</Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('billing')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </Button>
              <Avatar className="cursor-pointer">
                <AvatarImage src={client.avatar} alt={client.name} />
                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {client.name.split(' ')[0]}</h1>
          <p className="text-gray-600">Manage your appointments, messages, and health information.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</div>
              <p className="text-xs text-gray-500 mt-1">Next on {upcomingAppointments[0]?.date}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
              <CreditCard className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</div>
              <p className="text-xs text-orange-600 mt-1">Action required</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">New Messages</CardTitle>
              <MessageSquare className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</div>
              <p className="text-xs text-gray-500 mt-1">From your provider</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Sessions</CardTitle>
              <FileText className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.completedSessions}</div>
              <p className="text-xs text-gray-500 mt-1">Total sessions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Upcoming Appointments
                </CardTitle>
                <Button size="sm" onClick={() => onNavigate('book-appointment')} className="bg-green-600 hover:bg-green-700">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={provider.avatar} alt={provider.name} />
                        <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900">{provider.name}</div>
                        <div className="text-sm text-gray-600">{apt.type}</div>
                        <div className="text-sm text-gray-500">{apt.date} at {apt.time}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {apt.status === 'confirmed' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Video className="h-4 w-4 mr-2" />
                          Join Session
                        </Button>
                      )}
                      {apt.status === 'pending' && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {upcomingAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming appointments
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Provider Info & Quick Actions */}
          <div className="space-y-6">
            {/* Your Provider */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Your Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={provider.avatar} alt={provider.name} />
                    <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{provider.name}</div>
                    <div className="text-sm text-gray-600">{provider.specialty}</div>
                    <div className="text-sm text-gray-500 mt-2">{provider.phone}</div>
                    <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => onNavigate('messages')}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Payments */}
            {pendingInvoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                    Pending Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingInvoices.map((inv) => (
                    <div key={inv.id} className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-900">${inv.amount}</div>
                          <div className="text-sm text-gray-600">{inv.description}</div>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">Due {inv.dueDate}</Badge>
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onNavigate('billing')}>
                        Pay Now
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientPortal;
