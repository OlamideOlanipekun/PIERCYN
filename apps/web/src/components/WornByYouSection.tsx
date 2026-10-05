import React from 'react';
import { COMMUNITY_POSTS } from '../data/community';
import { useShop } from '../context/ShopContext';
import { ArrowUpRight, Instagram } from 'lucide-react';

export const WornByYouSection: React.FC = () => {
  const { products, setQuickViewProduct, showToast } = useShop();

  const handlePostClick = (pieceId: string) => {
    const found = products.find((p) => p.id === pieceId || p.slug === pieceId);
    if (found) {
      setQuickViewProduct(found);
    } else {
      showToast('Opening tagged editorial styling...');
    }
  };

  return (
    <section 
      id="community-section" 
      className="relative w-full bg-[#F2F0EB] py-20 sm:py-28 lg:py-32 overflow-hidden border-b border-[#E3DEC3]/70"
    >
      <div className="piercyn-container">
        
        {/* Section Header with Large Floating Overlaid Title */}
        <div className="relative mb-10 sm:mb-16 lg:mb-20">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.25em] text-[#141414]/70 font-sans font-semibold block mb-2 sm:mb-3">
            08 / COMMUNITY ARCHIVE
          </span>
          
          <h2 className="font-editorial text-[14vw] sm:text-[11vw] lg:text-[8vw] xl:text-[120px] leading-[0.86] tracking-[-0.03em] uppercase text-[#141414] select-none">
            <div>WORN</div>
            <div className="italic font-light pl-4 sm:pl-16 lg:pl-32">BY YOU<span className="not-italic text-[#A48B71]">.</span></div>
          </h2>
        </div>

        {/* Authentic Community Gallery with Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {COMMUNITY_POSTS.map((post, idx) => {
            const aspectRatios = [
              'aspect-[3/4.4]',
              'aspect-[3/3.9]',
              'aspect-[3/4.4]',
              'aspect-[3/4.1]',
              'aspect-[3/4.5]',
              'aspect-[3/4.0]'
            ];
            const aspect = aspectRatios[idx % aspectRatios.length];

            return (
              <div
                key={post.id}
                id={`community-post-${post.id}`}
                onClick={() => handlePostClick(post.taggedPieceId)}
                className={`group relative ${aspect} w-full overflow-hidden bg-[#E7E2D6] rounded-lg sm:rounded-xl cursor-pointer flex flex-col justify-between p-2.5 sm:p-4 shadow-2xs active:scale-[0.98] transition-transform`}
              >
                {/* Image */}
                <img
                  src={post.image}
                  alt={`PIERCYN worn by ${post.handle}`}
                  className="absolute inset-0 w-full h-full object-cover object-center filter contrast-[1.05] transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 sm:opacity-40 group-hover:opacity-90 transition-opacity duration-300" />

                {/* Top Corner: Tiny Handle Pill */}
                <div className="relative z-10 font-sans">
                  <span className="text-[10px] sm:text-[11px] font-sans font-semibold tracking-[0.05em] text-[#F2F0EB] bg-black/60 backdrop-blur-xs px-2.5 sm:px-3 py-0.5 rounded-full inline-block border border-white/10">
                    {post.handle}
                  </span>
                </div>

                {/* Bottom Corner: City & Product Tag */}
                <div className="relative z-10 font-sans opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#E3DEC3] font-semibold block">
                    {post.city}
                  </span>
                  <span className="text-[11px] sm:text-[12px] text-[#F2F0EB] font-medium leading-tight block mt-0.5 line-clamp-1">
                    {post.productName}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#F2F0EB]/90 block mt-0.5 underline font-semibold">
                    VIEW PIECE →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Link with Tactile Pill Button */}
        <div className="mt-10 sm:mt-16 text-center font-sans">
          <button
            onClick={() => {
              document.getElementById('newsletter-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-full border border-[#141414]/80 text-[12px] sm:text-[13px] tracking-[0.18em] uppercase text-[#141414] font-semibold hover:bg-[#141414] hover:text-[#F2F0EB] transition-all duration-300 inline-flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
          >
            <span>JOIN THE WORLD OF PIERCYN</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E6B65] mt-3 font-sans font-medium">
            TAG @PIERCYN OR #MADETOSTANDOUT TO BE ARCHIVED
          </p>
        </div>

      </div>
    </section>
  );
};
