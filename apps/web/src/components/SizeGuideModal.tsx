import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { X, Ruler } from 'lucide-react';

export const SizeGuideModal: React.FC = () => {
  const { isSizeGuideOpen, setIsSizeGuideOpen } = useShop();
  const [unit, setUnit] = useState<'CM' | 'INCHES'>('CM');

  if (!isSizeGuideOpen) return null;

  const sizingData = [
    {
      size: 'XS',
      chestCM: '118 cm',
      chestIN: '46.5 in',
      lengthCM: '68 cm',
      lengthIN: '26.8 in',
      shoulderCM: '56 cm',
      shoulderIN: '22.0 in',
      fitNote: 'Relaxed Oversize (Fits true to oversize)'
    },
    {
      size: 'S',
      chestCM: '124 cm',
      chestIN: '48.8 in',
      lengthCM: '70 cm',
      lengthIN: '27.5 in',
      shoulderCM: '58 cm',
      shoulderIN: '22.8 in',
      fitNote: 'Roomy Drop-Shoulder'
    },
    {
      size: 'M',
      chestCM: '130 cm',
      chestIN: '51.2 in',
      lengthCM: '72 cm',
      lengthIN: '28.3 in',
      shoulderCM: '60 cm',
      shoulderIN: '23.6 in',
      fitNote: 'Signature PIERCYN Volume'
    },
    {
      size: 'L',
      chestCM: '136 cm',
      chestIN: '53.5 in',
      lengthCM: '74 cm',
      lengthIN: '29.1 in',
      shoulderCM: '62 cm',
      shoulderIN: '24.4 in',
      fitNote: 'Full Brutalist Drape'
    },
    {
      size: 'XL',
      chestCM: '142 cm',
      chestIN: '55.9 in',
      lengthCM: '76 cm',
      lengthIN: '29.9 in',
      shoulderCM: '64 cm',
      shoulderIN: '25.2 in',
      fitNote: 'Maximum Architectural Silhouette'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={() => setIsSizeGuideOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-6 lg:p-12">
        <div className="relative w-full max-w-3xl bg-[#F2F0EB] text-[#141414] shadow-2xl border-t sm:border border-[#E3DEC3] rounded-t-2xl sm:rounded-2xl p-5 sm:p-10 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 max-h-[92svh] overflow-y-auto font-sans">
          
          {/* Close */}
          <button
            onClick={() => setIsSizeGuideOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 min-w-[44px] min-h-[44px] rounded-full text-[#141414] hover:bg-[#141414]/10 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Close Size Guide"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-sans font-semibold tracking-[0.22em] uppercase text-[#6E6B65] mb-1.5 sm:mb-2">
            <Ruler className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL FIT SPECIFICATION</span>
          </div>

          <h2 className="font-editorial text-2xl sm:text-4xl uppercase tracking-[-0.025em] text-[#141414] mb-3 sm:mb-4">
            SIZE & PROPORTION GUIDE
          </h2>

          <p className="text-[14px] sm:text-[15px] text-[#4A4844] font-normal leading-[1.6] mb-5 sm:mb-6">
            All PIERCYN tops and outerwear are intentionally cut with an architectural, boxy oversized drape.
            We advise choosing your normal size for our intended campaign silhouette, or sizing down one size for a more tailored look.
          </p>

          {/* Unit Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
            <span className="text-[11px] sm:text-[12px] font-sans font-semibold uppercase tracking-[0.16em] text-[#6E6B65]">
              MEASUREMENT UNIT:
            </span>
            <div className="flex border border-[#141414] rounded-full p-0.5 bg-[#EAE5D9] self-start">
              <button
                onClick={() => setUnit('CM')}
                className={`min-h-[36px] px-4 py-1.5 rounded-full text-[11px] font-sans font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                  unit === 'CM' ? 'bg-[#141414] text-[#F2F0EB] shadow-xs' : 'bg-transparent text-[#141414]'
                }`}
              >
                CENTIMETERS (CM)
              </button>
              <button
                onClick={() => setUnit('INCHES')}
                className={`min-h-[36px] px-4 py-1.5 rounded-full text-[11px] font-sans font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                  unit === 'INCHES' ? 'bg-[#141414] text-[#F2F0EB] shadow-xs' : 'bg-transparent text-[#141414]'
                }`}
              >
                INCHES (IN)
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-2 px-2 pb-2">
            <table className="w-full min-w-[340px] text-left text-[12px] sm:text-[13px] font-sans uppercase tracking-wider border-collapse">
              <thead>
                <tr className="border-b-2 border-[#141414] text-[#141414] font-bold">
                  <th className="py-2.5 px-2">SIZE</th>
                  <th className="py-2.5 px-2">CHEST</th>
                  <th className="py-2.5 px-2">LENGTH</th>
                  <th className="py-2.5 px-2">SHOULDER</th>
                  <th className="py-2.5 px-2 hidden sm:table-cell">STYLING NOTE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D5CFBF]">
                {sizingData.map((row) => (
                  <tr key={row.size} className="hover:bg-[#EAE5DA]">
                    <td className="py-3 px-2 font-bold text-[#141414]">{row.size}</td>
                    <td className="py-3 px-2 font-medium">{unit === 'CM' ? row.chestCM : row.chestIN}</td>
                    <td className="py-3 px-2 font-medium">{unit === 'CM' ? row.lengthCM : row.lengthIN}</td>
                    <td className="py-3 px-2 font-medium">{unit === 'CM' ? row.shoulderCM : row.shoulderIN}</td>
                    <td className="py-3 px-2 text-[#4A4844] normal-case hidden sm:table-cell font-normal">{row.fitNote}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};
