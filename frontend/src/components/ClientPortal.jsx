import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, CreditCard, MessageSquare, Video, Clock, User, LogOut,
  Heart, FileText, Bell, ChevronRight, Phone, Mail, MapPin, Menu, X, Settings
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsRes = await clientApi.getDashboard();
      setStats(statsRes.data);

      const appointmentsRes = await clientApi.getAppointments('pending');
      const confirmedRes = await clientApi.getAppointments('confirmed');
      setUpcomingAppointments([...(appointmentsRes.data || []), ...(confirmedRes.data || [])]);

      try {
        const providerRes = await clientApi.getProvider();
        setProvider(providerRes.data);
      } catch (err) {
        console.log('No provider assigned yet');
      }

      try {
        const invoicesRes = await billingApi.getInvoices();
        const pending = (invoicesRes.data || []).filter(inv => inv.status === 'pending');
        setPendingInvoices(pending);
      } catch (err) {
        console.log('Could not fetch invoices');
      }

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
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white dark:bg-gray-800 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-bold text-green-600 dark:text-green-400">DocPortal</h1>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <nav className="space-y-2">
              <button
                onClick={() => { onNavigate('book-appointment'); setMobileMenuOpen(false); }}
                className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Calendar className="h-5 w-5 mr-3" />
                Book Appointment
              </button>
              <button
                onClick={() => { onNavigate('messages'); setMobileMenuOpen(false); }}
                className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MessageSquare className="h-5 w-5 mr-3" />
                Messages
                {stats.unreadMessages > 0 && (
                  <Badge className="ml-auto bg-green-100 text-green-700">{stats.unreadMessages}</Badge>
                )}
              </button>
              <button
                onClick={() => { onNavigate('billing'); setMobileMenuOpen(false); }}
                className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <CreditCard className="h-5 w-5 mr-3" />
                Billing
                {stats.pendingPayments > 0 && (
                  <Badge className="ml-auto bg-orange-100 text-orange-700">{stats.pendingPayments}</Badge>
                )}
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              <button
                onClick={() => { navigate('/client/profile'); setMobileMenuOpen(false); }}
                className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="h-5 w-5 mr-3" />
                Profile & Settings
              </button>
            </nav>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mobile menu button */}
              <button className="lg:hidden" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">DocPortal</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Your Health Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>
              <Avatar 
                className="cursor-pointer h-8 w-8 sm:h-9 sm:w-9" 
                onClick={() => navigate('/client/profile')}
              >
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-xs sm:text-sm">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hidden sm:flex">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 sm:mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 text-sm">
            {error}
            <Button variant="link" size="sm" onClick={fetchDashboardData} className="ml-2">
              Retry
            </Button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Hello, {user?.name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Welcome to your health portal.
          </p>
        </div>

        {/* Your Provider Card */}
        {provider ? (
          <Card className="mb-4 sm:mb-8 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-4 sm:p-6 text-white">
              <p className="text-xs sm:text-sm opacity-90 mb-2">Your Healthcare Provider</p>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-white/30">
                  <AvatarImage src={provider.avatar} alt={provider.name} />
                  <AvatarFallback className="text-lg sm:text-xl bg-white/20">{getInitials(provider.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{provider.name}</h3>
                  <p className="text-green-100 text-sm">{provider.specialty || 'Healthcare Provider'}</p>
                </div>
              </div>
            </div>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 dark:border-gray-600 dark:text-gray-300"
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
          <Card className="mb-4 sm:mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-6 sm:p-8 text-center">
              <User className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">No Provider Assigned</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please contact your healthcare provider for an invite code to connect your account.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <Card 
            className="dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('book-appointment')}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingAppointments}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
            </CardContent>
          </Card>

          <Card 
            className="dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('messages')}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.unreadMessages}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
            </CardContent>
          </Card>

          <Card 
            className="dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onNavigate('billing')}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingPayments}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bills</p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.completedSessions}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <Card className="mb-4 sm:mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-base sm:text-lg text-gray-900 dark:text-white">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Upcoming Appointments
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onNavigate('book-appointment')} 
                className="text-green-600 dark:text-green-400 text-xs sm:text-sm"
              >
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl gap-3"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{apt.type}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {apt.date} at {apt.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-2">
                      {apt.status === 'confirmed' && apt.videoLink ? (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => window.open(apt.videoLink, '_blank')}
                        >
                          <Video className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Join</span>
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
              <div className="text-center py-6 sm:py-8">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No upcoming appointments</p>
                <Button 
                  onClick={() => onNavigate('book-appointment')}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  Book Your First Appointment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Messages */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-base sm:text-lg text-gray-900 dark:text-white">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                  Messages
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onNavigate('messages')} 
                  className="text-green-600 dark:text-green-400 text-xs sm:text-sm"
                >
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
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{msg.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No messages yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-base sm:text-lg text-gray-900 dark:text-white">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600" />
                  Billing
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onNavigate('billing')} 
                  className="text-green-600 dark:text-green-400 text-xs sm:text-sm"
                >
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
                      className="p-3 sm:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">${inv.amount}</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">Due {inv.dueDate}</Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">{inv.description}</p>
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
                  <CreditCard className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">No pending payments</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">You're all caught up! ✓</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Footer - Desktop */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4 mt-8">
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
            onClick={() => navigate('/client/profile')}
          >
            <Settings className="h-5 w-5 mr-2" />
            My Profile
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ClientPortal;
