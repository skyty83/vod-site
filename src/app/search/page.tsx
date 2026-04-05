'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, use } from 'react';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';
import { VodItem } from '@/types';
import { searchVideos } from '@/lib/api';
import { Search, ArrowLeft, Loader, Flame } from 'lucide-react';
import Link from 'next/link';

type SearchResult = { list: VodItem[]; pagecount: number; total: number };

const searchCache = new Map<string, Promise<SearchResult>>();

function getSearchPromise(query: string, page: number): Promise<SearchResult> {
  const key = `${query}::${page}`;
  const existing = searchCache.get(key);
  if (existing) return existing;
  const promise = searchVideos(query, page);
  searchCache.set(key, promise);
  return promise;
}

function SearchContent({ query }: { query: string }) {
  const router = useRouter();
  const [localQuery, setLocalQuery] = useState(query);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!query) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [query, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(localQuery.trim())}`);
    }
  };

  const result = query ? use(getSearchPromise(query, page)) : null;
  const videos = result?.list ?? [];
  const totalPages = result?.pagecount ?? 1;
  const total = result?.total ?? 0;

  return (
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex-1 w-full">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-bold mb-6 group bg-slate-100 hover:bg-card-bg/10/50 dark:hover:bg-slate-800 px-4 py-2 rounded-full border border-card-border shadow-sm w-fit"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        返回首页
      </Link>

      {/* Modern Large Search Hero */}
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-10 lg:p-14 text-center">
        {/* Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-full bg-gradient-to-r from-blue-500/20 to-rose-500/20 blur-3xl rounded-full opacity-60"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-card-bg/5 backdrop-blur-md border border-white/10 shadow-xl mb-6 text-white self-center mx-auto">
            <Search size={32} className="text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-8 tracking-tight drop-shadow-md">
            你想看什么？
          </h1>

          <form onSubmit={handleSearchSubmit} className="w-full relative group shadow-2xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-rose-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500"></div>
            <div className="relative flex items-center bg-card-bg/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 group-focus-within:border-white/40">
              <Search
                size={24}
                className="absolute left-5 text-white/50 group-focus-within:text-white transition-colors"
              />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="搜索电影、电视剧、综艺、动漫..."
                className="w-full bg-transparent py-4 sm:py-5 pl-14 pr-24 sm:pr-32 text-base sm:text-lg focus:outline-none text-white placeholder:text-white/40 font-medium"
              />
              <div className="absolute right-2 top-2 bottom-2">
                <button
                  type="submit"
                  className="h-full bg-blue-500 cursor-pointer hover:bg-blue-600 text-white px-5 sm:px-8 text-sm sm:text-base font-bold rounded-xl transition-all shadow-md flex items-center"
                >
                  搜索
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results Section */}
      {!query ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-card-bg/40 rounded-3xl border border-card-border">
          <div className="w-20 h-20 rounded-full bg-card-bg/5 flex items-center justify-center mb-6 shadow-inner text-slate-400">
            <Search size={40} />
          </div>
          <h3 className="text-lg font-bold text-slate-200 dark:text-slate-200 mb-2">输入片名开始搜索</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">千万影视资源任你搜索，即搜即看，极速秒播</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-card-border">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-rose-500 rounded-full"></span>
              搜索结果: <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-rose-500">&ldquo;{query}&rdquo;</span>
            </h2>
            {total > 0 && (
              <span className="text-slate-300 text-sm font-medium bg-card-bg dark:bg-slate-800/80 px-4 py-1.5 rounded-full border border-card-border shadow-sm flex items-center gap-2">
                <Flame size={16} className="text-rose-500" />
                共找到 <strong className="text-foreground text-base">{total.toLocaleString()}</strong> 部
              </span>
            )}
          </div>

          <VideoGrid videos={videos} loading={false} />
          {total > 0 && (
            <div className="mt-8">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  return <SearchContent key={query} query={query} />;
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center flex-1 h-[50vh]">
          <Loader size={40} className="text-blue-500 animate-spin mb-4" />
          <div className="text-slate-400 font-medium">加载中...</div>
        </div>
      }>
        <SearchPageInner />
      </Suspense>
    </div>
  );
}
