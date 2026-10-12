import React from 'react';
import { ArrowUpRight, X } from 'lucide-react';

type AffiliateAnnouncementModalProps = {
  onClose: () => void;
  onJoin: () => void;
};

export const AffiliateAnnouncementModal: React.FC<AffiliateAnnouncementModalProps> = ({
  onClose,
  onJoin,
}) => (
  <div
    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
    role="presentation"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="affiliate-announcement-title"
      className="relative w-full max-w-[480px] overflow-hidden border border-[#3A342D] bg-[#F2F0EB] text-[#141414] shadow-2xl"
    >
      <div className="h-1.5 w-full bg-[#A48B71]" />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close affiliate announcement"
        className="absolute right-3 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full text-[#4A4844] transition hover:bg-black/5 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A48B71]"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="px-6 pb-7 pt-8 sm:px-9 sm:pb-9 sm:pt-10">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8A7158]">
          THE PIERCYN CREATOR PROGRAM
        </p>
        <h2
          id="affiliate-announcement-title"
          className="max-w-[360px] font-editorial text-[clamp(32px,7vw,46px)] leading-[1.02] tracking-[-0.035em]"
        >
          Your style. Your audience. Your earnings.
        </h2>
        <p className="mt-4 max-w-[390px] text-sm leading-6 text-[#514D47] sm:text-[15px]">
          Love fashion and know people who do too? Join the PIERCYN affiliate community, share pieces you rate, and earn commission on successful orders made through your link.
        </p>

        <div className="my-6 grid grid-cols-1 gap-3 border-y border-[#DAD5CC] py-4 sm:grid-cols-3 sm:gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#81786D]">Share</p>
            <p className="mt-1 text-sm font-medium">Your unique link</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#81786D]">Recommend</p>
            <p className="mt-1 text-sm font-medium">Styles you love</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#81786D]">Earn</p>
            <p className="mt-1 text-sm font-medium">On delivered orders</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onJoin}
          className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#141414] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#F2F0EB] transition hover:bg-[#332D27] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A48B71]"
        >
          Explore the affiliate program
          <ArrowUpRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 min-h-10 w-full px-4 py-2 text-xs font-medium text-[#6A655E] underline decoration-[#C4BDB2] underline-offset-4 transition hover:text-[#141414]"
        >
          Maybe later
        </button>
      </div>
    </section>
  </div>
);
