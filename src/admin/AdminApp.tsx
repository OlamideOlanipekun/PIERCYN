import React, { useState, useEffect } from 'react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLayout } from './components/AdminLayout';
import { AdminLogin } from './components/AdminLogin';
import { DashboardHomeView } from './views/DashboardHomeView';
import { OrdersView } from './views/OrdersView';
import { OrderDetailModal } from './views/OrderDetailModal';
import { ProductsView } from './views/ProductsView';
import { MediaLibraryView } from './views/MediaLibraryView';
import { VariantsView } from './views/VariantsView';
import { CategoriesView } from './views/CategoriesView';
import { InventoryView } from './views/InventoryView';
import { CustomersView } from './views/CustomersView';
import { AffiliatesView } from './views/AffiliatesView';
import { AnalyticsView } from './views/AnalyticsView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { ReviewsView } from './views/ReviewsView';
import { AdminNavTab } from './types';
import { Loader2 } from 'lucide-react';
import { PiercynMonogram } from '../components/PiercynLogo';

interface AdminAppProps {
  onBackToStore: () => void;
}

const AdminContent: React.FC<AdminAppProps> = ({ onBackToStore }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminNavTab>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync tab from URL path
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/admin/orders')) setActiveTab('orders');
    else if (path.includes('/admin/products')) setActiveTab('products');
    else if (path.includes('/admin/media')) setActiveTab('media');
    else if (path.includes('/admin/variants')) setActiveTab('variants');
    else if (path.includes('/admin/categories')) setActiveTab('categories');
    else if (path.includes('/admin/inventory')) setActiveTab('inventory');
    else if (path.includes('/admin/customers')) setActiveTab('customers');
    else if (path.includes('/admin/affiliates')) setActiveTab('affiliates');
    else if (path.includes('/admin/analytics')) setActiveTab('analytics');
    else if (path.includes('/admin/audit')) setActiveTab('audit');
    else if (path.includes('/admin/reviews')) setActiveTab('reviews');
    else if (path.includes('/admin/settings')) setActiveTab('settings');
    else setActiveTab('dashboard');
  }, []);

  const handleSelectTab = (tab: AdminNavTab) => {
    setActiveTab(tab);
    const targetPath = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ adminTab: tab }, '', targetPath);
    }
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center space-y-4 text-[#F2F0EB]">
        <PiercynMonogram size={38} className="text-[#F2F0EB] animate-pulse" />
        <span className="text-xs font-mono text-[#A3A199] uppercase tracking-widest">
          INITIALIZING CONTROL ROOM...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onBackToStore={onBackToStore} />;
  }

  return (
    <AdminLayout
      activeTab={activeTab}
      onSelectTab={handleSelectTab}
      onBackToStore={onBackToStore}
      onOpenOrder={(orderId) => setSelectedOrderId(orderId)}
      onRefreshData={handleRefreshData}
      isRefreshing={isRefreshing}
    >
      <div key={refreshKey}>
        {activeTab === 'dashboard' && (
          <DashboardHomeView
            onSelectTab={handleSelectTab}
            onOpenOrder={(orderId) => setSelectedOrderId(orderId)}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView onOpenOrder={(orderId) => setSelectedOrderId(orderId)} />
        )}

        {activeTab === 'products' && <ProductsView />}

        {activeTab === 'media' && <MediaLibraryView />}

        {activeTab === 'variants' && <VariantsView />}

        {activeTab === 'categories' && <CategoriesView />}

        {activeTab === 'inventory' && <InventoryView />}

        {activeTab === 'customers' && (
          <CustomersView onOpenOrder={(orderId) => setSelectedOrderId(orderId)} />
        )}

        {activeTab === 'reviews' && <ReviewsView />}

        {activeTab === 'affiliates' && <AffiliatesView />}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'audit' && <AuditLogView />}

        {activeTab === 'settings' && (
          <SettingsView onSeedSampleOrders={handleRefreshData} />
        )}
      </div>

      {/* Global Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onOrderUpdated={handleRefreshData}
        />
      )}
    </AdminLayout>
  );
};

export const AdminApp: React.FC<AdminAppProps> = ({ onBackToStore }) => {
  return (
    <AdminAuthProvider>
      <AdminContent onBackToStore={onBackToStore} />
    </AdminAuthProvider>
  );
};
