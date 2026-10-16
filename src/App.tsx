import React, { useState, useEffect, useMemo } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { getDeduplicatedHomepageProducts } from './utils/homepageProducts';
import { ENABLE_WOMENSWEAR } from './config/homepage';
import { Product, LookbookLook, ActivePageView } from './types';
import { Navbar } from './components/Navbar';
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
import { CategoryPage } from './components/CategoryPage';
import { OrderPage } from './components/OrderPage';
import { NotFoundPage } from './components/NotFoundPage';
import { AdminDrawer } from './components/AdminDrawer';
import { Toast } from './components/Toast';
import { initAffiliateTracking } from './utils/affiliateTracking';
import { catalogService } from './services/catalogService';
import { StorefrontInfoPage, HomepageAvailabilitySections, StorefrontPageKey } from './components/StorefrontInfoPage';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { WomenCollectionPage } from './components/women/WomenCollectionPage';
import { AccessoriesPage } from './components/AccessoriesPage';
import { AccountDashboard } from './components/AccountDashboard';
import { CollectionsGrid } from './components/CollectionsGrid';
import { LookbookSection } from './components/LookbookSection';
import { LookbookModal } from './components/LookbookModal';
import { ScrollReveal } from './components/ScrollReveal';

// Lazy-loaded portals to preserve lightweight initial storefront bundle
const AdminApp = React.lazy(() => import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })));
const AffiliateApp = React.lazy(() => import('./affiliate/AffiliateApp').then((m) => ({ default: m.AffiliateApp })));


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
  const { products, getProductBySlug, setQuickViewProduct, setActiveLook, isLoadingProducts, catalogError, refreshProducts, setIsCartOpen, setIsCheckoutOpen } = useShop();
  const [activePage, setActivePage] = useState<ActivePageView>('home');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [currentPdpProduct, setCurrentPdpProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [routeParam, setRouteParam] = useState<string>('');
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isAffiliateView, setIsAffiliateView] = useState<boolean>(false);
  const [isAffiliateAnnouncementOpen, setIsAffiliateAnnouncementOpen] = useState(false);
  const [storefrontPage, setStorefrontPage] = useState<StorefrontPageKey | null>(null);

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

    const storefrontRoutes: Record<string, StorefrontPageKey> = {
      '/shipping': 'shipping',
      '/returns': 'returns',
      '/contact': 'contact',
      '/privacy': 'privacy',
      '/terms': 'terms',
      '/search': 'search',
      '/size-guide': 'size-guide',
      '/faq': 'faq',
      '/track-order': 'track-order',
      '/available-to-order': 'available-to-order',
          };
    const storefrontRoute = storefrontRoutes[rawPath];
    if (storefrontRoute) {
      setStorefrontPage(storefrontRoute);
      setCurrentPdpProduct(null);
      document.title = `${storefrontRoute.replaceAll('-', ' ')} — PIERCYN`;
      return;
    }
    setStorefrontPage(null);

    if (rawPath === '/cart') {
      setActivePage('cart');
      setCurrentPdpProduct(null);
      document.title = 'Cart — PIERCYN';
    } else if (rawPath === '/checkout') {
      setActivePage('checkout');
      setCurrentPdpProduct(null);
      document.title = 'Checkout — PIERCYN';
    } else if (rawPath === '/order-confirmation' || rawPath.startsWith('/order/success/')) {
      const orderId = new URLSearchParams(window.location.search).get('orderId') || rawPath.replace('/order/success/', '');
      setRouteParam(orderId);
      setActivePage('orderSuccess');
      setCurrentPdpProduct(null);
      document.title = 'Order Confirmed — PIERCYN';
    } else if (rawPath === '/shop') {
      setActivePage('shop');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Shop All';
    } else if (rawPath === '/men') {
      setActivePage('men');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Men';
    } else if (rawPath === '/women') {
      setActivePage('women');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Women';
    } else if (rawPath === '/new' || rawPath === '/new-in' || rawPath === '/new-arrivals') {
      setActivePage('new');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — New Arrivals';
    } else if (rawPath === '/accessories') {
      setActivePage('accessories');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Accessories';
    } else if (rawPath === '/account') {
      setActivePage('account');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Account';
    } else if (rawPath === '/lookbook') {
      setActivePage('lookbook');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Lookbook';
    } else if (rawPath === '/collections') {
      setActivePage('collections');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Collections';
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
    } else if (rawPath.startsWith('/categories/') || rawPath.startsWith('/category/')) {
      const catSlug = rawPath.replace(/^\/categor(?:ies|y)\//, '');
      setRouteParam(catSlug);
      setActivePage('category');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN — Category';
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
      category: '/shop',
      orderSuccess: '/order-confirmation',
      orderTracking: '/track-order',
      notFound: '/',
      affiliate: '/affiliate',
      cart: '/cart',
      checkout: '/checkout',
      orderConfirmation: '/order-confirmation',
      shipping: '/shipping',
      returns: '/returns',
      contact: '/contact',
      privacy: '/privacy',
      terms: '/terms',
      search: '/search',
      sizeGuide: '/size-guide',
      faq: '/faq',
      trackOrder: '/track-order',
    };

    const targetUrl = pathMap[page] || '/';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ page }, '', targetUrl);
    }

    syncRouteFromUrl();

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
      category: 'PIERCYN — Category',
      orderSuccess: 'Order Confirmed — PIERCYN',
      orderTracking: 'Order Tracking — PIERCYN',
      notFound: 'Page Not Found — PIERCYN',
      affiliate: 'PIERCYN Creator & Affiliate Portal',
      cart: 'Cart — PIERCYN',
      checkout: 'Checkout — PIERCYN',
      orderConfirmation: 'Order Confirmed — PIERCYN',
      shipping: 'Shipping & Delivery — PIERCYN',
      returns: 'Returns & Exchanges — PIERCYN',
      contact: 'Contact — PIERCYN',
      privacy: 'Privacy Policy — PIERCYN',
      terms: 'Terms & Conditions — PIERCYN',
      search: 'Search — PIERCYN',
      sizeGuide: 'Size Guide — PIERCYN',
      faq: 'FAQ — PIERCYN',
      trackOrder: 'Track Order — PIERCYN',
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
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#0A0A0A] text-[#F2F0EB] flex items-center justify-center font-mono text-xs tracking-widest uppercase">
            Loading Operations Room...
          </div>
        }
      >
        <AdminApp
          onBackToStore={() => {
            setIsAdminView(false);
            window.history.pushState({}, '', '/');
            document.title = 'PIERCYN — Look Good. Spend Less.';
          }}
        />
      </React.Suspense>
    );
  }

  if (isAffiliateView) {
    return (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#0A0A0A] text-[#F2F0EB] flex items-center justify-center font-mono text-xs tracking-widest uppercase">
            Loading Creator Portal...
          </div>
        }
      >
        <AffiliateApp
          onBackToShop={() => {
            setIsAffiliateView(false);
            window.history.pushState({}, '', '/');
            document.title = 'PIERCYN — Look Good. Spend Less.';
          }}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F2F0EB] font-sans selection:bg-[#F2F0EB] selection:text-[#0A0A0A] relative">

      {/* 2. Primary Navigation */}
      <Navbar 
        onNavigateSection={handleNavigateSection}
        activePage={activePage}
        onSelectPage={handleSelectPage}
      />

      {/* Main View Router */}
      {storefrontPage ? (
        <StorefrontInfoPage
          page={storefrontPage}
          products={products}
          onViewProduct={handleViewProduct}
          onShop={() => handleSelectPage('shop')}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          isLoadingProducts={isLoadingProducts}
          catalogError={catalogError}
          onRetryProducts={refreshProducts}
        />
      ) : activePage === 'product' ? (
        isLoadingProduct ? <main className="min-h-screen bg-[#F2F0EB] pt-32 text-center text-sm text-[#6E6B65]">Loading piece…</main> : <ProductDetailsPage
          product={currentPdpProduct}
          onSelectPage={handleSelectPage}
          onViewProduct={handleViewProduct}
          onReviewSubmitted={async () => {
            await refreshProducts();
            const updatedProduct = await catalogService.getProductBySlug(
              currentPdpProduct?.slug || currentPdpProduct?.id || ''
            );
            if (updatedProduct) setCurrentPdpProduct(updatedProduct);
          }}
        />
      ) : activePage === 'collection' ? (
        <CollectionPage slug={routeParam} products={products} loading={isLoadingProducts} error={catalogError} onRetry={refreshProducts} onViewProduct={handleViewProduct} onBackToShop={() => handleSelectPage('shop')} onNotFound={() => setActivePage('notFound')} />
      ) : activePage === 'category' ? (
        <CategoryPage
          slug={routeParam}
          onViewProduct={handleViewProduct}
          onBackToShop={() => handleSelectPage('shop')}
          onNotFound={() => setActivePage('notFound')}
        />
      ) : activePage === 'orderSuccess' ? (
        <OrderPage orderId={routeParam} mode="success" onShop={() => handleSelectPage('shop')} />
      ) : activePage === 'orderTracking' ? (
        <OrderPage orderId={routeParam} mode="tracking" onShop={() => handleSelectPage('shop')} />
      ) : activePage === 'notFound' ? (
        <NotFoundPage onShop={() => handleSelectPage('shop')} />
      ) : activePage === 'cart' ? (
        <CartPage onSelectPage={handleSelectPage} onViewProduct={handleViewProduct} />
      ) : activePage === 'checkout' ? (
        <CheckoutPage onSelectPage={handleSelectPage} onViewProduct={handleViewProduct} />
      ) : activePage === 'shop' ? (
        <ShopPage
          products={products}
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
      ) : activePage === 'account' ? (
        <AccountDashboard onSelectPage={handleSelectPage} onViewProduct={handleViewProduct} />
      ) : activePage === 'collections' ? (
        <CollectionsGrid onSelectCollection={(colId) => {
          window.history.pushState({}, '', `/collections/${colId}`);
          syncRouteFromUrl();
        }} />
      ) : activePage === 'lookbook' ? (
        <main className="min-h-screen bg-[#F2F0EB] pt-20 sm:pt-24 pb-16 text-[#141414]">
          <LookbookSection onSelectLook={(look) => setActiveLook(look)} />
        </main>
      ) : activePage === 'about' ? (
        <AboutPage onSelectPage={handleSelectPage} />
      ) : (
        <>
          {/* HOMEPAGE — V1: Hero → New Arrivals → Why PIERCYN → Shop Men → Trust */}

          {/* Hero */}
          <HeroSection onExplore={handleExploreHero} />

          {/* New Arrivals Grid */}
          <ScrollReveal>
            <JustDroppedSection 
              products={justDropped}
              onViewProduct={handleViewProduct}
              onSelectPage={handleSelectPage}
            />
          </ScrollReveal>

          {/* Real inventory only; supplier-held designs are never represented as physical stock. */}
          <ScrollReveal delay={0.04}>
            <HomepageAvailabilitySections
              products={products}
              onViewProduct={handleViewProduct}
              onBrowseShop={() => handleSelectPage('shop')}
              isLoadingProducts={isLoadingProducts}
              catalogError={catalogError}
            />
          </ScrollReveal>

          {/* Why PIERCYN brand statement */}
          <ScrollReveal>
            <WhyPiercynSection />
          </ScrollReveal>

          {/* Men's Fashion Discovery */}
          {mensFashion.length > 0 && (
            <ScrollReveal>
              <MensFashionSection 
                products={mensFashion}
                onViewProduct={handleViewProduct}
                onSelectPage={handleSelectPage}
              />
            </ScrollReveal>
          )}

          {/* Trust & Reassurance */}
          <ScrollReveal>
            <TrustReassuranceSection />
          </ScrollReveal>
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
      <LookbookModal />
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
