import React from 'react';
import { useShop } from '../context/ShopContext';
import { Sparkles } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useShop();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-[max(2rem,calc(env(safe-area-inset-bottom)+1rem))] left-1/2 -translate-x-1/2 z-[110] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none w-[calc(100%-2rem)] max-w-max flex justify-center">
      <div className="bg-[#141414]/95 backdrop-blur-md text-[#F2F0EB] px-5 py-2.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-2.5 max-w-full">
        <span className="w-1.5 h-1.5 rounded-full bg-[#E3DEC3] animate-ping shrink-0" />
        <span className="text-[10.5px] sm:text-[11px] font-sans uppercase tracking-[0.14em] font-semibold truncate">
          {toastMessage}
        </span>
      </div>
    </div>
  );
};
