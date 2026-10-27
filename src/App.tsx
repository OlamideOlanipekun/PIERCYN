import React, { useState, useEffect, useMemo } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { getDeduplicatedHomepageProducts } from './utils/homepageProducts';

import { Product, LookbookLook, ActivePageView } from './types';
import { Navbar } from './components/Navbar';
import { MenCollectionPage } from './components/men/MenCollectionPage';
import { HeroSection } from './components/HeroSection';
import { JustDroppedSection } from './components/JustDroppedSection';
import { TrustReassuranceSection } from './components/TrustReassuranceSection';
import { ProductDetailsPage } from './components/pdp/ProductDetailsPage';
import { NewArrivalsPage } from './components/NewArrivalsPage';
import { ShopPage } from './components/ShopPage';
import { HomepageCategoryPreviews } from './components/HomepageCategoryPreviews';
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
import { StorefrontInfoPage, StorefrontPageKey } from './components/StorefrontInfoPage';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { WomenCollectionPage } from './components/women/WomenCollectionPage';
import { AccessoriesPage } from './components/AccessoriesPage';
import { AccountDashboard } from './components/AccountDashboard';
import { CollectionsGrid } from './components/CollectionsGrid';
import { LookbookSection } from './components/LookbookSection';
import { LookbookModal } from './components/LookbookModal';
import { ScrollReveal } from './components/ScrollReveal';
import { formatProductSeoTitle, PUBLIC_PAGE_TITLES, syncClientSeo } from './utils/seo';

// Lazy-loaded portals to preserve lightweight initial storefront bundle
const AdminApp = React.lazy(() => import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })));

