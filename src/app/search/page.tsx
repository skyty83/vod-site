import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { searchVideos } from '@/lib/api';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';
import { GridSkeleton } from '@/components/Skeletons';

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const HOT = ['庆余年', '狂飙', '三体', '流浪地球', '哪吒', '繁花', '甄嬛传', '鱿鱼游戏'];

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const q = first((await searchParams).q)?.trim();
  return { title: q ? `搜索 ${q}` : '搜索' };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? '';
  const page = Math.max(1, parseInt(first(sp.page) ?? '1', 10) || 1);

  return (
    <>
      <header className="relative isolate overflow-hidden border-b border-line">
        <p
          aria-hidden="true"
          className="font-wide text-outline pointer-events-none absolute -bottom-[0.16em] right-[-0.03em] -z-10 select-none whitespace-nowrap text-[24vw] font-extrabold leading-none opacity-[0.18] lg:text-[15rem]"
        >
          SEARCH
        </p>
        <div className="wrap py-12 sm:py-16">
          <h1 className="rise line-clamp-2 text-6xl font-black leading-[1.02] tracking-[-0.055em] text-ink sm:text-8xl">
            {q ? `“${q}”` : '想看点什么'}
          </h1>
          <form action="/search" role="search" className="rise relative mt-9 flex max-w-3xl items-center" style={{ '--d': '0.08s' } as React.CSSProperties}>
            <label htmlFor="search-q" className="sr-only">
              搜索片名或演员
            </label>
            <Search size={22} strokeWidth={2.25} aria-hidden="true" className="pointer-events-none absolute left-6 text-sub" />
            <input
              id="search-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="输入片名或演员"
              autoComplete="off"
              className="h-16 min-w-0 flex-1 rounded-full bg-card pl-16 pr-36 text-lg text-ink ring-1 ring-line transition-shadow placeholder:text-sub focus:outline-none focus:ring-2 focus:ring-[var(--pop)]"
            />
            <button
              type="submit"
              className="absolute right-2 inline-flex h-12 items-center rounded-full bg-accent px-7 text-base font-bold text-onaccent transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98]"
            >
              搜索
            </button>
          </form>
        </div>
      </header>

      <div className="wrap pt-12">
        {q ? (
          <Suspense key={`${q}-${page}`} fallback={<GridSkeleton />}>
            <Results q={q} page={page} />
          </Suspense>
        ) : (
          <section>
            <h2 className="text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">大家都在搜</h2>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {HOT.map((h, i) => (
                <li key={h}>
                  <Link
                    href={`/search?q=${encodeURIComponent(h)}`}
                    className="group flex h-20 items-center gap-4 rounded-panel bg-card px-6 ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:bg-accent hover:text-onaccent hover:ring-transparent"
                  >
                    <span className="font-wide text-2xl font-extrabold tabular-nums text-pop group-hover:text-onaccent">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-xl font-black tracking-[-0.03em]">{h}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </>
  );
}

async function Results({ q, page }: { q: string; page: number }) {
  const { list, pagecount, total } = await searchVideos(q, page);
  return (
    <>
      {total > 0 && (
        <p className="mb-7 text-sm font-medium text-sub">
          共找到 <span className="font-wide text-base font-semibold tabular-nums text-ink">{total.toLocaleString()}</span> 部
        </p>
      )}
      <VideoGrid videos={list} />
      <div className="mt-16">
        <Pagination current={page} total={pagecount} basePath="/search" query={{ q }} />
      </div>
    </>
  );
}
