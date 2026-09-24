import React, { useState, useEffect, useMemo } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { ALL_PRODUCTS } from './data/allProducts';
import { getDeduplicatedHomepageProducts } from './utils/homepageProducts';
import { ENABLE_WOMENSWEAR } from './config/homepage';
import { Product, LookbookLook, ActivePageView } from './types';
import { Navbar } from './components/Navbar';
import { AnnouncementBar } from './components/AnnouncementBar';
import { MenCollectionPage } from './components/men/MenCollectionPage';
import { WomenCollectionPage } from './components/women/WomenCollectionPage';
import { CollectionsPage } from './components/collections/CollectionsPage';
import { HeroSection } from './components/HeroSection';
import { QuickCategoryNav } from './components/QuickCategoryNav';
import { JustDroppedSection } from './components/JustDroppedSection';
import { ShopByCategorySection } from './components/ShopByCategorySection';
import { TrendingNowSection } from './components/TrendingNowSection';
import { AffordableDiscoverySection } from './components/AffordableDiscoverySection';
import { ThePiercynEditSection } from './components/ThePiercynEditSection';
import { MensFashionSection } from './components/MensFashionSection';
import { WomensFashionSection } from './components/WomensFashionSection';
import { AccessoriesTeaserSection } from './components/AccessoriesTeaserSection';
import { TrustReassuranceSection } from './components/TrustReassuranceSection';
import { ProductDetailsPage } from './components/pdp/ProductDetailsPage';
import { NewArrivalsPage } from './components/NewArrivalsPage';
import { AccessoriesPage } from './components/AccessoriesPage';
import { ShopPage } from './components/ShopPage';
import { LookbookSection } from './components/LookbookSection';
import { WhatsAppCTASection } from './components/WhatsAppCTASection';
import { NewsletterSection } from './components/NewsletterSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { LookbookModal } from './components/LookbookModal';
import { SearchModal } from './components/SearchModal';
import { StoryModal } from './components/StoryModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { CraftsmanshipModal } from './components/CraftsmanshipModal';
import { ConciergeModal } from './components/ConciergeModal';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { WhatsAppButton } from './components/WhatsAppButton';
import { AccountDashboard } from './components/AccountDashboard';
import { BuildTheLookSection } from './components/BuildTheLookSection';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminDrawer } from './components/AdminDrawer';
import { Toast } from './components/Toast';

