import React from 'react';
import { ArrowUpRight, Bell } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ActivePageView } from '../types';

interface AccessoriesPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const AccessoriesPage: React.FC<AccessoriesPageProps> = ({ onSelectPage }) => {
  const { setIsConciergeOpen } = useShop();

  const previewItems = [
    {
      number: '01',
      title: 'HEADWEAR & CAPS',
      desc: 'Heavyweight cotton twill with understated embroidery.',
      tag: 'COMING SOON',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=900&auto=format&fit=crop',
    },
    {
      number: '02',
      title: 'LEATHER GOODS',
      desc: 'Full-grain leather cardholders designed for everyday movement.',
      tag: 'IN DEVELOPMENT',
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=900&auto=format&fit=crop',
    },
    {
      number: '03',
      title: 'EVERYDAY HARDWARE',
      desc: 'Brushed metal key loops and minimalist brass details.',
      tag: 'PROTOTYPING',
      image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=900&auto=format&fit=crop',
    },
    {
      number: '04',
      title: 'CANVAS TOTES',
      desc: 'Heavyweight canvas bags with reinforced handles.',
      tag: 'COMING SOON',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=900&auto=format&fit=crop',
    },
  ];

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-[90vh] pt-24 sm:pt-28 pb-20">
      <div className="piercyn-container">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-sans tracking-[0.2em] uppercase text-[#141414]/50 mb-6 sm:mb-8">
          <button 
            onClick={() => onSelectPage('home')}
            className="hover:text-[#141414] transition-colors cursor-pointer"
          >
            PIERCYN
          </button>
          <span>/</span>
          <span className="text-[#141414] font-medium">ACCESSORIES</span>
        </div>

        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-[#141414] text-[#F2F0EB] p-8 sm:p-14 lg:p-16 mb-16 shadow-xl">
          <div 
            className="absolute inset-0 opacity-20 mix-blend-luminosity bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1400&auto=format&fit=crop')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/85 to-transparent" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-block text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-[#A48B71] mb-4 font-bold">
              UPCOMING DROP
            </span>

            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05] mb-4">
              ACCESSORIES <br />
              <span className="italic text-[#A48B71]">COMING SOON.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#F2F0EB]/80 font-sans leading-relaxed mb-8 max-w-xl">
              We are finalizing the first batch of PIERCYN carry goods, headwear, and hardware. Made with the same heavyweight quality and clean cuts as our apparel.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => setIsConciergeOpen(true)}
                className="inline-flex items-center justify-center gap-2 bg-[#F2F0EB] text-[#141414] hover:bg-white px-7 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase rounded-full shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                GET NOTIFIED FIRST
              </button>

              <button
                onClick={() => onSelectPage('new')}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-[#F2F0EB] px-7 py-3.5 text-xs font-semibold tracking-[0.18em] uppercase rounded-full backdrop-blur-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>SHOP NEW IN</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#141414]/10 gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#7A7771] block mb-1">
              IN THE WORKS
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-light tracking-tight">
              UPCOMING PIECES
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#141414]/70 max-w-sm">
            Designed in Lagos. Built for everywhere.
          </p>
        </div>

        {/* 4-Grid Preview of Upcoming Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {previewItems.map((item) => (
            <div 
              key={item.number}
              className="group bg-[#EAE5D9]/40 rounded-xl overflow-hidden border border-[#141414]/10 hover:border-[#141414]/30 transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#E7E2D6]">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter grayscale contrast-125 group-hover:filter-none"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#141414]/90 text-[#F2F0EB] text-[9px] font-mono tracking-[0.18em] uppercase">
                  {item.tag}
                </div>
                <div className="absolute bottom-3 right-3 font-editorial text-2xl text-white/70">
                  {item.number}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between bg-transparent">
                <div>
                  <h3 className="font-editorial text-lg uppercase tracking-tight text-[#141414] mb-1.5 font-medium">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#6E6B65] font-sans leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#141414]/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#A48B71] font-semibold">
                    PIERCYN ATELIER
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
};
