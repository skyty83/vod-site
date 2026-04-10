'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';
import HeroSlider from '@/components/HeroSlider';
import CategorySection from '@/components/CategorySection';
import { CategoryItem, VodItem } from '@/types';
import { getCategories, getVideoList, getSubCategoryIds } from '@/lib/api';
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
  const areaParam = searchParams.get('area');

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [videos, setVideos] = useState<VodItem[]>([]);
  const [heroVideos, setHeroVideos] = useState<VodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(pageParam || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const activeCategory = catParam ? parseInt(catParam) : undefined;
  const year = yearParam || undefined;
  const area = areaParam || undefined;

  // Initial Content Sync
  useEffect(() => {
    const initData = async () => {
      // 1. 카테고리 먼저 로드
      const cats = await getCategories();
      setCategories(cats);

      // 2. 히어로 비디오 로드 (각 주요 카테고리별 인기 1개씩)
      try {
        // 효율적인 조회를 위해 주요 카테고리별로 하나의 프로미스만 생성
        const promises = HOME_SECTION_IDS.map(async id => {
          // 속도를 위해 fastMode를 다시 활성화 (상위 2개 API만 사용해도 충분히 대표작 확보 가능)
          const res = await getVideoList(1, id, true);
          let list = res.list as VodItem[];

          // 상위 카테고리가 비어있는 특수한 경우만 최소한으로 하위 카테고리 체크
          if (!list || list.length === 0) {
            const subIds = getSubCategoryIds(id);
            if (subIds.length > 0) {
              // 모든 하위 카테고리를 따로 부르지 않고 첫 번째 하위 장르 하나만 체크하여 부하 감소
              const fallbackRes = await getVideoList(1, subIds[0], true);
              list = fallbackRes.list as VodItem[];
            }
          }

          // 중복 및 인기순 정렬
          const uniqueItems: Record<string, VodItem> = {};
          list.forEach(item => {
            const name = item.vod_name;
            if (!uniqueItems[name] || (Number(item.vod_hits || 0) > Number(uniqueItems[name].vod_hits || 0))) {
              uniqueItems[name] = item;
            }
          });
          
          const sorted = Object.values(uniqueItems).sort((a, b) => 
            Number(b.vod_hits || 0) - Number(a.vod_hits || 0)
          );

          return sorted;
        });

        const results = await Promise.all(promises);

        // 결과 병합 및 슬라이드 구성 (인기 1위 선정)
        const combinedHero = results.map(list => {
          if (!list || list.length === 0) return null;
          // 이미지가 있는 최우수작 선정
          return list.find(item => item.vod_pic) || list[0];
        }).filter((item): item is VodItem => !!item);

        setHeroVideos([...combinedHero]);
      } catch (err) {
        console.error('Failed to fetch hero videos:', err);
      }
    };

    initData();
  }, []); // 마운트 시 최초 1회만 실행

  useEffect(() => {
    setPage(parseInt(pageParam || '1'));
  }, [pageParam]);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVideoList(page, activeCategory, true, year, area);
      setVideos(res.list as VodItem[]);
      setTotalPages(res.pagecount);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeCategory, page, year, area]);

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

  const handleAreaSelect = (a: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (a) params.set('area', a);
    else params.delete('area');
    params.set('page', '1');
    router.push(`/?${params.toString()}`);
  };

  const activeCategoryName = activeCategory
    ? categories.find(c => c.type_id === activeCategory)?.type_name || '探索'
    : '首页';

  const sectionsToRender = categories.filter(c => HOME_SECTION_IDS.includes(c.type_id));

  const isHome = activeCategory === undefined;

  const isSectionalPage = isHome || (activeCategory !== undefined && getSubCategoryIds(activeCategory).length > 0);

  const getHeaderGradient = (catId?: number) => {
    if (catId === 1) return 'from-rose-500 to-orange-500'; // 电影
    if (catId === 3) return 'from-emerald-500 to-teal-500'; // 综艺
    if (catId === 4) return 'from-purple-500 to-pink-500'; // 动漫
    return 'from-blue-500 to-rose-500'; // 默认 (연속극 등)
  };

  const activeSubIds = activeCategory !== undefined ? getSubCategoryIds(activeCategory) : [];

  if (isHome && (categories.length === 0 || heroVideos.length === 0)) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[80vh] relative overflow-hidden bg-background">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-10">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-[3px] border-white/5 rounded-full"></div>
            <div className="absolute inset-0 border-[3px] border-transparent border-t-blue-500 border-r-purple-500 border-b-rose-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-1.5 h-10 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-rose-400 animate-pulse">
              加载中
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-bold tracking-widest uppercase">
              正在加载精彩内容...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            {activeCategory !== undefined && getSubCategoryIds(activeCategory).length > 0 && (
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
                  <span className={`w-2 h-10 rounded-full bg-gradient-to-b ${getHeaderGradient(activeCategory)}`}></span>
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
              <div className="flex flex-col items-center justify-center py-20 w-full">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-rose-500 rounded-full animate-spin blur-lg opacity-30"></div>
                  <div className="absolute inset-0 bg-card-bg rounded-full m-1 flex items-center justify-center border border-white/5">
                    <LayoutGrid size={28} className="text-white/40 animate-pulse" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-bold tracking-widest uppercase animate-pulse">
                  正在加载精彩内容...
                </p>
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
                  <span>最新</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border shadow-sm bg-card-bg/60 dark:bg-slate-900/60 text-slate-400 border-card-border">
                  <TrendingUp size={14} />
                  <span>热播</span>
                </div>
              </div>
            </div>

            {/* Year Filter */}
            <div className="mb-5 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 py-2">
                <button
                  onClick={() => handleYearSelect(undefined)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${year === undefined
                    ? 'bg-slate-900 dark:bg-card-bg text-white dark:text-foreground shadow-md'
                    : 'bg-card-bg/60 dark:bg-slate-800/60 text-slate-400 hover:bg-card-bg dark:hover:bg-slate-800 border border-card-border'
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
                      : 'bg-card-bg/60 dark:bg-slate-800/60 text-slate-400 hover:bg-card-bg dark:hover:bg-slate-800 border border-card-border'
                      }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Area Filter */}
            {(() => {
              const areas = Array.from(
                new Set(
                  videos
                    .map(v => (typeof v.vod_area === 'string' ? v.vod_area.trim() : ''))
                    .filter(Boolean)
                )
              );
              const chips = area ? Array.from(new Set([area, ...areas])) : areas;
              if (chips.length === 0) return null;
              return (
                <div className="mb-8 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex items-center gap-2 py-2">
                    <button
                      onClick={() => handleAreaSelect(undefined)}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${area === undefined
                        ? 'bg-slate-900 dark:bg-card-bg text-white dark:text-foreground shadow-md'
                        : 'bg-card-bg/60 dark:bg-slate-800/60 text-slate-400 hover:bg-card-bg dark:hover:bg-slate-800 border border-card-border'
                        }`}
                    >
                      全部地区
                    </button>
                    {chips.slice(0, 18).map(a => (
                      <button
                        key={a}
                        onClick={() => handleAreaSelect(a)}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${area === a
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-card-bg/60 dark:bg-slate-800/60 text-slate-400 hover:bg-card-bg dark:hover:bg-slate-800 border border-card-border'
                          }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

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
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col">
      <Suspense fallback={<div className="flex-1" />}>
        <HomeContent />
      </Suspense>

      <footer className="bg-card-bg/80 dark:bg-slate-800/80 backdrop-blur-xl py-8 sm:py-10 mt-10">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-semibold">
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
