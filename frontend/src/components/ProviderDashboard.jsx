import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, DollarSign, FileText, MessageSquare, Video, Clock, 
  TrendingUp, LogOut, UserPlus, Copy, Check, Trash2, Key, Settings,
  Bell, CreditCard, CheckCircle, XCircle, AlertCircle, Eye, Mail,
  Phone, MoreVertical, Search, Filter, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { providerApi, messagesApi, billingApi } from '../services/api';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import api from '../services/api';

const ProviderDashboard = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Dashboard data states
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
  const [clients, setClients] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Invite code states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loadingCodes, setLoadingCodes] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('overview');
  
  // Client search
  const [clientSearch, setClientSearch] = useState('');

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
      setRecentMessages((messagesRes.data || []).slice(-5).reverse());

      // Fetch invoices
      try {
        const invoicesRes = await billingApi.getInvoices();
        setInvoices(invoicesRes.data || []);
      } catch (e) {
        console.log('Could not fetch invoices');
      }

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
      const response = await api.get('/provider/invite-codes');
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

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Share these codes with new clients to join your practice.
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
                    Generate New Code
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
                          <span className="text-green-600 dark:text-green-400">✓ Used</span>
                        ) : (
                          <span>Expires: {new Date(invite.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">DocPortal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Provider Dashboard</p>
        </div>
        
        <nav className="px-4 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'overview' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="h-5 w-5 mr-3" />
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'clients' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="h-5 w-5 mr-3" />
            My Clients
            <Badge className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">{clients.length}</Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('appointments')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'appointments' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="h-5 w-5 mr-3" />
            Appointments
            {stats.appointmentsToday > 0 && (
              <Badge className="ml-auto bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">{stats.appointmentsToday}</Badge>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'billing' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <DollarSign className="h-5 w-5 mr-3" />
            Billing & Payments
            {pendingInvoices.length > 0 && (
              <Badge className="ml-auto bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">{pendingInvoices.length}</Badge>
            )}
          </button>
          
          <button
            onClick={() => onNavigate('messages')}
            className="w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MessageSquare className="h-5 w-5 mr-3" />
            Messages
            {stats.messagesUnread > 0 && (
              <Badge className="ml-auto bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">{stats.messagesUnread}</Badge>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('invites')}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'invites' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Key className="h-5 w-5 mr-3" />
            Invite Codes
          </button>
        </nav>
        
        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'clients' && 'My Clients'}
              {activeTab === 'appointments' && 'Appointments'}
              {activeTab === 'billing' && 'Billing & Payments'}
              {activeTab === 'invites' && 'Invite Codes'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Welcome back, {user?.name?.split(' ')[0]}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <LanguageSelector />
            <Button onClick={openInviteModal} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Client
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Income</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.monthlyIncome.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-1">Total: ${stats.totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Clients</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeClients}</p>
                      <p className="text-xs text-blue-600 mt-1 cursor-pointer" onClick={() => setActiveTab('clients')}>View all →</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Today's Appointments</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.appointmentsToday}</p>
                      <p className="text-xs text-gray-500 mt-1">This week: {stats.appointmentsWeek}</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pending Notes</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingNotes}</p>
                      <p className="text-xs text-orange-600 mt-1">Needs attention</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Action - No Clients */}
            {clients.length === 0 && (
              <Card className="mb-8 bg-gradient-to-r from-blue-500 to-blue-600 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Get Started: Invite Your First Client</h3>
                      <p className="text-blue-100">Generate an invite code and share it with your clients.</p>
                    </div>
                    <Button onClick={openInviteModal} className="bg-white text-blue-600 hover:bg-blue-50">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Generate Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Schedule & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {todayAppointments.map((apt) => (
                        <div key={apt._id || apt.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getClientAvatar(apt.clientId)} />
                              <AvatarFallback>{getInitials(getClientName(apt.clientId))}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{getClientName(apt.clientId)}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{apt.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">{apt.time}</p>
                            {apt.videoLink && (
                              <Button size="sm" variant="outline" className="mt-1" onClick={() => window.open(apt.videoLink, '_blank')}>
                                <Video className="h-3 w-3 mr-1" />
                                Join
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No appointments scheduled for today
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900 dark:text-white">
                    <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                    Recent Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentMessages.length > 0 ? (
                    <div className="space-y-3">
                      {recentMessages.slice(0, 4).map((msg) => (
                        <div key={msg._id || msg.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {msg.senderType === 'client' ? getClientName(msg.senderId) : 'You'}
                            </span>
                            {!msg.read && msg.senderType === 'client' && (
                              <Badge className="bg-blue-100 text-blue-700 text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{msg.message}</p>
                        </div>
                      ))}
                      <Button variant="outline" className="w-full mt-2" onClick={() => onNavigate('messages')}>
                        View All Messages
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No messages yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={openInviteModal} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite New Client
              </Button>
            </div>

            {filteredClients.length > 0 ? (
              <div className="grid gap-4">
                {filteredClients.map((client) => {
                  const clientInvoices = invoices.filter(inv => inv.clientId === client.user_id);
                  const paidCount = clientInvoices.filter(inv => inv.status === 'paid').length;
                  const pendingCount = clientInvoices.filter(inv => inv.status === 'pending').length;
                  
                  return (
                    <Card key={client.user_id} className="dark:bg-gray-800 dark:border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-14 w-14">
                              <AvatarImage src={client.avatar} />
                              <AvatarFallback className="text-lg">{getInitials(client.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{client.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                {client.phone && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {client.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{paidCount}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => onNavigate('messages')}>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Clients Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Generate an invite code and share it with your clients to get started.</p>
                  <Button onClick={openInviteModal} className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Generate Invite Code
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Today's Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((apt) => (
                      <div key={apt._id || apt.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={getClientAvatar(apt.clientId)} />
                            <AvatarFallback>{getInitials(getClientName(apt.clientId))}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{getClientName(apt.clientId)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{apt.type} • {apt.duration} min</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">{apt.time}</p>
                            <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>
                              {apt.status}
                            </Badge>
                          </div>
                          {apt.videoLink && (
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(apt.videoLink, '_blank')}>
                              <Video className="h-4 w-4 mr-2" />
                              Join Call
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No appointments scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div>
            {/* Billing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Paid Invoices</p>
                      <p className="text-2xl font-bold text-green-600">{paidInvoices.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pending Payments</p>
                      <p className="text-2xl font-bold text-yellow-600">{pendingInvoices.length}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">{overdueInvoices.length}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoice List */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">All Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((inv) => (
                      <div key={inv._id || inv.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(getClientName(inv.clientId))}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{getClientName(inv.clientId)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{inv.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">${inv.amount}</p>
                          <Badge variant={
                            inv.status === 'paid' ? 'default' : 
                            inv.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No invoices yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invites Tab */}
        {activeTab === 'invites' && (
          <div>
            <Card className="dark:bg-gray-800 dark:border-gray-700 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Invite Code</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create a unique code for new clients to join your practice</p>
                  </div>
                  <Button onClick={generateInviteCode} className="bg-blue-600 hover:bg-blue-700" disabled={generatingCode}>
                    {generatingCode ? 'Generating...' : 'Generate New Code'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">All Invite Codes</CardTitle>
              </CardHeader>
              <CardContent>
                {inviteCodes.length > 0 ? (
                  <div className="space-y-3">
                    {inviteCodes.map((invite) => (
                      <div key={invite.code} className={`flex items-center justify-between p-4 rounded-lg ${
                        invite.used 
                          ? 'bg-gray-50 dark:bg-gray-700/30' 
                          : 'bg-blue-50 dark:bg-blue-900/20'
                      }`}>
                        <div>
                          <p className="font-mono text-xl font-bold text-gray-900 dark:text-white tracking-widest">{invite.code}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {invite.used ? 'Used' : `Expires: ${new Date(invite.expiresAt).toLocaleDateString()}`}
                          </p>
                        </div>
                        {!invite.used && (
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => copyToClipboard(invite.code)}>
                              {copiedCode === invite.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteInviteCode(invite.code)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                        {invite.used && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Used</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Key className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="mb-4">No invite codes generated yet</p>
                    <Button onClick={generateInviteCode} className="bg-blue-600 hover:bg-blue-700">
                      Generate Your First Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProviderDashboard;
