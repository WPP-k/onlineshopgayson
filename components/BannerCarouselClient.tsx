"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";

export function BannerCarouselClient({ banners }: { banners: { id: string; image: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000); // 5 seconds auto-scroll

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[260px] sm:h-[340px] md:h-[420px] rounded-2xl overflow-hidden group shadow-md bg-neutral-900 border border-gray-100">
      <div 
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <Link
            key={banner.id}
            href="#promotions"
            className="min-w-full h-full relative flex items-center justify-center overflow-hidden cursor-pointer select-none"
            title="คลิกที่โฆษณาเพื่อดูสินค้าโปรโมชันและสินค้าลดราคา"
          >
            {/* Ambient Blurred Background to fill any letterbox seamlessly */}
            <img 
              src={banner.image} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110" 
              aria-hidden="true"
            />
            {/* Main Banner Image - object-contain so NO text or cup is cropped */}
            <img 
              src={banner.image} 
              alt="โฆษณาโปรโมชัน" 
              className="relative z-10 max-w-full max-h-full object-contain drop-shadow-md select-none" 
            />

            {/* Click to view badge on hover */}
            <div className="absolute top-3 right-3 z-20 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity shadow-sm">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>คลิกเพื่อดูสินค้าลดราคา</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Navigation Buttons */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all shadow-md z-20 cursor-pointer backdrop-blur-xs"
            title="ก่อนหน้า"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-all shadow-md z-20 cursor-pointer backdrop-blur-xs"
            title="ถัดไป"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  index === currentIndex ? "bg-red-500 w-6" : "bg-white/60 hover:bg-white w-2"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
