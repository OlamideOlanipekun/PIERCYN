import React, { useState, useEffect, useMemo } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { getDeduplicatedHomepageProducts } from './utils/homepageProducts';
import { ENABLE_WOMENSWEAR } from './config/homepage';
import { Product, LookbookLook, ActivePageView } from './types';
import { Navbar } from './components/Navbar';
import { AnnouncementBar } from './components/AnnouncementBar';
import { AffiliateAnnouncementModal } from './components/AffiliateAnnouncementModal';
import { MenCollectionPage } from './components/men/MenCollectionPage';
import { HeroSection } from './components/HeroSection';
import { JustDroppedSection } from './components/JustDroppedSection';
import { MensFashionSection } from './components/MensFashionSection';
import { TrustReassuranceSection } from './components/TrustReassuranceSection';
import { ProductDetailsPage } from './components/pdp/ProductDetailsPage';
import { NewArrivalsPage } from './components/NewArrivalsPage';
import { ShopPage } from './components/ShopPage';
import { AboutPage } from './components/AboutPage';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { QuickViewModal } from './components/QuickViewModal';
import { SearchModal } from './components/SearchModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { WhatsAppButton } from './components/WhatsAppButton';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CollectionPage } from './components/CollectionPage';
import { OrderPage } from './components/OrderPage';
import { NotFoundPage } from './components/NotFoundPage';
import { AdminDrawer } from './components/AdminDrawer';
import { Toast } from './components/Toast';
import { AdminApp } from './admin/AdminApp';
import { AffiliateApp } from './affiliate/AffiliateApp';
import { initAffiliateTracking } from './utils/affiliateTracking';

// V1: Simple "Why PIERCYN" brand section for homepage
const WhyPiercynSection: React.FC = () => (
  <section className="w-full bg-[#F2F0EB] text-[#141414] py-14 sm:py-20 border-t border-[#DAD8D1]">
    <div className="piercyn-container max-w-[680px]">
      <span className="section-eyebrow block mb-4">WHY PIERCYN</span>
      <p className="font-editorial italic text-[clamp(28px,4.5vw,48px)] leading-[1.1] tracking-[-0.02em] text-[#141414] mb-5">
        Fashion that makes you stand out — without the price tag that holds you back.
      </p>
      <p className="text-[14px] sm:text-[15px] leading-[1.7] text-[#4A4844] font-sans">
        PIERCYN makes modern, elevated clothing for a generation that values style and knows the value of money. Every piece is designed to look premium, made to last, and priced to make sense. From Lagos. For Nigeria. For the world.
      </p>
    </div>
  </section>
);

