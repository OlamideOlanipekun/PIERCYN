import React, { useState } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { ALL_PRODUCTS } from './data/allProducts';
import { Product, LookbookLook, ActivePageView } from './types';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { MenCollectionPage } from './components/men/MenCollectionPage';
import { WomenCollectionPage } from './components/women/WomenCollectionPage';
import { CollectionsPage } from './components/collections/CollectionsPage';
import { HeroSection } from './components/HeroSection';
import { NewArrivalsPage } from './components/NewArrivalsPage';
import { NewDropSection } from './components/NewDropSection';
import { ManifestoSection } from './components/ManifestoSection';
import { CollectionsGrid } from './components/CollectionsGrid';
import { ProductCatalogSection } from './components/ProductCatalogSection';
import { EditorialSections } from './components/EditorialSections';
import { ShopPage } from './components/ShopPage';
import { FromLagosSection } from './components/FromLagosSection';
import { LookbookSection } from './components/LookbookSection';
import { ThePieceSection } from './components/ThePieceSection';
import { WornByYouSection } from './components/WornByYouSection';
import { SocialSection } from './components/SocialSection';
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
import { AdminDrawer } from './components/AdminDrawer';
import { Toast } from './components/Toast';

const MainLayout: React.FC = () => {
  const { setQuickViewProduct, setActiveLook } = useShop();
  const [activePage, setActivePage] = useState<ActivePageView>('home');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreHero = (category?: string) => {
    if (category === 'shop') {
      setActivePage('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (category === 'new') {
      setActivePage('new');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (category === 'men') {
      setActivePage('men');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSelectedCategoryFilter('all');
      handleNavigateSection('products-section');
    }
  };

  const handleSelectCollection = (collectionId: string) => {
    if (collectionId === 'everyday' || collectionId === 'essentials') {
      setActivePage('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (collectionId === 'after-dark') setSelectedCategoryFilter('outerwear');
      else if (collectionId === 'the-drop') setSelectedCategoryFilter('all');
      handleNavigateSection('products-section');
    }
  };

  const handleViewProduct = (product: Product) => {
    setQuickViewProduct(product);
  };

  const handleSelectLook = (look: LookbookLook) => {
    setActiveLook(look);
  };

  return (
    <div className="min-h-screen bg-[#F2F0EB] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#F2F0EB] relative">
      {/* Announcement & Top Dispatch Bar */}
      <AnnouncementBar />

      {/* Primary Header Navigation */}
      <Navbar 
        onNavigateSection={handleNavigateSection}
        activePage={activePage}
        onSelectPage={handleSelectPage}
      />

      {/* Main View Router */}
      {activePage === 'shop' ? (
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
      ) : activePage === 'collections' ? (
        <CollectionsPage onNavigateSection={handleNavigateSection} onSelectPage={handleSelectPage} />
      ) : (
        <>
          {/* Main Homepage Flow */}
          <HeroSection onExplore={handleExploreHero} />
          <NewDropSection products={ALL_PRODUCTS} onViewProduct={handleViewProduct} />
          <ManifestoSection />
          <CollectionsGrid onSelectCollection={handleSelectCollection} />
          <EditorialSections
            products={ALL_PRODUCTS}
            onViewProduct={handleViewProduct}
            onSelectCategory={(cat) => {
              setSelectedCategoryFilter(cat);
              setActivePage('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <ProductCatalogSection
            products={ALL_PRODUCTS}
            selectedCategoryFilter={selectedCategoryFilter}
            onViewProduct={handleViewProduct}
          />
          <FromLagosSection />
          <LookbookSection onSelectLook={handleSelectLook} />
          <ThePieceSection />
          <WornByYouSection />
          <SocialSection />
          <NewsletterSection />
        </>
      )}

      {/* Global Luxury Footer */}
      <Footer onNavigateSection={handleNavigateSection} onSelectPage={handleSelectPage} />


      {/* Subtle Floating WhatsApp Concierge Button */}
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


