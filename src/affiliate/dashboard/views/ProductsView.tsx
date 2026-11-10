import React, { useState, useEffect } from 'react';
import { Product } from '../../../types';
import { catalogService } from '../../../services/catalogService';
import { PRODUCTS } from '../../../data/products';
import { formatNGN } from '../../types';
import { downloadProductImage } from '../../../utils/downloadImage';
import {
  ShoppingBag,
  Search,
  Filter,
  Link2,
  Copy,
  Check,
  Download,
  Share2,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface ProductsViewProps {
  primaryReferralCode: string;
  onLinkGenerated?: (linkUrl: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  primaryReferralCode,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    catalogService
      .getProducts()
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setProducts(items);
        } else if (isMounted) {
          setProducts(PRODUCTS);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProducts(PRODUCTS);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getProductReferralUrl = (p: Product) => {
    const slug = p.slug || p.id;
    return `https://piercyn.vercel.app/product/${slug}?ref=${primaryReferralCode}`;
  };

  const handleCopyLink = (p: Product) => {
    const url = getProductReferralUrl(p);
    navigator.clipboard.writeText(url);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadImage = async (p: Product) => {
    const imgUrl = p.images?.[0] || p.colors?.[0]?.image;
    if (!imgUrl) return;

    setDownloadingId(p.id);
    try {
      const fileName = `piercyn-${p.slug || p.id}`;
      const success = await downloadProductImage(imgUrl, fileName);
      if (success) {
        setDownloadedId(p.id);
        setTimeout(() => setDownloadedId(null), 2500);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.fabric && p.fabric.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'NEW') return Boolean(p.isNewDrop);
    if (categoryFilter === 'BEST') return Boolean(p.isBestSeller);
    if (categoryFilter === 'IN_STOCK') return !p.isSoldOut && (p.stock === undefined || p.stock > 0);
    return (p.category || '').toLowerCase() === categoryFilter.toLowerCase();
  });

  const categories = [
    { id: 'ALL', label: 'All Pieces' },
    { id: 'NEW', label: 'New In' },
    { id: 'BEST', label: 'Best Sellers' },
    { id: 'hoodies', label: 'Hoodies' },
    { id: 'tees', label: 'Tees' },
    { id: 'pants', label: 'Pants & Cargo' },
    { id: 'outerwear', label: 'Outerwear' },
    { id: 'accessories', label: 'Caps & Accessories' },
    { id: 'IN_STOCK', label: 'In Stock Only' },
  ];

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
            Curated Catalog
          </span>
          <h2 className="text-2xl font-serif font-medium text-[#141414]">
            Products & Link Generator
          </h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Share individual pieces with your audience. Earn ₦1,000 on every delivered referral.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Search piece, fabric, fit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
          />
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === cat.id
                ? 'bg-[#141414] text-white'
                : 'bg-white border border-[#E5E2DC] text-[#555555] hover:border-[#141414]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white border border-[#E5E2DC] p-4 space-y-4 animate-pulse">
              <div className="aspect-[3/4] bg-[#E5E2DC]" />
              <div className="h-4 bg-[#E5E2DC] w-3/4" />
              <div className="h-3 bg-[#E5E2DC] w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#E5E2DC] p-16 text-center space-y-3">
          <ShoppingBag className="w-8 h-8 text-[#A3A3A3] mx-auto" />
          <h4 className="font-serif text-lg text-[#141414]">No products match your filter</h4>
          <p className="text-xs text-[#737373]">
            Try clearing the search query or selecting a different category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
            }}
            className="px-4 py-2 border border-[#141414] text-xs uppercase tracking-wider font-semibold hover:bg-[#FAF8F5]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const productUrl = getProductReferralUrl(product);
            const isCopied = copiedId === product.id;
            const img = product.images?.[0] || product.colors?.[0]?.image;
            const altImg = product.images?.[1] || product.colors?.[0]?.altImage;
            const waText = encodeURIComponent(
              `Check out the PIERCYN ${product.name}: ${productUrl}`
            );
            const waLink = `https://wa.me/?text=${waText}`;

            return (
              <div
                key={product.id}
                className="group bg-white border border-[#E5E2DC] hover:border-[#141414] transition-all flex flex-col justify-between overflow-hidden shadow-sm"
              >
                {/* Image Section */}
                <div className="aspect-[3/4] bg-[#F2F0EB] relative overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs uppercase tracking-widest text-[#737373]">
                      PIERCYN
                    </div>
                  )}

                  {/* Commission Badge */}
                  <div className="absolute top-3 left-3 bg-[#141414] text-white text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 z-10 shadow-sm">
                    ₦1,000 Commission
                  </div>

                  {/* Stock tag */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#141414] text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 border border-[#E5E2DC] z-10">
                    {product.isSoldOut ? 'Sold Out' : 'Available'}
                  </div>

                  {/* Direct Download Icon on Image */}
                  {img && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(product);
                      }}
                      title="Download image"
                      aria-label={`Download image for ${product.name}`}
                      disabled={downloadingId === product.id}
                      className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-[#141414] p-2 border border-[#E5E2DC] shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer z-10 flex items-center justify-center disabled:opacity-50"
                    >
                      {downloadingId === product.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : downloadedId === product.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#737373]">
                      <span>{product.category || 'Apparel'}</span>
                      {product.gsm && <span>{product.gsm}</span>}
                    </div>
                    <h3 className="font-serif font-medium text-sm text-[#141414] truncate">
                      {product.name}
                    </h3>
                    <div className="text-xs font-semibold text-[#141414]">
                      {formatNGN(product.priceNGN)}
                    </div>
                  </div>

                  {/* Available sizes */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="flex items-center gap-1 pt-1 text-[10px] text-[#737373]">
                      <span>Sizes:</span>
                      <span className="font-mono text-[#141414]">{product.sizes.join(', ')}</span>
                    </div>
                  )}

                  {/* Affiliate Actions */}
                  <div className="pt-3 border-t border-[#E5E2DC] space-y-2">
                    <button
                      onClick={() => handleCopyLink(product)}
                      className="w-full py-2 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Link Copied' : 'Generate Link'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 bg-[#FAF8F5] hover:bg-[#F2F0EB] border border-[#E5E2DC] text-[11px] font-semibold uppercase tracking-wider text-[#141414] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(product)}
                        disabled={downloadingId === product.id}
                        className="py-1.5 bg-[#FAF8F5] hover:bg-[#F2F0EB] border border-[#E5E2DC] text-[11px] font-semibold uppercase tracking-wider text-[#141414] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {downloadingId === product.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : downloadedId === product.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Saved</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

