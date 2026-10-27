import { Router, Request, Response } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CatalogUnavailableError, ProductService } from '../modules/products/productService';
import { ReviewService } from '../modules/reviews/reviewService';

export const seoFallbackRouter = Router();

const SITE_ORIGIN = (process.env.APP_URL || 'https://piercyn.vercel.app').replace(/\/+$/, '');
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character] as string));
const cleanText = (value: unknown) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const escapeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

function formatProductSeoTitle(name: string): string {
  const standardTitle = `${name} | PIERCYN Lagos`;
  const title = standardTitle.length < 30 ? `${name} Streetwear | PIERCYN Lagos` : standardTitle;
  return title.length > 60 ? `${title.slice(0, 57).trimEnd()}…` : title;
}

function formatCategorySeoTitle(name: string): string {
  const standardTitle = `${name} Clothing | PIERCYN Lagos`;
  const title = standardTitle.length < 30 ? `${name} Streetwear | PIERCYN Lagos` : standardTitle;
  return title.length > 60 ? `${title.slice(0, 57).trimEnd()}…` : title;
}

function getTemplate(): string {
  const candidates = [join(process.cwd(), 'build', 'index.html')];
  if (typeof __dirname === 'string') candidates.push(join(__dirname, 'index.html'));
  const templatePath = candidates.find((candidate) => existsSync(candidate));
  if (!templatePath) throw new Error('Built SEO HTML template is missing from the serverless bundle.');
  return readFileSync(templatePath, 'utf8');
}

function replaceRootContent(html: string, body: string): string {
  const openingTag = /<div id="root">/i.exec(html);
  if (!openingTag || openingTag.index === undefined) throw new Error('SEO fallback template has no React root.');
  const contentStart = openingTag.index + openingTag[0].length;
  const divTag = /<\/?div\b[^>]*>/gi;
  divTag.lastIndex = contentStart;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = divTag.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return `${html.slice(0, contentStart)}${body}${html.slice(match.index)}`;
  }
  throw new Error('SEO fallback template has an unclosed React root.');
}

interface SeoPageOptions {
  title: string;
  description: string;
  path: string;
  body: string;
  indexable?: boolean;
  canonicalPath?: string;
  image?: string;
  type?: 'website' | 'product';
  jsonLd?: unknown;
}

function renderSeoPage(template: string, options: SeoPageOptions): string {
  const { description, path: routePath, body, indexable = false } = options;
  const title = options.title.length > 60 ? `${options.title.slice(0, 57).trimEnd()}…` : options.title;
  const canonical = indexable ? `${SITE_ORIGIN}${options.canonicalPath || routePath}` : null;
  const image = options.image || `${SITE_ORIGIN}/favicon.svg`;
  let html = template.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  const upsert = (attribute: 'name' | 'property', key: string, content: string) => {
    const pattern = new RegExp(`<meta\\s+${attribute}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*\\s*/?>`, 'i');
    const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
    html = pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
  };
  upsert('name', 'description', description);
  upsert('name', 'keywords', 'PIERCYN, Lagos fashion, Nigerian streetwear, Nigerian clothing, contemporary fashion');
  upsert('name', 'robots', indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');
  upsert('property', 'og:title', title);
  upsert('property', 'og:site_name', 'PIERCYN');
  upsert('property', 'og:description', description);
  upsert('property', 'og:type', options.type || 'website');
  upsert('property', 'og:image', image);
  upsert('property', 'og:url', canonical || `${SITE_ORIGIN}${routePath}`);
  upsert('name', 'twitter:card', 'summary_large_image');
  upsert('name', 'twitter:title', title);
  upsert('name', 'twitter:description', description);
  upsert('name', 'twitter:image', image);
  const canonicalPattern = /<link\s+rel=["']canonical["'][^>]*\/?\s*>/i;
  if (canonical) {
    const tag = `<link rel="canonical" href="${escapeHtml(canonical)}" />`;
    html = canonicalPattern.test(html) ? html.replace(canonicalPattern, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
  } else {
    html = html.replace(canonicalPattern, '');
  }
  html = html.replace(/\s*<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, '');
  if (options.jsonLd) html = html.replace('</head>', `    <script type="application/ld+json">${escapeJsonLd(options.jsonLd)}</script>\n  </head>`);
  return replaceRootContent(html, body);
}

function normalizePath(value: unknown): string {
  const raw = typeof value === 'string' ? value : '/';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return (withSlash.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/').split('?')[0].toLowerCase();
}

function productAvailable(product: any): boolean {
  if (product.isSoldOut) return false;
  if (Array.isArray(product.variants)) {
    return product.variants.some((variant: any) => variant.active !== false && (variant.isAvailable === true || Number(variant.availableStock) > 0));
  }
  return true;
}

function productJsonLd(product: any, canonical: string, ratingSummary: any) {
  const hasRating = Number(ratingSummary?.totalReviews) > 0 && Number(ratingSummary?.averageRating) > 0;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cleanText(product.name),
    description: cleanText(product.shortDescription || product.description || product.name),
    image: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
    sku: product.variants?.find((variant: any) => variant.sku)?.sku,
    category: cleanText(product.categoryName || product.categorySlug || ''),
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
      ratingValue: Number(ratingSummary.averageRating),
      reviewCount: Number(ratingSummary.totalReviews),
      bestRating: 5,
      worstRating: 1,
    } } : {}),
  };
}

