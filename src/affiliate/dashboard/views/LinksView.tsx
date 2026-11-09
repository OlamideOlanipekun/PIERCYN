import React, { useState } from 'react';
import {
  AffiliateLinkItem,
  AffiliateApiClient,
} from '../../../services/affiliateApi';
import {
  Link2,
  Plus,
  Copy,
  Check,
  QrCode,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { formatNGN, formatDate } from '../../types';
import { QrCodeModal } from '../../components/QrCodeModal';

interface LinksViewProps {
  links: AffiliateLinkItem[];
  onRefreshLinks: () => void;
  primaryReferralCode: string;
}

export const LinksView: React.FC<LinksViewProps> = ({
  links,
  onRefreshLinks,
  primaryReferralCode,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQr, setSelectedQr] = useState<{ url: string; title: string } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [linkName, setLinkName] = useState('');
  const [destinationType, setDestinationType] = useState<'homepage' | 'collection' | 'product'>('collection');
  const [customPath, setCustomPath] = useState('/shop?category=hoodies');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getFullUrl = (item: AffiliateLinkItem) => {
    const dest = item.destination.startsWith('/') ? item.destination : `/${item.destination}`;
    const separator = dest.includes('?') ? '&' : '?';
    return `https://piercyn.vercel.app${dest}${separator}ref=${item.referralCode}`;
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!linkName.trim()) {
      setErrorMsg('Please provide a campaign or link name.');
      return;
    }

    setIsSubmitting(true);
    try {
      let dest = '/';
      if (destinationType === 'collection') {
        dest = customPath.startsWith('/') ? customPath : `/${customPath}`;
      } else if (destinationType === 'product') {
        dest = customPath.startsWith('/') ? customPath : `/${customPath}`;
      }

      const res = await AffiliateApiClient.createLink({
        name: linkName.trim(),
        destination: dest,
        destinationType,
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        setLinkName('');
        onRefreshLinks();
      } else {
        setErrorMsg(res.error || 'Failed to create link.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while creating link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLinks = links.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.referralCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-up max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="bg-white border border-[#E5E2DC] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-[#737373]">
            Attribution Engine
          </span>
          <h2 className="text-2xl font-serif font-medium text-[#141414]">
            My Referral Links
          </h2>
          <p className="text-xs text-[#737373] mt-0.5">
            Generate and manage links with real-time click and conversion tracking.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-3 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Link</span>
        </button>
      </div>

      {/* Preset Curated Campaign Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* The Drop Campaign */}
        <div className="bg-[#FAF8F5] border border-[#E5E2DC] p-5 space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-widest bg-white border border-[#E5E2DC] px-2 py-0.5 font-semibold text-[#737373]">
              Collection Preset
            </span>
            <h4 className="font-serif font-medium text-base text-[#141414] mt-2">
              The Drop · Lagos Streetwear
            </h4>
            <p className="text-xs text-[#666666] mt-1">
              Links directly to limited releases and latest oversized cuts.
            </p>
          </div>
          <button
            onClick={() => {
              const url = `https://piercyn.vercel.app/shop?collection=the-drop&ref=${primaryReferralCode}`;
              handleCopy(url, 'preset-drop');
            }}
            className="w-full py-2 bg-white hover:bg-[#F2F0EB] border border-[#E5E2DC] text-xs font-semibold uppercase tracking-wider text-[#141414] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiedId === 'preset-drop' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedId === 'preset-drop' ? 'Copied' : 'Copy Drop Link'}
          </button>
        </div>

        {/* Heavyweight Hoodies */}
        <div className="bg-[#FAF8F5] border border-[#E5E2DC] p-5 space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-widest bg-white border border-[#E5E2DC] px-2 py-0.5 font-semibold text-[#737373]">
              Category Preset
            </span>
            <h4 className="font-serif font-medium text-base text-[#141414] mt-2">
              Heavyweight Hoodies
            </h4>
            <p className="text-xs text-[#666666] mt-1">
              Direct to 450 GSM French Terry and dense double-ribbed hoodies.
            </p>
          </div>
          <button
            onClick={() => {
              const url = `https://piercyn.vercel.app/shop?category=hoodies&ref=${primaryReferralCode}`;
              handleCopy(url, 'preset-hoodies');
            }}
            className="w-full py-2 bg-white hover:bg-[#F2F0EB] border border-[#E5E2DC] text-xs font-semibold uppercase tracking-wider text-[#141414] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiedId === 'preset-hoodies' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedId === 'preset-hoodies' ? 'Copied' : 'Copy Hoodies Link'}
          </button>
        </div>

        {/* Storefront Home */}
        <div className="bg-[#FAF8F5] border border-[#E5E2DC] p-5 space-y-3 flex flex-col justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-widest bg-white border border-[#E5E2DC] px-2 py-0.5 font-semibold text-[#737373]">
              Storefront
            </span>
            <h4 className="font-serif font-medium text-base text-[#141414] mt-2">
              Storefront Homepage
            </h4>
            <p className="text-xs text-[#666666] mt-1">
              Primary brand landing page with editorial lookbook and full catalog.
            </p>
          </div>
          <button
            onClick={() => {
              const url = `https://piercyn.vercel.app/?ref=${primaryReferralCode}`;
              handleCopy(url, 'preset-home');
            }}
            className="w-full py-2 bg-white hover:bg-[#F2F0EB] border border-[#E5E2DC] text-xs font-semibold uppercase tracking-wider text-[#141414] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiedId === 'preset-home' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedId === 'preset-home' ? 'Copied' : 'Copy Store Link'}
          </button>
        </div>
      </div>

      {/* Active Links Directory */}
      <div className="bg-white border border-[#E5E2DC] shadow-sm">
        <div className="p-5 border-b border-[#E5E2DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm font-serif font-medium text-[#141414]">
            Active Links Directory ({filteredLinks.length})
          </div>
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search links by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#E5E2DC] text-xs text-[#141414] focus:outline-none focus:border-[#141414]"
            />
            <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-2.5" />
          </div>
        </div>

        {filteredLinks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#737373]">
            No referral links matching your search.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E2DC]">
            {filteredLinks.map((link) => {
              const fullUrl = getFullUrl(link);
              const isCopied = copiedId === link.id;
              const waText = encodeURIComponent(`Explore PIERCYN: ${fullUrl}`);
              const waLink = `https://wa.me/?text=${waText}`;

              return (
                <div
                  key={link.id}
                  className="p-5 sm:p-6 hover:bg-[#FAF8F5]/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-serif font-medium text-base text-[#141414] truncate">
                        {link.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#F2F0EB] text-[#737373] font-semibold border border-[#E5E2DC]">
                        {link.destinationType || 'custom'}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#555555] truncate max-w-xl">
                      {fullUrl}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-[#737373] pt-1">
                      <span>Created {formatDate(link.createdAt)}</span>
                      <span>·</span>
                      <span className="font-semibold text-[#141414]">
                        {link.clickCount || 0} clicks
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-[#141414]">
                        {link.orderCount || 0} orders
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-[#141414]">
                        {formatNGN((link.orderCount || 0) * 800)} earned
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                    <button
                      onClick={() => handleCopy(fullUrl, link.id)}
                      className="px-4 py-2 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedQr({ url: fullUrl, title: link.name })}
                      className="p-2 border border-[#E5E2DC] hover:border-[#141414] text-[#141414] hover:bg-white transition-all cursor-pointer"
                      title="View QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-[#E5E2DC] hover:border-[#141414] text-[#141414] hover:bg-white transition-all"
                      title="Share to WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-[#E5E2DC] hover:border-[#141414] text-[#737373] hover:text-[#141414] hover:bg-white transition-all"
                      title="Test Link Destination"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Link Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
          <div className="w-full max-w-md bg-white border border-[#E5E2DC] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC] bg-[#F2F0EB]">
              <h3 className="font-serif text-lg font-medium text-[#141414]">
                Create Campaign Referral Link
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#737373] hover:text-[#141414]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-[#FDF2F2] border border-[#FCA5A5] text-[#7F1D1D] text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                  Campaign / Link Name *
                </label>
                <input
                  type="text"
                  required
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  placeholder="e.g. Instagram Bio, TikTok Drop Review"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs text-[#141414] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                  Destination Type
                </label>
                <select
                  value={destinationType}
                  onChange={(e) => {
                    const dt = e.target.value as any;
                    setDestinationType(dt);
                    if (dt === 'homepage') setCustomPath('/');
                    if (dt === 'collection') setCustomPath('/shop?category=hoodies');
                    if (dt === 'product') setCustomPath('/product/oversized-tee');
                  }}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs text-[#141414] focus:outline-none"
                >
                  <option value="collection">Collection / Category</option>
                  <option value="homepage">Storefront Homepage</option>
                  <option value="product">Specific Product</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-[#141414]">
                  Target Path
                </label>
                <input
                  type="text"
                  required
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="/shop?category=hoodies"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5E2DC] focus:border-[#141414] text-xs font-mono text-[#141414] focus:outline-none"
                />
                <span className="text-[10px] text-[#737373]">
                  Your unique referral parameter will be appended automatically.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E2DC] text-xs uppercase tracking-wider font-semibold text-[#737373] hover:text-[#141414]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-wider font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQr && (
        <QrCodeModal
          isOpen={Boolean(selectedQr)}
          onClose={() => setSelectedQr(null)}
          url={selectedQr.url}
          title={selectedQr.title}
        />
      )}
    </div>
  );
};

