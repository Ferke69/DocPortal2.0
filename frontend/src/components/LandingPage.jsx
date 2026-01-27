import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Shield, Video, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import LanguageSelector from './LanguageSelector';

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600">DocPortal</div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <Button variant="outline" onClick={() => navigate('/login')}>{t('landing.clientLogin')}</Button>
              <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">{t('landing.providerLogin')}</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('landing.title')}
            <span className="block text-blue-600 mt-2">{t('landing.subtitle')}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('landing.description')}
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              {t('landing.getStartedProvider')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8 py-6">
              {t('landing.accessClientPortal')}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('landing.featuresTitle')}</h2>
            <p className="text-xl text-gray-600">{t('landing.featuresSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('features.scheduling')}</h3>
                <p className="text-gray-600">
                  {t('features.schedulingDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Video className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('features.telehealth')}</h3>
                <p className="text-gray-600">
                  {t('features.telehealthDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('features.compliance')}</h3>
                <p className="text-gray-600">
                  {t('features.complianceDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('features.billing')}</h3>
                <p className="text-gray-600">
                  {t('features.billingDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('features.clientPortal')}</h3>
                <p className="text-gray-600">
                  {t('features.clientPortalDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('features.clinicalNotes')}</h3>
                <p className="text-gray-600">
                  {t('features.clinicalNotesDesc')}
                </p>
              </CardContent>
            </Card>
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
          <div className="flex justify-center space-x-4">
            <Button size="lg" onClick={() => navigate('/register')} className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
              {t('landing.startProvider')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6">
              {t('landing.accessClientPortal')}
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
