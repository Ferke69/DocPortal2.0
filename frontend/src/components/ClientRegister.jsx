import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { AlertCircle, User, CheckCircle } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import api from '../services/api';

const ClientRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    inviteCode: location.state?.inviteCode || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);
  const [providerInfo, setProviderInfo] = useState(location.state?.providerInfo || null);
  const [validatingCode, setValidatingCode] = useState(false);

  useEffect(() => {
    // Validate invite code if coming from ClientLogin
    if (formData.inviteCode && !providerInfo) {
      validateInviteCode(formData.inviteCode);
    } else if (providerInfo) {
      setInviteValid(true);
    }
  }, []);

  const validateInviteCode = async (code) => {
    if (!code || code.length < 6) {
      setInviteValid(false);
      setProviderInfo(null);
      return;
    }

    setValidatingCode(true);
    try {
      const response = await api.get(`/api/auth/validate-invite/${code}`);
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

    if (!inviteValid) {
      setError('Please enter a valid invite code');
      return;
    }

    if (!formData.email || !formData.password || !formData.name) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || null,
        userType: 'client',
        inviteCode: formData.inviteCode
      };

      const result = await register(submitData);
      
      if (result.success) {
        navigate('/client/dashboard');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <CardTitle className="text-2xl dark:text-white">Join Your Provider</CardTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Create your client account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Invite Code */}
            <div>
              <Label htmlFor="inviteCode">Invite Code *</Label>
              <div className="relative mt-1">
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="Enter 8-character code"
                  value={formData.inviteCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setFormData({ ...formData, inviteCode: code });
                    if (code.length >= 8) {
                      validateInviteCode(code);
                    } else {
                      setInviteValid(false);
                      setProviderInfo(null);
                    }
                  }}
                  className={`uppercase tracking-widest text-center font-mono ${
                    inviteValid ? 'border-green-500 focus:border-green-500' : ''
                  }`}
                  maxLength={8}
                  required
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
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  {providerInfo.avatar ? (
                    <img src={providerInfo.avatar} alt={providerInfo.name} className="h-10 w-10 rounded-full" />
                  ) : (
                    <div className="h-10 w-10 bg-green-200 dark:bg-green-700 rounded-full flex items-center justify-center">
                      <span className="text-green-800 dark:text-green-200 font-semibold">
                        {providerInfo.name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{providerInfo.name}</p>
                    {providerInfo.specialty && (
                      <p className="text-xs text-gray-600 dark:text-gray-300">{providerInfo.specialty}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading || !inviteValid}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
            <Link to="/client/login" className="text-green-600 hover:text-green-700 dark:text-green-400 font-medium">
              Sign in
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

export default ClientRegister;