function productList(products: any[]): string {
  if (!products.length) return '<p>No pieces are currently listed in this selection. Browse the <a href="/shop">full PIERCYN store</a>.</p>';
  return `<ul>${products.map((product) => {
    const productPath = `/products/${encodeURIComponent(product.slug)}`;
    const image = product.images?.[0];
    const price = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(product.priceNGN || 0));
    return `<li><a href="${productPath}">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="240" height="300" loading="lazy" />` : ''}<span>${escapeHtml(product.name)}</span></a> <span>${escapeHtml(price)}</span></li>`;
  }).join('')}</ul>`;
}

async function renderProduct(pathname: string, slug: string, template: string, res: Response) {
  const product = await ProductService.getProductBySlugOrId(slug);
  if (!product) return false;
  const ratingSummary = await ReviewService.getProductRatingSummary(product.id);
  const canonical = `${SITE_ORIGIN}/products/${encodeURIComponent(product.slug || slug)}`;
  const productName = cleanText(product.name);
  const baseDescription = cleanText(product.description || `${productName} from PIERCYN Lagos.`);
  const details = [product.fabric && cleanText(product.fabric), product.fit && `${cleanText(product.fit)} fit`].filter(Boolean).join(', ');
  let description = `${baseDescription} Shop ${productName} at PIERCYN Lagos.${details ? ` ${details}.` : ''}`;
  if (description.length < 50) description += ' Discover contemporary Nigerian streetwear from PIERCYN.';
  description = description.slice(0, 160);
  const categoryPath = product.categorySlug ? `/category/${encodeURIComponent(product.categorySlug)}` : '/shop';
  const imageList = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const stockMessage = productAvailable(product) ? 'Available to order.' : 'Currently out of stock.';
  const price = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(product.priceNGN || 0));
  const body = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${categoryPath}">${escapeHtml(cleanText(product.categoryName || 'Shop'))}</a> / <span>${escapeHtml(productName)}</span></nav><article><h1>${escapeHtml(productName)}</h1><p>${escapeHtml(description)}</p><p><strong>${escapeHtml(price)}</strong> · ${escapeHtml(stockMessage)}</p>${imageList.map((image: string, index: number) => `<img src="${escapeHtml(image)}" alt="${escapeHtml(`${productName}${index ? ` product view ${index + 1}` : ''}`)}" width="640" height="800"${index ? ' loading="lazy"' : ''} />`).join('')}<dl>${product.fabric ? `<dt>Fabric</dt><dd>${escapeHtml(cleanText(product.fabric))}</dd>` : ''}${product.fit ? `<dt>Fit</dt><dd>${escapeHtml(cleanText(product.fit))}</dd>` : ''}${product.origin ? `<dt>Origin</dt><dd>${escapeHtml(cleanText(product.origin))}</dd>` : ''}</dl><p><a href="${categoryPath}">Explore more ${escapeHtml(cleanText(product.categoryName || 'PIERCYN').toLowerCase())}</a></p></article></main>`;
  const html = renderSeoPage(template, {
    title: formatProductSeoTitle(productName), description, path: pathname,
    canonicalPath: `/products/${encodeURIComponent(product.slug || slug)}`,
    image: imageList[0], type: 'product', body, indexable: true,
    jsonLd: productJsonLd(product, canonical, ratingSummary),
  });
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.status(200).type('html').send(html);
  return true;
}

async function renderCategory(pathname: string, slug: string, template: string, res: Response) {
  const categories = await ProductService.getCategories();
  const category = categories.find((item: any) => item.slug?.toLowerCase() === slug || item.id?.toLowerCase() === slug);
  if (!category) return false;
  const catalog = await ProductService.getCatalog({ category: category.slug, page: 1, limit: 100 });
  const products = catalog.products || [];
  const title = formatCategorySeoTitle(cleanText(category.name));
  const description = `Shop ${cleanText(category.name).toLowerCase()} from PIERCYN Lagos. Explore contemporary Nigerian clothing, discover product details and find your next everyday piece.`.slice(0, 160);
  const body = `<main><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/shop">Shop</a> / <span>${escapeHtml(category.name)}</span></nav><h1>${escapeHtml(category.name)} from PIERCYN</h1><p>${escapeHtml(cleanText(category.description) || `Explore ${cleanText(category.name).toLowerCase()} in the PIERCYN collection, designed in Lagos and built for everyday wear.`)}</p><section><h2>${escapeHtml(category.name)} pieces</h2>${productList(products)}</section><p><a href="/shop">Browse all PIERCYN clothing</a></p></main>`;
  const html = renderSeoPage(template, {
    title, description, path: pathname, canonicalPath: `/category/${encodeURIComponent(category.slug)}`,
    image: products.find((product: any) => product.images?.[0])?.images?.[0], body, indexable: true,
  });
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.status(200).type('html').send(html);
  return true;
}

