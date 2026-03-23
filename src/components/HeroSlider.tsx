'use client';

import { VodItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Info } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

interface HeroSliderProps {
  items: VodItem[];
}

export default function HeroSlider({ items }: HeroSliderProps) {
  const slides = items.slice(0, 10);

  if (!slides.length) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl group/slider bg-slate-900">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
           prevEl: '.swiper-button-prev-custom',
           nextEl: '.swiper-button-next-custom',
        }}
        pagination={{ 
           clickable: true, 
           bulletActiveClass: 'swiper-pagination-bullet-active bg-blue-500',
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="w-full aspect-[4/3] sm:aspect-[21/9] lg:aspect-[24/9]"
      >
        {slides.map((slide) => {
          const score = parseFloat(slide.vod_score || '0');
          return (
            <SwiperSlide key={slide.vod_id} className="relative w-full h-full overflow-hidden">
              {/* Image & Gradient Overlays */}
              <div className="absolute inset-0 block">
                {slide.vod_pic && (
                  <Image
                    src={slide.vod_pic}
                    alt={slide.vod_name}
                    fill
                    className="object-cover scale-100 sm:scale-105"
                    priority={true}
                    unoptimized
                  />
                )}
                {/* Horizontal dark gradient (netflix style) */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 sm:from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />
                {/* Vertical bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Content Box */}
              <div className="absolute inset-0 flex flex-col justify-end lg:justify-center p-5 sm:p-10 lg:pl-16 z-10 w-full max-w-4xl pb-16 sm:pb-10">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3 lg:mb-4">
                  {slide.type_name && (
                    <span className="bg-blue-600/90 text-white text-[10px] sm:text-xs lg:text-sm font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded lg:rounded-sm shadow-md">
                      {slide.type_name}
                    </span>
                  )}
                  {slide.vod_remarks && (
                    <span className="bg-rose-600/90 text-white text-[10px] sm:text-xs lg:text-sm font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded lg:rounded-sm shadow-md">
                      {slide.vod_remarks}
                    </span>
                  )}
                  {score > 0 && (
                    <span className="flex items-center gap-1 bg-amber-500/90 text-white text-[10px] sm:text-xs lg:text-sm font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded lg:rounded-sm shadow-md">
                      <Star size={12} fill="currentColor" />
                      {score.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-white font-black text-2xl sm:text-4xl lg:text-6xl leading-[1.15] mb-3 sm:mb-4 drop-shadow-xl line-clamp-2">
                  {slide.vod_name}
                </h2>

                {/* Blurb */}
                {slide.vod_blurb && (
                  <p className="text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl line-clamp-2 leading-relaxed hidden sm:block mb-6 sm:mb-8 drop-shadow-md font-medium text-shadow">
                    {slide.vod_blurb}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <Link
                    href={`/vod/${slide.vod_id}`}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white text-slate-900 font-bold px-4 py-2 sm:px-8 sm:py-3.5 rounded-full sm:rounded-lg text-xs sm:text-base hover:bg-slate-200 transition-colors shadow-xl min-w-[100px] sm:min-w-[140px]"
                  >
                    <Play size={16} fill="currentColor" className="sm:w-5 sm:h-5" />
                    播放
                  </Link>
                  <Link
                    href={`/vod/${slide.vod_id}`}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-md text-white font-bold px-4 py-2 sm:px-8 sm:py-3.5 rounded-full sm:rounded-lg text-xs sm:text-base hover:bg-white/30 transition-colors border border-white/20 min-w-[100px] sm:min-w-[140px]"
                  >
                    <Info size={16} className="sm:w-5 sm:h-5" />
                    详情
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          );
        })}

        {/* Custom Navigation */}
        <div className="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white items-center justify-center cursor-pointer hover:bg-black/60 transition-all opacity-0 group-hover/slider:opacity-100 hidden sm:flex">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </div>
        <div className="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-white items-center justify-center cursor-pointer hover:bg-black/60 transition-all opacity-0 group-hover/slider:opacity-100 hidden sm:flex">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </Swiper>

      {/* Global override for swiper pagination styling */}
      <style dangerouslySetInnerHTML={{__html: `
        .swiper-pagination-bullet { background: rgba(255,255,255,0.4); width: 8px; height: 8px; transition: all 0.3s }
        .swiper-pagination-bullet-active { background: #fff !important; width: 24px; border-radius: 6px; }
      `}} />
    </div>
  );
}
