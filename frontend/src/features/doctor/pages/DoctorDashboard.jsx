/**
 * Doctor Dashboard Page - Main dashboard for doctors/providers
 * Shows doctor-specific stats, today's schedule, and quick actions
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, Users, DollarSign, FileText, MessageSquare, 
  Video, Clock, TrendingUp, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../contexts/AuthContext';
import { useDoctorDashboard, useTodayAppointments, useDoctorPatients, useDoctorMessages } from '../hooks/useDoctorData';
import DoctorLayout from '../components/DoctorLayout';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDoctorDashboard();
  const { appointments: todayAppointments, loading: appointmentsLoading } = useTodayAppointments();
  const { patients, loading: patientsLoading } = useDoctorPatients();
  const { messages, loading: messagesLoading } = useDoctorMessages();

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.user_id === patientId);
    return patient?.name || t('common.unknown', 'Unknown Patient');
  };

  const getPatientAvatar = (patientId) => {
    const patient = patients.find(p => p.user_id === patientId);
    return patient?.avatar;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const recentMessages = messages.slice(-3).reverse();
  const loading = statsLoading || appointmentsLoading || patientsLoading || messagesLoading;

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">{t('common.loading', 'Loading...')}</p>
          </div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      {/* Error Banner */}
      {statsError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {statsError}
          <Button variant="link" size="sm" onClick={refetchStats} className="ml-2">
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      )}

      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('provider.welcome', 'Welcome back, {{name}}', { name: user?.name?.split(' ')[0] || 'Doctor' })}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('provider.description', "Here's what's happening with your practice today.")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700" data-testid="stat-monthly-income">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('provider.monthlyIncome', 'Monthly Income')}
            </CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${stats.monthlyIncome?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('provider.fromLastMonth', '+12% from last month')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700" data-testid="stat-today-appointments">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('provider.todayAppointments', "Today's Appointments")}
            </CardTitle>
            <Calendar className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.appointmentsToday || 0}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {todayAppointments[0] 
                ? t('provider.nextAt', 'Next at {{time}}', { time: todayAppointments[0].time })
                : t('provider.noAppointments', 'No appointments today')
              }
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700" data-testid="stat-active-patients">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('provider.activeClients', 'Active Patients')}
            </CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeClients || 0}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('provider.totalClients', 'Total active patients')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700" data-testid="stat-pending-notes">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('provider.pendingNotes', 'Pending Notes')}
            </CardTitle>
            <FileText className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingNotes || 0}</div>
            <p className="text-xs text-orange-600 mt-1">
              {t('provider.needsCompletion', 'Needs completion')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700" data-testid="today-schedule">
          <CardHeader>
            <CardTitle className="flex items-center dark:text-white">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              {t('provider.todaySchedule', "Today's Schedule")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((apt) => (
                <div 
                  key={apt._id || apt.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={getPatientAvatar(apt.clientId)} alt={getPatientName(apt.clientId)} />
                      <AvatarFallback>{getInitials(getPatientName(apt.clientId))}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{getPatientName(apt.clientId)}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{apt.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">{apt.time}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{apt.duration} {t('booking.minutes', 'min')}</div>
                    </div>
                    {apt.videoLink && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.open(apt.videoLink, '_blank')}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {t('provider.join', 'Join')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {todayAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t('provider.noAppointments', 'No appointments scheduled for today')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="dark:bg-gray-800 dark:border-gray-700" data-testid="recent-messages">
          <CardHeader>
            <CardTitle className="flex items-center dark:text-white">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
              {t('provider.recentMessages', 'Recent Messages')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.map((msg) => (
                <div 
                  key={msg._id || msg.id} 
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                  onClick={() => navigate('/doctor/messages')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {msg.senderType === 'client' ? getPatientName(msg.senderId) : t('messaging.you', 'You')}
                    </div>
                    {!msg.read && msg.receiverId === user?.user_id && (
                      <Badge className="bg-blue-500 text-white text-xs">{t('messaging.new', 'New')}</Badge>
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
                  {t('messaging.noMessages', 'No messages yet')}
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full dark:border-gray-600 dark:text-gray-300" 
                onClick={() => navigate('/doctor/messages')}
              >
                {t('provider.viewAll', 'View All Messages')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
