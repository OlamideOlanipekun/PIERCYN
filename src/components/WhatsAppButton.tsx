import React, { useState } from 'react';
import { MessageCircle, X, HelpCircle, Send } from 'lucide-react';

export const WhatsAppButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultMsg = encodeURIComponent(
    "Hello PIERCYN Concierge! I'm browsing the store and have a question about sizing and delivery."
  );

  return (
    <div className="fixed bottom-5 right-5 z-40 font-sans">
      {/* EXPANDED ASSISTANCE POPUP */}
      {isOpen && (
        <div className="mb-3 w-72 bg-[#141414] text-[#F2F0EB] p-4 rounded-2xl shadow-2xl border border-white/10 text-left animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#E8E6E1]">
                NEED HELP?
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#E8E6E1]/90 mb-3 leading-relaxed">
            Need help with sizing, fit, or delivery? Chat with us directly on WhatsApp.
          </p>

          <a
            href={`https://wa.me/2348000000000?text=${defaultMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full py-2.5 px-4 bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#20bd5a] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>CHAT WITH US ON WHATSAPP</span>
          </a>
        </div>
      )}

      {/* SUBTLE FLOATING BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-[#141414] text-[#F2F0EB] hover:bg-black rounded-full shadow-lg border border-[#DAD8D1]/40 flex items-center justify-center transition-transform active:scale-95 cursor-pointer group"
        aria-label="Contact PIERCYN Concierge on WhatsApp"
        title="PIERCYN Concierge Support"
      >
        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform text-[#25D366]" />
      </button>
    </div>
  );
};
