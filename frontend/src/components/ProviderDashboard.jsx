import React, { useState } from 'react';
import { Calendar, Users, DollarSign, FileText, MessageSquare, Video, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { mockDashboardStats, mockAppointments, mockClients, mockMessages, mockProviders } from '../mockData';

const ProviderDashboard = ({ onNavigate }) => {
  const provider = mockProviders[0];
  const stats = mockDashboardStats.provider;
  const todayAppointments = mockAppointments.filter(apt => apt.date === '2025-01-20');
  const recentMessages = mockMessages.slice(0, 3);

  const getClientName = (clientId) => {
    const client = mockClients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-blue-600">SimplePractice</div>
              <Badge variant="secondary" className="text-xs">Provider Portal</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('clients')}>
                <Users className="h-4 w-4 mr-2" />
                Clients
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('messages')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
                {stats.messagesUnread > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{stats.messagesUnread}</Badge>
                )}
              </Button>
              <Avatar className="cursor-pointer">
                <AvatarImage src={provider.avatar} alt={provider.name} />
                <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {provider.name.split(' ')[1]}</h1>
          <p className="text-gray-600">Here's what's happening with your practice today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Income</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">${stats.monthlyIncome.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.appointmentsToday}</div>
              <p className="text-xs text-gray-500 mt-1">Next at 10:00 AM</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Clients</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.activeClients}</div>
              <p className="text-xs text-gray-500 mt-1">Total active clients</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Notes</CardTitle>
              <FileText className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pendingNotes}</div>
              <p className="text-xs text-orange-600 mt-1">Needs completion</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.map((apt) => {
                  const client = mockClients.find(c => c.id === apt.clientId);
                  return (
                    <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={client?.avatar} alt={client?.name} />
                          <AvatarFallback>{getInitials(client?.name || 'N/A')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-gray-900">{client?.name}</div>
                          <div className="text-sm text-gray-600">{apt.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{apt.time}</div>
                          <div className="text-sm text-gray-600">{apt.duration} min</div>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Video className="h-4 w-4 mr-2" />
                          Join
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {todayAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No appointments scheduled for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMessages.map((msg) => (
                  <div key={msg.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900 text-sm">
                        {msg.senderType === 'client' ? getClientName(msg.senderId) : 'You'}
                      </div>
                      {!msg.read && msg.senderType === 'client' && (
                        <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => onNavigate('messages')}>
                  View All Messages
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;
