import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_ORIGIN = (process.env.SEO_SITE_ORIGIN || process.env.APP_URL || 'https://piercyn.vercel.app').replace(/\/+$/, '');
const API_ORIGIN = (process.env.SEO_API_ORIGIN || SITE_ORIGIN).replace(/\/+$/, '');
const DIST = path.resolve('dist');
const TEMPLATE_PATH = path.join(DIST, 'index.html');
const FALLBACK_IMAGE = `${SITE_ORIGIN}/favicon.svg`;

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const escapeJsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const text = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`SEO catalog request failed (${response.status}): ${url}`);
  return response.json();
}

async function fetchCatalog() {
  const first = await fetchJson(`${API_ORIGIN}/api/products?limit=100&page=1`);
  if (!first?.success || !Array.isArray(first.data)) throw new Error('SEO catalog response was not a product list.');
  const products = [...first.data];
  const totalPages = Math.max(1, Number(first.meta?.totalPages || 1));
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchJson(`${API_ORIGIN}/api/products?limit=100&page=${page}`);
    if (!next?.success || !Array.isArray(next.data)) throw new Error(`SEO catalog page ${page} was invalid.`);
    products.push(...next.data);
  }
  const categoryResponse = await fetchJson(`${API_ORIGIN}/api/categories`);
  if (!categoryResponse?.success || !Array.isArray(categoryResponse.data)) throw new Error('SEO categories response was invalid.');
  return { products, categories: categoryResponse.data };
}

