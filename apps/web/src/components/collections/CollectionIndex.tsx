import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface CollectionIndexProps {
  onSelectSection: (sectionId: string) => void;
}

export const CollectionIndex: React.FC<CollectionIndexProps> = ({ onSelectSection }) => {
  const [activeSection, setActiveSection] = useState('col-everyday');

  const indexItems = [
    { number: '01', id: 'col-everyday', label: 'THE EVERYDAY' },
    { number: '02', id: 'col-after-dark', label: 'AFTER DARK' },
    { number: '03', id: 'col-essentials', label: 'ESSENTIALS' },
    { number: '04', id: 'col-the-drop', label: 'THE DROP' },
    { number: '05', id: 'col-featured', label: 'FEATURED' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      indexItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 250 && rect.bottom >= 250) {
            setActiveSection(item.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      id="collection-index"
      className="sticky top-14 sm:top-16 z-30 bg-[#F2F0EB]/95 backdrop-blur-md border-b border-[#E3DEC3] text-[#141414] py-3 sm:py-4 select-none"
    >
      <div className="piercyn-container">
        
        {/* Desktop: Horizontal Editorial Pill Navigation */}
        <div className="hidden md:flex items-center justify-between gap-4 text-[11px] lg:text-[12px] font-sans font-semibold tracking-[0.14em] uppercase">
          <span className="text-[#8C8A84] font-mono text-[10px]">COLLECTION INDEX:</span>
          
          <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto scrollbar-none">
            {indexItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`h-11 px-4 sm:px-5 rounded-full transition-all duration-300 cursor-pointer inline-flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-[#141414] text-[#F2F0EB] font-bold shadow-xs'
                      : 'bg-[#E8E6E1]/90 text-[#4A4844] hover:text-[#141414] hover:bg-[#E8E6E1]'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-70">{item.number}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile: Vertical Stacked Index */}
        <div className="md:hidden flex flex-col space-y-1">
          {indexItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`w-full min-h-[52px] px-4 rounded-xl flex items-center justify-between text-[11px] font-sans tracking-[0.14em] uppercase font-semibold transition-colors cursor-pointer ${
                  isActive ? 'bg-[#141414] text-[#F2F0EB]' : 'bg-[#E8E6E1]/70 text-[#141414]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] opacity-60">{item.number}</span>
                  <span>{item.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-70" />
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
