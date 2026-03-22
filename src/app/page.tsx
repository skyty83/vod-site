'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';
import HeroSlider from '@/components/HeroSlider';
import CategorySection from '@/components/CategorySection';
import { CategoryItem, VodItem } from '@/types';
import { getCategories, getVideoList } from '@/lib/api';
import { TrendingUp, Clock, LayoutGrid } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

const HOME_SECTION_IDS = [6, 13, 25, 29, 14, 15, 7, 8];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  const activeCategory = catParam ? parseInt(catParam) : undefined;

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [heroVideos, setHeroVideos] = useState<VodItem[]>([]);
  const [videos, setVideos] = useState<VodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getCategories().then(setCategories);
    getVideoList(1).then(r => {
      setHeroVideos(r.list.filter(v => v.vod_pic).slice(0, 10));
    });
  }, []);

  const fetchVideos = useCallback(async () => {
    if (activeCategory === undefined) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getVideoList(page, activeCategory);
      setVideos(result.list);
      setTotalPages(result.pagecount);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory]);

  useEffect(() => {
    fetchVideos();
    if (activeCategory !== undefined) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [fetchVideos]);

  const handleCategorySelect = (id?: number) => {
    setPage(1);
    if (id) {
      router.push(`/?cat=${id}`);
    } else {
      router.push(`/`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const activeCategoryName = activeCategory
    ? categories.find(c => c.type_id === activeCategory)?.type_name
    : undefined;

  const sectionCats = categories.filter(c => HOME_SECTION_IDS.includes(c.type_id));
  // Keep the render order aligned with HOME_SECTION_IDS manually, or let map natural order
  const sectionsToRender = sectionCats.length > 0 
    ? HOME_SECTION_IDS.map(id => sectionCats.find(c => c.type_id === id)).filter((c): c is CategoryItem => !!c)
    : categories.filter(c => c.type_pid !== 0 && c.type_pid !== undefined).slice(0, 5);

  const isHome = activeCategory === undefined;

  return (
    <>
      <CategoryNav
        categories={categories}
        activeId={activeCategory}
        onSelect={handleCategorySelect}
      />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 overflow-x-hidden">
        {/* =============== HOME VIEW =============== */}
        {isHome && (
          <div className="flex flex-col gap-10 sm:gap-14">
            {heroVideos.length > 0 && (
              <div>
                <HeroSlider items={heroVideos} />
              </div>
            )}

            {sectionsToRender.length > 0 ? (
              sectionsToRender.map(cat => (
                <CategorySection
                  key={cat.type_id}
                  typeId={cat.type_id}
                  typeName={cat.type_name}
                />
              ))
            ) : (
              <div className="flex flex-col gap-12">
                {[1, 2, 3].map(i => (
                  <div key={i}>
                    <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse mb-6" />
                    <div className="flex gap-4">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="shrink-0 w-40 aspect-[2/3] bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =============== CATEGORY VIEW =============== */}
        {!isHome && (
          <div>
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

            <VideoGrid videos={videos} loading={loading} />

            {!loading && (
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
    </>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col">
      <Header />
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
