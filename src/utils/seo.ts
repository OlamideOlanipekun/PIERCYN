import type { Product } from '../types';

const SITE_ORIGIN = (import.meta.env.VITE_SITE_URL || 'https://piercyn.vercel.app').replace(/\/+$/, '');
export const PUBLIC_PAGE_TITLES: Record<string, string> = {
  home: 'PIERCYN Lagos | Nigerian Streetwear & Fashion',
  shop: 'Shop All Clothing | PIERCYN Lagos',
  men: "Men's Streetwear & Clothing | PIERCYN Lagos",
  women: "Women's Clothing & Streetwear | PIERCYN Lagos",
  new: 'New Arrivals & Latest Drops | PIERCYN',
  accessories: 'Accessories & Finishing Pieces | PIERCYN Lagos',
  collections: 'Clothing Collections | PIERCYN Lagos',
  lookbook: 'Lookbook | PIERCYN Lagos Streetwear',
  about: 'About PIERCYN | Born in Lagos, Built for Everywhere',
  shipping: 'Shipping & Delivery Information | PIERCYN',
  returns: 'Returns & Exchanges Policy | PIERCYN',
  contact: 'Contact PIERCYN | Lagos Fashion & Customer Support',
  privacy: 'PIERCYN Privacy Policy & Data Practices',
  terms: 'PIERCYN Terms & Conditions for Online Orders',
  sizeGuide: 'Clothing Size Guide & Fit Help | PIERCYN',
  faq: 'Frequently Asked Questions | PIERCYN',
  availableToOrder: 'Available to Order | PIERCYN Lagos',
};

const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/': 'Shop Nigerian streetwear from PIERCYN Lagos. Discover heavyweight tees, jeans and everyday essentials: modern style, fair prices, made for everywhere.',
  '/shop': 'Explore the full PIERCYN clothing collection: heavyweight tees, jeans, polos and modern everyday essentials, designed in Lagos and priced to make sense.',
  '/men': 'Discover modern men’s streetwear from PIERCYN Lagos, including heavyweight tees, polos, denim and easy everyday essentials.',
  '/women': 'Shop contemporary women’s clothing and streetwear from PIERCYN Lagos. Explore modern essentials, expressive tees and easy everyday pieces.',
  '/new-arrivals': 'See the latest clothing drops and new arrivals from PIERCYN Lagos. Shop fresh streetwear, tees and contemporary everyday essentials.',
  '/accessories': 'Explore accessories from PIERCYN Lagos, alongside contemporary streetwear and everyday clothing made for modern Nigerian style.',
  '/lookbook': 'Explore the PIERCYN lookbook for styling inspiration, contemporary Nigerian fashion and streetwear photographed with a Lagos point of view.',
  '/collections': 'Explore PIERCYN clothing collections, from everyday tees and hoodies to denim and contemporary streetwear, rooted in Lagos style.',
  '/about': 'Get to know PIERCYN, a Lagos-born fashion brand making modern, elevated clothing that looks premium, lasts, and is priced to make sense.',
  '/shipping': 'Find PIERCYN shipping and delivery information, including dispatch guidance and what to expect after placing an order in Nigeria.',
  '/returns': 'Read PIERCYN’s returns and exchange information, including how to contact the team if there is an issue with your order.',
  '/contact': 'Contact PIERCYN for product questions, order support, delivery information and other customer service enquiries.',
  '/faq': 'Find answers to common questions about PIERCYN products, sizing, orders, payments, delivery and customer support.',
  '/size-guide': 'Use the PIERCYN size guide to help choose a fit for tees, denim and other clothing before adding your selection to the cart.',
};

export function formatSeoTitle(title: string): string {
  return title.length > 60 ? `${title.slice(0, 57).trimEnd()}…` : title;
}

export function formatProductSeoTitle(name: string): string {
  const standardTitle = `${name} | PIERCYN Lagos`;
  return formatSeoTitle(standardTitle.length < 30 ? `${name} Streetwear | PIERCYN Lagos` : standardTitle);
}

export function formatCategorySeoTitle(name: string): string {
  const standardTitle = `${name} Clothing | PIERCYN Lagos`;
  return formatSeoTitle(standardTitle.length < 30 ? `${name} Streetwear | PIERCYN Lagos` : standardTitle);
}

const escapeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

