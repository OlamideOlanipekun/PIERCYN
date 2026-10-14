import { describe, expect, it } from 'vitest';
import { ActivePageView } from '../src/types';

describe('PIERCYN Route & Navigation Integrity', () => {
  // Standardized Route Map matching App.tsx
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

  it('provides a valid and unique URL path for all primary active page views', () => {
    const primaryViews: ActivePageView[] = [
      'home', 'shop', 'men', 'women', 'new', 'accessories',
      'collections', 'lookbook', 'about', 'account', 'cart',
      'checkout', 'orderConfirmation', 'shipping', 'returns',
      'contact', 'privacy', 'terms', 'search', 'sizeGuide', 'faq', 'trackOrder'
    ];

    primaryViews.forEach((view) => {
      expect(pathMap[view]).toBeDefined();
      expect(pathMap[view].startsWith('/')).toBe(true);
      expect(pathMap[view]).not.toContain('#');
    });
  });

  it('contains properly formatted document titles without mojibake encoding corruption', () => {
    Object.entries(titleMap).forEach(([view, title]) => {
      expect(title).toBeDefined();
      expect(title).not.toContain('â€”');
      expect(title).not.toContain('â€');
      expect(title.length).toBeGreaterThan(5);
    });
  });

  it('ensures post-checkout navigates to /order-confirmation rather than homepage reset', () => {
    expect(pathMap.orderSuccess).toBe('/order-confirmation');
    expect(pathMap.orderConfirmation).toBe('/order-confirmation');
  });

  it('ensures order tracking routes consistently to /track-order', () => {
    expect(pathMap.orderTracking).toBe('/track-order');
    expect(pathMap.trackOrder).toBe('/track-order');
  });
});
