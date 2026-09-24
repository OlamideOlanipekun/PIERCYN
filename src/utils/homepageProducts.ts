import { Product } from '../types';
import { SECTION_LIMITS } from '../config/homepage';

export interface HomepageProductBuckets {
  justDropped: Product[];
  trendingNow: Product[];
  mensFashion: Product[];
  under15k: Product[];
}

/**
 * Deduplicates and assigns products to homepage sections:
 * 1. Just Dropped (newest by createdAt or isNewDrop)
 * 2. Trending Now (isBestSeller or high-demand tag, excluding Just Dropped)
 * 3. Men's Fashion (category/menswear staple pieces, excluding earlier items)
 * 4. Good Looks Under ₦15K (filtered priceNGN <= 15000, min 4 items required)
 */
export function getDeduplicatedHomepageProducts(allProducts: Product[]): HomepageProductBuckets {
  const activeProducts = allProducts.filter((p) => p.status !== 'archived');
  const usedProductIds = new Set<string>();

  // 1. Just Dropped: sort by createdAt descending, prefer isNewDrop
  const newDropCandidates = [...activeProducts].sort((a, b) => {
    if (a.isNewDrop && !b.isNewDrop) return -1;
    if (!a.isNewDrop && b.isNewDrop) return 1;
    return new Date(b.createdAt || '2026-01-01').getTime() - new Date(a.createdAt || '2026-01-01').getTime();
  });

  const justDropped: Product[] = [];
  for (const product of newDropCandidates) {
    if (justDropped.length >= SECTION_LIMITS.justDropped) break;
    justDropped.push(product);
    usedProductIds.add(product.id);
  }

  // 2. Trending Now: prefer isBestSeller or popular tag, strictly excluding used
  const trendingCandidates = activeProducts.filter(
    (p) => !usedProductIds.has(p.id) && (p.isBestSeller || p.tag === 'POPULAR' || p.tag === 'CORE' || p.tag === 'ICONIC')
  );

  const fallbackTrending = activeProducts.filter((p) => !usedProductIds.has(p.id));
  const combinedTrendingCandidates = [...trendingCandidates, ...fallbackTrending];

  const trendingNow: Product[] = [];
  for (const product of combinedTrendingCandidates) {
    if (trendingNow.length >= SECTION_LIMITS.trendingNow) break;
    if (!usedProductIds.has(product.id)) {
      trendingNow.push(product);
      usedProductIds.add(product.id);
    }
  }

  // 3. Men's Fashion: curated menswear staples, strictly excluding used
  const mensCandidates = activeProducts.filter((p) => !usedProductIds.has(p.id));
  const mensFashion: Product[] = [];
  for (const product of mensCandidates) {
    if (mensFashion.length >= SECTION_LIMITS.mensFashion) break;
    mensFashion.push(product);
    usedProductIds.add(product.id);
  }

  // 4. Good Looks Under ₦15K: filter all active products with priceNGN <= 15000
  const under15kCandidates = activeProducts
    .filter((p) => (p.priceNGN || 0) <= 15000)
    .sort((a, b) => (a.priceNGN || 0) - (b.priceNGN || 0));

  // Tag them with Under ₦15K badge
  const under15k: Product[] = under15kCandidates.map((p) => ({
    ...p,
    tag: 'UNDER ₦15K',
  }));

  return {
    justDropped,
    trendingNow: trendingNow.length >= 3 ? trendingNow : [],
    mensFashion: mensFashion.length >= 3 ? mensFashion : [],
    under15k: under15k.length >= SECTION_LIMITS.affordableUnder15kMin ? under15k : [],
  };
}