function upsertMeta(html, attribute, key, content) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tagPattern = new RegExp(`<meta\\s+${attribute}=["']${escapedKey}["'][^>]*\\s*/?>`, 'i');
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`;
  return tagPattern.test(html) ? html.replace(tagPattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
}

function makePage(template, { title, description, path: routePath, canonicalPath = routePath, image, type = 'website', noindex = false, body, jsonLd }) {
  const canonical = noindex ? null : `${SITE_ORIGIN}${canonicalPath === '/' ? '/' : canonicalPath}`;
  const seoTitle = title.length > 60 ? `${title.slice(0, 57).trimEnd()}…` : title;
  let html = template.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seoTitle)}</title>`);
  html = upsertMeta(html, 'name', 'description', description);
  html = upsertMeta(html, 'name', 'keywords', 'PIERCYN, Lagos fashion, Nigerian streetwear, Nigerian clothing, contemporary fashion');
  html = upsertMeta(html, 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  html = upsertMeta(html, 'property', 'og:title', seoTitle);
  html = upsertMeta(html, 'property', 'og:site_name', 'PIERCYN');
  html = upsertMeta(html, 'property', 'og:description', description);
  html = upsertMeta(html, 'property', 'og:type', type);
  html = upsertMeta(html, 'property', 'og:image', image || FALLBACK_IMAGE);
  html = upsertMeta(html, 'property', 'og:url', canonical || `${SITE_ORIGIN}${routePath}`);
  html = upsertMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = upsertMeta(html, 'name', 'twitter:title', seoTitle);
  html = upsertMeta(html, 'name', 'twitter:description', description);
  html = upsertMeta(html, 'name', 'twitter:image', image || FALLBACK_IMAGE);
  const canonicalTag = canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : '';
  const canonicalPattern = /<link\s+rel=["']canonical["'][^>]*\/?\s*>/i;
  html = canonicalPattern.test(html) ? html.replace(canonicalPattern, canonicalTag) : html.replace('</head>', `    ${canonicalTag}\n  </head>`);
  html = html.replace(/\s*<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, '');
  if (jsonLd) html = html.replace('</head>', `    <script type="application/ld+json">${escapeJsonLd(jsonLd)}</script>\n  </head>`);
  const rootContent = body || `<main><h1>${escapeHtml(seoTitle)}</h1><p>${escapeHtml(description)}</p></main>`;
  html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${rootContent}</div>`);
  if (!html.includes('id="root">')) throw new Error('Could not find the React root in the Vite HTML template.');
  return html;
}

function productAvailable(product) {
  if (product.isSoldOut) return false;
  if (Array.isArray(product.variants)) {
    const activeVariants = product.variants.filter((variant) => variant.active !== false);
    return activeVariants.some((variant) => variant.isAvailable === true || Number(variant.availableStock) > 0);
  }
  return true;
}

function productStructuredData(product, canonical) {
  const hasRating = Number(product.ratingSummary?.totalReviews) > 0 && Number(product.ratingSummary?.averageRating) > 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: text(product.name),
    description: text(product.description || product.shortDescription || product.name),
    image: (Array.isArray(product.images) ? product.images : []).filter(Boolean),
    sku: product.variants?.find((variant) => variant.sku)?.sku,
    category: text(product.categoryName || product.categorySlug || ''),
    url: canonical,
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'NGN',
      price: String(Number(product.priceNGN || 0)),
      availability: productAvailable(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(hasRating ? { aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number(product.ratingSummary.averageRating),
      reviewCount: Number(product.ratingSummary.totalReviews),
      bestRating: 5,
      worstRating: 1,
    } } : {}),
  };
}

function productList(products) {
  if (!products.length) return '<p>No pieces are currently listed in this selection. Browse the <a href="/shop">full PIERCYN store</a>.</p>';
  return `<ul>${products.map((product) => {
    const productPath = `/products/${encodeURIComponent(product.slug)}`;
    const image = product.images?.[0];
    return `<li><a href="${productPath}">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="240" height="300" loading="lazy" />` : ''}<span>${escapeHtml(product.name)}</span></a> <span>${escapeHtml(new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(product.priceNGN || 0)))}</span></li>`;
  }).join('')}</ul>`;
}

const STATIC_PAGES = {
  '/': {
    title: 'PIERCYN Lagos | Nigerian Streetwear & Fashion',
    description: 'Shop Nigerian streetwear from PIERCYN Lagos. Discover heavyweight tees, jeans and everyday essentials: modern style, fair prices, made for everywhere.',
    heading: 'Nigerian streetwear made for everywhere',
    intro: 'PIERCYN makes modern, elevated clothing for a generation that values style and knows the value of money. Explore heavyweight tees, denim, and everyday essentials, born in Lagos and built for everywhere.',
  },
  '/shop': {
    title: 'Shop All Clothing | PIERCYN Lagos',
    description: 'Explore the full PIERCYN clothing collection: heavyweight tees, jeans, polos and modern everyday essentials, designed in Lagos and priced to make sense.',
    heading: 'Shop all PIERCYN pieces',
    intro: 'Browse the current PIERCYN collection of contemporary Nigerian streetwear, everyday essentials, tees, denim and more.',
  },
  '/men': { title: "Men's Streetwear & Clothing | PIERCYN Lagos", description: 'Discover modern men’s streetwear from PIERCYN Lagos, including heavyweight tees, polos, denim and easy everyday essentials.', heading: "Men's streetwear from PIERCYN", intro: 'Explore versatile everyday clothing and contemporary streetwear from PIERCYN Lagos.' },
  '/women': { title: "Women's Clothing & Streetwear | PIERCYN Lagos", description: 'Shop contemporary women’s clothing and streetwear from PIERCYN Lagos. Explore modern essentials, expressive tees and easy everyday pieces.', heading: "Women's clothing from PIERCYN", intro: 'Discover contemporary pieces designed for personal style, comfort and everyday wear.' },
  '/new-arrivals': { title: 'New Arrivals & Latest Drops | PIERCYN', description: 'See the latest clothing drops and new arrivals from PIERCYN Lagos. Shop fresh streetwear, tees and contemporary everyday essentials.', heading: 'New arrivals from PIERCYN', intro: 'Discover the latest PIERCYN pieces and recent drops from Lagos.' },
  '/new-in': { title: 'New Arrivals & Latest Drops | PIERCYN', description: 'See the latest clothing drops and new arrivals from PIERCYN Lagos. Shop fresh streetwear, tees and contemporary everyday essentials.', heading: 'New arrivals from PIERCYN', intro: 'Discover the latest PIERCYN pieces and recent drops from Lagos.' },
  '/new': { title: 'New Arrivals & Latest Drops | PIERCYN', description: 'See the latest clothing drops and new arrivals from PIERCYN Lagos. Shop fresh streetwear, tees and contemporary everyday essentials.', heading: 'New arrivals from PIERCYN', intro: 'Discover the latest PIERCYN pieces and recent drops from Lagos.' },
  '/available-to-order': { title: 'Available to Order | PIERCYN Lagos', description: 'Browse PIERCYN pieces available to order. Find contemporary Nigerian clothing and streetwear with clear product details and delivery information.', heading: 'Available to order', intro: 'Explore PIERCYN products and their current availability.' },
  '/accessories': { title: 'Accessories & Finishing Pieces | PIERCYN Lagos', description: 'Explore accessories from PIERCYN Lagos, alongside contemporary streetwear and everyday clothing made for modern Nigerian style.', heading: 'PIERCYN accessories', intro: 'Explore the accessories and finishing pieces available from PIERCYN.' },
  '/lookbook': { title: 'Lookbook | PIERCYN Lagos Streetwear', description: 'Explore the PIERCYN lookbook for styling inspiration, contemporary Nigerian fashion and streetwear photographed with a Lagos point of view.', heading: 'The PIERCYN lookbook', intro: 'A visual journal of contemporary style, Lagos energy and PIERCYN pieces.' },
  '/collections': { title: 'Clothing Collections | PIERCYN Lagos', description: 'Explore PIERCYN clothing collections, from everyday tees and hoodies to denim and contemporary streetwear, rooted in Lagos style.', heading: 'Shop by collection', intro: 'Explore curated PIERCYN edits and find the pieces that fit your everyday rotation.' },
  '/about': { title: 'About PIERCYN | Born in Lagos, Built for Everywhere', description: 'Get to know PIERCYN, a Lagos-born fashion brand making modern, elevated clothing that looks premium, lasts, and is priced to make sense.', heading: 'About PIERCYN', intro: 'PIERCYN makes modern, elevated clothing for a generation that values style and knows the value of money. Born in Lagos, built for everywhere.' },
  '/shipping': { title: 'Shipping & Delivery Information | PIERCYN', description: 'Find PIERCYN shipping and delivery information, including dispatch guidance and what to expect after placing an order in Nigeria.', heading: 'Shipping and delivery', intro: 'Review PIERCYN delivery information before placing your order. For the latest timing and coverage, contact our team.' },
  '/returns': { title: 'Returns & Exchanges Policy | PIERCYN', description: 'Read PIERCYN’s returns and exchange information, including how to contact the team if there is an issue with your order.', heading: 'Returns and exchanges', intro: 'Review PIERCYN’s returns and exchange information and contact the team for help with an order.' },
  '/contact': { title: 'Contact PIERCYN | Lagos Fashion & Customer Support', description: 'Contact PIERCYN for product questions, order support, delivery information and other customer service enquiries.', heading: 'Contact PIERCYN', intro: 'Need help choosing a piece or checking an order? Contact the PIERCYN team for assistance.' },
  '/privacy': { title: 'PIERCYN Privacy Policy & Data Practices', description: 'Read the PIERCYN privacy policy to understand how information is handled when you browse the store, create an account or place an order.', heading: 'PIERCYN privacy policy', intro: 'Read the PIERCYN privacy policy and learn about information handling on this store.' },
  '/terms': { title: 'PIERCYN Terms & Conditions for Online Orders', description: 'Read PIERCYN’s terms and conditions for using the online store, purchasing products, payments, delivery and customer support.', heading: 'PIERCYN terms and conditions', intro: 'Review the terms that apply when browsing or purchasing from the PIERCYN store.' },
  '/size-guide': { title: 'Clothing Size Guide & Fit Help | PIERCYN', description: 'Use the PIERCYN size guide to help choose a fit for tees, denim and other clothing before adding your selection to the cart.', heading: 'PIERCYN size guide', intro: 'Check garment sizing information before choosing a size for your PIERCYN piece.' },
  '/faq': { title: 'Frequently Asked Questions | PIERCYN', description: 'Find answers to common questions about PIERCYN products, sizing, orders, payments, delivery and customer support.', heading: 'PIERCYN frequently asked questions', intro: 'Find answers about shopping, product availability, sizing, orders and delivery.' },
};

function publicPageBody(page, products, categories, routePath) {
  const collectionLinks = categories.map((category) => `<li><a href="/category/${encodeURIComponent(category.slug)}">${escapeHtml(category.name)}</a></li>`).join('');
  const isArrivals = ['/new', '/new-in', '/new-arrivals'].includes(routePath);
  const selectedProducts = routePath === '/shop' ? products
    : routePath === '/' ? products.slice(0, 12)
      : isArrivals ? products.filter((product) => product.isNewDrop)
        : routePath === '/available-to-order' ? products.filter((product) => product.availabilityType === 'available_to_order')
          : routePath === '/accessories' ? products.filter((product) => product.categorySlug === 'accessories' || product.category === 'accessories')
            : [];
  const productSection = selectedProducts.length
    ? `<section><h2>${routePath === '/shop' ? 'Shop current PIERCYN pieces' : routePath === '/' ? 'Explore PIERCYN clothing' : 'Featured pieces'}</h2>${productList(selectedProducts)}</section>`
    : isArrivals || routePath === '/available-to-order' || routePath === '/accessories'
      ? `<p>No pieces are currently listed in this selection. <a href="/shop">Browse all PIERCYN clothing</a>.</p>`
      : '';
  const categoryNav = ['/', '/shop', '/collections'].includes(routePath)
    ? `<nav aria-label="Shop categories"><h2>Shop categories</h2><ul>${collectionLinks}</ul></nav>` : '';
  return `<main><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.intro)}</p>${categoryNav}${productSection}<p><a href="/about">About PIERCYN</a> · <a href="/shipping">Shipping and delivery</a> · <a href="/contact">Contact</a></p></main>`;
}

async function writeRoute(template, routePath, renderedHtml) {
  const directory = path.join(DIST, ...routePath.split('/').filter(Boolean));
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'index.html'), renderedHtml, 'utf8');
}

