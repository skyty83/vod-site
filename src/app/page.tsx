'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import CategoryNav from '@/components/CategoryNav';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';
import HeroSlider from '@/components/HeroSlider';
import CategorySection from '@/components/CategorySection';
import { CategoryItem, VodItem } from '@/types';
import { getCategories, getVideoList } from '@/lib/api';
import { TrendingUp, Clock, LayoutGrid } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

// 홈 화면에 표시할 주요 대분류 섹션 ID 목록
const HOME_SECTION_IDS = [1, 2, 3, 4, 36];

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  const pageParam = searchParams.get('page');
  const yearParam = searchParams.get('year');

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [videos, setVideos] = useState<VodItem[]>([]);
  const [heroVideos, setHeroVideos] = useState<VodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(pageParam || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const activeCategory = catParam ? parseInt(catParam) : undefined;
  const year = yearParam || undefined;

  // Initial Content Sync
  useEffect(() => {
    getCategories().then(setCategories);
    
    // Fetch the most popular 'Hot' video from each of the 5 main categories
    const fetchHeroVideos = async () => {
      try {
        const promises = HOME_SECTION_IDS.map(id => getVideoList(1, id, true));
        const results = await Promise.all(promises);
        
        const combinedHero = results.map(res => {
          const list = res.list as VodItem[];
          if (!list || list.length === 0) return null;
          // Sort by score to get the 'Hot' item
          return list.sort((a, b) => {
            const scoreA = parseFloat(a.vod_score || '0');
            const scoreB = parseFloat(b.vod_score || '0');
            return scoreB - scoreA;
          })[0];
        }).filter((item): item is VodItem => !!item);
        
        setHeroVideos(combinedHero);
      } catch (err) {
        console.error('Failed to fetch hero videos:', err);
      }
    };
    fetchHeroVideos();
  }, []);

  useEffect(() => {
    setPage(parseInt(pageParam || '1'));
  }, [pageParam]);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVideoList(page, activeCategory, true, year);
      setVideos(res.list as VodItem[]);
      setTotalPages(res.pagecount);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeCategory, page, year]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/?${params.toString()}`);
  };

  const handleYearSelect = (y: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (y) params.set('year', y);
    else params.delete('year');
    params.set('page', '1');
    router.push(`/?${params.toString()}`);
  };

  const activeCategoryName = activeCategory
    ? categories.find(c => c.type_id === activeCategory)?.type_name || '探索'
    : '首页';

  const sectionsToRender = categories.filter(c => HOME_SECTION_IDS.includes(c.type_id));

  const isHome = activeCategory === undefined;
  const isSeriesPage = activeCategory === 2;
  const isMoviePage = activeCategory === 1;
  const isVarietyPage = activeCategory === 3;
  const isAnimePage = activeCategory === 4;

  const SERIES_PAGE_SUB_IDS = [13, 14, 15, 16, 21, 22, 23, 24];
  const MOVIE_PAGE_SUB_IDS = [6, 7, 8, 9, 10, 11, 12, 20];
  const VARIETY_PAGE_SUB_IDS = [25, 26, 27, 28];
  const ANIME_PAGE_SUB_IDS = [29, 30, 31, 32];

  const isSectionalPage = isHome || isSeriesPage || isMoviePage || isVarietyPage || isAnimePage;

  const getActiveSubIds = () => {
    if (isSeriesPage) return SERIES_PAGE_SUB_IDS;
    if (isMoviePage) return MOVIE_PAGE_SUB_IDS;
    if (isVarietyPage) return VARIETY_PAGE_SUB_IDS;
    if (isAnimePage) return ANIME_PAGE_SUB_IDS;
    return [];
  };

  const activeSubIds = getActiveSubIds();
  const getHeaderGradient = () => {
    if (isMoviePage) return 'from-rose-500 to-orange-500';
    if (isVarietyPage) return 'from-emerald-500 to-teal-500';
    if (isAnimePage) return 'from-purple-500 to-pink-500';
    return 'from-blue-500 to-rose-500';
  };

  return (
    <div className="w-full flex-1 overflow-x-hidden">
      {/* =============== HERO SLIDER (TRULY FULL WIDTH) =============== */}
      {isHome && heroVideos.length > 0 && (
        <div className="mb-10 sm:mb-14">
          <HeroSlider items={heroVideos} />
        </div>
      )}

      {/* =============== MAIN CONTENT (CENTERED) =============== */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-10 sm:gap-14">
        {isSectionalPage && (
          <>
            {/* Sectional Page Header */}
            {(isSeriesPage || isMoviePage || isVarietyPage || isAnimePage) && (
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
                  <span className={`w-2 h-10 rounded-full bg-gradient-to-b ${getHeaderGradient()}`}></span>
                  {activeCategoryName}
                </h1>
              </div>
            )}

            {(isHome ? sectionsToRender : activeSubIds.map(id => categories.find(c => c.type_id === id)).filter((c): c is CategoryItem => !!c)).length > 0 ? (
              (isHome ? sectionsToRender : activeSubIds.map(id => categories.find(c => c.type_id === id)).filter((c): c is CategoryItem => !!c)).map(cat => (
                <CategorySection
                  key={cat.type_id}
                  typeId={cat.type_id}
                  typeName={cat.type_name}
                />
              ))
            ) : (
              <div className="flex flex-col gap-12 text-center text-slate-500 py-20 bg-slate-100 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <LayoutGrid size={48} className="mx-auto opacity-20 mb-4" />
                <p className="font-bold">正在加载精彩内容...</p>
              </div>
            )}
          </>
        )}

        {/* =============== OTHER CATEGORY LIST / ALL VIDEOS VIEW =============== */}
        {!isSectionalPage && (
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-rose-500 rounded-full"></span>
                  {activeCategoryName}
                </h2>
                {!loading && total > 0 && (
                  <span className="inline-flex bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-1 rounded-full items-center">
                    共 {total.toLocaleString()} 部
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border shadow-sm bg-blue-500 text-white border-blue-500">
                  <Clock size={14} />
                  <span>最新更新</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border shadow-sm bg-white/60 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800">
                  <TrendingUp size={14} />
                  <span>热门排行</span>
                </div>
              </div>
            </div>

            {/* Year Filter */}
            <div className="mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 py-2">
                <button
                  onClick={() => handleYearSelect(undefined)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${year === undefined
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                    : 'bg-white/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                >
                  全部年份
                </button>
                {YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => handleYearSelect(y)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${year === y
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                      }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <VideoGrid videos={videos} loading={loading} />

            {!loading && total > 0 && (
              <div className="mt-12">
                <Pagination
                  currentPage={page}
                  totalPages={Math.min(totalPages, 500)}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col">
      <Suspense fallback={<div className="flex-1" />}>
        <HomeContent />
      </Suspense>

      <footer className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 py-8 sm:py-10 mt-10">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
            © 2026 喵喵影视 · 仅供学习交流
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/80"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80"></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
