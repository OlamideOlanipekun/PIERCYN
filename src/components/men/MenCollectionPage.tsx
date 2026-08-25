import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { MENS_PRODUCTS } from '../../data/mensProducts';
import { Product, MenCategory, SortOption } from '../../types';
import { MenHeroSection } from './MenHeroSection';
import { MenCollectionIntro } from './MenCollectionIntro';
import { MenCategoryNav } from './MenCategoryNav';
import { MenFilterSortBar, FilterState } from './MenFilterSortBar';
import { MenProductGrid } from './MenProductGrid';
import { MenCategoryDiscovery } from './MenCategoryDiscovery';
import { MenNewArrivalsCta } from './MenNewArrivalsCta';
import { NewsletterSection } from '../NewsletterSection';

interface MenCollectionPageProps {
  onNavigateSection: (sectionId: string) => void;
}

export const MenCollectionPage: React.FC<MenCollectionPageProps> = ({ onNavigateSection }) => {
  const { setQuickViewProduct } = useShop();

  // Category filter state
  const [activeCategory, setActiveCategory] = useState<MenCategory>('ALL');

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('FEATURED');

  // Detailed Filter State
  const [filters, setFilters] = useState<FilterState>({
    category: 'ALL',
    sizes: [],
    colors: [],
    priceRange: 'ALL',
    inStockOnly: false
  });

  const handleSelectCategory = (category: MenCategory) => {
    setActiveCategory(category);
    setFilters((prev) => ({ ...prev, category }));
  };

  const handleClearFilters = () => {
    setActiveCategory('ALL');
    setSortBy('FEATURED');
    setFilters({
      category: 'ALL',
      sizes: [],
      colors: [],
      priceRange: 'ALL',
      inStockOnly: false
    });
  };

  const handleShopNewArrivals = () => {
    setActiveCategory('ALL');
    setSortBy('NEWEST');
    const el = document.getElementById('men-category-navigation');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShopEveryday = () => {
    setActiveCategory('HOODIES');
    const el = document.getElementById('men-category-navigation');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter and Sort Processing
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...MENS_PRODUCTS];

    // 1. Category Filter
    if (activeCategory !== 'ALL') {
      const targetCat = activeCategory.toLowerCase();
      result = result.filter((p) => {
        if (targetCat === 't-shirts') return p.category === 't-shirts' || p.category === 'tees';
        if (targetCat === 'jackets') return p.category === 'jackets' || p.category === 'outerwear';
        if (targetCat === 'denim' || targetCat === 'jeans') return p.category === 'jeans' || p.category === 'trousers';
        return p.category.toLowerCase() === targetCat;
      });
    }

    // 2. Sizes Filter
    if (filters.sizes.length > 0) {
      result = result.filter((p) =>
        p.sizes.some((sz) => filters.sizes.includes(sz))
      );
    }

    // 3. Color Filter
    if (filters.colors.length > 0) {
      result = result.filter((p) =>
        p.colors.some((col) =>
          filters.colors.some((fc) => {
            const key = fc.split('/')[0].trim().toLowerCase();
            return col.name.toLowerCase().includes(key);
          })
        )
      );
    }

    // 4. Price Filter
    if (filters.priceRange === 'UNDER_40K') {
      result = result.filter((p) => p.priceNGN < 40000);
    } else if (filters.priceRange === '40K_60K') {
      result = result.filter((p) => p.priceNGN >= 40000 && p.priceNGN <= 60000);
    } else if (filters.priceRange === 'OVER_60K') {
      result = result.filter((p) => p.priceNGN > 60000);
    }

    // 5. In Stock Filter
    if (filters.inStockOnly) {
      result = result.filter((p) => !p.isSoldOut);
    }

    // 6. Sorting
    if (sortBy === 'NEWEST') {
      result.sort((a, b) => (b.isNewDrop ? 1 : 0) - (a.isNewDrop ? 1 : 0));
    } else if (sortBy === 'PRICE — LOW TO HIGH') {
      result.sort((a, b) => a.priceNGN - b.priceNGN);
    } else if (sortBy === 'PRICE — HIGH TO LOW') {
      result.sort((a, b) => b.priceNGN - a.priceNGN);
    } else if (sortBy === 'BEST SELLING') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }
    // FEATURED leaves the intentional curatorial order intact

    return result;
  }, [activeCategory, filters, sortBy]);

  const handleViewProduct = (product: Product) => {
    setQuickViewProduct(product);
  };

  return (
    <main id="piercyn-men-collection-page" className="w-full bg-[#F2F0EB]">
      {/* 01: Editorial Men Hero Section */}
      <MenHeroSection onShopNewArrivals={handleShopNewArrivals} />

      {/* 02: Collection Introduction */}
      <MenCollectionIntro />

      {/* 03: Category Navigation */}
      <MenCategoryNav
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* 04: Filter + Sort Bar (Sticky) */}
      <MenFilterSortBar
        totalCount={filteredAndSortedProducts.length}
        activeCategory={activeCategory}
        sortBy={sortBy}
        filters={filters}
        onSelectCategory={handleSelectCategory}
        onSortChange={setSortBy}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* 05: Product Catalog Grid & Editorial Campaign Break */}
      <MenProductGrid
        products={filteredAndSortedProducts}
        onViewProduct={handleViewProduct}
        onClearFilters={handleClearFilters}
        onShopEveryday={handleShopEveryday}
      />

      {/* 06: Category Discovery (Visual Tiles) */}
      <MenCategoryDiscovery onSelectCategory={handleSelectCategory} />

      {/* 07: New Arrivals Contrast CTA */}
      <MenNewArrivalsCta onExploreNewArrivals={handleShopNewArrivals} />

      {/* 08: Newsletter Component */}
      <NewsletterSection />
    </main>
  );
};
