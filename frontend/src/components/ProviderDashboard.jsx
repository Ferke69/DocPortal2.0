import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, DollarSign, FileText, MessageSquare, Video, Clock, 
  TrendingUp, LogOut, UserPlus, Copy, Check, Trash2, Key, Settings,
  Bell, CreditCard, CheckCircle, XCircle, AlertCircle, Eye, Mail,
  Phone, MoreVertical, Search, Filter, ChevronRight, Menu, X, User, ClipboardList
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
import ScheduleSettings from './ScheduleSettings';
import { useCurrency } from './CurrencySelector';
import PendingItemsWidget from './PendingItemsWidget';
import api from '../services/api';

const ProviderDashboard = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Use shared currency hook
  const { symbol: currencySymbol } = useCurrency();
  
  // Dashboard data states
  const [stats, setStats] = useState({
    totalIncome: 0,
    monthlyIncome: 0,
    appointmentsToday: 0,
    appointmentsWeek: 0,
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
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Client search
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'invites') {
      fetchInviteCodes();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsRes = await providerApi.getDashboard();
      setStats(statsRes.data);

      const today = new Date().toISOString().split('T')[0];
      const appointmentsRes = await providerApi.getAppointments(today);
      setTodayAppointments(appointmentsRes.data || []);

      const clientsRes = await providerApi.getClients();
      setClients(clientsRes.data || []);

      const messagesRes = await messagesApi.getAll();
      // Get only the latest message from each client
      const allMessages = messagesRes.data || [];
      const clientLatestMessages = {};
      allMessages.forEach(msg => {
        if (msg.senderType === 'client') {
          const existing = clientLatestMessages[msg.senderId];
          if (!existing || new Date(msg.timestamp) > new Date(existing.timestamp)) {
            clientLatestMessages[msg.senderId] = msg;
          }
        }
      });
      // Sort by timestamp descending and take top 5
      const latestMessages = Object.values(clientLatestMessages)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
      setRecentMessages(latestMessages);

      try {
        const invoicesRes = await billingApi.getInvoices();
        setInvoices(invoicesRes.data || []);
      } catch (e) {
        console.log('Could not fetch invoices');
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data.');
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
      const response = await api.post('/provider/invite-code', { expiresInDays: 7 });
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
      await api.delete(`/provider/invite-codes/${code}`);
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

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
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

  const navItems = [
    { key: 'overview', label: 'Overview', icon: TrendingUp, badge: null },
    { key: 'clients', label: 'My Clients', icon: Users, badge: clients.length, badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    { key: 'appointments', label: 'Appointments', icon: Calendar, badge: stats.appointmentsToday > 0 ? stats.appointmentsToday : null, badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    { key: 'billing', label: 'Billing', icon: DollarSign, badge: pendingInvoices.length > 0 ? pendingInvoices.length : null, badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    { key: 'messages', label: 'Messages', icon: MessageSquare, badge: stats.messagesUnread > 0 ? stats.messagesUnread : null, badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', action: 'messages' },
    { key: 'invites', label: 'Invite Codes', icon: Key, badge: null },
    { key: 'divider', isDivider: true },
    { key: 'schedule', label: 'Schedule Settings', icon: ClipboardList, badge: null },
    { key: 'profile', label: 'Profile', icon: User, badge: null, action: 'profile' },
  ];

  const renderNavItems = () => (
    <>
      {navItems.map((item) => {
        if (item.isDivider) {
          return <div key={item.key} className="border-t border-gray-200 dark:border-gray-700 my-2"></div>;
        }
        
        const IconComponent = item.icon;
        const isActive = activeTab === item.key;
        
        const handleClick = () => {
          if (item.action === 'messages') {
            onNavigate('messages');
            setMobileMenuOpen(false);
          } else if (item.action === 'profile') {
            navigate('/provider/profile');
            setMobileMenuOpen(false);
          } else {
            handleNavClick(item.key);
          }
        };
        
        const baseClass = item.action 
          ? "w-full flex items-center px-4 py-3 rounded-lg text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          : `w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
              isActive 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`;
        
        return (
          <button key={item.key} onClick={handleClick} className={baseClass}>
            <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
            <span>{item.label}</span>
            {item.badge !== null && (
              <Badge className={`ml-auto ${item.badgeClass}`}>{item.badge}</Badge>
            )}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white dark:bg-gray-800 p-4 flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">DocPortal</h1>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <nav className="space-y-1 flex-1 overflow-y-auto">
              {renderNavItems()}
            </nav>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-3 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Code Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Key className="h-5 w-5 mr-2 text-blue-600" />
                  Invite Codes
                </h2>
                <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-xl">×</button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <Button onClick={generateInviteCode} className="w-full bg-blue-600 hover:bg-blue-700 mb-4" disabled={generatingCode}>
                {generatingCode ? 'Generating...' : <><UserPlus className="h-4 w-4 mr-2" />Generate New Code</>}
              </Button>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {loadingCodes ? (
                  <div className="text-center py-4"><div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div></div>
                ) : inviteCodes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">No codes yet</div>
                ) : (
                  inviteCodes.map((invite) => (
                    <div key={invite.code} className={`p-3 sm:p-4 rounded-lg border ${invite.used ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-base sm:text-lg font-bold tracking-wider text-gray-900 dark:text-white">{invite.code}</div>
                        {!invite.used && (
                          <div className="flex items-center space-x-1">
                            <button onClick={() => copyToClipboard(invite.code)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg">
                              {copiedCode === invite.code ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-blue-600" />}
                            </button>
                            <button onClick={() => deleteInviteCode(invite.code)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {invite.used ? <span className="text-green-600">✓ Used</span> : `Expires: ${new Date(invite.expiresAt).toLocaleDateString()}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">DocPortal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Provider Dashboard</p>
        </div>
        <nav className="px-4 space-y-1">
          {renderNavItems()}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar className="cursor-pointer" onClick={() => navigate('/provider/profile')}>
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
      <main className="lg:ml-64 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
              <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">DocPortal</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Avatar className="h-8 w-8" onClick={() => navigate('/provider/profile')}>
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-xs">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'clients' && 'My Clients'}
                {activeTab === 'appointments' && 'Appointments'}
                {activeTab === 'billing' && 'Billing & Payments'}
                {activeTab === 'invites' && 'Invite Codes'}
                {activeTab === 'schedule' && 'Schedule Settings'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back, {user?.name?.split(' ')[0]}</p>
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

          {/* Mobile Quick Actions */}
          <div className="lg:hidden mb-6">
            <Button onClick={openInviteModal} className="w-full bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Client
            </Button>
          </div>

          {/* Schedule Settings Tab */}
          {activeTab === 'schedule' && (
            <ScheduleSettings />
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Monthly Income</p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{currencySymbol}{stats.monthlyIncome.toLocaleString()}</p>
                      </div>
                      <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Active Clients</p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.activeClients}</p>
                      </div>
                      <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Today&apos;s Appointments</p>
                        <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.appointmentsToday}</p>
                      </div>
                      <div className="h-8 w-8 sm:h-12 sm:w-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Items Widget - New */}
                <PendingItemsWidget />
              </div>

              {clients.length === 0 && (
                <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-500 to-blue-600 border-0">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-white space-y-4 sm:space-y-0">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Get Started</h3>
                        <p className="text-blue-100 text-sm">Generate an invite code and share it with your clients.</p>
                      </div>
                      <Button onClick={openInviteModal} className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Generate Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center text-base sm:text-lg text-gray-900 dark:text-white">
                      <Clock className="h-5 w-5 mr-2 text-blue-600" />
                      Today&apos;s Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todayAppointments.length > 0 ? (
                      <div className="space-y-3">
                        {todayAppointments.map((apt) => (
                          <div key={apt._id || apt.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-3 min-w-0">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                <AvatarImage src={getClientAvatar(apt.clientId)} />
                                <AvatarFallback className="text-xs">{getInitials(getClientName(apt.clientId))}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{getClientName(apt.clientId)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{apt.type}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{apt.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">No appointments today</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center text-base sm:text-lg text-gray-900 dark:text-white">
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
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Avatar className="h-6 w-6 flex-shrink-0">
                                  <AvatarImage src={getClientAvatar(msg.senderId)} />
                                  <AvatarFallback className="text-xs">{getInitials(getClientName(msg.senderId))}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {getClientName(msg.senderId)}
                                </span>
                              </div>
                              {!msg.read && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs ml-2 flex-shrink-0">New</Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-1 pl-8">{msg.message}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 pl-8">
                              {new Date(msg.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                        <Button variant="outline" className="w-full mt-2 text-sm" onClick={() => onNavigate('messages')}>
                          View All Messages
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">No messages yet</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search clients..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-10" />
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
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                                <AvatarImage src={client.avatar} />
                                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate">{client.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{client.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6">
                              <div className="flex space-x-4">
                                <div className="text-center">
                                  <p className="text-xl sm:text-2xl font-bold text-green-600">{paidCount}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingCount}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => onNavigate('messages')}>
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No Clients Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm sm:text-base">Generate an invite code and share it with your clients to get started.</p>
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
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Today&apos;s Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {todayAppointments.map((apt) => (
                      <div key={apt._id || apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-3">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                            <AvatarImage src={getClientAvatar(apt.clientId)} />
                            <AvatarFallback>{getInitials(getClientName(apt.clientId))}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{getClientName(apt.clientId)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{apt.type} • {apt.duration} min</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end space-x-4">
                          <div className="text-left sm:text-right">
                            <p className="font-medium text-gray-900 dark:text-white">{apt.time}</p>
                            <Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>{apt.status}</Badge>
                          </div>
                          {apt.videoLink && (
                            <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => window.open(apt.videoLink, '_blank')}>
                              <Video className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Join</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No appointments scheduled for today</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div>
              <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Paid</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{paidInvoices.length}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 hidden sm:block" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pending</p>
                        <p className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingInvoices.length}</p>
                      </div>
                      <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 hidden sm:block" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">{overdueInvoices.length}</p>
                      </div>
                      <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 hidden sm:block" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">All Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <div className="space-y-3">
                      {invoices.map((inv) => (
                        <div key={inv._id || inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-3">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{getInitials(getClientName(inv.clientId))}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{getClientName(inv.clientId)}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{inv.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end space-x-4">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{currencySymbol}{inv.amount}</p>
                            <Badge variant={inv.status === 'paid' ? 'default' : inv.status === 'pending' ? 'secondary' : 'destructive'}>{inv.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                      <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
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
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Generate Invite Code</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Create a unique code for new clients</p>
                    </div>
                    <Button onClick={generateInviteCode} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" disabled={generatingCode}>
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
                        <div key={invite.code} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg gap-3 ${invite.used ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                          <div>
                            <p className="font-mono text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-widest">{invite.code}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {invite.used ? 'Used' : `Expires: ${new Date(invite.expiresAt).toLocaleDateString()}`}
                            </p>
                          </div>
                          {!invite.used ? (
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard(invite.code)}>
                                {copiedCode === invite.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => deleteInviteCode(invite.code)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Used</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                      <Key className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="mb-4">No invite codes yet</p>
                      <Button onClick={generateInviteCode} className="bg-blue-600 hover:bg-blue-700">Generate First Code</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;
