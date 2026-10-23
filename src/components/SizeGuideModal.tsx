import React, { useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { X, Ruler, MessageCircle } from 'lucide-react';

export const SizeGuideModal: React.FC = () => {
  const { isSizeGuideOpen, setIsSizeGuideOpen } = useShop();

  useEffect(() => {
    if (!isSizeGuideOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSizeGuideOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSizeGuideOpen, setIsSizeGuideOpen]);

  if (!isSizeGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="size-guide-title">
      <button type="button" aria-label="Close size guide" onClick={() => setIsSizeGuideOpen(false)} className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-xs" />
      <div className="relative flex min-h-full items-end justify-center p-0 sm:items-center sm:p-6 lg:p-12">
        <div className="relative max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border-t border-[#DAD8D1] bg-[#F2F0EB] p-5 text-[#141414] shadow-2xl sm:rounded-2xl sm:border sm:p-9">
          <button type="button" onClick={() => setIsSizeGuideOpen(false)} aria-label="Close size guide" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#141414]/10 sm:right-6 sm:top-6"><X className="h-5 w-5" /></button>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6E6B65]"><Ruler className="h-4 w-4" /> Fit & sizing</div>
          <h2 id="size-guide-title" className="mb-4 pr-12 font-editorial text-3xl italic sm:text-4xl">Find your fit</h2>
          <p className="max-w-xl text-sm leading-7 text-[#5F5C56]">Fit and measurements can vary by product and supplier. We only publish numerical garment measurements when they have been verified for that specific piece.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <section className="rounded-xl border border-[#DAD8D1] bg-white/70 p-5"><h3 className="font-semibold">For a relaxed fit</h3><p className="mt-2 text-sm leading-6 text-[#5F5C56]">Compare the product’s fit description with a garment you already own that fits the way you like.</p></section>
            <section className="rounded-xl border border-[#DAD8D1] bg-white/70 p-5"><h3 className="font-semibold">For a closer fit</h3><p className="mt-2 text-sm leading-6 text-[#5F5C56]">Review the individual product details and contact support if the page does not include enough verified sizing information.</p></section>
          </div>
          <div className="mt-6 rounded-xl bg-[#E8E6E1] p-5">
            <h3 className="font-semibold">Need exact measurements?</h3>
            <p className="mt-2 text-sm leading-6 text-[#5F5C56]">Send support the product name and your preferred fit before ordering. We will confirm the measurements available for that item rather than guess.</p>
            <a href="https://wa.me/2348076431059?text=Hello%20PIERCYN%2C%20please%20help%20me%20confirm%20the%20sizing%20for%20a%20product." target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#141414] px-5 text-xs font-bold uppercase tracking-wider text-white"><MessageCircle className="h-4 w-4" /> Ask about sizing</a>
          </div>
        </div>
      </div>
    </div>
  );
};
