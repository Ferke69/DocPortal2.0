import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, MessageSquare, Video, FileText, Clock, User, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { clientApi, billingApi } from '../services/api';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

const ClientPortal = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    pendingPayments: 0,
    unreadMessages: 0,
    completedSessions: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [provider, setProvider] = useState(null);
  const [pendingInvoices, setPendingInvoices] = useState([]);
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
        // Provider might not be assigned yet
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

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">DocPortal</div>
              <Badge variant="secondary" className="text-xs">Client Portal</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('book-appointment')} className="dark:text-gray-300">
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('messages')} className="dark:text-gray-300">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
                {stats.unreadMessages > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{stats.unreadMessages}</Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('billing')} className="dark:text-gray-300">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </Button>
              <ThemeToggle />
              <LanguageSelector />
              <Avatar className="cursor-pointer">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="dark:text-gray-300">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {error}
            <Button variant="link" size="sm" onClick={fetchDashboardData} className="ml-2">
              Retry
            </Button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your appointments, messages, and health information.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingAppointments}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {upcomingAppointments[0] ? `Next on ${upcomingAppointments[0].date}` : 'No upcoming'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</CardTitle>
              <CreditCard className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingPayments}</div>
              <p className="text-xs text-orange-600 mt-1">{stats.pendingPayments > 0 ? 'Action required' : 'All paid'}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">New Messages</CardTitle>
              <MessageSquare className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unreadMessages}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From your provider</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Sessions</CardTitle>
              <FileText className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedSessions}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total sessions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointments */}
          <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center dark:text-white">
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
                  <div key={apt._id || apt.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={provider?.avatar} alt={provider?.name} />
                        <AvatarFallback>{getInitials(provider?.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{provider?.name || 'Your Provider'}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{apt.type}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{apt.date} at {apt.time}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {apt.status === 'confirmed' && apt.videoLink && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(apt.videoLink, '_blank')}>
                          <Video className="h-4 w-4 mr-2" />
                          Join Session
                        </Button>
                      )}
                      {apt.status === 'pending' && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">Pending</Badge>
                      )}
                      {apt.status === 'confirmed' && !apt.videoLink && (
                        <Badge variant="outline" className="text-green-600 border-green-600">Confirmed</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {upcomingAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No upcoming appointments
                    <div className="mt-4">
                      <Button onClick={() => onNavigate('book-appointment')} className="bg-green-600 hover:bg-green-700">
                        Book Your First Appointment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Provider Info & Quick Actions */}
          <div className="space-y-6">
            {/* Your Provider */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-white">
                  <User className="h-5 w-5 mr-2 text-purple-600" />
                  Your Provider
                </CardTitle>
              </CardHeader>
              <CardContent>
                {provider ? (
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={provider.avatar} alt={provider.name} />
                      <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">{provider.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{provider.specialty}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">{provider.phone}</div>
                      <Button variant="outline" size="sm" className="mt-3 w-full dark:border-gray-600 dark:text-gray-300" onClick={() => onNavigate('messages')}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <p className="mb-3">No provider assigned yet</p>
                    <Button variant="outline" size="sm" onClick={() => onNavigate('book-appointment')} className="dark:border-gray-600 dark:text-gray-300">
                      Find a Provider
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Payments */}
            {pendingInvoices.length > 0 && (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center dark:text-white">
                    <CreditCard className="h-5 w-5 mr-2 text-orange-600" />
                    Pending Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingInvoices.map((inv) => (
                    <div key={inv._id || inv.id} className="mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">${inv.amount}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{inv.description}</div>
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
