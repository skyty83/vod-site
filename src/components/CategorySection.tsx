'use client';

import { useEffect, useState } from 'react';
import { VodItem } from '@/types';
import { getVideoList } from '@/lib/api';
import VideoCard from './VideoCard';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Clock, TrendingUp, Zap } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

interface CategorySectionProps {
  typeId: number;
  typeName: string;
}

type SortMode = 'recent' | 'hot';

function SkeletonCard() {
  return (
    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shrink-0 h-full">
      <div className="bg-slate-200 dark:bg-slate-800 animate-pulse aspect-[2/3] w-full" />
      <div className="p-3 flex flex-col gap-2">
        <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-3.5 rounded w-full" />
        <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-3 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function CategorySection({ typeId, typeName }: CategorySectionProps) {
  const [videos, setVideos] = useState<VodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  useEffect(() => {
    setLoading(true);
    // In production, an appropriate API param for 'hot' should be applied. 
    // Here we simulate by requesting page 1 or page 2 just to show different content if desired, 
    // but typically `getVideoList` doesn't support 'sort' without custom backend, so we fetch pg=1.
    getVideoList(sortMode === 'hot' ? 2 : 1, typeId).then(r => {
      setVideos(r.list.slice(0, 15));
      setLoading(false);
    });
  }, [typeId, sortMode]);

  const sortButtons: { mode: SortMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'recent', icon: <Clock size={12} />, label: '最新' },
    { mode: 'hot', icon: <TrendingUp size={12} />, label: '热播' },
  ];

  return (
    <section className="group/section">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/?cat=${typeId}`}
            className="flex items-center gap-2 group/title"
          >
            <span className="w-1.5 h-6 sm:h-7 bg-gradient-to-b from-blue-500 to-rose-500 rounded-full blur-[0.5px]"></span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white group-hover/title:text-blue-500 dark:group-hover/title:text-blue-400 transition-colors">
              {typeName}
            </h2>
            <ChevronRight size={22} className="text-slate-400 group-hover/title:translate-x-1 group-hover/title:text-blue-500 transition-all hidden sm:block delay-75" />
          </Link>

          {/* Sort tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-md p-0.5 ml-2 hidden sm:flex">
            {sortButtons.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all duration-200 ${sortMode === mode
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        <Link
          href={`/?cat=${typeId}`}
          className="flex items-center gap-1 text-sm font-bold bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:border-blue-500/50 dark:hover:text-blue-400 transition-all shadow-sm"
        >
          更多
        </Link>
      </div>

      {/* Swiper Slider */}
      <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Swiper
          modules={[Navigation, FreeMode]}
          navigation={{
            prevEl: `.swiper-prev-${typeId}`,
            nextEl: `.swiper-next-${typeId}`
          }}
          freeMode={true}
          slidesPerView="auto"
          spaceBetween={16}
          className="w-full pb-4 pt-1"
        >
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
              <SwiperSlide key={i} style={{ width: 'auto', height: 'auto' }} className="!w-[130px] sm:!w-[160px] lg:!w-[180px]">
                <SkeletonCard />
              </SwiperSlide>
            ))
            : videos.map((vod, i) => (
              <SwiperSlide key={vod.vod_id} style={{ width: 'auto', height: 'auto' }} className="!w-[130px] sm:!w-[160px] lg:!w-[180px]">
                {/* Item */}
                <div className="relative h-full">
                  {/* Rank Badge for Top 3 */}
                  {sortMode === 'hot' && i < 3 && (
                    <div className={`absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg border-2 border-white dark:border-slate-950 ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                        i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                          'bg-gradient-to-br from-amber-700 to-amber-900'
                      }`}>
                      {i + 1}
                    </div>
                  )}

                  <VideoCard vod={vod} />
                </div>
              </SwiperSlide>
            ))
          }

          {!loading && videos.length > 0 && (
            <SwiperSlide style={{ width: 'auto', height: 'auto' }} className="!w-[130px] sm:!w-[160px] lg:!w-[180px]">
              <Link
                href={`/?cat=${typeId}`}
                className="h-[calc(100%-42px)] sm:h-[calc(100%-48px)] aspect-[2/3] bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-500/50 hover:text-blue-500 dark:hover:text-blue-400 transition-all group/more mt-0"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover/more:bg-blue-500 group-hover/more:text-white transition-all">
                  <Zap size={20} className="group-hover/more:scale-110 transition-transform" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">查看全部</p>
                  <p className="text-xs opacity-70 mt-1">{typeName}</p>
                </div>
              </Link>
            </SwiperSlide>
          )}
        </Swiper>

        {/* Custom Nav Arrows - hidden on mobile, placed to overlap edges */}
        <button className={`swiper-prev-${typeId} absolute left-2 sm:left-4 top-[calc(50%-20px)] sm:top-[calc(50%-24px)] z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.15)] opacity-0 group-hover/section:opacity-100 transition-all hover:scale-110 hover:text-blue-500 disabled:opacity-0 hidden sm:flex items-center justify-center`}>
          <ChevronLeft size={24} />
        </button>
        <button className={`swiper-next-${typeId} absolute right-2 sm:right-4 top-[calc(50%-20px)] sm:top-[calc(50%-24px)] z-20 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.15)] opacity-0 group-hover/section:opacity-100 transition-all hover:scale-110 hover:text-blue-500 disabled:opacity-0 hidden sm:flex items-center justify-center`}>
          <ChevronRight size={24} />
        </button>
      </div>
    </section>
  );
}
