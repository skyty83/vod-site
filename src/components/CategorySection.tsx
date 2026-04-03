'use client';

import { useEffect, useState } from 'react';
import { VodItem } from '@/types';
import { getVideoList } from '@/lib/api';
import VideoCard from './VideoCard';
import Link from 'next/link';
import { ChevronRight, Clock, TrendingUp } from 'lucide-react';

interface CategorySectionProps {
  typeId: number;
  typeName: string;
}

type SortMode = 'recent' | 'hot';

function SkeletonCard() {
  return (
    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shrink-0 h-full">
      <div className="bg-slate-200 dark:bg-slate-800 animate-pulse aspect-[3/4] w-full" />
      <div className="p-4 flex flex-col gap-3">
        <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-4 rounded w-full" />
        <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-3 rounded w-2/3" />
      </div>
    </div>
  );
}

const SUB_CATS: Record<number, number[]> = {
  1: [6, 7, 8, 9, 10, 11, 12, 20],        // 영화
  2: [13, 14, 15, 16, 21, 22, 23, 24],    // 연속극
  3: [25, 26, 27, 28],                    // 예능
  4: [29, 30, 31, 32],                    // 애니
};

export default function CategorySection({ typeId, typeName }: CategorySectionProps) {
  const [videos, setVideos] = useState<VodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(`cat-section-${typeId}`);
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [typeId]);

  useEffect(() => {
    if (!isVisible) return;
    setLoading(true);

    const fetchVideos = async () => {
      try {
        const subIds = SUB_CATS[typeId] || [typeId];

        // Fetch up to 10 items from multiple sub-categories for a diverse mix
        const promises = subIds.slice(0, 5).map(sid => getVideoList(sortMode === 'hot' ? 2 : 1, sid, true));
        // Only unshift the parent category if we are fetching multiple subcategories
        if (subIds.length > 1) {
          promises.unshift(getVideoList(sortMode === 'hot' ? 2 : 1, typeId, true));
        }

        const results = await Promise.all(promises);
        const combined = results.flatMap(r => r.list as VodItem[]);

        // Clean duplicates and sort
        const unique = Array.from(new Map(combined.map(item => [item.vod_id, item])).values());
        const sorted = unique.sort((a, b) => {
          if (sortMode === 'hot') {
            const scoreA = parseFloat(a.vod_score || '0');
            const scoreB = parseFloat(b.vod_score || '0');
            return scoreB - scoreA;
          }
          const timeA = a.vod_time ? new Date(a.vod_time).getTime() : 0;
          const timeB = b.vod_time ? new Date(b.vod_time).getTime() : 0;
          return timeB - timeA;
        });

        setVideos(sorted.slice(0, 10));
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [typeId, sortMode, isVisible]);

  const sortButtons: { mode: SortMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'recent', icon: <Clock size={12} />, label: '最新' },
    { mode: 'hot', icon: <TrendingUp size={12} />, label: '热播' },
  ];

  return (
    <section id={`cat-section-${typeId}`} className="group/section last:pb-10">
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div className="flex items-center gap-4">
          <Link href={`/?cat=${typeId}`} className="flex items-center gap-2 group/title">
            <span className="w-2.5 h-8 sm:h-10 bg-gradient-to-b from-blue-500 to-rose-500 rounded-full shadow-lg shadow-blue-500/20"></span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white group-hover/title:text-blue-500 transition-all">
              {typeName}
            </h2>
            <ChevronRight size={28} className="text-slate-400 group-hover/title:translate-x-1.5 group-hover/title:text-blue-500 transition-all hidden sm:block" />
          </Link>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-1 ml-4 hidden md:flex">
            {sortButtons.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-black transition-all cursor-pointer ${sortMode === mode
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
          className="text-sm font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-6 py-2.5 rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-500 dark:hover:border-blue-500 transition-all shadow-md"
        >
          查看全部
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
          : videos.map((vod, i) => (
            <div key={vod.vod_id} className="relative group/card-wrap">
              {sortMode === 'hot' && i < 3 && (
                <div className={`absolute -top-3 -left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shadow-2xl border-2 border-white dark:border-slate-950 transform group-hover/card-wrap:scale-110 transition-transform z-100 ${i === 0 ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500' : i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' : 'bg-gradient-to-br from-amber-700 to-amber-900'}`}>
                  {i + 1}
                </div>
              )}
              <VideoCard vod={vod} />
            </div>
          ))
        }
      </div>
    </section>
  );
}
