import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { WOMENS_PRODUCTS } from '../../data/womensProducts';
import { Product, WomenCategory, SortOption } from '../../types';
import { WomenHeroSection } from './WomenHeroSection';
import { WomenCollectionIntro } from './WomenCollectionIntro';
import { WomenCategoryNav } from './WomenCategoryNav';
import { WomenFilterSortBar, WomenFilterState } from './WomenFilterSortBar';
import { WomenProductGrid } from './WomenProductGrid';
import { WomenCategoryDiscovery } from './WomenCategoryDiscovery';
import { WomenNewArrivalsCta } from './WomenNewArrivalsCta';
import { NewsletterSection } from '../NewsletterSection';

interface WomenCollectionPageProps {
  onNavigateSection?: (sectionId: string) => void;
}

export const WomenCollectionPage: React.FC<WomenCollectionPageProps> = ({ onNavigateSection }) => {
  const { setQuickViewProduct } = useShop();

  // Category filter state
  const [activeCategory, setActiveCategory] = useState<WomenCategory>('ALL');

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('FEATURED');

  // Detailed Filter State
  const [filters, setFilters] = useState<WomenFilterState>({
    category: 'ALL',
    sizes: [],
    colors: [],
    priceRange: 'ALL',
    inStockOnly: false
  });

  const handleSelectCategory = (category: WomenCategory) => {
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
    const el = document.getElementById('women-category-nav');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShopEditorial = () => {
    setActiveCategory('DRESSES & SETS');
    const el = document.getElementById('women-category-nav');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Compute category counts for the nav pills
  const categoryCounts = useMemo(() => {
    const counts: Record<WomenCategory, number> = {
      'ALL': WOMENS_PRODUCTS.length,
      'HOODIES & FLEECE': 0,
      'CROPPED & TOPS': 0,
      'TEES': 0,
      'DRESSES & SETS': 0,
      'TROUSERS & SKIRTS': 0,
      'OUTERWEAR': 0,
      'ACCESSORIES': 0
    };

    WOMENS_PRODUCTS.forEach((p) => {
      if (p.category === 'hoodies' || p.category === 'sweatshirts') {
        counts['HOODIES & FLEECE']++;
      }
      if (p.category === 'tees' && (p.id.includes('top') || p.fit.includes('Contour') || p.fit.includes('Form'))) {
        counts['CROPPED & TOPS']++;
      }
      if (p.category === 't-shirts' || (p.category === 'tees' && !p.id.includes('top'))) {
        counts['TEES']++;
      }
      if (p.id.includes('dress') || p.collection === 'after-dark') {
        counts['DRESSES & SETS']++;
      }
      if (p.category === 'trousers' || p.category === 'jeans') {
        counts['TROUSERS & SKIRTS']++;
      }
      if (p.category === 'jackets' || p.category === 'outerwear') {
        counts['OUTERWEAR']++;
      }
      if (p.category === 'accessories') {
        counts['ACCESSORIES']++;
      }
    });

    return counts;
  }, []);

  // Filter and Sort Processing
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...WOMENS_PRODUCTS];

    // 1. Category Filter
    if (activeCategory !== 'ALL') {
      if (activeCategory === 'HOODIES & FLEECE') {
        result = result.filter((p) => p.category === 'hoodies' || p.category === 'sweatshirts');
      } else if (activeCategory === 'CROPPED & TOPS') {
        result = result.filter((p) => p.id.includes('top') || p.fit.includes('Contour') || p.fit.includes('Form'));
      } else if (activeCategory === 'TEES') {
        result = result.filter((p) => p.category === 't-shirts' || (p.category === 'tees' && !p.id.includes('top')));
      } else if (activeCategory === 'DRESSES & SETS') {
        result = result.filter((p) => p.id.includes('dress') || p.collection === 'after-dark');
      } else if (activeCategory === 'TROUSERS & SKIRTS') {
        result = result.filter((p) => p.category === 'trousers' || p.category === 'jeans');
      } else if (activeCategory === 'OUTERWEAR') {
        result = result.filter((p) => p.category === 'jackets' || p.category === 'outerwear');
      } else if (activeCategory === 'ACCESSORIES') {
        result = result.filter((p) => p.category === 'accessories');
      }
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
    } else if (sortBy === 'PRICE: LOW TO HIGH') {
      result.sort((a, b) => a.priceNGN - b.priceNGN);
    } else if (sortBy === 'PRICE: HIGH TO LOW') {
      result.sort((a, b) => b.priceNGN - a.priceNGN);
    } else if (sortBy === 'BEST SELLING') {
      result.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }

    return result;
  }, [activeCategory, filters, sortBy]);

  const handleViewProduct = (product: Product) => {
    setQuickViewProduct(product);
  };

  return (
    <main id="piercyn-women-collection-page" className="w-full bg-[#F2F0EB]">
      {/* 01: Editorial Women Hero Section */}
      <WomenHeroSection onShopNewArrivals={handleShopNewArrivals} />

      {/* 02: Collection Introduction */}
      <WomenCollectionIntro />

      {/* 03: Category Navigation */}
      <WomenCategoryNav
        selectedCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        categoryCounts={categoryCounts}
      />

      {/* 04: Filter + Sort Bar */}
      <WomenFilterSortBar
        totalCount={filteredAndSortedProducts.length}
        activeCategory={activeCategory}
        sortBy={sortBy}
        filters={filters}
        onSelectCategory={handleSelectCategory}
        onSortChange={setSortBy}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* 05: 4:5 Product Grid with Mid-Grid Editorial Break */}
      <div className="pt-6 sm:pt-10">
        <WomenProductGrid
          products={filteredAndSortedProducts}
          onViewProduct={handleViewProduct}
          onClearFilters={handleClearFilters}
          onExploreEditorial={handleShopEditorial}
        />
      </div>

      {/* 06: Visual Category Discovery */}
      <WomenCategoryDiscovery onSelectCategory={handleSelectCategory} />

      {/* 07: Runway & New Arrivals CTA */}
      <WomenNewArrivalsCta onShopAll={handleClearFilters} />

      {/* 08: Global Newsletter Section */}
      <NewsletterSection />
    </main>
  );
};
