'use client';

import { VodItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Info, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';

// 由于 Swiper 9+ 已将 effect 样式合并，无需单独引入 effect-fade 样式
// 如需兼容旧版可保留，但当前版本会报模块缺失，故注释掉
// import 'swiper/css/effect-fade';

interface HeroSliderProps {
  items: VodItem[];
}

export default function HeroSlider({ items }: HeroSliderProps) {
  const slides = items.slice(0, 10);

  if (!slides.length) return null;

  const swiperKey = slides.map(s => s.vod_id).join('-');
  const useRewind = slides.length === 5;

  return (
    <div className="relative w-full overflow-hidden group/slider bg-[#090a0f]">
      <Swiper
        key={swiperKey}
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={1000}
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
        autoplay={{ delay: 5000, disableOnInteraction: false, waitForTransition: false }}
        loop={slides.length > 5}
        rewind={useRewind}
        onSlideChange={(swiper) => {
          if (!swiper.autoplay.running) {
            swiper.autoplay.start();
          }
        }}
        className="hero-swiper w-full h-[600px] sm:h-[700px] lg:h-[800px] xl:h-[850px]"
      >
        {slides.map((slide, index) => {
          const score = parseFloat(slide.vod_score || '0' as string);
          return (
            <SwiperSlide key={`${slide.vod_id}-${index}`} className="relative w-full h-full overflow-hidden">
              <div className="absolute inset-0 z-0">
                {(slide.vod_pic || slide.vod_pic_screenshot) && (
                  <div className="relative w-full h-full scale-105 animate-ken-burns">
                    <Image
                      src={slide.vod_pic || slide.vod_pic_screenshot || ''}
                      alt={slide.vod_name}
                      fill
                      className="object-cover brightness-[0.6] saturate-125"
                      priority={index === 0}
                      unoptimized
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/35 z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/70 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-[#090a0f]/25 z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_35%,rgba(59,130,246,0.22),transparent_55%)] z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(236,72,153,0.18),transparent_55%)] z-10" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.06] z-10 mix-blend-overlay" />
              </div>

              <div className="absolute inset-0 z-20 flex items-center">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-10 lg:gap-14 items-center">
                    <div className="max-w-3xl space-y-6 sm:space-y-8">
                      <div className="flex flex-wrap items-center gap-3 animate-fade-in-up">
                        {slide.type_name && (
                          <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                            {slide.type_name}
                          </span>
                        )}
                        {slide.vod_remarks && (
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-600/30 to-rose-600/25 border border-white/10 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                            {slide.vod_remarks}
                          </span>
                        )}
                        {score > 0 && (
                          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <span className="text-amber-400 font-black text-sm">{score.toFixed(1)}</span>
                          </div>
                        )}
                        {slide.vod_time && (
                          <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                            <Clock size={10} />
                            {slide.vod_time.split(' ')[0]}
                          </span>
                        )}
                        {(slide.vod_year || slide.vod_area) && (
                          <span className="text-slate-300 text-sm font-bold hidden sm:inline">
                            {[slide.vod_year, slide.vod_area].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>

                      <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tighter animate-fade-in-up delay-100">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-slate-400">
                          {slide.vod_name}
                        </span>
                      </h2>

                      {slide.vod_blurb && (
                        <div className="animate-fade-in-up delay-200">
                          <div
                            className="text-slate-200/80 text-base sm:text-xl line-clamp-2 max-w-2xl leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: slide.vod_blurb }}
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pt-2 animate-fade-in-up delay-300">
                        <Link
                          href={`/vod/${slide.vod_id}`}
                          className="group/cta relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-full font-black text-white shadow-2xl shadow-black/40 overflow-hidden active:scale-95 transition-transform"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 opacity-95 group-hover/cta:opacity-100 transition-opacity" />
                          <div className="absolute inset-0 opacity-0 group-hover/cta:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
                          <div className="absolute inset-0 -translate-x-full group-hover/cta:animate-hero-shine bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                          <span className="relative z-10 inline-flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-black/25 backdrop-blur-md border border-white/15 flex items-center justify-center">
                              <Play size={18} fill="currentColor" className="ml-0.5" />
                            </span>
                            立即播放
                          </span>
                        </Link>

                        <Link
                          href={`/vod/${slide.vod_id}`}
                          className="inline-flex items-center justify-center gap-2 px-7 sm:px-8 py-4 rounded-full font-black text-white bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md shadow-xl shadow-black/30 transition-colors active:scale-95"
                        >
                          <Info size={18} />
                          详情介绍
                        </Link>
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      <Link
                        href={`/vod/${slide.vod_id}`}
                        className="block relative max-w-[360px] ml-auto animate-fade-in-up delay-200"
                      >
                        <div className="absolute -inset-3 bg-gradient-to-b from-blue-500/20 to-rose-500/20 blur-2xl opacity-60" />
                        <div className="relative aspect-[2/3] rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.75)]">
                          {(slide.vod_pic || slide.vod_pic_screenshot) && (
                            <Image
                              src={slide.vod_pic || slide.vod_pic_screenshot || ''}
                              alt={slide.vod_name}
                              fill
                              className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                              unoptimized
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}

        {/* Custom Navigation */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
          <div className="hero-pagination flex items-center gap-2.5"></div>
        </div>

        <button className="swiper-button-prev-hero absolute left-8 top-1/2 -translate-y-1/2 z-40 w-14 h-14 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-all hidden xl:flex">
          <ChevronLeft size={32} />
        </button>
        <button className="swiper-button-next-hero absolute right-8 top-1/2 -translate-y-1/2 z-40 w-14 h-14 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-all hidden xl:flex">
          <ChevronRight size={32} />
        </button>
      </Swiper>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes ken-burns {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-ken-burns {
          animation: ken-burns 20s ease infinite alternate;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }

        @keyframes hero-shine {
          0% { transform: translateX(-120%); opacity: 0; }
          25% { opacity: 1; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        .animate-hero-shine {
          animation: hero-shine 1.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes hero-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .hero-swiper .swiper-slide {
          pointer-events: none;
        }
        .hero-swiper .swiper-slide-active,
        .hero-swiper .swiper-slide-duplicate-active {
          pointer-events: auto;
        }

        .hero-bullet {
          width: 44px;
          height: 4px;
          background: rgba(255,255,255,0.12);
          border-radius: 999px;
          transition: all 0.35s ease;
          cursor: pointer;
          overflow: hidden;
          position: relative;
        }
        .hero-bullet::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #fb7185);
          opacity: 0.9;
        }
        .hero-bullet:hover {
          background: rgba(255,255,255,0.22);
        }
        .hero-bullet-active {
          background: rgba(255,255,255,0.16);
          box-shadow: 0 0 25px rgba(59,130,246,0.45);
        }
        .hero-bullet-active::after {
          animation: hero-progress 6s linear forwards;
        }
      `}} />
    </div>
  );
}
