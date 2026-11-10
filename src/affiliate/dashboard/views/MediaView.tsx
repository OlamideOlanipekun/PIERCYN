import React, { useState, useEffect } from 'react';
import { MediaItem, AffiliateApiClient } from '../../../services/affiliateApi';
import { downloadProductImage } from '../../../utils/downloadImage';
import {
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Eye,
  Filter,
  ExternalLink,
  Sparkles,
  X,
  FileText,
  Share2,
  Loader2,
} from 'lucide-react';

interface MediaViewProps {
  primaryReferralCode: string;
}

export const MediaView: React.FC<MediaViewProps> = ({ primaryReferralCode }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [copiedCaptionIdx, setCopiedCaptionIdx] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const referralUrl = `https://piercyn.vercel.app/?ref=${primaryReferralCode}`;

  // Default brand assets fallback if database is empty
  const defaultAssets: MediaItem[] = [
    {
      id: 'asset-1',
      title: 'PIERCYN Campaign Editorial 01',
      description: 'Handmade heavyweight garments photographed in Lagos, Nigeria.',
      category: 'campaign',
      mediaType: 'IMAGE',
      url: '/images/affiliate-campaign.webp',
      thumbnailUrl: '/images/affiliate-campaign.webp',
      dimensions: '2000 x 2500 px',
      fileSize: '1.2 MB',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'asset-2',
      title: 'Lagos Streetwear Hero Shoot',
      description: 'Signature drop-shoulder silhouettes and dense fabric textures.',
      category: 'campaign',
      mediaType: 'IMAGE',
      url: '/images/affiliate-hero.webp',
      thumbnailUrl: '/images/affiliate-hero.webp',
      dimensions: '1920 x 1080 px',
      fileSize: '1.8 MB',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'asset-3',
      title: 'Heavyweight French Terry Hoodies',
      description: 'Studio product detail showcasing double-ribbed construction.',
      category: 'product',
      mediaType: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=600&auto=format&fit=crop',
      dimensions: '1600 x 2000 px',
      fileSize: '950 KB',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'asset-4',
      title: 'Raw Bone & Onyx Capsule Poster',
      description: 'Vertical 9:16 layout optimized for Instagram Stories and TikTok.',
      category: 'vertical',
      mediaType: 'IMAGE',
      url: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1200&auto=format&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=600&auto=format&fit=crop',
      dimensions: '1080 x 1920 px (9:16)',
      fileSize: '840 KB',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    let isMounted = true;
    AffiliateApiClient.getMedia()
      .then((res) => {
        if (isMounted) {
          if (res.success && res.data && res.data.length > 0) {
            setMediaItems(res.data);
          } else {
            setMediaItems(defaultAssets);
          }
        }
      })
      .catch(() => {
        if (isMounted) setMediaItems(defaultAssets);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const captionTemplates = [
    {
      title: 'Instagram Feed / Carousel Caption',
      tag: 'Instagram Feed',
      text: `Crafted in Lagos, built for permanence. Heavyweight silhouettes, dense organic cotton, and zero compromises on cut. Check out the latest PIERCYN collection at ${referralUrl} #PIERCYNpartner #LagosStreetwear`,
    },
    {
      title: 'TikTok & Reels Hook Caption',
      tag: 'Reels / TikTok',
      text: `If you appreciate structured streetwear that actually holds its shape after 50 washes, PIERCYN is the brand to watch. Explore the full drop through my link: ${referralUrl}`,
    },
    {
      title: 'WhatsApp Broadcast / Community Message',
      tag: 'WhatsApp Broadcast',
      text: `Hey guys, PIERCYN just released new pieces in their Lagos collection. The fabric quality on these hoodies and oversized tees is genuinely top tier. Check them out here: ${referralUrl}`,
    },
  ];

  const handleCopyCaption = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCaptionIdx(idx);
    setTimeout(() => setCopiedCaptionIdx(null), 2000);
  };

  const handleDownload = async (item: MediaItem) => {
    const url = item.downloadUrl || item.url;
    if (!url) return;

    setDownloadingId(item.id);
    try {
      const fileName = `piercyn-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const success = await downloadProductImage(url, fileName);
      if (success) {
        setDownloadedId(item.id);
        setTimeout(() => setDownloadedId(null), 2500);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredItems = mediaItems.filter((item) => {
    if (categoryFilter === 'ALL') return true;
    return (item.category || '').toLowerCase() === categoryFilter.toLowerCase();
  });

  return (
    <div className="space-y-10 animate-fade-up max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
            Creative Studio
          </span>
          <h2 className="text-2xl font-serif font-medium text-[#141414]">
            Media & Asset Library
          </h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Download high-resolution official PIERCYN lookbooks, reels, and copy-ready captions.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'campaign', 'product', 'vertical'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${categoryFilter === cat
                  ? 'bg-[#141414] text-white'
                  : 'bg-[#FAF8F5] border border-[#E5E2DC] text-[#555555] hover:border-[#141414]'
                }`}
            >
              {cat === 'ALL'
                ? 'All Assets'
                : cat === 'vertical'
                  ? '9:16 Vertical / Reels'
                  : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group bg-white border border-[#E5E2DC] hover:border-[#141414] transition-all flex flex-col justify-between overflow-hidden shadow-sm"
          >
            <div className="aspect-[4/3] bg-[#F2F0EB] relative overflow-hidden">
              <img
                src={item.thumbnailUrl || item.url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute top-2 left-2 bg-[#141414]/90 text-white text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5">
                {item.category || 'Asset'}
              </div>
              <button
                onClick={() => setPreviewItem(item)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity gap-2 text-xs font-semibold uppercase tracking-wider"
              >
                <Eye className="w-4 h-4" /> Quick Preview
              </button>
            </div>

            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-serif font-medium text-sm text-[#141414] truncate">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-[#666666] line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[#E5E2DC] flex items-center justify-between text-[10px] text-[#737373]">
                <span>{item.dimensions || 'High Resolution'}</span>
                {item.fileSize && <span>{item.fileSize}</span>}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  disabled={downloadingId === item.id}
                  className="w-full py-2 bg-[#FAF8F5] hover:bg-[#141414] hover:text-white border border-[#E5E2DC] text-[#141414] text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloadingId === item.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : downloadedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Saved Asset</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Asset</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Copy-Ready Social Captions Section */}
      <div className="bg-white border border-[#E5E2DC] shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#E5E2DC] pb-4">
          <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
            Curated Copy Suite
          </span>
          <h3 className="text-lg font-serif font-medium text-[#141414]">
            Ready-to-Post Captions & Hooks
          </h3>
          <p className="text-xs text-[#737373] mt-0.5">
            Pre-written captions tuned for high engagement. Your referral link is already embedded.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {captionTemplates.map((template, idx) => (
            <div
              key={idx}
              className="bg-[#FAF8F5] border border-[#E5E2DC] p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 bg-white border border-[#E5E2DC] text-[#737373]">
                    {template.tag}
                  </span>
                </div>
                <h4 className="font-serif font-medium text-sm text-[#141414]">
                  {template.title}
                </h4>
                <p className="text-xs text-[#555555] leading-relaxed italic bg-white p-3 border border-[#E5E2DC]">
                  "{template.text}"
                </p>
              </div>

              <button
                onClick={() => handleCopyCaption(template.text, idx)}
                className="w-full py-2 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCaptionIdx === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCaptionIdx === idx ? 'Copied to Clipboard' : 'Copy Caption'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-up">
          <div className="relative max-w-2xl w-full bg-white border border-[#E5E2DC] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC] bg-[#F2F0EB]">
              <span className="font-serif font-medium text-base text-[#141414]">
                {previewItem.title}
              </span>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 text-[#737373] hover:text-[#141414]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden bg-black flex items-center justify-center">
              <img
                src={previewItem.url}
                alt={previewItem.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="p-4 bg-white border-t border-[#E5E2DC] flex items-center justify-between">
              <div className="text-xs text-[#737373]">
                {previewItem.dimensions} · {previewItem.fileSize}
              </div>
              <button
                type="button"
                onClick={() => handleDownload(previewItem)}
                disabled={downloadingId === previewItem.id}
                className="px-4 py-2 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {downloadingId === previewItem.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : downloadedId === previewItem.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Full Quality</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

