import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, MessageCircle, PackageCheck } from 'lucide-react';
import { Product } from '../types';
import { formatNGN } from '../utils/currency';
import { SHIPPING_CONFIG } from '../utils/shipping';

export type StorefrontPageKey =
  | 'shipping' | 'returns' | 'contact' | 'privacy' | 'terms' | 'search'
  | 'size-guide' | 'faq' | 'track-order' | 'available-to-order' | 'cart'
  | 'checkout' | 'order-confirmation';

interface StorefrontInfoPageProps {
  page: StorefrontPageKey;
  products: Product[];
  onViewProduct: (product: Product) => void;
  onShop: () => void;
  onOpenSearch?: () => void;
  isLoadingProducts?: boolean;
  catalogError?: string | null;
  onRetryProducts?: () => void;
  onOpenCart: () => void;
  onOpenCheckout: () => void;
}

const SUPPORT_URL = 'https://wa.me/2348076431059?text=Hello%20PIERCYN%2C%20I%20need%20help.';

const copy: Record<Exclude<StorefrontPageKey, 'search' | 'cart' | 'checkout' | 'order-confirmation'>, { eyebrow: string; title: string; intro: string; sections: { title: string; body: string }[] }> = {
  shipping: {
    eyebrow: 'DELIVERY INFORMATION', title: 'Shipping & Delivery',
    intro: 'Delivery options and charges are shown at checkout and recalculated by PIERCYN’s server before an order is created.',
    sections: [
      { title: 'Lagos delivery', body: `${SHIPPING_CONFIG.lagosDescription} Delivery costs ₦${SHIPPING_CONFIG.lagosDeliveryFeeNGN.toLocaleString()} for orders below the configured free-delivery threshold.` },
      { title: 'Delivery across Nigeria', body: `${SHIPPING_CONFIG.nationwideDescription} Delivery costs ₦${SHIPPING_CONFIG.nationwideDeliveryFeeNGN.toLocaleString()} for orders below the configured free-delivery threshold.` },
      { title: 'Free delivery', body: `The current checkout configuration applies free delivery to eligible orders of ₦${SHIPPING_CONFIG.freeShippingThresholdNGN.toLocaleString()} or more. The final eligible amount is confirmed in checkout.` },
      { title: 'Please note', body: 'These are estimates, not guaranteed arrival dates. Delivery timing can depend on destination, dispatch and courier conditions. Contact support with your order reference if you need help.' },
    ],
  },
  returns: {
    eyebrow: 'CUSTOMER CARE', title: 'Returns & Exchanges',
    intro: 'If your order arrives damaged, incorrect, or materially different from what you ordered, contact PIERCYN promptly so the team can review it.',
    sections: [
      { title: 'Before contacting us', body: 'Keep the item, packaging and order reference. Take clear photos of any damage or incorrect item and do not alter or discard the item while your request is being reviewed.' },
      { title: 'Request a review', body: 'Message PIERCYN support with your order reference, a description of the issue and supporting photos. We will review the details and explain the available next steps.' },
      { title: 'Eligibility and refunds', body: 'A detailed, time-bound return or refund promise is not currently published here. Do not send an item back before support confirms the procedure and destination.' },
    ],
  },
  contact: {
    eyebrow: 'WE ARE HERE TO HELP', title: 'Contact PIERCYN',
    intro: 'For product questions, sizing, order updates, damaged or incorrect deliveries, and general support, contact us through the official WhatsApp support link.',
    sections: [
      { title: 'WhatsApp support', body: 'Send your question and include your order reference where relevant. Do not share passwords, payment PINs or one-time passcodes.' },
      { title: 'Order support', body: 'For an existing order, include the order reference and the phone number used at checkout. Support will ask for any additional information needed to verify the request.' },
      { title: 'From Lagos, Nigeria', body: 'PIERCYN focuses on expressive, accessible fashion. Product availability and fulfilment details should be confirmed before you place an order.' },
    ],
  },
  privacy: {
    eyebrow: 'YOUR INFORMATION', title: 'Privacy Policy',
    intro: 'PIERCYN processes information needed to operate the storefront, accept orders, provide delivery and support, protect the service, and attribute eligible affiliate referrals.',
    sections: [
      { title: 'Information collected', body: 'Checkout may collect your name, email address, phone number, delivery address, order notes and order details. The storefront may also process anonymous session identifiers, cart activity, product interactions, and referral attribution data.' },
      { title: 'Why it is used', body: 'Information is used to calculate and fulfil orders, communicate about delivery or support, maintain inventory and order records, prevent abuse, and operate affiliate attribution and commissions.' },
      { title: 'Service providers and access', body: 'PIERCYN uses application hosting, database and payment/delivery integrations configured for the service. Access to order and administrative information should be limited to people and providers who need it to operate the service.' },
      { title: 'Retention and requests', body: 'Order and accounting records may need to be retained for operational or legal reasons. For a privacy question or request to access, correct or delete information, contact PIERCYN support and identify the relevant order or contact details. Requests may be limited where records must be retained.' },
      { title: 'Payment details', body: 'Never send card PINs, passwords or one-time passcodes over WhatsApp. Payment status should be verified through the payment provider or PIERCYN’s backend records, not a screenshot alone.' },
    ],
  },
  terms: {
    eyebrow: 'PLEASE READ', title: 'Terms & Conditions',
    intro: 'By placing an order through PIERCYN, you confirm that the checkout information you provide is accurate and that you have reviewed the product, delivery and payment details shown before submission.',
    sections: [
      { title: 'Products and availability', body: 'Product images and descriptions are provided to help you make a choice. Availability can change, and an order is not proof that a supplier-held item has been confirmed unless PIERCYN explicitly confirms it.' },
      { title: 'Prices and order creation', body: 'Prices, discounts, stock and delivery charges are recalculated by the server during checkout. An order is created only after the backend accepts the submission; payment and fulfilment may still be pending.' },
      { title: 'Payment', body: 'Follow only the payment instructions presented by the live checkout or confirmed by official PIERCYN support. Do not rely on payment details copied from unofficial sources.' },
      { title: 'Delivery and support', body: 'Delivery timeframes are estimates. Contact support promptly if an item arrives damaged or incorrect, or if you need an update. Do not return items before support confirms the process.' },
      { title: 'Cancellations and changes', body: 'Contact support as soon as possible if you need to change or cancel an order. Requests may depend on whether payment, sourcing, packing or dispatch has already taken place.' },
    ],
  },
  'size-guide': {
    eyebrow: 'FIT & SIZING', title: 'Size Guide',
    intro: 'PIERCYN’s current range focuses on graphic tees and relaxed streetwear. Fit can vary by supplier, garment and cut, so check the measurements on the individual product where supplied.',
    sections: [
      { title: 'Choosing a size', body: 'Compare a garment you already own with the product’s confirmed measurements when available. Consider chest width, shoulder width and body length, not only the letter size.' },
      { title: 'Need a measurement?', body: 'If the product page does not show verified garment measurements, contact support with the product name and your preferred fit before ordering. We will confirm what information is available.' },
      { title: 'Important', body: 'Do not treat generic size charts as guaranteed measurements for every supplier or product. The product-specific details take precedence.' },
    ],
  },
  faq: {
    eyebrow: 'QUICK ANSWERS', title: 'Frequently Asked Questions',
    intro: 'The essentials for shopping PIERCYN online.',
    sections: [
      { title: 'How do I place an order?', body: 'Choose a product and its available variant, add it to your bag, enter your delivery details at checkout, select a delivery region and follow the payment instructions shown.' },
      { title: 'Do I need an account?', body: 'No customer account is required to place a guest order.' },
      { title: 'How much is delivery?', body: `Current configured rates are ₦${SHIPPING_CONFIG.lagosDeliveryFeeNGN.toLocaleString()} within Lagos and ₦${SHIPPING_CONFIG.nationwideDeliveryFeeNGN.toLocaleString()} nationwide below the ₦${SHIPPING_CONFIG.freeShippingThresholdNGN.toLocaleString()} free-delivery threshold. Checkout displays the final charge.` },
      { title: 'How long does delivery take?', body: `Current estimates are ${SHIPPING_CONFIG.lagosTimeframe.toLowerCase()} within Lagos and ${SHIPPING_CONFIG.nationwideTimeframe.toLowerCase()} nationwide. These are estimates, not guarantees.` },
      { title: 'Can I order an item that is not in stock?', body: 'Only order-to-source products whose availability and expected timeline have been explicitly confirmed by PIERCYN. The current storefront does not yet expose a verified supplier-confirmation status for catalogue items.' },
      { title: 'What if my order is damaged or incorrect?', body: 'Keep the item and packaging, take photos, and contact support with your order reference before returning anything.' },
      { title: 'How can I track an order?', body: 'Use the secure order link on the device used at checkout. If you no longer have that link, contact support; the storefront does not provide an open order-number lookup.' },
    ],
  },
  'track-order': {
    eyebrow: 'ORDER SUPPORT', title: 'Track an Order',
    intro: 'For privacy, PIERCYN does not expose customer order details through a public order-number search.',
    sections: [
      { title: 'Use your secure order link', body: 'After checkout, use the tracking link provided with your order confirmation on the device used to place the order.' },
      { title: 'Lost the link?', body: 'Contact official support with your order reference and the phone number used at checkout. Support can help verify your request before sharing order information.' },
    ],
  },
  'available-to-order': {
    eyebrow: 'SUPPLIER-SOURCED PIECES', title: 'Available to Order',
    intro: 'PIERCYN may expand its catalogue with supplier-sourced designs, but a supplier image alone is not confirmation that an item can be fulfilled.',
    sections: [
      { title: 'Availability must be confirmed', body: 'The current product model tracks active products and physical inventory, but it does not yet record verified supplier availability or a product-specific sourcing lead time. For that reason, this page does not label unverified products as available to order.' },
      { title: 'Ask before you pay', body: 'Message support with the product or design you are interested in. Do not submit payment for a supplier-sourced item until PIERCYN confirms availability, expected fulfilment timing and the applicable cancellation/refund process.' },
    ],
  },
};

