import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Shield, Video, Clock, Users, CheckCircle, ArrowRight, Stethoscope, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">DocPortal</div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <LanguageSelector />
              <Button 
                variant="outline" 
                onClick={() => navigate('/client/login')}
                className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
              >
                <User className="h-4 w-4 mr-2" />
                {t('landing.clientLogin')}
              </Button>
              <Button 
                onClick={() => navigate('/provider/login')} 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                {t('landing.providerLogin')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {t('landing.title')}
            <span className="block text-blue-600 dark:text-blue-400 mt-2">{t('landing.subtitle')}</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            {t('landing.description')}
          </p>
          
          {/* Two Portal Entry Points */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Provider Portal Card */}
            <Card className="hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-blue-200 dark:border-blue-800 dark:bg-gray-800">
              <CardContent className="p-8 text-center">
                <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Stethoscope className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Healthcare Provider</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Manage your practice, clients, appointments, and billing all in one place.
                </p>
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/provider/login')} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Provider Login
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate('/provider/register')} 
                    className="w-full dark:border-gray-600 dark:text-gray-300"
                  >
                    Register as Provider
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Client Portal Card */}
            <Card className="hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-green-200 dark:border-green-800 dark:bg-gray-800">
              <CardContent className="p-8 text-center">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Patient / Client</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Access your health portal, book appointments, and communicate with your provider.
                </p>
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/client/login')} 
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Client Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Have an invite code from your provider?<br/>
                    <span 
                      onClick={() => navigate('/client/login?showRegister=true')} 
                      className="text-green-600 dark:text-green-400 cursor-pointer hover:underline"
                    >
                      Click here to join
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('landing.featuresTitle')}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">{t('landing.featuresSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('features.scheduling')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('features.schedulingDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('features.telehealth')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('features.telehealthDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('features.compliance')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('features.complianceDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('features.billing')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('features.billingDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('features.clientPortal')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('features.clientPortalDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('features.clinicalNotes')}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('features.clinicalNotesDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Simple onboarding for providers and clients</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Provider Flow */}
            <div>
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-6 flex items-center">
                <Stethoscope className="h-6 w-6 mr-2" />
                For Providers
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Register your account</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Create your provider account with email or Google</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Generate invite codes</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Create unique codes for your clients to join</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Manage your practice</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Schedule appointments, send messages, and manage billing</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Flow */}
            <div>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-6 flex items-center">
                <User className="h-6 w-6 mr-2" />
                For Clients
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Get invite code from provider</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Your healthcare provider will share a unique code with you</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Register with the code</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Create your account and automatically connect to your provider</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Access your portal</p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Book appointments, message your provider, and manage payments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">{t('landing.ctaTitle')}</h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('landing.ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/provider/register')} 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              <Stethoscope className="h-5 w-5 mr-2" />
              Start as Provider
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/client/login')} 
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              <User className="h-5 w-5 mr-2" />
              Access Client Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-4">DocPortal</div>
            <p className="mb-4">{t('landing.footer')}</p>
            <div className="flex justify-center space-x-6 text-sm">
              <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors duration-200">HIPAA Compliance</a>
              <a href="#" className="hover:text-white transition-colors duration-200">Contact</a>
            </div>
            <p className="mt-6 text-sm">© 2025 DocPortal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
