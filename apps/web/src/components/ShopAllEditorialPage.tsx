import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ShopAllEditorialPageProps {
  products: Product[];
  onViewProduct: (product: Product) => void;
}

type CollectionKey = Product['collection'];

const COLLECTION_META: Record<CollectionKey, { title: string; eyebrow: string; description: string }> = {
  everyday: {
    title: 'THE EVERYDAY',
    eyebrow: '01 / EVERYDAY ROTATION',
    description: 'Easy pieces for daily rotation. Built for repeat wear.',
  },
  'after-dark': {
    title: 'AFTER DARK',
    eyebrow: '02 / AFTER HOURS',
    description: 'Graphic statements and darker tones for after-hours plans.',
  },
  essentials: {
    title: 'ESSENTIALS',
    eyebrow: '03 / THE FOUNDATIONS',
    description: 'The dependable pieces that make getting dressed simple.',
  },
  'the-drop': {
    title: 'THE DROP',
    eyebrow: '04 / FRESH FINDS',
    description: 'New designs and limited finds from the current edit.',
  },
};

const COLLECTION_ORDER: CollectionKey[] = ['everyday', 'after-dark', 'essentials', 'the-drop'];

const formatCount = (count: number) => String(count).padStart(2, '0');

export const ShopAllEditorialPage: React.FC<ShopAllEditorialPageProps> = ({
  products,
  onViewProduct,
}) => {
  const [activeCollection, setActiveCollection] = useState<CollectionKey | null>(() => {
    const requested = new URLSearchParams(window.location.search).get('collection');
    return COLLECTION_ORDER.includes(requested as CollectionKey) ? requested as CollectionKey : null;
  });
  const [search, setSearch] = useState('');

  // The public storefront only renders published products. Products are grouped by
  // their existing admin-assigned collection field; no duplicate catalogue is kept here.
  const publishedProducts = useMemo(
    () => products.filter((product) => product.status !== 'draft' && product.status !== 'archived'),
    [products],
  );

  const searchedProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return publishedProducts;
    return publishedProducts.filter((product) =>
      [product.name, product.description, product.category, product.collection]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [publishedProducts, search]);

  const groups = useMemo(() => COLLECTION_ORDER
    .map((key) => ({
      key,
      meta: COLLECTION_META[key],
      products: searchedProducts.filter((product) => product.collection === key),
    }))
    .filter((group) => group.products.length > 0), [searchedProducts]);

  const selectedGroup = activeCollection
    ? groups.find((group) => group.key === activeCollection)
    : undefined;

  const openCollection = (key: CollectionKey | null) => {
    setActiveCollection(key);
    const url = key ? `/shop?collection=${encodeURIComponent(key)}` : '/shop';
    window.history.pushState({ page: 'shop', collection: key }, '', url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main id="piercyn-shop-all" className="min-h-screen bg-[#F2F0EB] text-[#141414] pt-[56px] sm:pt-[60px] pb-20">
      <section className="relative overflow-hidden bg-[#141414] text-[#F2F0EB]">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10 sm:h-[30rem] sm:w-[30rem]" />
        <div className="pointer-events-none absolute -right-4 -top-12 h-56 w-56 rounded-full border border-white/10 sm:right-8 sm:top-0 sm:h-[22rem] sm:w-[22rem]" />
        <div className="piercyn-container relative py-12 sm:py-20 lg:py-24">
          <div className="mb-5 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#C6C0B4] sm:text-[11px]">
            <span className="h-px w-7 bg-[#C6C0B4]" />
            PIERCYN / THE STORE
          </div>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-editorial text-[clamp(3.25rem,10vw,8rem)] leading-[0.84] tracking-[-0.055em]">
                {selectedGroup ? selectedGroup.meta.title : <>SHOP<br /><span className="italic text-[#C6C0B4]">ALL.</span></>}
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-[#F2F0EB]/70 sm:text-base sm:leading-7">
                {selectedGroup
                  ? selectedGroup.meta.description
                  : 'Find your next everyday favourite. Explore the edits, discover new designs, and shop the pieces that fit your style — without stretching your budget.'}
              </p>
            </div>
            <div className="flex shrink-0 items-end gap-5 border-t border-white/20 pt-4 md:border-t-0 md:pt-0">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">AVAILABLE PIECES</span>
                <span className="mt-1 block font-editorial text-4xl">{formatCount(selectedGroup ? selectedGroup.products.length : searchedProducts.length)}</span>
              </div>
              {selectedGroup && (
                <button onClick={() => openCollection(null)} className="mb-1 inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75 transition-colors hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> ALL EDITS
                </button>
              )}
            </div>
          </div>
          <div className="mt-9 flex flex-col gap-3 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search designs, categories..."
                aria-label="Search products"
                className="min-h-12 w-full rounded-full border border-white/20 bg-white/[0.06] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/60"
              />
            </label>
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/50">
              CURATED FOR YOUR ROTATION <span className="mx-2">/</span> LAGOS, NIGERIA
            </p>
          </div>
        </div>
      </section>

      {selectedGroup ? (
        <section className="piercyn-container py-9 sm:py-14">
          <div className="mb-7 flex items-end justify-between gap-4 border-b border-[#DAD8D1] pb-4">
            <div>
              <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#77736B]">{selectedGroup.meta.eyebrow}</p>
              <h2 className="font-editorial text-3xl sm:text-5xl">{selectedGroup.meta.title}</h2>
            </div>
            <span className="pb-1 text-[10px] font-mono text-[#77736B]">{selectedGroup.products.length} PIECES</span>
          </div>
          {selectedGroup.products.length ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
              {selectedGroup.products.map((product, index) => (
                <ProductCard key={product.id} product={product} onViewProduct={onViewProduct} priority={index < 4} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-[#77736B]">No published pieces match this search yet.</p>
          )}
        </section>
      ) : (
        <div className="piercyn-container">
          <div className="flex items-center justify-between border-b border-[#DAD8D1] py-5">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#77736B]">THE COLLECTION EDITS</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#77736B]">{groups.length} EDITS</span>
          </div>

          {groups.length === 0 ? (
            <div className="py-20 text-center">
              <h2 className="font-editorial text-3xl">NOTHING FOUND</h2>
              <p className="mt-3 text-sm text-[#77736B]">Try another search or clear the search field.</p>
              <button onClick={() => setSearch('')} className="mt-5 min-h-11 rounded-full bg-[#141414] px-6 text-xs font-bold uppercase tracking-widest text-[#F2F0EB]">Clear search</button>
            </div>
          ) : groups.map((group, groupIndex) => {
            const leadProduct = group.products[0];
            const leadImage = leadProduct.colors?.[0]?.image || leadProduct.productShotUrl || leadProduct.images?.[0] || '';
            return (
              <section key={group.key} className="border-b border-[#DAD8D1] py-9 sm:py-14">
                <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
                  <div>
                    <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#77736B]">{group.meta.eyebrow}</p>
                    <h2 className="font-editorial text-3xl leading-none tracking-[-0.03em] sm:text-5xl">{group.meta.title}</h2>
                    <p className="mt-3 max-w-md text-xs leading-5 text-[#625F58] sm:text-sm">{group.meta.description}</p>
                  </div>
                  <button
                    onClick={() => openCollection(group.key)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#141414]/25 px-4 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-[#141414] hover:text-[#F2F0EB] sm:px-5"
                    aria-label={`View all ${group.meta.title.toLowerCase()} pieces`}
                  >
                    VIEW ALL <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4">
                  {group.products.slice(0, 8).map((product, index) => (
                    <ProductCard key={product.id} product={product} onViewProduct={onViewProduct} priority={groupIndex === 0 && index < 2} />
                  ))}
                </div>
                {group.products.length > 8 && (
                  <div className="mt-6 flex justify-center sm:mt-8">
                    <button onClick={() => openCollection(group.key)} className="inline-flex min-h-11 items-center gap-2 border-b border-[#141414] px-1 text-[10px] font-bold uppercase tracking-[0.18em]">
                      VIEW ALL <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <section className="piercyn-container pt-10">
        <div className="flex flex-col gap-4 border-t border-[#DAD8D1] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#77736B]">The right fit, the right price. Discover the full PIERCYN edit.</p>
          {activeCollection && (
            <button onClick={() => openCollection(null)} className="inline-flex min-h-11 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
              <SlidersHorizontal className="h-4 w-4" /> BACK TO SHOP ALL
            </button>
          )}
        </div>
      </section>
    </main>
  );
};
