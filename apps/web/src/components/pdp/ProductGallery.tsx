import React, { useState, useEffect } from 'react';
import { ProductColor } from '../../types';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  activeColor?: ProductColor;
  gsm?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  activeColor,
  gsm,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Combine active color images and base images
  const galleryImages = [
    activeColor?.image,
    activeColor?.altImage,
    ...images,
  ].filter((img, idx, arr): img is string => Boolean(img) && arr.indexOf(img) === idx);

  // Reset index when color changes
  useEffect(() => {
    setSelectedImageIdx(0);
  }, [activeColor?.name]);

  const currentImage = galleryImages[selectedImageIdx] || galleryImages[0] || images[0];

  const handleNext = () => {
    setSelectedImageIdx((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrev = () => {
    setSelectedImageIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <div className="w-full flex flex-col-reverse lg:flex-row gap-3 sm:gap-4 select-none">
      {/* Desktop & Tablet Thumbnail Strip (Left Side) */}
      {galleryImages.length > 1 && (
        <div className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto no-scrollbar py-1 lg:py-0 max-h-[640px] shrink-0">
          {galleryImages.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              onClick={() => setSelectedImageIdx(idx)}
              className={`relative w-16 sm:w-20 aspect-[4/5] rounded-lg overflow-hidden bg-[#E8E4DA] border-2 transition-all cursor-pointer shrink-0 ${
                selectedImageIdx === idx
                  ? 'border-[#141414] scale-[1.02] shadow-xs ring-1 ring-[#141414]'
                  : 'border-transparent opacity-65 hover:opacity-100'
              }`}
              aria-label={`View image ${idx + 1} of ${productName}`}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Feature Image Container */}
      <div className="relative flex-1 aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#E8E4DA] shadow-xs">
        <img
          src={currentImage}
          alt={`${productName} view ${selectedImageIdx + 1}`}
          className="w-full h-full object-cover object-center transition-opacity duration-300"
          fetchPriority="high"
        />

        {/* GSM / Fabric Badge */}
        {gsm && (
          <div className="absolute top-3.5 left-3.5 z-10">
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-[#141414]/90 text-[#F2F0EB] backdrop-blur-xs font-semibold">
              {gsm}
            </span>
          </div>
        )}

        {/* Mobile Swipe / Arrow Controls */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="sm:hidden absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-[#141414] flex items-center justify-center shadow-md active:scale-90 z-10"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="sm:hidden absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 text-[#141414] flex items-center justify-center shadow-md active:scale-90 z-10"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Mobile Pagination Indicator Dots */}
            <div className="sm:hidden absolute bottom-3.5 inset-x-0 flex items-center justify-center gap-1.5 z-10">
              {galleryImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    selectedImageIdx === idx
                      ? 'w-6 bg-[#141414]'
                      : 'w-1.5 bg-black/25'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
