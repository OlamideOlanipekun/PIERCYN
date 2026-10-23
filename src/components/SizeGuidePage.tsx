import React, { useState } from 'react';
import { ActivePageView } from '../types';
import { Ruler, ChevronRight, ArrowRight, ShieldCheck, Info } from 'lucide-react';

interface SizeGuidePageProps {
  onSelectPage: (page: ActivePageView) => void;
}

export const SizeGuidePage: React.FC<SizeGuidePageProps> = ({ onSelectPage }) => {
  const [unit, setUnit] = useState<'CM' | 'INCHES'>('CM');
  const [selectedGarment, setSelectedGarment] = useState<'tops' | 'bottoms'>('tops');

  const topsData = [
    {
      size: 'XS',
      chestCM: '118 cm',
      chestIN: '46.5 in',
      lengthCM: '68 cm',
      lengthIN: '26.8 in',
      shoulderCM: '56 cm',
      shoulderIN: '22.0 in',
      fitNote: 'Relaxed Oversize (Fits true to oversize)',
    },
    {
      size: 'S',
      chestCM: '124 cm',
      chestIN: '48.8 in',
      lengthCM: '70 cm',
      lengthIN: '27.5 in',
      shoulderCM: '58 cm',
      shoulderIN: '22.8 in',
      fitNote: 'Roomy Drop-Shoulder',
    },
    {
      size: 'M',
      chestCM: '130 cm',
      chestIN: '51.2 in',
      lengthCM: '72 cm',
      lengthIN: '28.3 in',
      shoulderCM: '60 cm',
      shoulderIN: '23.6 in',
      fitNote: 'Signature PIERCYN Volume',
    },
    {
      size: 'L',
      chestCM: '136 cm',
      chestIN: '53.5 in',
      lengthCM: '74 cm',
      lengthIN: '29.1 in',
      shoulderCM: '62 cm',
      shoulderIN: '24.4 in',
      fitNote: 'Full Boxy Drape',
    },
    {
      size: 'XL',
      chestCM: '142 cm',
      chestIN: '55.9 in',
      lengthCM: '76 cm',
      lengthIN: '29.9 in',
      shoulderCM: '64 cm',
      shoulderIN: '25.2 in',
      fitNote: 'Architectural Streetwear Silhouette',
    },
    {
      size: 'XXL',
      chestCM: '148 cm',
      chestIN: '58.3 in',
      lengthCM: '78 cm',
      lengthIN: '30.7 in',
      shoulderCM: '66 cm',
      shoulderIN: '26.0 in',
      fitNote: 'Maximum Relaxed Oversize',
    },
  ];

  const bottomsData = [
    {
      size: 'S (30)',
      waistCM: '76–80 cm',
      waistIN: '30–31 in',
      lengthCM: '102 cm',
      lengthIN: '40.2 in',
      thighCM: '64 cm',
      thighIN: '25.2 in',
      fitNote: 'Straight Relaxed Fit',
    },
    {
      size: 'M (32)',
      waistCM: '81–85 cm',
      waistIN: '32–33 in',
      lengthCM: '104 cm',
      lengthIN: '40.9 in',
      thighCM: '67 cm',
      thighIN: '26.4 in',
      fitNote: 'Standard Streetwear Cargo',
    },
    {
      size: 'L (34)',
      waistCM: '86–90 cm',
      waistIN: '34–35 in',
      lengthCM: '106 cm',
      lengthIN: '41.7 in',
      thighCM: '70 cm',
      thighIN: '27.6 in',
      fitNote: 'Roomy Leg Silhouette',
    },
    {
      size: 'XL (36)',
      waistCM: '91–96 cm',
      waistIN: '36–37 in',
      lengthCM: '108 cm',
      lengthIN: '42.5 in',
      thighCM: '73 cm',
      thighIN: '28.7 in',
      fitNote: 'Full Volume Drape',
    },
  ];

  return (
    <main className="w-full bg-[#F2F0EB] text-[#141414] min-h-screen pt-24 sm:pt-28 pb-20 font-sans">
      <div className="piercyn-container max-w-4xl mx-auto">
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono tracking-[0.16em] uppercase text-[#7A7771] mb-8">
          <button onClick={() => onSelectPage('home')} className="hover:text-[#141414] cursor-pointer">
            HOME
          </button>
          <ChevronRight className="w-3 h-3 text-[#DAD8D1]" />
          <span className="text-[#141414] font-semibold">SIZE GUIDE</span>
        </nav>

        {/* Page Header */}
        <header className="mb-12 border-b border-[#DAD8D1] pb-8">
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#7A7771] block mb-2 font-semibold">
            PROPORTIONS & FIT SPECIFICATIONS
          </span>
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#141414] italic font-normal tracking-tight">
            Size & Proportion Guide
          </h1>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#4A4844] max-w-2xl leading-relaxed">
            Every PIERCYN piece is engineered with custom street proportions: dropped shoulders, high dense collar ribs, and structured heavyweight draping. Choose your true size for our signature campaign silhouette, or size down for a more fitted profile.
          </p>
        </header>

        {/* Controls: Garment Type & Unit Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-4 sm:p-5 mb-8">
          {/* Garment Type Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedGarment('tops')}
              className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                selectedGarment === 'tops'
                  ? 'bg-[#141414] text-[#F2F0EB] font-bold'
                  : 'bg-transparent text-[#55524D] hover:text-[#141414]'
              }`}
            >
              TOPS (TEES, HOODIES & POLOS)
            </button>
            <button
              onClick={() => setSelectedGarment('bottoms')}
              className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                selectedGarment === 'bottoms'
                  ? 'bg-[#141414] text-[#F2F0EB] font-bold'
                  : 'bg-transparent text-[#55524D] hover:text-[#141414]'
              }`}
            >
              BOTTOMS (CARGOS & PANTS)
            </button>
          </div>

          {/* Unit Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#7A7771] uppercase font-semibold">UNIT:</span>
            <div className="inline-flex rounded-full border border-[#DAD6CC] bg-white/60 p-0.5">
              <button
                type="button"
                onClick={() => setUnit('CM')}
                className={`px-3 py-1 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
                  unit === 'CM' ? 'bg-[#141414] text-[#F2F0EB] font-bold' : 'text-[#7A7771]'
                }`}
              >
                CM
              </button>
              <button
                type="button"
                onClick={() => setUnit('INCHES')}
                className={`px-3 py-1 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
                  unit === 'INCHES' ? 'bg-[#141414] text-[#F2F0EB] font-bold' : 'text-[#7A7771]'
                }`}
              >
                INCHES
              </button>
            </div>
          </div>
        </div>

        {/* Measurement Table */}
        <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#DAD6CC] bg-[#E3DFD4] font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7A7771]">
                  <th className="py-3.5 px-4 font-bold text-[#141414]">Size</th>
                  <th className="py-3.5 px-4 font-bold text-[#141414]">
                    {selectedGarment === 'tops' ? 'Chest Width' : 'Waist Width'}
                  </th>
                  <th className="py-3.5 px-4 font-bold text-[#141414]">Total Length</th>
                  <th className="py-3.5 px-4 font-bold text-[#141414]">
                    {selectedGarment === 'tops' ? 'Shoulder Width' : 'Thigh Width'}
                  </th>
                  <th className="py-3.5 px-4 font-bold text-[#141414]">Intended Fit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DAD6CC] font-sans">
                {selectedGarment === 'tops'
                  ? topsData.map((row) => (
                      <tr key={row.size} className="hover:bg-white/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#141414]">{row.size}</td>
                        <td className="py-3.5 px-4 font-mono">{unit === 'CM' ? row.chestCM : row.chestIN}</td>
                        <td className="py-3.5 px-4 font-mono">{unit === 'CM' ? row.lengthCM : row.lengthIN}</td>
                        <td className="py-3.5 px-4 font-mono">{unit === 'CM' ? row.shoulderCM : row.shoulderIN}</td>
                        <td className="py-3.5 px-4 text-[#55524D]">{row.fitNote}</td>
                      </tr>
                    ))
                  : bottomsData.map((row) => (
                      <tr key={row.size} className="hover:bg-white/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#141414]">{row.size}</td>
                        <td className="py-3.5 px-4 font-mono">{unit === 'CM' ? row.waistCM : row.waistIN}</td>
                        <td className="py-3.5 px-4 font-mono">{row.lengthCM}</td>
                        <td className="py-3.5 px-4 font-mono">{row.thighCM}</td>
                        <td className="py-3.5 px-4 text-[#55524D]">{row.fitNote}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Measuring Advice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 text-xs">
          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6">
            <h3 className="font-editorial text-xl italic text-[#141414] mb-3">
              How to Measure Tops
            </h3>
            <ul className="space-y-2 text-[#55524D] leading-relaxed">
              <li><strong>Chest:</strong> Measure across the fullest part of your chest, keeping tape flat and horizontal under your armpits.</li>
              <li><strong>Length:</strong> Measure from the highest point of your shoulder down to where you want the hem to drape.</li>
              <li><strong>Shoulder:</strong> Measure across your back from the tip of one shoulder bone to the other.</li>
            </ul>
          </div>

          <div className="bg-[#EAE6DD] border border-[#DAD6CC] rounded-2xl p-6">
            <h3 className="font-editorial text-xl italic text-[#141414] mb-3">
              Still Unsure About Sizing?
            </h3>
            <p className="text-[#55524D] leading-relaxed mb-4">
              Send your height, weight, and normal tee size to our WhatsApp concierge. We’ll recommend the exact size for your frame.
            </p>
            <a
              href="https://wa.me/2348076431059?text=Hello%20PIERCYN!%20Could%20you%20advise%20on%20sizing%20for%20my%20frame?"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#141414] hover:underline"
            >
              <span>Ask a Stylist on WhatsApp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </main>
  );
};
