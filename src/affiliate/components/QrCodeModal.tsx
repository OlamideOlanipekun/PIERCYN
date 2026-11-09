import React, { useState } from 'react';
import { X, Download, Copy, Check, ExternalLink } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodedUrl}&format=png&color=14-14-14&bgcolor=FFFFFF&margin=2`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `piercyn-qr-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="relative w-full max-w-sm bg-white rounded-none border border-[#E5E2DC] shadow-2xl overflow-hidden text-center">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E2DC] bg-[#F2F0EB]">
          <span className="text-[10px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
            Affiliate QR Code
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-[#141414] hover:bg-[#E5E2DC]/50 rounded-none transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <h3 className="font-serif text-lg text-[#141414] mb-1 font-medium">{title}</h3>
          <p className="text-xs text-[#737373] mb-5 max-w-xs">
            Scan to open your personalized referral link with automatic attribution.
          </p>

          {/* QR Code Container */}
          <div className="p-4 bg-white border border-[#E5E2DC] shadow-sm mb-5">
            <img
              src={qrImageUrl}
              alt={`QR Code for ${url}`}
              className="w-48 h-48 object-contain"
              loading="lazy"
            />
          </div>

          <div className="w-full bg-[#FAF8F5] border border-[#E5E2DC] p-2.5 mb-5 text-left flex items-center justify-between">
            <span className="text-xs text-[#555555] truncate max-w-[200px] font-mono">{url}</span>
            <button
              onClick={handleCopy}
              className="text-xs font-semibold text-[#141414] flex items-center gap-1 hover:underline ml-2 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={handleDownload}
              className="w-full py-2.5 border border-[#141414] text-[#141414] hover:bg-[#F2F0EB] text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Save PNG
            </button>
            <button
              onClick={handleCopy}
              className="w-full py-2.5 bg-[#141414] hover:bg-[#262626] text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

