import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, DollarSign, FileText, MessageSquare, Video, Clock, TrendingUp, LogOut, UserPlus, Copy, Check, Trash2, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { providerApi, messagesApi } from '../services/api';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import api from '../services/api';

const ProviderDashboard = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Invite code states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loadingCodes, setLoadingCodes] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      const statsRes = await providerApi.getDashboard();
      setStats(statsRes.data);

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsRes = await providerApi.getAppointments(today);
      setTodayAppointments(appointmentsRes.data || []);

      // Fetch clients
      const clientsRes = await providerApi.getClients();
      setClients(clientsRes.data || []);

      // Fetch recent messages
      const messagesRes = await messagesApi.getAll();
      setRecentMessages((messagesRes.data || []).slice(-3).reverse());

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInviteCodes = async () => {
    setLoadingCodes(true);
    try {
      const response = await api.get('/api/provider/invite-codes');
      setInviteCodes(response.data || []);
    } catch (err) {
      console.error('Error fetching invite codes:', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  const generateInviteCode = async () => {
    setGeneratingCode(true);
    try {
      const response = await api.post('/api/provider/invite-code', { expiresInDays: 7 });
      await fetchInviteCodes();
      // Auto-copy new code
      copyToClipboard(response.data.code);
    } catch (err) {
      console.error('Error generating invite code:', err);
    } finally {
      setGeneratingCode(false);
    }
  };

  const deleteInviteCode = async (code) => {
    try {
      await api.delete(`/api/provider/invite-codes/${code}`);
      await fetchInviteCodes();
    } catch (err) {
      console.error('Error deleting invite code:', err);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openInviteModal = () => {
    setShowInviteModal(true);
    fetchInviteCodes();
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.user_id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getClientAvatar = (clientId) => {
    const client = clients.find(c => c.user_id === clientId);
    return client?.avatar;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Invite Code Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Key className="h-5 w-5 mr-2 text-blue-600" />
                  Client Invite Codes
                </h2>
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Generate invite codes for new clients to join your practice.
              </p>
            </div>
            
            <div className="p-6">
              <Button 
                onClick={generateInviteCode} 
                className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
                disabled={generatingCode}
              >
                {generatingCode ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Generate New Invite Code
                  </>
                )}
              </Button>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {loadingCodes ? (
                  <div className="text-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : inviteCodes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    No invite codes yet. Generate one above!
                  </div>
                ) : (
                  inviteCodes.map((invite) => (
                    <div 
                      key={invite.code}
                      className={`p-4 rounded-lg border ${
                        invite.used 
                          ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-lg font-bold tracking-wider text-gray-900 dark:text-white">
                          {invite.code}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!invite.used && (
                            <>
                              <button
                                onClick={() => copyToClipboard(invite.code)}
                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                                title="Copy code"
                              >
                                {copiedCode === invite.code ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-blue-600" />
                                )}
                              </button>
                              <button
                                onClick={() => deleteInviteCode(invite.code)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Delete code"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        {invite.used ? (
                          <span className="text-gray-500">✓ Used</span>
                        ) : (
                          <span>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Share invite codes with clients so they can join your practice. Each code can only be used once.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">DocPortal</div>
              <Badge variant="secondary" className="text-xs">Provider Portal</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={openInviteModal} 
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Client
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')} className="dark:text-gray-300">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('clients')} className="dark:text-gray-300">
                <Users className="h-4 w-4 mr-2" />
                Clients
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('messages')} className="dark:text-gray-300">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
                {stats.messagesUnread > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{stats.messagesUnread}</Badge>
                )}
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
            Welcome back, {user?.name?.split(' ')[0] || 'Doctor'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Here's what's happening with your practice today.</p>
        </div>

        {/* Quick Action - Invite Client */}
        {stats.activeClients === 0 && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Get Started: Invite Your First Client</h3>
                <p className="text-blue-100">Generate an invite code to add clients to your practice.</p>
              </div>
              <Button 
                onClick={openInviteModal}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Generate Invite Code
              </Button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Income</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">${stats.monthlyIncome.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                Total: ${stats.totalIncome.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.appointmentsToday}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This week: {stats.appointmentsWeek}</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Clients</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeClients}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.activeClients === 0 ? (
                  <span className="text-blue-600 cursor-pointer" onClick={openInviteModal}>+ Invite clients</span>
                ) : (
                  'Total active clients'
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Notes</CardTitle>
              <FileText className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingNotes}</div>
              <p className="text-xs text-orange-600 mt-1">Needs completion</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center dark:text-white">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.map((apt) => (
                  <div key={apt._id || apt.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={getClientAvatar(apt.clientId)} alt={getClientName(apt.clientId)} />
                        <AvatarFallback>{getInitials(getClientName(apt.clientId))}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{getClientName(apt.clientId)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{apt.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium text-gray-900 dark:text-white">{apt.time}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{apt.duration} min</div>
                      </div>
                      {apt.videoLink && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(apt.videoLink, '_blank')}>
                          <Video className="h-4 w-4 mr-2" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {todayAppointments.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No appointments scheduled for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center dark:text-white">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMessages.map((msg) => (
                  <div key={msg._id || msg.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {msg.senderType === 'client' ? getClientName(msg.senderId) : 'You'}
                      </div>
                      {!msg.read && msg.receiverId === user?.user_id && (
                        <Badge className="bg-blue-500 text-white text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
                {recentMessages.length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No messages yet
                  </div>
                )}
                <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300" onClick={() => onNavigate('messages')}>
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