async function renderCatalogLanding(pathname: string, template: string, res: Response) {
  if (pathname !== '/' && pathname !== '/shop') return false;
  const catalog = await ProductService.getCatalog({ page: 1, limit: pathname === '/' ? 12 : 100 });
  const categories = await ProductService.getCategories();
  const isHome = pathname === '/';
  const title = isHome ? 'PIERCYN Lagos | Nigerian Streetwear & Fashion' : 'Shop All Clothing | PIERCYN Lagos';
  const description = isHome
    ? 'Shop Nigerian streetwear from PIERCYN Lagos. Discover heavyweight tees, jeans and everyday essentials: modern style, fair prices, made for everywhere.'
    : 'Explore the full PIERCYN clothing collection: heavyweight tees, jeans, polos and modern everyday essentials, designed in Lagos and priced to make sense.';
  const categoryLinks = categories.map((category: any) => `<li><a href="/category/${encodeURIComponent(category.slug)}">${escapeHtml(category.name)}</a></li>`).join('');
  const body = `<main><h1>${isHome ? 'Nigerian streetwear made for everywhere' : 'Shop all PIERCYN pieces'}</h1><p>${escapeHtml(description)}</p><nav aria-label="Shop categories"><h2>Shop categories</h2><ul>${categoryLinks}</ul></nav><section><h2>${isHome ? 'Explore PIERCYN clothing' : 'Shop current PIERCYN pieces'}</h2>${productList(catalog.products || [])}</section></main>`;
  const organizationSchema = isHome ? [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'PIERCYN', url: SITE_ORIGIN, description: 'Lagos-born contemporary fashion and streetwear, built for everywhere.' },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'PIERCYN', url: SITE_ORIGIN },
  ] : undefined;
  const html = renderSeoPage(template, {
    title, description, path: pathname, body, indexable: true,
    image: catalog.products?.find((product: any) => product.images?.[0])?.images?.[0],
    jsonLd: organizationSchema,
  });
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.status(200).type('html').send(html);
  return true;
}

const PRIVATE_ROUTE = /^\/(?:admin|affiliate|account|cart|checkout|search|track-order|order-confirmation)(?:\/|$)|^\/orders?(?:\/|$)/;

seoFallbackRouter.get('/fallback', async (req: Request, res: Response) => {
  const pathname = normalizePath(req.query.path);
  const productAlias = pathname.match(/^\/product\/([^/]+)$/);
  const categoryAlias = pathname.match(/^\/categories\/([^/]+)$/);
  if (productAlias || categoryAlias) {
    const target = productAlias ? `/products/${encodeURIComponent(productAlias[1])}` : `/category/${encodeURIComponent(categoryAlias![1])}`;
    return res.redirect(301, target);
  }

  try {
    const template = getTemplate();
    if (PRIVATE_ROUTE.test(pathname)) {
      const html = renderSeoPage(template, {
        title: 'PIERCYN Store',
        description: 'Customer and account information on the PIERCYN store.',
        path: pathname,
        body: '<main><h1>PIERCYN</h1><p>Loading your store page…</p></main>',
      });
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).type('html').send(html);
    }

    const productMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      const rendered = await renderProduct(pathname, productMatch[1], template, res);
      if (rendered) return;
    }
    const categoryMatch = pathname.match(/^\/category\/([^/]+)$/);
    if (categoryMatch) {
      const rendered = await renderCategory(pathname, categoryMatch[1], template, res);
      if (rendered) return;
    }
    const landingPageRendered = await renderCatalogLanding(pathname, template, res);
    if (landingPageRendered) return;

    const html = renderSeoPage(template, {
      title: 'Page not found | PIERCYN',
      description: 'The page you requested could not be found. Browse PIERCYN clothing and collections.',
      path: pathname,
      body: '<main><h1>Page not found</h1><p>This PIERCYN page does not exist or is no longer available.</p><p><a href="/shop">Browse all PIERCYN pieces</a></p></main>',
    });
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
    return res.status(404).type('html').send(html);
  } catch (error) {
    console.error('[SEO_FALLBACK_FAILED]', error);
    if (error instanceof CatalogUnavailableError) {
      return res.status(503).type('text/plain').send('The product catalog is temporarily unavailable.');
    }
    return res.status(500).type('text/plain').send('Unable to render page.');
  }
});
