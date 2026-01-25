import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import WelcomeScreen from '@/components/WelcomeScreen';
import Navbar from '@/components/Navbar';
import HomePage from '@/pages/HomePage';
import DashboardPage from '@/pages/DashboardPage';
import MarketsPage from '@/pages/MarketsPage';
import HelpdeskPage from '@/pages/HelpdeskPage';
import SettingsPage from '@/pages/SettingsPage';
import ConnectWalletPopup from '@/components/ConnectWalletPopup';

const MainApp: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [showConnectPopup, setShowConnectPopup] = useState(false);
  const { wallet } = useWallet();

  // Check if user has seen welcome before (this session) or skipwelcome param
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    const urlParams = new URLSearchParams(window.location.search);
    if (hasSeenWelcome || urlParams.get('skipwelcome') === 'true') {
      setShowWelcome(false);
    }
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    sessionStorage.setItem('hasSeenWelcome', 'true');
  };

  const handleNavigate = (page: string) => {
    if (page === 'dashboard' && !wallet.isConnected) {
      setShowConnectPopup(true);
      return;
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'markets':
        return <MarketsPage />;
      case 'helpdesk':
        return <HelpdeskPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <WelcomeScreen key="welcome" onComplete={handleWelcomeComplete} />
        ) : (
          <>
            <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
            {renderPage()}
          </>
        )}
      </AnimatePresence>

      <ConnectWalletPopup 
        isOpen={showConnectPopup} 
        onClose={() => setShowConnectPopup(false)} 
      />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  );
};

export default Index;