const MainLayout: React.FC = () => {
  const { products, getProductBySlug, setQuickViewProduct, setActiveLook, isLoadingProducts, catalogError, refreshProducts } = useShop();
  const [activePage, setActivePage] = useState<ActivePageView>('home');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [currentPdpProduct, setCurrentPdpProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [routeParam, setRouteParam] = useState<string>('');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isAffiliateView, setIsAffiliateView] = useState<boolean>(false);
  const [isAffiliateAnnouncementOpen, setIsAffiliateAnnouncementOpen] = useState(false);

  // Initialize affiliate click tracking once on mount
  useEffect(() => {
    initAffiliateTracking();
  }, []);

  // Show the affiliate invitation once per full storefront entry, not on every SPA route change.
  useEffect(() => {
    const initialPath = window.location.pathname.toLowerCase();
    if (initialPath.startsWith('/admin') || initialPath.startsWith('/affiliate')) return;

    const timeoutId = window.setTimeout(() => {
      const currentPath = window.location.pathname.toLowerCase();
      if (!currentPath.startsWith('/admin') && !currentPath.startsWith('/affiliate')) {
        setIsAffiliateAnnouncementOpen(true);
      }
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  // Compute deduplicated homepage products from real backend catalog
  const { justDropped, mensFashion } = useMemo(
    () => getDeduplicatedHomepageProducts(products),
    [products]
  );

  // Sync state from current URL pathname
  const syncRouteFromUrl = () => {
    const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';

    if (rawPath.startsWith('/admin')) {
      setIsAdminView(true);
      setIsAffiliateView(false);
      document.title = 'PIERCYN — Operations Control Room';
      return;
    }

    if (rawPath.startsWith('/affiliate')) {
      setIsAffiliateView(true);
      setIsAdminView(false);
      document.title = 'PIERCYN Creator & Affiliate Portal';
      return;
    }

    setIsAdminView(false);
    setIsAffiliateView(false);

    if (rawPath === '/shop' || rawPath === '/collections') {
      setActivePage('shop');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Shop All';
    } else if (rawPath === '/men') {
      setActivePage('men');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Men';
    } else if (rawPath === '/new' || rawPath === '/new-in' || rawPath === '/new-arrivals') {
      setActivePage('new');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — New Arrivals';
    } else if (rawPath === '/about') {
      setActivePage('about');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — About';
    } else if (rawPath.startsWith('/products/') || rawPath.startsWith('/product/')) {
      const slug = rawPath.replace(/^\/products?\//, '');
      if (rawPath.startsWith('/product/')) window.history.replaceState({}, '', `/products/${slug}${window.location.search}`);
      setActivePage('product');
      
      const foundInCache = products.find(
        (p) =>
          p.slug === slug ||
          (p.id && p.id.toLowerCase() === slug) ||
          (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug)
      );

      if (foundInCache) {
        setCurrentPdpProduct(foundInCache);
        setIsLoadingProduct(false);
        document.title = `${foundInCache.name} — PIERCYN`;
      } else {
        setIsLoadingProduct(true);
        getProductBySlug(slug).then((backendProduct) => {
          if (backendProduct) {
            setCurrentPdpProduct(backendProduct);
            document.title = `${backendProduct.name} — PIERCYN`;
          } else {
            setCurrentPdpProduct(null);
            document.title = 'Piece Not Found — PIERCYN';
          }
          setIsLoadingProduct(false);
        }).catch(() => {
          setCurrentPdpProduct(null);
          setIsLoadingProduct(false);
          document.title = 'Piece Not Found — PIERCYN';
        });
      }
    } else if (rawPath.startsWith('/collections/')) {
      setRouteParam(rawPath.replace('/collections/', ''));
      setActivePage('collection');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Collection';
    } else if (rawPath.startsWith('/order/success/')) {
      setRouteParam(rawPath.replace('/order/success/', ''));
      setActivePage('orderSuccess');
    } else if (rawPath.startsWith('/orders/')) {
      setRouteParam(rawPath.replace('/orders/', ''));
      setActivePage('orderTracking');
    } else if (rawPath === '/') {
      setActivePage('home');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Look Good. Spend Less.';
    } else {
      setActivePage('notFound');
      setCurrentPdpProduct(null);
      document.title = 'Page Not Found — PIERCYN';
    }
  };

  useEffect(() => {
    syncRouteFromUrl();

    const handlePopState = () => {
      syncRouteFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      setTimeout(() => {
        const el2 = document.getElementById(sectionId);
        if (el2) el2.scrollIntoView({ behavior: 'smooth' });
      }, 120);
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
      collection: '/collections',
      orderSuccess: '/',
      orderTracking: '/',
      notFound: '/',
      affiliate: '/affiliate',
    };

    const targetUrl = pathMap[page] || '/';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ page }, '', targetUrl);
    }

    const titleMap: Record<ActivePageView, string> = {
      home: 'PIERCYN — Look Good. Spend Less.',
      shop: 'PIERCYN — Shop All',
      men: 'PIERCYN — Men',
      women: 'PIERCYN — Women',
      new: 'PIERCYN — New Arrivals',
      accessories: 'PIERCYN — Accessories',
      collections: 'PIERCYN — Collections',
      lookbook: 'PIERCYN — Lookbook',
      about: 'PIERCYN — About',
      account: 'PIERCYN — Account',
      product: 'PIERCYN',
      collection: 'PIERCYN — Collection',
      orderSuccess: 'Order Confirmed — PIERCYN',
      orderTracking: 'Order Tracking — PIERCYN',
      notFound: 'Page Not Found — PIERCYN',
      affiliate: 'PIERCYN Creator & Affiliate Portal',
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
    } else {
      handleSelectPage('shop');
    }
  };

  const handleViewProduct = (product: Product) => {
    setCurrentPdpProduct(product);
    setActivePage('product');
    setQuickViewProduct(null);

    const slug = product.slug || product.id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetUrl = `/products/${slug}`;
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ productId: product.id }, '', targetUrl);
    }
    document.title = `${product.name} — PIERCYN`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryFilter = (cat: string) => {
    setSelectedCategoryFilter(cat);
  };

  if (isAdminView) {
    return (
      <AdminApp
        onBackToStore={() => {
          setIsAdminView(false);
          window.history.pushState({}, '', '/');
          document.title = 'PIERCYN — Look Good. Spend Less.';
        }}
      />
    );
  }

  if (isAffiliateView) {
    return (
      <AffiliateApp
        onBackToShop={() => {
          setIsAffiliateView(false);
          window.history.pushState({}, '', '/');
          document.title = 'PIERCYN — Look Good. Spend Less.';
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F2F0EB] font-sans selection:bg-[#F2F0EB] selection:text-[#0A0A0A] relative">

      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Primary Navigation */}
      <Navbar 
        onNavigateSection={handleNavigateSection}
        activePage={activePage}
        onSelectPage={handleSelectPage}
      />

      {/* Main View Router */}
      {activePage === 'product' ? (
        isLoadingProduct ? <main className="min-h-screen bg-[#F2F0EB] pt-32 text-center text-sm text-[#6E6B65]">Loading piece…</main> : <ProductDetailsPage
          product={currentPdpProduct}
          onSelectPage={handleSelectPage}
          onViewProduct={handleViewProduct}
        />
      ) : activePage === 'collection' ? (
        <CollectionPage slug={routeParam} products={products} loading={isLoadingProducts} error={catalogError} onRetry={refreshProducts} onViewProduct={handleViewProduct} onBackToShop={() => handleSelectPage('shop')} onNotFound={() => setActivePage('notFound')} />
      ) : activePage === 'orderSuccess' ? (
        <OrderPage orderId={routeParam} mode="success" onShop={() => handleSelectPage('shop')} />
      ) : activePage === 'orderTracking' ? (
        <OrderPage orderId={routeParam} mode="tracking" onShop={() => handleSelectPage('shop')} />
      ) : activePage === 'notFound' ? (
        <NotFoundPage onShop={() => handleSelectPage('shop')} />
      ) : activePage === 'shop' ? (
        <ShopPage
          products={products}
          onViewProduct={handleViewProduct}
          initialCategory={selectedCategoryFilter}
        />
      ) : activePage === 'men' ? (
        <MenCollectionPage onNavigateSection={handleNavigateSection} />
      ) : activePage === 'new' ? (
        <NewArrivalsPage onSelectPage={handleSelectPage} />
      ) : activePage === 'about' ? (
        <AboutPage onSelectPage={handleSelectPage} />
      ) : (
        <>
          {/* HOMEPAGE — V1: Hero → New Arrivals → Why PIERCYN → Shop Men → Trust */}

          {/* Hero */}
          <HeroSection onExplore={handleExploreHero} />

          {/* New Arrivals Grid */}
          <JustDroppedSection 
            products={justDropped}
            onViewProduct={handleViewProduct}
            onSelectPage={handleSelectPage}
          />

          {/* Why PIERCYN brand statement */}
          <WhyPiercynSection />

          {/* Men's Fashion Discovery */}
          {mensFashion.length > 0 && (
            <MensFashionSection 
              products={mensFashion}
              onViewProduct={handleViewProduct}
              onSelectPage={handleSelectPage}
            />
          )}

          {/* Trust & Reassurance */}
          <TrustReassuranceSection />
        </>
      )}

      {/* Global Footer */}
      <Footer onNavigateSection={handleNavigateSection} onSelectPage={handleSelectPage} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activePage={activePage} onSelectPage={handleSelectPage} />

      {/* Floating WhatsApp */}
      <WhatsAppButton />

      {/* Modals & Drawers */}
      <CartDrawer />
      <QuickViewModal />
      <SearchModal onViewProduct={handleViewProduct} />
      <SizeGuideModal />
      <CheckoutModal />
      <OrderConfirmationModal />
      <AdminDrawer />
      <Toast />
      {isAffiliateAnnouncementOpen && (
        <AffiliateAnnouncementModal
          onClose={() => setIsAffiliateAnnouncementOpen(false)}
          onJoin={() => {
            setIsAffiliateAnnouncementOpen(false);
            window.location.assign('/affiliate');
          }}
        />
      )}
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
