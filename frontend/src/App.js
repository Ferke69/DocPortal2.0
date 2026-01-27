import React, { useState } from 'react';
import './App.css';
import LandingPage from './components/LandingPage';
import ProviderDashboard from './components/ProviderDashboard';
import ClientPortal from './components/ClientPortal';
import MessagingCenter from './components/MessagingCenter';
import AppointmentBooking from './components/AppointmentBooking';
import BillingPayments from './components/BillingPayments';
import { Toaster } from './components/ui/toaster';
import { mockProviders, mockClients } from './mockData';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const handleSelectPortal = (portalType) => {
    setUserType(portalType);
    // Mock login - in real app, would have actual authentication
    if (portalType === 'provider') {
      setCurrentUser(mockProviders[0]);
      setCurrentView('provider-dashboard');
    } else {
      setCurrentUser(mockClients[0]);
      setCurrentView('client-portal');
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
  };

  const handleBackToDashboard = () => {
    if (userType === 'provider') {
      setCurrentView('provider-dashboard');
    } else {
      setCurrentView('client-portal');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onSelectPortal={handleSelectPortal} />;
      
      case 'provider-dashboard':
        return <ProviderDashboard onNavigate={handleNavigate} />;
      
      case 'client-portal':
        return <ClientPortal onNavigate={handleNavigate} />;
      
      case 'messages':
        return (
          <MessagingCenter 
            userType={userType} 
            userId={currentUser?.id}
            onBack={handleBackToDashboard}
          />
        );
      
      case 'book-appointment':
      case 'calendar':
        return (
          <AppointmentBooking 
            userType={userType}
            userId={currentUser?.id}
            onBack={handleBackToDashboard}
          />
        );
      
      case 'billing':
        return (
          <BillingPayments 
            userType={userType}
            userId={currentUser?.id}
            onBack={handleBackToDashboard}
          />
        );
      
      case 'clients':
        // In a real app, would have a full clients management page
        return <ProviderDashboard onNavigate={handleNavigate} />;
      
      default:
        return <LandingPage onSelectPortal={handleSelectPortal} />;
    }
  };

  return (
    <div className="App">
      {renderView()}
      <Toaster />
    </div>
  );
}

export default App;