async function main() {
  const template = await fs.readFile(TEMPLATE_PATH, 'utf8');
  const { products, categories } = await fetchCatalog();
  if (products.length === 0) throw new Error('SEO prerender received an empty product catalog; refusing to publish empty product pages.');
  const primaryImage = products.find((product) => product.images?.[0])?.images?.[0] || FALLBACK_IMAGE;

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PIERCYN',
    url: SITE_ORIGIN,
    description: 'Lagos-born contemporary fashion and streetwear, built for everywhere.',
  };
  for (const [routePath, page] of Object.entries(STATIC_PAGES)) {
    const body = publicPageBody(page, products, categories, routePath);
    const jsonLd = routePath === '/' ? [organizationSchema, {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PIERCYN',
      url: SITE_ORIGIN,
    }] : undefined;
    const canonicalPath = ['/new', '/new-in'].includes(routePath) ? '/new-arrivals' : routePath;
    const rendered = makePage(template, { ...page, path: routePath, canonicalPath, image: primaryImage, body, jsonLd });
    if (routePath === '/') await fs.writeFile(TEMPLATE_PATH, rendered, 'utf8');
    else await writeRoute(template, routePath, rendered);
  }


  const collectionPages = [
    { slug: 'mens-tshirts', title: "Men's T-shirts", description: 'Everyday essentials, cut for Lagos heat and daily rotation.', categories: ['tees', 't-shirts'] },
    { slug: 'hoodies', title: 'Hoodies', description: 'Layering pieces built for comfort, structure and repeat wear.', categories: ['hoodies', 'sweatshirts'] },
    { slug: 'trousers', title: 'Trousers', description: 'Contemporary trousers and denim for a composed everyday uniform.', categories: ['trousers', 'jeans'] },
  ];
  for (const collection of collectionPages) {
    const matches = products.filter((product) => collection.categories.includes(product.categorySlug || product.category));
    const routePath = `/collections/${collection.slug}`;
    const title = `${collection.title} Collection | PIERCYN Lagos`;
    const description = `${collection.description} Shop the PIERCYN collection, born in Lagos and built for everywhere.`;
    const body = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/collections">Collections</a> / <span>${escapeHtml(collection.title)}</span></nav><h1>${escapeHtml(collection.title)}</h1><p>${escapeHtml(collection.description)}</p>${productList(matches)}<p><a href="/shop">Shop all PIERCYN pieces</a></p></main>`;
    await writeRoute(template, routePath, makePage(template, { title, description, path: routePath, image: matches.find((product) => product.images?.[0])?.images?.[0] || primaryImage, body }));
  }

  const privateRoutes = ['/account', '/cart', '/checkout', '/search', '/track-order', '/order-confirmation', '/admin', '/affiliate'];
  for (const routePath of privateRoutes) {
    const name = routePath.slice(1).replaceAll('-', ' ');
    const rendered = makePage(template, { title: `${name.replace(/\b\w/g, (letter) => letter.toUpperCase())} | PIERCYN`, description: 'This PIERCYN store page is intended for customer use.', path: routePath, noindex: true, image: primaryImage, body: `<main><h1>${escapeHtml(name)}</h1></main>` });
    await writeRoute(template, routePath, rendered);
  }
  console.log(`SEO prerender complete: ${Object.keys(STATIC_PAGES).length} public routes and ${collectionPages.length} collections; ${products.length} products and ${categories.length} categories will render live on request.`);
}

main().catch((error) => {
  console.error('[SEO_PRERENDER_FAILED]', error);
  process.exitCode = 1;
});
