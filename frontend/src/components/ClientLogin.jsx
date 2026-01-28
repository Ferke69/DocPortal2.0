import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { AlertCircle, User, CheckCircle } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const ClientLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // For invite code registration
  const [showRegister, setShowRegister] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteValid, setInviteValid] = useState(false);
  const [providerInfo, setProviderInfo] = useState(null);
  const [validatingCode, setValidatingCode] = useState(false);

  useEffect(() => {
    // Check if there's an invite code in the URL
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
      setShowRegister(true);
      validateInviteCode(code);
    }
  }, [searchParams]);

  const validateInviteCode = async (code) => {
    if (!code || code.length < 6) {
      setInviteValid(false);
      setProviderInfo(null);
      return;
    }

    setValidatingCode(true);
    try {
      const response = await api.get(`/auth/validate-invite/${code}`);
      setInviteValid(true);
      setProviderInfo(response.data.provider);
      setError('');
    } catch (err) {
      setInviteValid(false);
      setProviderInfo(null);
      setError(err.response?.data?.detail || 'Invalid invite code');
    } finally {
      setValidatingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Verify it's a client account
      if (result.user.userType !== 'client') {
        setError('This is not a client account. Please use the Provider Portal to login.');
        setLoading(false);
        return;
      }
      navigate('/client/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    if (!inviteValid) {
      setError('Please enter a valid invite code first');
      return;
    }
    
    // Store intended user type and invite code in sessionStorage
    sessionStorage.setItem('intended_user_type', 'client');
    sessionStorage.setItem('invite_code', inviteCode);
    
    // Redirect to dashboard - the AppRouter will detect session_id and handle it
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <ThemeToggle />
        <LanguageSelector />
      </div>
      
      <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">DocPortal</div>
          <CardTitle className="text-2xl dark:text-white">{t('client.portal')}</CardTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            {showRegister ? t('auth.joinProviderPractice') : t('auth.accessHealthPortal')}
          </p>
        </CardHeader>
        <CardContent>
          {/* Toggle between login and register */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !showRegister 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              onClick={() => setShowRegister(false)}
            >
              {t('auth.signIn')}
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                showRegister 
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              onClick={() => setShowRegister(true)}
            >
              {t('auth.haveInviteCode')}
            </button>
          </div>

          {!showRegister ? (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
            </form>
          ) : (
            /* Register with Invite Code */
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <Label htmlFor="inviteCode">{t('auth.inviteCodeFromProvider')}</Label>
                <div className="relative mt-1">
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder={t('auth.enterInviteCode')}
                    value={inviteCode}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      setInviteCode(code);
                      if (code.length >= 8) {
                        validateInviteCode(code);
                      } else {
                        setInviteValid(false);
                        setProviderInfo(null);
                      }
                    }}
                    className={`uppercase tracking-widest text-center text-lg font-mono ${
                      inviteValid ? 'border-green-500 focus:border-green-500' : ''
                    }`}
                    maxLength={8}
                  />
                  {validatingCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  {inviteValid && !validatingCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Provider Info */}
              {inviteValid && providerInfo && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {providerInfo.avatar ? (
                      <img src={providerInfo.avatar} alt={providerInfo.name} className="h-12 w-12 rounded-full" />
                    ) : (
                      <div className="h-12 w-12 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center">
                        <span className="text-green-800 dark:text-green-200 font-semibold">
                          {providerInfo.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{providerInfo.name}</p>
                      {providerInfo.specialty && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">{providerInfo.specialty}</p>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-green-800 dark:text-green-200">
                    ✓ {t('auth.willBeConnected')}
                  </p>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('auth.orContinueWith')}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={!inviteValid}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>

              <Link to="/client/register" state={{ inviteCode, providerInfo }}>
                <Button
                  type="button"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!inviteValid}
                >
                  Sign up with Email
                </Button>
              </Link>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Don't have an invite code? Ask your healthcare provider to generate one for you.
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Are you a provider? </span>
            <Link to="/provider/login" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-sm">
              Go to Provider Portal →
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientLogin;