const STOREFRONT_PAGE_TITLES: Record<StorefrontPageKey, string> = {
  shipping: PUBLIC_PAGE_TITLES.shipping,
  returns: PUBLIC_PAGE_TITLES.returns,
  contact: PUBLIC_PAGE_TITLES.contact,
  privacy: PUBLIC_PAGE_TITLES.privacy,
  terms: PUBLIC_PAGE_TITLES.terms,
  search: 'Search | PIERCYN',
  'size-guide': PUBLIC_PAGE_TITLES.sizeGuide,
  faq: PUBLIC_PAGE_TITLES.faq,
  'track-order': 'Track Order | PIERCYN',
  'available-to-order': PUBLIC_PAGE_TITLES.availableToOrder,
  cart: 'Cart | PIERCYN',
  checkout: 'Checkout | PIERCYN',
  'order-confirmation': 'Order Confirmed | PIERCYN',
};


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
  const [storefrontPage, setStorefrontPage] = useState<StorefrontPageKey | null>(null);

  // Initialize affiliate click tracking (checks pause flag)
  useEffect(() => {
    initAffiliateTracking();
  }, []);

  // Compute deduplicated homepage products from real backend catalog
  const { justDropped } = useMemo(
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
      document.title = STOREFRONT_PAGE_TITLES[storefrontRoute];
      return;
    }
    setStorefrontPage(null);

    if (rawPath === '/cart') {
      setActivePage('cart');
      setCurrentPdpProduct(null);
      document.title = STOREFRONT_PAGE_TITLES.cart;
    } else if (rawPath === '/checkout') {
      setActivePage('checkout');
      setCurrentPdpProduct(null);
      document.title = STOREFRONT_PAGE_TITLES.checkout;
    } else if (rawPath === '/order-confirmation' || rawPath.startsWith('/order/success/')) {
      const orderId = new URLSearchParams(window.location.search).get('orderId') || rawPath.replace('/order/success/', '');
      setRouteParam(orderId);
      setActivePage('orderSuccess');
      setCurrentPdpProduct(null);
      document.title = STOREFRONT_PAGE_TITLES['order-confirmation'];
    } else if (rawPath === '/shop') {
      setActivePage('shop');
      setCurrentPdpProduct(null);
      // Honour ?category= query param set by VIEW ALL links from the homepage
      const categoryParam = new URLSearchParams(window.location.search).get('category');
      if (categoryParam) {
        setSelectedCategoryFilter(categoryParam);
      }
      document.title = PUBLIC_PAGE_TITLES.shop;
    } else if (rawPath === '/men') {
      setActivePage('men');
      setCurrentPdpProduct(null);
      document.title = PUBLIC_PAGE_TITLES.men;
    } else if (rawPath === '/women') {
      setActivePage('women');
      setCurrentPdpProduct(null);
      document.title = PUBLIC_PAGE_TITLES.women;
    } else if (rawPath === '/new' || rawPath === '/new-in' || rawPath === '/new-arrivals') {
      setActivePage('new');
      setCurrentPdpProduct(null);
      document.title = PUBLIC_PAGE_TITLES.new;
    } else if (rawPath === '/accessories') {
      setActivePage('accessories');
      setCurrentPdpProduct(null);
      document.title = PUBLIC_PAGE_TITLES.accessories;
    } else if (rawPath === '/account') {
      setActivePage('account');
      setCurrentPdpProduct(null);
      document.title = 'Account | PIERCYN';
    } else if (rawPath === '/lookbook') {
      setActivePage('lookbook');
      setCurrentPdpProduct(null);
      document.title = PUBLIC_PAGE_TITLES.lookbook;
    } else if (rawPath === '/collections') {
      setActivePage('collections');
      setCurrentPdpProduct(null);
      document.title = PUBLIC_PAGE_TITLES.collections;
    } else if (rawPath === '/about') {
      setActivePage('about');
      setCurrentPdpProduct(null);
      document.title = PUBLIC_PAGE_TITLES.about;
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
        document.title = formatProductSeoTitle(foundInCache.name);
      } else {
        setIsLoadingProduct(true);
        getProductBySlug(slug).then((backendProduct) => {
          if (backendProduct) {
            setCurrentPdpProduct(backendProduct);
            document.title = formatProductSeoTitle(backendProduct.name);
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
      document.title = 'PIERCYN Collection';
    } else if (rawPath.startsWith('/categories/') || rawPath.startsWith('/category/')) {
      const catSlug = rawPath.replace(/^\/categor(?:ies|y)\//, '');
      setRouteParam(catSlug);
      setActivePage('category');
      setCurrentPdpProduct(null);
      document.title = 'PIERCYN Category';
    } else if (rawPath.startsWith('/order/success/')) {
      setRouteParam(rawPath.replace('/order/success/', ''));
      setActivePage('orderSuccess');
    } else if (rawPath.startsWith('/orders/')) {
      setRouteParam(rawPath.replace('/orders/', ''));
      setActivePage('orderTracking');
    } else if (rawPath === '/') {
      setActivePage('home');
      setCurrentPdpProduct(null);
      document.title = PUBLIC_PAGE_TITLES.home;
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

  useEffect(() => {
    const updateSeo = () => {
      syncClientSeo(window.location.pathname, document.title, currentPdpProduct);
    };
    updateSeo();
    const titleElement = document.querySelector('title');
    const observer = titleElement ? new MutationObserver(updateSeo) : null;
    observer?.observe(titleElement!, { childList: true, subtree: true, characterData: true });
    return () => observer?.disconnect();
  }, [activePage, currentPdpProduct, storefrontPage, routeParam, isAdminView, isAffiliateView]);

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
      home: PUBLIC_PAGE_TITLES.home,
      shop: PUBLIC_PAGE_TITLES.shop,
      men: PUBLIC_PAGE_TITLES.men,
      women: PUBLIC_PAGE_TITLES.women,
      new: PUBLIC_PAGE_TITLES.new,
      accessories: PUBLIC_PAGE_TITLES.accessories,
      collections: PUBLIC_PAGE_TITLES.collections,
      lookbook: PUBLIC_PAGE_TITLES.lookbook,
      about: PUBLIC_PAGE_TITLES.about,
      account: 'Account | PIERCYN',
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
      shipping: PUBLIC_PAGE_TITLES.shipping,
      returns: PUBLIC_PAGE_TITLES.returns,
      contact: PUBLIC_PAGE_TITLES.contact,
      privacy: PUBLIC_PAGE_TITLES.privacy,
      terms: PUBLIC_PAGE_TITLES.terms,
      search: 'Search | PIERCYN',
      sizeGuide: PUBLIC_PAGE_TITLES.sizeGuide,
      faq: PUBLIC_PAGE_TITLES.faq,
      trackOrder: 'Track Order | PIERCYN',
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
    document.title = formatProductSeoTitle(product.name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryFilter = (cat: string) => {
    setSelectedCategoryFilter(cat);
  };

  /**
   * Called by VIEW ALL buttons on the homepage category previews.
   * Navigates to /shop?category=<slug> and passes the filter through.
   */
  const handleViewAllCategory = (categorySlug: string) => {
    setSelectedCategoryFilter(categorySlug);
    const url = `/shop?category=${encodeURIComponent(categorySlug)}`;
    window.history.pushState({ page: 'shop', category: categorySlug }, '', url);
    syncRouteFromUrl();
    document.title = PUBLIC_PAGE_TITLES.shop;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            document.title = PUBLIC_PAGE_TITLES.home;
          }}
        />
      </React.Suspense>
    );
  }

  if (isAffiliateView) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F2F0EB] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full border border-[#2B2B2B] bg-[#141414] p-8 sm:p-10 rounded-sm">
          <span className="font-mono text-[10px] tracking-[0.25em] text-[#C9A96E] uppercase block mb-3">
            Program Notice
          </span>
          <h1 className="font-editorial italic text-2xl sm:text-3xl text-white mb-4">
            Creator & Affiliate Program
          </h1>
          <p className="text-[#888888] text-xs sm:text-sm leading-relaxed mb-8">
            The PIERCYN Creator & Affiliate Program is currently paused for upgrades. Please check back later or follow our social channels for announcements.
          </p>
          <button
            onClick={() => {
              setIsAffiliateView(false);
              window.history.pushState({}, '', '/');
              document.title = PUBLIC_PAGE_TITLES.home;
            }}
            className="w-full py-3 bg-[#F2F0EB] text-[#0A0A0A] text-xs uppercase tracking-widest font-semibold hover:bg-white transition-colors"
          >
            Return to Store
          </button>
        </div>
      </div>
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
          {/* HOMEPAGE — Hero → Dynamic Category Previews → Why PIERCYN → Trust */}

          {/* Hero */}
          <HeroSection onExplore={handleExploreHero} />

          {/* New Arrivals — keeps the editorial "Just Dropped" energy */}
          <ScrollReveal>
            <JustDroppedSection 
              products={justDropped}
              onViewProduct={handleViewProduct}
              onSelectPage={handleSelectPage}
            />
          </ScrollReveal>

          {/* Dynamic category preview rows (one per active category with products) */}
          <HomepageCategoryPreviews
            products={products}
            isLoadingProducts={isLoadingProducts}
            catalogError={catalogError}
            onViewProduct={handleViewProduct}
            onViewAllCategory={handleViewAllCategory}
          />

          {/* Why PIERCYN brand statement */}
          <ScrollReveal>
            <WhyPiercynSection />
          </ScrollReveal>

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
