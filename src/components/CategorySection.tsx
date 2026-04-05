'use client';

import { useEffect, useState } from 'react';
import { VodItem } from '@/types';
import { getVideoList, getSubCategoryIds } from '@/lib/api';
import VideoCard from './VideoCard';
import Link from 'next/link';
import { ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CategorySectionProps {
  typeId: number;
  typeName: string;
}

type SortMode = 'recent' | 'hot';

function SkeletonCard() {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl overflow-hidden shrink-0 h-full">
      <div className="bg-card-bg/10 animate-pulse aspect-[3/4] w-full" />
      <div className="p-4 flex flex-col gap-3">
        <div className="bg-card-bg/10 animate-pulse h-4 rounded w-full" />
        <div className="bg-card-bg/10 animate-pulse h-3 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function CategorySection({ typeId, typeName }: CategorySectionProps) {
  const { t } = useTranslation();
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
        const subIds = getSubCategoryIds(typeId);
        if (subIds.length === 0) subIds.push(typeId);

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
    { mode: 'recent', icon: <Clock size={12} />, label: t('sort.recent') },
    { mode: 'hot', icon: <TrendingUp size={12} />, label: t('sort.hot') },
  ];

  return (
    <section id={`cat-section-${typeId}`} className="group/section last:pb-10">
      <div className="flex items-center justify-between mb-8 sm:mb-10">
        <div className="flex items-center gap-4">
          <Link href={`/?cat=${typeId}`} className="flex items-center gap-2 group/title relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-rose-600 opacity-0 group-hover/title:opacity-20 blur-xl transition-opacity duration-500 rounded-full"></div>
            <span className="w-2 h-8 sm:h-10 bg-gradient-to-b from-blue-500 via-purple-500 to-rose-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] group-hover/title:shadow-[0_0_25px_rgba(236,72,153,0.8)] transition-shadow duration-500"></span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white group-hover/title:text-transparent group-hover/title:bg-clip-text group-hover/title:bg-gradient-to-r group-hover/title:from-blue-400 group-hover/title:via-purple-400 group-hover/title:to-rose-400 group-hover/title:animate-gradient-x transition-all duration-500">
              {typeName}
            </h2>
            <ChevronRight size={32} className="text-slate-500 group-hover/title:translate-x-2 group-hover/title:text-rose-400 transition-all duration-500 hidden sm:block" />
          </Link>

          <div className="flex items-center gap-1 bg-[#11141d]/80 backdrop-blur-md border border-white/5 rounded-xl p-1 ml-4 hidden md:flex shadow-inner shadow-black/50">
            {sortButtons.map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-black transition-all cursor-pointer ${sortMode === mode
                  ? 'bg-card-bg dark:bg-slate-800 text-foreground shadow-xl'
                  : 'text-slate-400 hover:text-foreground dark:hover:text-white'
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
          className="relative group/btn text-sm font-black px-6 py-2.5 rounded-full overflow-hidden transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-0 bg-[#11141d] border border-white/10 rounded-full z-0 group-hover/btn:bg-transparent transition-colors duration-300"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 opacity-0 group-hover/btn:opacity-100 group-hover/btn:animate-gradient-x transition-opacity duration-500 z-0"></div>
          <span className="relative z-10 text-slate-300 group-hover/btn:text-white transition-colors duration-300">{t('common.viewAll')}</span>
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
