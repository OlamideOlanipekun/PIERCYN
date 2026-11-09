import React from 'react';
import { X, Mail, MessageCircle, HelpCircle, ArrowUpRight, Clock } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateEmail?: string;
  affiliateCode?: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  affiliateEmail,
  affiliateCode,
}) => {
  if (!isOpen) return null;

  const mailtoSubject = encodeURIComponent(`Affiliate Support Request [${affiliateCode || 'General'}]`);
  const mailtoBody = encodeURIComponent(
    `Hello PIERCYN Affiliate Team,\n\nAffiliate Code: ${affiliateCode || 'N/A'}\nEmail: ${affiliateEmail || 'N/A'}\n\nMy Question or Request:\n`
  );

  const whatsappMessage = encodeURIComponent(
    `Hi PIERCYN Creator Support, I need assistance with my affiliate account (Code: ${affiliateCode || 'N/A'}).`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="relative w-full max-w-lg bg-white rounded-none border border-[#E5E2DC] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E2DC] bg-[#F2F0EB]">
          <div>
            <span className="text-[10px] tracking-[0.24em] font-semibold uppercase text-[#737373]">
              PIERCYN Concierge
            </span>
            <h2 className="text-xl font-serif tracking-tight text-[#141414] mt-0.5">
              Affiliate Support
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#737373] hover:text-[#141414] hover:bg-[#E5E2DC]/50 rounded-none transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-[#555555] leading-relaxed">
            Need help with your referral links, payout verification, or campaign assets? Our dedicated creator relations desk is here to assist.
          </p>

          <div className="space-y-3">
            {/* Direct WhatsApp */}
            <a
              href={`https://wa.me/2348140000000?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 border border-[#E5E2DC] hover:border-[#141414] bg-[#FAF8F5] hover:bg-white transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#141414] text-white flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#141414]">WhatsApp Creator Desk</h4>
                  <span className="text-xs text-[#737373]">Fastest response · Mon–Sat 9am–6pm</span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#737373] group-hover:text-[#141414] transition-colors" />
            </a>

            {/* Email Support */}
            <a
              href={`mailto:affiliates@piercyn.com?subject=${mailtoSubject}&body=${mailtoBody}`}
              className="group flex items-center justify-between p-4 border border-[#E5E2DC] hover:border-[#141414] bg-[#FAF8F5] hover:bg-white transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#141414] text-white flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#141414]">Email Creator Operations</h4>
                  <span className="text-xs text-[#737373]">affiliates@piercyn.com · Response within 24h</span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#737373] group-hover:text-[#141414] transition-colors" />
            </a>
          </div>

          <div className="p-4 bg-[#F2F0EB] border border-[#E5E2DC] flex items-start gap-3 text-xs text-[#555555]">
            <Clock className="w-4 h-4 text-[#141414] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#141414] mb-0.5">Payout Timeline Notice</p>
              <p>Withdrawal requests are processed via direct NIP bank transfer within 24 to 48 business hours after request approval.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E2DC] bg-[#FAF8F5] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-[#E5E2DC] hover:border-[#141414] text-[#141414] text-xs uppercase tracking-widest font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

