import React from 'react';
import { ArrowUpRight, Bell, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { ActivePageView } from '../types';

interface AccessoriesPageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const AccessoriesPage: React.FC<AccessoriesPageProps> = ({ onSelectPage }) => {
  const { setConciergeOpen } = useShop();

  const previewItems = [
    {
      number: '01',
      title: 'HEADWEAR & CAPS',
      desc: 'Heavyweight cotton twill & unstructured silhouettes with understated embroidery.',
      tag: 'DROP 02',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=900&auto=format&fit=crop',
    },
    {
      number: '02',
      title: 'LEATHER & WALLETS',
      desc: 'Raw edge full-grain leather goods designed for daily Lagos transit and global movement.',
      tag: 'IN DEVELOPMENT',
      image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=900&auto=format&fit=crop',
    },
    {
      number: '03',
      title: 'EVERYDAY HARDWARE',
      desc: 'Brushed metal key loops, minimalist carabiners, and custom branded jewelry.',
      tag: 'PROTOTYPING',
      image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=900&auto=format&fit=crop',
    },
    {
      number: '04',
      title: 'CANVAS CARRY & TOTES',
      desc: '500 GSM canvas totes with reinforced webbing handles and internal laptop sleeves.',
      tag: 'DROP 02',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=900&auto=format&fit=crop',
    },
  ];

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-[90vh] pt-24 sm:pt-28 pb-20">
      <div className="piercyn-container">
        
        {/* Breadcrumb / Top Indicator */}
        <div className="flex items-center gap-2 text-[11px] font-sans tracking-[0.2em] uppercase text-[#141414]/50 mb-6 sm:mb-8">
          <button 
            onClick={() => onSelectPage('home')}
            className="hover:text-[#141414] transition-colors focus:outline-none"
          >
            PIERCYN
          </button>
          <span>/</span>
          <span className="text-[#141414] font-medium">ACCESSORIES</span>
        </div>

        {/* Hero Banner Card */}
        <div className="relative rounded-2xl overflow-hidden bg-[#141414] text-[#F2F0EB] p-8 sm:p-14 lg:p-20 mb-16 shadow-2xl">
          {/* Subtle background ambient overlay */}
          <div 
            className="absolute inset-0 opacity-25 mix-blend-luminosity bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1400&auto=format&fit=crop')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2F0EB]/10 backdrop-blur-md border border-[#F2F0EB]/15 text-[10px] sm:text-xs font-sans tracking-[0.25em] uppercase text-[#A48B71] mb-6">
              <Sparkles className="w-3 h-3 text-[#A48B71]" />
              NEXT RELEASE PREVIEW
            </div>

            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight leading-[1.05] mb-4">
              ACCESSORIES <br />
              <span className="italic text-[#A48B71]">COMING SOON.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#F2F0EB]/75 font-sans leading-relaxed mb-8 max-w-xl">
              We are finalizing the first batch of PIERCYN carry goods, headwear, and everyday hardware. Engineered with the same heavyweight discipline and Lagos attitude as our apparel.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => setConciergeOpen(true)}
                className="btn-primary inline-flex items-center justify-center gap-2 bg-[#F2F0EB] text-[#141414] hover:bg-white px-7 py-4 text-xs font-medium tracking-[0.18em] uppercase rounded-full shadow-lg active:scale-95 transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                GET NOTIFIED FIRST
              </button>

              <button
                onClick={() => onSelectPage('new')}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-[#F2F0EB] px-7 py-4 text-xs font-medium tracking-[0.18em] uppercase rounded-full backdrop-blur-sm active:scale-95 transition-all"
              >
                SHOP NEW ARRIVALS
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#141414]/10 gap-4">
          <div>
            <span className="section-eyebrow block mb-1">IN THE WORKS</span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-light tracking-tight">
              UPCOMING CATEGORIES
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#141414]/60 max-w-sm">
            Everything designed from the thread up in Victoria Island, Lagos.
          </p>
        </div>

        {/* 4-Grid Preview of Upcoming Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {previewItems.map((item) => (
            <div 
              key={item.number}
              className="group bg-white rounded-xl overflow-hidden border border-[#141414]/10 hover:border-[#141414]/30 transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#141414]/5">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter grayscale contrast-125 group-hover:filter-none"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#141414]/80 text-[#F2F0EB] text-[9px] font-sans tracking-[0.18em] uppercase backdrop-blur-sm">
                  {item.tag}
                </div>
                <div className="absolute bottom-3 right-3 font-editorial text-2xl text-white/70">
                  {item.number}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-sans font-semibold text-sm tracking-wide mb-1.5 text-[#141414]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#141414]/65 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#141414]/10 flex items-center justify-between text-[10px] font-sans tracking-[0.18em] uppercase text-[#A48B71]">
                  <span>NOTIFY ON DROP</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Shop Prompt Banner */}
        <div className="p-8 sm:p-10 rounded-2xl bg-white border border-[#141414]/10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-light mb-1">
              LOOKING FOR APPAREL?
            </h3>
            <p className="text-xs sm:text-sm text-[#141414]/65 font-sans">
              Explore our current heavyweight tees, fleece hoodies, and essentials ready to ship today.
            </p>
          </div>
          <button
            onClick={() => onSelectPage('shop')}
            className="btn-primary w-full sm:w-auto px-8 py-4 text-xs tracking-[0.2em] uppercase rounded-full active:scale-95 transition-transform shrink-0"
          >
            VIEW ALL APPAREL
          </button>
        </div>

      </div>
    </main>
  );
};