export const StorefrontInfoPage: React.FC<StorefrontInfoPageProps> = ({ page, products, onViewProduct, onShop, onOpenSearch, onOpenCart, onOpenCheckout, isLoadingProducts = false, catalogError = null, onRetryProducts }) => {
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || '');
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return products.filter((product) => [product.name, product.description, product.category, product.tag || ''].some((value) => value.toLowerCase().includes(normalizedQuery)));
  }, [products, normalizedQuery]);

  const pageTitle = page === 'search' ? 'Search the Catalogue' : page === 'cart' ? 'Your Shopping Bag' : page === 'checkout' ? 'Secure Checkout' : page === 'order-confirmation' ? 'Order Confirmation' : copy[page].title;
  const eyebrow = page === 'search' ? 'FIND YOUR NEXT PIECE' : page === 'cart' ? 'YOUR SELECTION' : page === 'checkout' ? 'GUEST CHECKOUT' : page === 'order-confirmation' ? 'ORDER STATUS' : copy[page].eyebrow;

  return (
    <main className="min-h-[70vh] bg-[#F2F0EB] px-0 pb-20 pt-24 text-[#141414] sm:pt-28">
      <div className="piercyn-container mx-auto max-w-5xl">
        <button onClick={onShop} className="mb-8 inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6E6B65] hover:text-[#141414]"><ArrowLeft className="h-4 w-4" /> Back to shop</button>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#77736C]">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl font-editorial text-4xl italic leading-[1.02] tracking-[-0.035em] sm:text-6xl">{pageTitle}</h1>

        {page === 'search' ? (
          <section className="mt-8">
            <label htmlFor="storefront-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em]">Search products</label>
            <div className="flex gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#DAD8D1] bg-white px-4">
                <Search className="h-4 w-4 shrink-0 text-[#77736C]" />
                <input id="storefront-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a product name or category" className="min-h-12 w-full bg-transparent text-sm outline-none" />
              </div>
              <button onClick={() => setQuery(query.trim())} className="min-h-12 rounded-xl bg-[#141414] px-5 text-xs font-bold uppercase tracking-wider text-white">Search</button>
            </div>
            {catalogError ? <div className="mt-6 rounded-2xl border border-[#DAD8D1] p-8 text-center"><p className="font-editorial text-2xl italic">Catalogue unavailable</p><p className="mt-2 text-sm text-[#6E6B65]">{catalogError}</p>{onRetryProducts && <button onClick={onRetryProducts} className="mt-5 text-xs font-bold uppercase underline underline-offset-4">Try again</button>}</div> : isLoadingProducts ? <p className="mt-6 text-sm text-[#6E6B65]">Loading the latest catalogue…</p> : !normalizedQuery ? <p className="mt-6 text-sm text-[#6E6B65]">Enter a term to search the live catalogue.</p> : results.length === 0 ? <div className="mt-6 rounded-2xl border border-[#DAD8D1] p-8 text-center"><p className="font-editorial text-2xl italic">No pieces found</p><p className="mt-2 text-sm text-[#6E6B65]">Try another name or category.</p><button onClick={onShop} className="mt-5 text-xs font-bold uppercase underline underline-offset-4">Browse all pieces</button></div> : (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{results.map((product) => <button key={product.id} onClick={() => onViewProduct(product)} className="overflow-hidden rounded-xl border border-[#DAD8D1] bg-white text-left transition-transform hover:-translate-y-0.5"><div className="aspect-[3/4] bg-[#E8E6E1]">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-[#77736C]">Image unavailable</div>}</div><div className="p-3"><p className="line-clamp-2 text-sm font-semibold">{product.name}</p><p className="mt-2 text-xs text-[#6E6B65]">{formatNGN(product.priceNGN)}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-[#6E6B65]">{product.stock === undefined ? 'Availability not confirmed' : product.stock > 0 ? 'In stock' : 'Out of stock'}</p></div></button>)}</div>
            )}
          </section>
        ) : page === 'cart' ? (
          <section className="mt-6 max-w-2xl rounded-2xl border border-[#DAD8D1] bg-white p-6 sm:p-8"><p className="text-sm leading-7 text-[#5F5C56]">Your bag opens in the existing shopping-bag panel, where you can review variants, change quantities and continue to checkout.</p><button onClick={onOpenCart} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#141414] px-6 text-xs font-bold uppercase tracking-wider text-white">Open shopping bag <ArrowRight className="h-4 w-4" /></button></section>
        ) : page === 'checkout' ? (
          <section className="mt-6 max-w-2xl rounded-2xl border border-[#DAD8D1] bg-white p-6 sm:p-8"><p className="text-sm leading-7 text-[#5F5C56]">Checkout uses the existing server-validated order flow. Your order is not confirmed until the backend accepts the order submission.</p><button onClick={onOpenCheckout} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#141414] px-6 text-xs font-bold uppercase tracking-wider text-white">Continue to checkout <ArrowRight className="h-4 w-4" /></button></section>
        ) : page === 'order-confirmation' ? (
          <section className="mt-6 max-w-2xl rounded-2xl border border-[#DAD8D1] bg-white p-6 sm:p-8"><p className="text-sm leading-7 text-[#5F5C56]">A confirmation is shown only after an order is created by the backend. If you have just checked out, use the secure order link from the successful checkout flow. No order details are exposed on this generic URL.</p><a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#141414] px-6 text-xs font-bold uppercase tracking-wider text-white"><MessageCircle className="h-4 w-4" /> Contact support</a></section>
        ) : (
          <>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#5F5C56]">{copy[page].intro}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">{copy[page].sections.map((section) => <section key={section.title} className="rounded-2xl border border-[#DAD8D1] bg-white/70 p-5 sm:p-6"><h2 className="font-editorial text-2xl italic">{section.title}</h2><p className="mt-3 text-sm leading-7 text-[#5F5C56]">{section.body}</p></section>)}</div>
            <div className="mt-8 flex flex-wrap gap-3"><button onClick={onShop} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#141414] px-6 text-xs font-bold uppercase tracking-wider text-white">Shop all <ArrowRight className="h-4 w-4" /></button>{page !== 'available-to-order' && <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#141414]/25 px-6 text-xs font-bold uppercase tracking-wider"><MessageCircle className="h-4 w-4" /> WhatsApp support</a>}</div>
          </>
        )}
      </div>
    </main>
  );
};


export const HomepageAvailabilitySections: React.FC<{
  products: Product[];
  onViewProduct: (product: Product) => void;
  onBrowseShop: () => void;
  isLoadingProducts?: boolean;
  catalogError?: string | null;
}> = ({ products, onViewProduct, onBrowseShop, isLoadingProducts = false, catalogError = null }) => {
  const inStock = products.filter((product) => typeof product.stock === 'number' && product.stock > 0 && !product.isSoldOut).slice(0, 4);

  return (
    <section className="bg-[#F2F0EB] px-0 py-12 text-[#141414] sm:py-16">
      <div className="piercyn-container space-y-12 sm:space-y-16">
        <div>
          <div className="flex items-end justify-between gap-4 border-b border-[#DAD8D1] pb-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#77736C]">READY TO DISPATCH</p><h2 className="mt-2 font-editorial text-3xl italic sm:text-4xl">In stock now</h2></div>
            <button onClick={onBrowseShop} className="mb-1 inline-flex min-h-10 items-center gap-2 text-[10px] font-bold uppercase tracking-wider">Shop all <ArrowRight className="h-4 w-4" /></button>
          </div>
          {catalogError ? <p className="mt-5 max-w-2xl text-sm leading-7 text-[#8B3028]">The catalogue could not be loaded: {catalogError}</p> : isLoadingProducts ? <p className="mt-5 text-sm leading-7 text-[#5F5C56]">Checking live inventory…</p> : inStock.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">{inStock.map((product) => <button key={product.id} onClick={() => onViewProduct(product)} className="overflow-hidden rounded-xl border border-[#DAD8D1] bg-white text-left"><div className="aspect-[3/4] bg-[#E8E6E1]">{product.images?.[0] ? <img src={product.images[0]} alt={product.name} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-[#77736C]">Image unavailable</div>}</div><div className="p-3"><p className="line-clamp-2 text-sm font-semibold">{product.name}</p><p className="mt-2 text-xs text-[#6E6B65]">{formatNGN(product.priceNGN)}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-800"><PackageCheck className="mr-1 inline h-3.5 w-3.5" /> In stock</p></div></button>)}</div> : <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5F5C56]">No products with confirmed available stock are currently listed here. Inventory is never assumed when the catalogue does not provide it.</p>}
        </div>
        <div className="grid gap-5 rounded-2xl bg-[#141414] p-6 text-[#F2F0EB] sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">SUPPLIER-SOURCED DESIGNS</p><h2 className="mt-2 font-editorial text-3xl italic sm:text-4xl">Available to order</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Supplier availability and sourcing timelines must be confirmed before an item can be promised. We will not label unverified supplier designs as guaranteed stock.</p></div>
          <a href="/available-to-order" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-white hover:text-[#141414]">How it works <ArrowRight className="h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
};