function isPrivatePath(path: string): boolean {
  return /^\/(?:admin|affiliate|account|cart|checkout|search|track-order|order-confirmation)(?:\/|$)|^\/orders?(?:\/|$)/i.test(path);
}

function productAvailability(product: Product): string {
  if (product.isSoldOut) return 'https://schema.org/OutOfStock';
  if (product.variants?.length) {
    const available = product.variants.some((variant) => variant.active !== false && Number(variant.availableStock) > 0);
    return available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  }
  return 'https://schema.org/InStock';
}

export function syncClientSeo(path: string, title: string, product: Product | null): void {
  const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
  const privatePath = isPrivatePath(normalizedPath);
  const canonicalPath = normalizedPath === '/new' || normalizedPath === '/new-in'
    ? '/new-arrivals'
    : normalizedPath.replace(/^\/categories\//, '/category/').split('?')[0] || '/';
  const canonical = `${SITE_ORIGIN}${canonicalPath}`;
  const baseProductDescription = product?.description || `${product?.name || 'PIERCYN'} from PIERCYN Lagos.`;
  const productDetails = product ? [product.fabric && product.fabric.trim(), product.fit && `${product.fit.trim()} fit`].filter(Boolean).join(', ') : '';
  let productDescription = product
    ? `${baseProductDescription.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()} Shop ${product.name} at PIERCYN Lagos.${productDetails ? ` ${productDetails}.` : ''}`
    : '';
  if (product && productDescription.length < 50) productDescription += ' Discover contemporary Nigerian streetwear from PIERCYN.';
  const description = product
    ? productDescription.slice(0, 160)
    : PAGE_DESCRIPTIONS[canonicalPath] || (canonicalPath.startsWith('/category/')
      ? `Shop ${canonicalPath.split('/').pop()?.replace(/-/g, ' ')} from PIERCYN Lagos. Explore contemporary Nigerian clothing and everyday streetwear.`
      : 'Explore PIERCYN Lagos for contemporary Nigerian streetwear, heavyweight tees, jeans and everyday essentials.');
  const existingShareImage = document.head.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content;
  const shareImage = product?.images?.[0] || existingShareImage || `${SITE_ORIGIN}/favicon.svg`;
  const keywords = product
    ? `PIERCYN, ${product.name}, ${product.categoryName || product.category}, Lagos fashion, Nigerian clothing`
    : 'PIERCYN, Lagos fashion, Nigerian streetwear, Nigerian clothing, contemporary fashion';

  upsertMeta('name', 'description', description);
  upsertMeta('name', 'keywords', product
    ? `PIERCYN, ${product.name}, ${product.categoryName || product.category}, Lagos fashion, Nigerian clothing`
    : 'PIERCYN, Lagos fashion, Nigerian streetwear, Nigerian clothing, contemporary fashion');
  upsertMeta('name', 'keywords', keywords);
  upsertMeta('name', 'robots', privatePath ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:site_name', 'PIERCYN');
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:site_name', 'PIERCYN');
  upsertMeta('property', 'og:type', product ? 'product' : 'website');
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:image', shareImage);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', shareImage);

  let canonicalElement = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (privatePath) {
    canonicalElement?.remove();
  } else {
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.rel = 'canonical';
      document.head.append(canonicalElement);
    }
    canonicalElement.href = canonical;
  }

  document.head.querySelectorAll('script[data-piercyn-product-jsonld="true"]').forEach((node) => node.remove());
  if (product && !privatePath) {
    const canonicalProductUrl = `${SITE_ORIGIN}/products/${encodeURIComponent(product.slug || product.id)}`;
    const rating = product.ratingSummary;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      image: product.images,
      url: canonicalProductUrl,
      category: product.categoryName || product.category,
      offers: {
        '@type': 'Offer',
        url: canonicalProductUrl,
        priceCurrency: 'NGN',
        price: String(product.priceNGN),
        availability: productAvailability(product),
        itemCondition: 'https://schema.org/NewCondition',
      },
      ...(rating && rating.totalReviews > 0 && rating.averageRating !== null ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: rating.averageRating,
          reviewCount: rating.totalReviews,
          bestRating: 5,
          worstRating: 1,
        },
      } : {}),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.piercynProductJsonld = 'true';
    script.textContent = escapeJsonLd(schema);
    document.head.append(script);
  }
}
