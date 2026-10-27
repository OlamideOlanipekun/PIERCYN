import React, { useEffect, useMemo } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { formatSeoTitle } from '../utils/seo';

const COLLECTIONS: Record<string, { title: string; description: string; categories: string[] }> = {
  'mens-tshirts': { title: "MEN'S T-SHIRTS", description: 'Everyday essentials, cut for Lagos heat and daily rotation.', categories: ['tees', 't-shirts'] },
  hoodies: { title: 'HOODIES', description: 'Layering pieces built for comfort, structure, and repeat wear.', categories: ['hoodies', 'sweatshirts'] },
  trousers: { title: 'TROUSERS', description: 'Contemporary trousers and cargos for a composed everyday uniform.', categories: ['trousers', 'jeans'] },
};

interface CollectionPageProps {
  slug: string;
  products: Product[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewProduct: (product: Product) => void;
  onBackToShop: () => void;
  onNotFound: () => void;
}

export const CollectionPage: React.FC<CollectionPageProps> = ({ slug, products, loading, error, onRetry, onViewProduct, onBackToShop, onNotFound }) => {
  const collection = COLLECTIONS[slug];
  const matchingProducts = useMemo(() => {
    if (!collection) return [];
    return products.filter((product) => collection.categories.includes(product.category) || product.collection === slug);
  }, [collection, products, slug]);

  useEffect(() => {
    if (!collection && !loading) onNotFound();
  }, [collection, loading, onNotFound]);
  useEffect(() => {
    if (collection) {
      const title = collection.title === "MEN'S T-SHIRTS" ? "Men's T-shirts" : collection.title.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
      document.title = formatSeoTitle(`${title} Collection | PIERCYN Lagos`);
    }
  }, [collection]);
  if (!collection) return null;

  return (
    <main className="min-h-screen bg-[#F2F0EB] pt-24 pb-20 text-[#141414]">
      <div className="piercyn-container">
        <button onClick={onBackToShop} className="mb-7 inline-flex min-h-11 items-center gap-2 text-xs font-mono font-semibold tracking-wider hover:opacity-60">
          <ArrowLeft className="h-4 w-4" /> SHOP ALL
        </button>
        <header className="mb-10 border-b border-[#DAD8D1] pb-7">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#7A7771]">PIERCYN COLLECTION</span>
          <h1 className="mt-2 font-editorial text-4xl italic sm:text-6xl">{collection.title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6E6B65]">{collection.description}</p>
        </header>

        {loading ? <div className="py-20 text-center text-sm text-[#6E6B65]">Loading collection…</div> : error ? (
          <div className="rounded-xl border border-[#DAD8D1] p-8 text-center"><p className="text-sm">We could not load this collection.</p><button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#141414] px-5 py-3 text-xs font-semibold text-white"><RefreshCw className="h-4 w-4" /> TRY AGAIN</button></div>
        ) : matchingProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#DAD8D1] p-10 text-center"><h2 className="font-editorial text-2xl italic">NO PIECES IN THIS DROP YET</h2><button onClick={onBackToShop} className="mt-4 text-xs font-semibold underline">EXPLORE ALL PIECES</button></div>
        ) : <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">{matchingProducts.map((product) => <ProductCard key={product.id} product={product} onViewProduct={onViewProduct} />)}</div>}
      </div>
    </main>
  );
};
