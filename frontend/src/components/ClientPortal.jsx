import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, CreditCard, MessageSquare, Video, Clock, User, LogOut,
  Heart, FileText, Bell, ChevronRight, Phone, Mail, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { clientApi, billingApi, messagesApi } from '../services/api';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

const ClientPortal = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Dashboard data
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    pendingPayments: 0,
    unreadMessages: 0,
    completedSessions: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [provider, setProvider] = useState(null);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      const statsRes = await clientApi.getDashboard();
      setStats(statsRes.data);

      // Fetch upcoming appointments
      const appointmentsRes = await clientApi.getAppointments('pending');
      const confirmedRes = await clientApi.getAppointments('confirmed');
      setUpcomingAppointments([...(appointmentsRes.data || []), ...(confirmedRes.data || [])]);

      // Fetch assigned provider
      try {
        const providerRes = await clientApi.getProvider();
        setProvider(providerRes.data);
      } catch (err) {
        console.log('No provider assigned yet');
      }

      // Fetch pending invoices
      try {
        const invoicesRes = await billingApi.getInvoices();
        const pending = (invoicesRes.data || []).filter(inv => inv.status === 'pending');
        setPendingInvoices(pending);
      } catch (err) {
        console.log('Could not fetch invoices');
      }

      // Fetch recent messages
      try {
        const messagesRes = await messagesApi.getAll();
        setRecentMessages((messagesRes.data || []).slice(-3).reverse());
      } catch (err) {
        console.log('Could not fetch messages');
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load your portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-green-600 dark:text-green-400">DocPortal</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your Health Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <LanguageSelector />
              <Avatar className="cursor-pointer h-9 w-9">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-sm">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200">
            {error}
            <Button variant="link" size="sm" onClick={fetchDashboardData} className="ml-2">
              Retry
            </Button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hello, {user?.name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome to your health portal. Here's what's happening.
          </p>
        </div>

        {/* Your Provider Card */}
        {provider ? (
          <Card className="mb-8 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Your Healthcare Provider</p>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-2 border-white/30">
                  <AvatarImage src={provider.avatar} alt={provider.name} />
                  <AvatarFallback className="text-xl bg-white/20">{getInitials(provider.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{provider.name}</h3>
                  <p className="text-green-100">{provider.specialty || 'Healthcare Provider'}</p>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  className="flex-1 mr-2 dark:border-gray-600 dark:text-gray-300"
                  onClick={() => onNavigate('messages')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => onNavigate('book-appointment')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <User className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Provider Assigned</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Please contact your healthcare provider for an invite code to connect your account.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onNavigate('book-appointment')}>
            <CardContent className="p-4 text-center">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingAppointments}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onNavigate('messages')}>
            <CardContent className="p-4 text-center">
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unreadMessages}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onNavigate('billing')}>
            <CardContent className="p-4 text-center">
              <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingPayments}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending Bills</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedSessions}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Upcoming Appointments
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('book-appointment')} className="text-green-600 dark:text-green-400">
                Book New
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div 
                    key={apt._id || apt.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{apt.type}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {apt.date} at {apt.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {apt.status === 'confirmed' && apt.videoLink ? (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => window.open(apt.videoLink, '_blank')}
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      ) : (
                        <Badge variant="outline" className={
                          apt.status === 'confirmed' 
                            ? 'text-green-600 border-green-600' 
                            : 'text-orange-600 border-orange-600'
                        }>
                          {apt.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming appointments</p>
                <Button 
                  onClick={() => onNavigate('book-appointment')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Book Your First Appointment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                  <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                  Messages
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('messages')} className="text-green-600 dark:text-green-400">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentMessages.length > 0 ? (
                <div className="space-y-3">
                  {recentMessages.map((msg) => (
                    <div 
                      key={msg._id || msg.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => onNavigate('messages')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {msg.senderType === 'provider' ? provider?.name || 'Provider' : 'You'}
                        </span>
                        {!msg.read && msg.senderType === 'provider' && (
                          <Badge className="bg-green-100 text-green-700 text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{msg.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No messages yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg text-gray-900 dark:text-white">
                  <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                  Billing
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('billing')} className="text-green-600 dark:text-green-400">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pendingInvoices.length > 0 ? (
                <div className="space-y-3">
                  {pendingInvoices.map((inv) => (
                    <div 
                      key={inv._id || inv.id}
                      className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">${inv.amount}</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-600">Due {inv.dueDate}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{inv.description}</p>
                      <Button 
                        size="sm" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => onNavigate('billing')}
                      >
                        Pay Now
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No pending payments</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">You're all caught up! ✓</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="py-6 dark:border-gray-600 dark:text-gray-300"
            onClick={() => onNavigate('book-appointment')}
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Appointment
          </Button>
          <Button 
            variant="outline" 
            className="py-6 dark:border-gray-600 dark:text-gray-300"
            onClick={() => onNavigate('messages')}
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            Send Message
          </Button>
          <Button 
            variant="outline" 
            className="py-6 dark:border-gray-600 dark:text-gray-300"
            onClick={() => onNavigate('billing')}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            View Bills
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ClientPortal;
