import React, { useState, useEffect } from 'react';
import { AffiliateApiClient, AffiliateUser } from '../services/affiliateApi';
import { AffiliateLandingPage } from './AffiliateLandingPage';
import { AffiliatePortal } from './AffiliatePortal';

interface AffiliateAppProps {
  onBackToShop: () => void;
}

export const AffiliateApp: React.FC<AffiliateAppProps> = ({ onBackToShop }) => {
  const [currentUser, setCurrentUser] = useState<AffiliateUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = AffiliateApiClient.getToken();
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const res = await AffiliateApiClient.getMe();
        if (res.success && res.data) {
          setCurrentUser(res.data);
        } else {
          AffiliateApiClient.clearToken();
        }
      } catch (err) {
        AffiliateApiClient.clearToken();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, []);

  const handleLogout = () => {
    AffiliateApiClient.logout();
    setCurrentUser(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-xs uppercase tracking-widest text-[#888888]">Authenticating Creator Portal...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AffiliateLandingPage
        onGoToPortal={(user) => setCurrentUser(user)}
        onBackToShop={onBackToShop}
      />
    );
  }

  return (
    <AffiliatePortal
      initialUser={currentUser}
      onLogout={handleLogout}
      onBackToShop={onBackToShop}
    />
  );
};
