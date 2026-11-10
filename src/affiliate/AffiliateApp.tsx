          import React, { useState, useEffect, useCallback } from 'react';
import { AffiliateApiClient, AffiliateUser } from '../services/affiliateApi';
import { AffiliatePublicRoute, AffiliateDashboardTab } from './types';
import { AffiliateLandingPage } from './public/AffiliateLandingPage';
import { AffiliateRegisterPage } from './public/AffiliateRegisterPage';
import { AffiliateLoginPage } from './public/AffiliateLoginPage';
import { AffiliateApplicationStatus } from './public/AffiliateApplicationStatus';
import { AffiliatePortal } from './AffiliatePortal';
import { ProductsView } from './dashboard/views/ProductsView';

interface AffiliateAppProps {
  onBackToShop: () => void;
}

export const AffiliateApp: React.FC<AffiliateAppProps> = ({ onBackToShop }) => {
  const [currentUser, setCurrentUser] = useState<AffiliateUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Sub-route state
  const [currentRoute, setCurrentRoute] = useState<{
    kind: 'public' | 'dashboard';
    publicRoute?: AffiliatePublicRoute;
    dashboardTab?: AffiliateDashboardTab;
  }>({ kind: 'public', publicRoute: 'landing' });

  // Parse path to route
  const parsePath = useCallback((): {
    kind: 'public' | 'dashboard';
    publicRoute?: AffiliatePublicRoute;
    dashboardTab?: AffiliateDashboardTab;
  } => {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    if (path === '/affiliate/register') return { kind: 'public', publicRoute: 'register' };
    if (path === '/affiliate/login') return { kind: 'public', publicRoute: 'login' };
    if (path === '/affiliate/application') return { kind: 'public', publicRoute: 'application' };

    const validTabs: AffiliateDashboardTab[] = [
      'overview',
      'links',
      'products',
      'media',
      'referrals',
      'earnings',
      'withdrawals',
      'notifications',
      'settings',
    ];

    for (const tab of validTabs) {
      if (path === `/affiliate/${tab}` || (tab === 'overview' && path === '/affiliate/dashboard')) {
        return { kind: 'dashboard', dashboardTab: tab };
      }
    }

    return { kind: 'public', publicRoute: 'landing' };
  }, []);

  // Update browser URL & document title
  const navigateTo = useCallback(
    (
      target:
        | { kind: 'public'; route: AffiliatePublicRoute }
        | { kind: 'dashboard'; tab: AffiliateDashboardTab },
      replace = false
    ) => {
      let path = '/affiliate';
      let title = 'PIERCYN Creator & Affiliate Platform';

      if (target.kind === 'public') {
        if (target.route === 'register') {
          path = '/affiliate/register';
          title = 'Apply to Partner — PIERCYN Affiliate';
        } else if (target.route === 'login') {
          path = '/affiliate/login';
          title = 'Creator Sign In — PIERCYN Affiliate';
        } else if (target.route === 'application') {
          path = '/affiliate/application';
          title = 'Application Status — PIERCYN Affiliate';
        }
        setCurrentRoute({ kind: 'public', publicRoute: target.route });
      } else {
        path = target.tab === 'overview' ? '/affiliate/dashboard' : `/affiliate/${target.tab}`;
        const tabNames: Record<AffiliateDashboardTab, string> = {
          overview: 'Dashboard Overview',
          links: 'Referral Links',
          products: 'Products & Links',
          media: 'Media Studio',
          referrals: 'Attributed Referrals',
          earnings: 'Earnings & Ledger',
          withdrawals: 'Withdrawals & Payouts',
          notifications: 'Notifications',
          settings: 'Account Settings',
        };
        title = `${tabNames[target.tab]} — PIERCYN Affiliate`;
        setCurrentRoute({ kind: 'dashboard', dashboardTab: target.tab });
      }

      document.title = title;
      if (window.location.pathname !== path) {
        if (replace) {
          window.history.replaceState({ affiliatePath: path }, '', path);
        } else {
          window.history.pushState({ affiliatePath: path }, '', path);
        }
      }
    },
    []
  );

  // Initial Auth Check
  useEffect(() => {
    const init = async () => {
      const initialParsed = parsePath();
      const token = AffiliateApiClient.getToken();

      if (!token) {
        setIsCheckingAuth(false);
        if (initialParsed.kind === 'dashboard') {
          if (initialParsed.dashboardTab === 'products') {
            setCurrentRoute(initialParsed);
          } else {
            navigateTo({ kind: 'public', route: 'login' }, true);
          }
        } else {
          setCurrentRoute(initialParsed);
        }
        return;
      }

      try {
        const res = await AffiliateApiClient.getMe();
        if (res.success && res.data) {
          const user = res.data;
          setCurrentUser(user);

          if (user.status !== 'ACTIVE') {
            navigateTo({ kind: 'public', route: 'application' }, true);
          } else {
            if (initialParsed.kind === 'dashboard') {
              navigateTo({ kind: 'dashboard', tab: initialParsed.dashboardTab || 'overview' }, true);
            } else if (
              initialParsed.publicRoute === 'login' ||
              initialParsed.publicRoute === 'register' ||
              initialParsed.publicRoute === 'application'
            ) {
              navigateTo({ kind: 'dashboard', tab: 'overview' }, true);
            } else {
              setCurrentRoute(initialParsed);
            }
          }
        } else {
          AffiliateApiClient.clearToken();
          setCurrentUser(null);
          if (initialParsed.kind === 'dashboard') {
            navigateTo({ kind: 'public', route: 'login' }, true);
          } else {
            setCurrentRoute(initialParsed);
          }
        }
      } catch {
        AffiliateApiClient.clearToken();
        setCurrentUser(null);
        setCurrentRoute(initialParsed);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    init();
  }, [navigateTo, parsePath]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parsePath();
      if (!currentUser && parsed.kind === 'dashboard') {
        if (parsed.dashboardTab === 'products') {
          setCurrentRoute(parsed);
        } else {
          navigateTo({ kind: 'public', route: 'login' }, true);
        }
      } else {
        setCurrentRoute(parsed);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, navigateTo, parsePath]);

  // Login handler
  const handleAuthSuccess = (user: AffiliateUser) => {
    setCurrentUser(user);
    if (user.status === 'ACTIVE') {
      navigateTo({ kind: 'dashboard', tab: 'overview' });
    } else {
      navigateTo({ kind: 'public', route: 'application' });
    }
  };

  // Logout handler
  const handleLogout = () => {
    AffiliateApiClient.logout();
    setCurrentUser(null);
    navigateTo({ kind: 'public', route: 'landing' });
  };

  // Loading Screen in Brand Bone / Onyx
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F2F0EB] text-[#141414] flex flex-col items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4">
          <div className="text-3xl font-serif font-bold uppercase tracking-widest text-[#141414]">
            PIERCYN
          </div>
          <div className="w-8 h-8 border-2 border-[#141414] border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-[11px] uppercase tracking-[0.24em] text-[#737373] block font-semibold">
            Authenticating Creator Network...
          </span>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // APPLICATION STATUS ROUTE (Pending / Rejected / Suspended)
  // ------------------------------------------------------------
  if (currentRoute.kind === 'public' && currentRoute.publicRoute === 'application') {
    if (!currentUser) {
      return (
        <AffiliateLoginPage
          onNavigate={(r) => navigateTo({ kind: 'public', route: r })}
          onSuccess={handleAuthSuccess}
          onBackToShop={onBackToShop}
        />
      );
    }
    return (
      <AffiliateApplicationStatus
        user={currentUser}
        onRefreshUser={(updated) => setCurrentUser(updated)}
        onGoToDashboard={() => navigateTo({ kind: 'dashboard', tab: 'overview' })}
        onLogout={handleLogout}
        onBackToShop={onBackToShop}
      />
    );
  }

  // ------------------------------------------------------------
  // PUBLIC PAGES
  // ------------------------------------------------------------
  if (currentRoute.kind === 'public') {
    if (currentRoute.publicRoute === 'register') {
      return (
        <AffiliateRegisterPage
          onNavigate={(r) => navigateTo({ kind: 'public', route: r })}
          onSuccess={handleAuthSuccess}
          onBackToShop={onBackToShop}
        />
      );
    }

    if (currentRoute.publicRoute === 'login') {
      return (
        <AffiliateLoginPage
          onNavigate={(r) => navigateTo({ kind: 'public', route: r })}
          onSuccess={handleAuthSuccess}
          onBackToShop={onBackToShop}
        />
      );
    }

    // Default: Public Landing Page
    return (
      <AffiliateLandingPage
        onNavigate={(r) => navigateTo({ kind: 'public', route: r })}
        onBackToShop={onBackToShop}
      />
    );
  }

  // ------------------------------------------------------------
  // AUTHENTICATED DASHBOARD PAGES
  // ------------------------------------------------------------
  if (currentUser) {
    // If user is not active, force application status
    if (currentUser.status !== 'ACTIVE') {
      return (
        <AffiliateApplicationStatus
          user={currentUser}
          onRefreshUser={(updated) => setCurrentUser(updated)}
          onGoToDashboard={() => navigateTo({ kind: 'dashboard', tab: 'overview' })}
          onLogout={handleLogout}
          onBackToShop={onBackToShop}
        />
      );
    }

    return (
      <AffiliatePortal
        initialUser={currentUser}
        activeTab={currentRoute.dashboardTab || 'overview'}
        onTabChange={(tab) => navigateTo({ kind: 'dashboard', tab })}
        onLogout={handleLogout}
        onBackToShop={onBackToShop}
      />
    );
  }

  // Public catalog view for /affiliate/products without requiring authentication
  if (currentRoute.kind === 'dashboard' && currentRoute.dashboardTab === 'products') {
    return (
      <div className="min-h-screen bg-[#F2F0EB] text-[#141414] font-sans antialiased flex flex-col justify-between">
        {/* Top Header */}
        <header className="border-b border-[#E5E2DC] bg-[#F2F0EB]/95 backdrop-blur-md px-4 sm:px-8 py-5 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateTo({ kind: 'public', route: 'landing' })}
                className="text-2xl font-serif font-bold uppercase tracking-widest text-[#141414] hover:opacity-80 transition-opacity cursor-pointer"
              >
                PIERCYN
              </button>
              <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373] border-l border-[#E5E2DC] pl-4 hidden sm:inline">
                Creator Catalog
              </span>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => navigateTo({ kind: 'public', route: 'login' })}
                className="text-xs font-semibold uppercase tracking-wider text-[#141414] hover:bg-[#E5E2DC] px-3 py-1.5 border border-[#141414] transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigateTo({ kind: 'public', route: 'register' })}
                className="text-xs font-semibold uppercase tracking-wider bg-[#141414] text-white px-3.5 py-1.5 hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Apply to Partner
              </button>
              <button
                onClick={onBackToShop}
                className="text-xs font-semibold uppercase tracking-wider text-[#737373] hover:text-[#141414] hidden md:inline ml-2 transition-colors cursor-pointer"
              >
                Storefront
              </button>
            </div>
          </div>
        </header>

        {/* Highlight Banner */}
        <div className="bg-[#141414] text-white px-4 py-2.5 text-center text-xs tracking-wide">
          <span>Earn <strong>₦1,000 flat commission</strong> per qualifying delivered referral order. </span>
          <button
            onClick={() => navigateTo({ kind: 'public', route: 'register' })}
            className="underline font-semibold ml-1.5 hover:text-[#FAF8F5] cursor-pointer"
          >
            Apply to Partner →
          </button>
        </div>

        {/* Curated Products Catalog */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductsView primaryReferralCode="CREATOR" />
        </main>
      </div>
    );
  }

  // Fallback if not logged in but trying to view dashboard
  return (
    <AffiliateLoginPage
      onNavigate={(r) => navigateTo({ kind: 'public', route: r })}
      onSuccess={handleAuthSuccess}
      onBackToShop={onBackToShop}
    />
  );
};