const MainLayout: React.FC = () => {
  const { setQuickViewProduct, setActiveLook } = useShop();
  const [activePage, setActivePage] = useState<ActivePageView>('home');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [currentPdpProduct, setCurrentPdpProduct] = useState<Product | null>(null);

  // Compute distinct, deduplicated products across homepage sections
  const { justDropped, trendingNow, mensFashion, under15k } = useMemo(
    () => getDeduplicatedHomepageProducts(ALL_PRODUCTS),
    []
  );

  // Sync state from current URL pathname
  const syncRouteFromUrl = () => {
    const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';

    if (rawPath === '/shop') {
      setActivePage('shop');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Shop All Pieces';
    } else if (rawPath === '/men') {
      setActivePage('men');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Men’s Collection';
    } else if (rawPath === '/women') {
      setActivePage('women');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Women’s Collection';
    } else if (rawPath === '/new' || rawPath === '/new-in' || rawPath === '/new-arrivals') {
      setActivePage('new');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — New Arrivals';
    } else if (rawPath === '/accessories') {
      setActivePage('accessories');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Accessories';
    } else if (rawPath === '/collections') {
      setActivePage('collections');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Collections Archive';
    } else if (rawPath === '/account') {
      setActivePage('account');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — My Account';
    } else if (rawPath.startsWith('/product/')) {
      const slug = rawPath.replace('/product/', '');
      const product = ALL_PRODUCTS.find(
        (p) =>
          p.slug === slug ||
          p.id.toLowerCase() === slug ||
          p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug
      );
      if (product) {
        setCurrentPdpProduct(product);
        setActivePage('product');
        document.title = `${product.name} — PIERCYN Lagos`;
      } else {
        setCurrentPdpProduct(null);
        setActivePage('product');
        document.title = 'Piece Not Found — PIERCYN';
      }
    } else {
      setActivePage('home');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Look Good. Spend Less.';
    }
  };

  useEffect(() => {
    syncRouteFromUrl();

    const handlePopState = () => {
      syncRouteFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateSection = (sectionId: string) => {
    const scroll = () => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setTimeout(scroll, 120);
    }
  };

  const handleSelectPage = (page: ActivePageView) => {
    setActivePage(page);
    setQuickViewProduct(null);
    setCurrentPdpProduct(null);

    const pathMap: Record<ActivePageView, string> = {
      home: '/',
      shop: '/shop',
      men: '/men',
      women: '/women',
      new: '/new-in',
      accessories: '/accessories',
      collections: '/collections',
      lookbook: '/lookbook',
      about: '/about',
      account: '/account',
      product: '/shop',
    };

    const targetUrl = pathMap[page] || '/';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ page }, '', targetUrl);
    }

    const titleMap: Record<ActivePageView, string> = {
      home: 'PIERCYN — Look Good. Spend Less.',
      shop: 'PIERCYN — Shop All Pieces',
      men: 'PIERCYN — Men’s Collection',
      women: 'PIERCYN — Women’s Collection',
      new: 'PIERCYN — New Arrivals',
      accessories: 'PIERCYN — Accessories',
      collections: 'PIERCYN — Collections Archive',
      lookbook: 'PIERCYN — Lookbook',
      about: 'PIERCYN — About Our Lagos Atelier',
      account: 'PIERCYN — My Account',
      product: 'PIERCYN',
    };

    document.title = titleMap[page] || 'PIERCYN';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreHero = (category?: string) => {
    if (category === 'shop') {
      handleSelectPage('shop');
    } else if (category === 'new') {
      handleSelectPage('new');
    } else if (category === 'men') {
      handleSelectPage('men');
    } else if (category === 'women') {
      handleSelectPage('women');
    } else if (category === 'accessories') {
      handleSelectPage('accessories');
    } else {
      setSelectedCategoryFilter('all');
      handleSelectPage('shop');
    }
  };

  const handleViewProduct = (product: Product) => {
    setCurrentPdpProduct(product);
    setActivePage('product');
    setQuickViewProduct(null);

    const slug = product.slug || product.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetUrl = `/product/${slug}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ productId: product.id }, '', targetUrl);
    }
    document.title = `${product.name} — PIERCYN Lagos`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryFilter = (cat: string) => {
    setSelectedCategoryFilter(cat);
  };

  const handleSelectLook = (look: LookbookLook) => {
    setActiveLook(look);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F2F0EB] font-sans selection:bg-[#F2F0EB] selection:text-[#0A0A0A] relative">

      {/* 1. Simple Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Primary Header Navigation */}
      <Navbar 
        onNavigateSection={handleNavigateSection}
        activePage={activePage}
        onSelectPage={handleSelectPage}
      />

      {/* Main View Router */}
      {activePage === 'product' ? (
        <ProductDetailsPage
          product={currentPdpProduct}
          onSelectPage={handleSelectPage}
          onViewProduct={handleViewProduct}
        />
      ) : activePage === 'account' ? (
        <AccountDashboard
          onSelectPage={handleSelectPage}
          onViewProduct={handleViewProduct}
        />
      ) : activePage === 'shop' ? (
        <ShopPage
          products={ALL_PRODUCTS}
          onViewProduct={handleViewProduct}
          initialCategory={selectedCategoryFilter}
        />
      ) : activePage === 'men' ? (
        <MenCollectionPage onNavigateSection={handleNavigateSection} />
      ) : activePage === 'women' ? (
        <WomenCollectionPage onNavigateSection={handleNavigateSection} />
      ) : activePage === 'new' ? (
        <NewArrivalsPage onSelectPage={handleSelectPage} />
      ) : activePage === 'accessories' ? (
        <AccessoriesPage onSelectPage={handleSelectPage} />
      ) : activePage === 'collections' ? (
        <CollectionsPage onNavigateSection={handleNavigateSection} onSelectPage={handleSelectPage} />
      ) : (
        <>
          {/* 3. Hero Campaign Section */}
          <HeroSection onExplore={handleExploreHero} />

          {/* 4. Quick Category Navigation Bar */}
          <QuickCategoryNav 
            onSelectPage={handleSelectPage}
            onSelectCategoryFilter={handleSelectCategoryFilter}
          />

          {/* 5. Just Dropped (4-col Desktop / 2-col Mobile Grid) */}
          <JustDroppedSection 
            products={justDropped}
            onViewProduct={handleViewProduct}
            onSelectPage={handleSelectPage}
          />

          {/* 6. Shop by Category (Visual Discovery Tiles) */}
          <ShopByCategorySection 
            onSelectPage={handleSelectPage}
            onSelectCategoryFilter={handleSelectCategoryFilter}
          />

          {/* 7. Trending Now (Curated Standout Pieces) */}
          <TrendingNowSection 
            products={trendingNow}
            onViewProduct={handleViewProduct}
            onSelectPage={handleSelectPage}
          />

          {/* 8. Curated Styling: Build the Look */}
          <BuildTheLookSection onViewProduct={handleViewProduct} />

          {/* 9. Affordable Discovery: Good Looks Under ₦15K */}
          <AffordableDiscoverySection 
            products={under15k}
            onViewProduct={handleViewProduct}
            onSelectPage={handleSelectPage}
          />

          {/* 10. Featured Campaign / The Piercyn Edit */}
          <ThePiercynEditSection 
            onSelectPage={handleSelectPage}
          />

          {/* 11. Men's Fashion Discovery */}
          <MensFashionSection 
            products={mensFashion}
            onViewProduct={handleViewProduct}
            onSelectPage={handleSelectPage}
          />

          {/* 12. Women's Fashion Discovery (Optional) */}
          {ENABLE_WOMENSWEAR && (
            <WomensFashionSection 
              onViewProduct={handleViewProduct}
              onSelectPage={handleSelectPage}
            />
          )}

          {/* 13. Accessories Teaser (Coming Soon) */}
          <AccessoriesTeaserSection 
            onSelectPage={handleSelectPage}
          />

          {/* 14. Trust & Reassurance Pillars */}
          <TrustReassuranceSection />

          {/* 15. Interactive Lookbook Archive */}
          <LookbookSection onSelectLook={handleSelectLook} />

          {/* 16. Customer Care & WhatsApp Break */}
          <WhatsAppCTASection />

          {/* 17. Newsletter */}
          <NewsletterSection />
        </>
      )}

      {/* Global Luxury Footer */}
      <Footer onNavigateSection={handleNavigateSection} onSelectPage={handleSelectPage} />

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav activePage={activePage} onSelectPage={handleSelectPage} />

      {/* Floating WhatsApp Concierge Button */}
      <WhatsAppButton />

      {/* Interactive Drawers & Modals */}
      <CartDrawer />
      <WishlistDrawer />
      <QuickViewModal />
      <LookbookModal />
      <SearchModal />
      <StoryModal />
      <SizeGuideModal />
      <CraftsmanshipModal />
      <ConciergeModal />
      <AuthModal />
      <CheckoutModal />
      <OrderConfirmationModal />
      <AdminDrawer />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <MainLayout />
    </ShopProvider>
  );
}
