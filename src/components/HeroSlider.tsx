'use client';

import { VodItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Info, ChevronRight, ChevronLeft, Calendar, User, Layout } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade, Parallax } from 'swiper/modules';

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
    <div className="relative w-full overflow-hidden group/slider bg-[#020617]">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade, Parallax]}
        effect="fade"
        parallax={true}
        speed={1200}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          prevEl: '.swiper-button-prev-hero',
          nextEl: '.swiper-button-next-hero',
        }}
        pagination={{
          clickable: true,
          el: '.hero-pagination',
          bulletClass: 'hero-bullet',
          bulletActiveClass: 'hero-bullet-active',
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="w-full h-[550px] sm:h-[650px] lg:h-[800px] xl:h-[900px]"
      >
        {slides.map((slide) => {
          const score = parseFloat(slide.vod_score || '0');
          return (
            <SwiperSlide key={slide.vod_id} className="relative w-full h-full overflow-hidden">
              {/* Background Image with Cinematic Ken Burns & Parallax */}
              <div className="absolute inset-0 overflow-hidden" data-swiper-parallax="25%">
                {slide.vod_pic && (
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 z-0 animate-ken-burns">
                      <Image
                        src={slide.vod_pic}
                        alt={slide.vod_name}
                        fill
                        className="object-cover brightness-[0.85]"
                        priority={true}
                        unoptimized
                      />
                    </div>
                  </div>
                )}

                {/* Multi-layered High-End Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-[#020617]/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/30 z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_40%,rgba(59,130,246,0.15),transparent_60%)] z-10" />

                {/* Subtle Overlay Texture (Movie Grain Style) */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              </div>

              {/* Centered Content Container */}
              <div className="absolute inset-0 z-20 flex items-center justify-center p-6 sm:p-10 lg:p-16">
                <div className="w-full max-w-[1400px] mx-auto flex flex-col justify-end h-full pb-24 sm:pb-32 lg:pb-48">
                  <div className="max-w-4xl space-y-6 sm:space-y-8" data-swiper-parallax="-400">

                    {/* Floating Info Badges with Micro-Animations */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 opacity-0 animate-slide-in-left [animation-delay:300ms] [animation-fill-mode:forwards]">
                      {slide.type_name && (
                        <div className="flex items-center gap-1.5 bg-blue-600/20 backdrop-blur-xl text-blue-400 text-[11px] sm:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-blue-500/30">
                          <Layout size={12} />
                          {slide.type_name}
                        </div>
                      )}
                      {slide.vod_remarks && (
                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl text-white/90 text-[11px] sm:text-xs font-bold px-4 py-1.5 rounded-full border border-white/10">
                          {slide.vod_remarks}
                        </div>
                      )}
                      {slide.vod_year && (
                        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-xl text-white/70 text-[11px] sm:text-xs font-medium px-4 py-1.5 rounded-full border border-white/10 hidden sm:flex">
                          <Calendar size={12} />
                          {slide.vod_year}
                        </div>
                      )}
                      {score > 0 && (
                        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[11px] sm:text-xs font-black px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                          <Star size={12} fill="currentColor" />
                          {score.toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* Massive Cinematic Title */}
                    <div className="space-y-4">
                      <h2
                        className="text-white font-black text-5xl sm:text-7xl lg:text-9xl leading-[1] tracking-tighter opacity-0 animate-slide-in-left [animation-delay:500ms] [animation-fill-mode:forwards]"
                        style={{ filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.8))' }}
                      >
                        {slide.vod_name}
                      </h2>

                      {/* Secondary Info (Director/Actor) */}
                      {(slide.vod_actor || slide.vod_director) && (
                        <p className="text-white/50 text-xs sm:text-sm font-bold flex flex-wrap items-center gap-x-4 gap-y-1 opacity-0 animate-slide-in-left [animation-delay:600ms] [animation-fill-mode:forwards]">
                          {slide.vod_director && <span className="flex items-center gap-1.5"><User size={14} className="text-blue-500" /> {slide.vod_director.split(',')[0]} (导演)</span>}
                          {slide.vod_actor && <span className="flex items-center gap-1.5 hidden sm:flex"><User size={14} className="text-rose-500" /> {slide.vod_actor.split(',').slice(0, 3).join(', ')}</span>}
                        </p>
                      )}
                    </div>

                    {/* Blurb with Better Legibility */}
                    {slide.vod_blurb && (
                      <div
                        className="text-slate-300 text-sm sm:text-xl lg:text-2xl max-w-3xl line-clamp-2 leading-relaxed font-medium drop-shadow-2xl opacity-0 animate-slide-in-left [animation-delay:700ms] [animation-fill-mode:forwards]"
                        dangerouslySetInnerHTML={{ __html: slide.vod_blurb }}
                      />
                    )}

                    {/* CTA Actions with Premium Hover States */}
                    <div className="flex items-center gap-5 sm:gap-6 pt-6 sm:pt-10 opacity-0 animate-slide-in-left [animation-delay:850ms] [animation-fill-mode:forwards]">
                      <Link
                        href={`/vod/${slide.vod_id}`}
                        className="group/btn flex items-center justify-center gap-3 bg-white text-slate-950 font-black px-5 py-2 sm:px-14 sm:py-5.5 rounded-2xl text-base sm:text-xl hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-2 ring-1 ring-white/20 active:scale-95"
                      >
                        <Play size={24} fill="currentColor" className="transition-transform group-hover/btn:scale-125 duration-500" />
                        立即点播
                      </Link>
                      <Link
                        href={`/vod/${slide.vod_id}`}
                        className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-3xl text-white font-black px-5 py-2 sm:px-14 sm:py-5.5 rounded-2xl text-base sm:text-xl hover:bg-white/20 transition-all duration-500 border border-white/20 shadow-2xl active:scale-95"
                      >
                        <Info size={24} />
                        详情介绍
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}

        {/* Cinematic Pagination Control */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-10">
          <div className="hero-pagination flex items-center gap-3"></div>
        </div>

        {/* Industrial Grade Navigation Arrows */}
        <button className="swiper-button-prev-hero absolute left-10 top-1/2 -translate-y-1/2 z-40 w-20 h-20 rounded-3xl bg-black/10 backdrop-blur-3xl border border-white/5 text-white/50 flex items-center justify-center cursor-pointer hover:bg-blue-600 hover:text-white hover:border-blue-400 transition-all duration-700 opacity-0 group-hover/slider:opacity-100 hidden xl:flex shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:scale-110">
          <ChevronLeft size={48} strokeWidth={1} />
        </button>
        <button className="swiper-button-next-hero absolute right-10 top-1/2 -translate-y-1/2 z-40 w-20 h-20 rounded-3xl bg-black/10 backdrop-blur-3xl border border-white/5 text-white/50 flex items-center justify-center cursor-pointer hover:bg-blue-600 hover:text-white hover:border-blue-400 transition-all duration-700 opacity-0 group-hover/slider:opacity-100 hidden xl:flex shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:scale-110">
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </Swiper>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes ken-burns {
          0% { transform: scale(1.0) rotate(0.01deg) }
          100% { transform: scale(1.18) rotate(0.01deg) }
        }
        .animate-ken-burns {
          animation: ken-burns 15s cubic-bezier(0.1, 0, 0.9, 1) infinite alternate;
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-60px); filter: blur(20px); }
          to { opacity: 1; transform: translateX(0); filter: blur(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hero-bullet {
          width: 6px;
          height: 6px;
          background: rgba(255,255,255,0.15);
          border-radius: 3px;
          transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .hero-bullet-active {
          width: 60px;
          background: #3b82f6;
          box-shadow: 0 0 30px rgba(59,130,246,0.6);
          border-color: #60a5fa;
        }
        .hero-bullet:hover {
          background: rgba(255,255,255,0.4);
        }
      `}} />
    </div>
  );
}
