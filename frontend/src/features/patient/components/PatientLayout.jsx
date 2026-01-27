/**
 * Patient Layout - Main layout wrapper for all patient pages
 * Includes patient-specific navigation, header, and common UI elements
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, MessageSquare, CreditCard, User, 
  LogOut, LayoutDashboard, FileText, Heart
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../contexts/AuthContext';
import ThemeToggle from '../../../components/ThemeToggle';
import LanguageSelector from '../../../components/LanguageSelector';

const PatientLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/patient/dashboard', icon: LayoutDashboard, label: t('client.dashboard', 'Dashboard') },
    { path: '/patient/appointments', icon: Calendar, label: t('client.bookAppointment', 'Appointments') },
    { path: '/patient/messages', icon: MessageSquare, label: t('client.messages', 'Messages') },
    { path: '/patient/billing', icon: CreditCard, label: t('client.billing', 'Billing') },
    { path: '/patient/records', icon: FileText, label: t('client.records', 'Health Records') },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Top Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Portal Badge */}
            <div className="flex items-center space-x-4">
              <div 
                className="text-2xl font-bold text-green-600 dark:text-green-400 cursor-pointer"
                onClick={() => navigate('/patient/dashboard')}
              >
                DocPortal
              </div>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {t('client.portal', 'Patient Portal')}
              </Badge>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.slice(0, 4).map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`dark:text-gray-300 ${isActive(item.path) ? 'bg-green-50 dark:bg-green-900/30' : ''}`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <LanguageSelector />
              <Avatar className="cursor-pointer h-9 w-9" onClick={() => navigate('/patient/profile')}>
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="text-sm">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="dark:text-gray-300">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 overflow-x-auto">
        <div className="flex space-x-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className={`whitespace-nowrap ${isActive(item.path) ? 'bg-green-50 dark:bg-green-900/30' : ''}`}
            >
              <item.icon className="h-4 w-4 mr-1" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default PatientLayout;
