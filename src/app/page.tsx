import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getTypeListing, getSubCategoryIds } from '@/lib/api';
import { getCategoryName, getTopCategoryId, STATIC_CATEGORIES } from '@/lib/categories';
import Hero from '@/components/Hero';
import Ticker from '@/components/Ticker';
import Shelf from '@/components/Shelf';
import Mosaic from '@/components/Mosaic';
import ContinueWatching from '@/components/ContinueWatching';
import VideoGrid from '@/components/VideoGrid';
import Pagination from '@/components/Pagination';
import FilterBar from '@/components/FilterBar';
import { GridSkeleton, HeroSkeleton, MosaicSkeleton, ShelfSkeleton, TickerSkeleton } from '@/components/Skeletons';

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// 分类页背景上的英文大字
const WORDMARK: Record<number, string> = {
  1: 'MOVIES',
  2: 'SERIES',
  3: 'VARIETY',
  4: 'ANIME',
  36: 'SHORTS',
  48: 'SPORTS',
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const cat = parseInt(first((await searchParams).cat) ?? '', 10);
  const name = Number.isFinite(cat) ? getCategoryName(cat) : undefined;
  return name ? { title: name } : {};
}

export default async function HomePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const catRaw = parseInt(first(sp.cat) ?? '', 10);
  const cat = Number.isFinite(catRaw) && getCategoryName(catRaw) ? catRaw : undefined;

  if (cat === undefined) return <Home />;

  const year = first(sp.year);
  const area = first(sp.area);
  const sort = first(sp.sort) ?? 'hits';
  const page = Math.max(1, parseInt(first(sp.page) ?? '1', 10) || 1);
  const showAll = first(sp.view) === 'all';

  return <Category cat={cat} year={year} area={area} sort={sort} page={page} showAll={showAll} />;
}

/* ───────────── 首页 ───────────── */
function Home() {
  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<TickerSkeleton />}>
        <Ticker />
      </Suspense>

      <div className="wrap flex flex-col gap-20 pt-10 lg:gap-28">
        <ContinueWatching />
        <Suspense fallback={<ShelfSkeleton title="热门电影" />}>
          <Shelf typeId={1} title="热门电影" kicker="TOP 10" ranked />
        </Suspense>
        <Suspense fallback={<MosaicSkeleton title="追剧精选" />}>
          <Mosaic typeId={2} title="追剧精选" kicker="HOT" />
        </Suspense>
        {[
          { id: 3, title: '综艺' },
          { id: 4, title: '动漫' },
          { id: 36, title: '短剧' },
        ].map(s => (
          <Suspense key={s.id} fallback={<ShelfSkeleton title={s.title} />}>
            <Shelf typeId={s.id} title={s.title} />
          </Suspense>
        ))}
      </div>
    </>
  );
}

/* ───────────── 分类页 ───────────── */
function chipClass(active: boolean) {
  return `inline-flex h-10 items-center rounded-full px-4 text-sm font-bold whitespace-nowrap transition-colors duration-200 ${
    active ? 'bg-ink text-paper' : 'text-ink ring-1 ring-line hover:bg-card-2'
  }`;
}

function Category({ cat, year, area, sort, page, showAll }: {
  cat: number;
  year?: string;
  area?: string;
  sort: string;
  page: number;
  showAll: boolean;
}) {
  const top = getTopCategoryId(cat);
  const subIds = getSubCategoryIds(top);
  const subs = STATIC_CATEGORIES.filter(c => subIds.includes(c.type_id));
  const hasFilter = !!(year && year !== '全部') || !!(area && area !== '全部');
  const hasChildren = getSubCategoryIds(cat).length > 0;
  const sectional = hasChildren && !showAll && !hasFilter;

  return (
    <>
      <header className="relative isolate overflow-hidden border-b border-line">
        <p
          aria-hidden="true"
          className="font-wide text-outline pointer-events-none absolute -bottom-[0.16em] right-[-0.03em] -z-10 select-none whitespace-nowrap text-[24vw] font-extrabold leading-none opacity-[0.18] lg:text-[15rem]"
        >
          {WORDMARK[top] ?? 'MIAO'}
        </p>
        <div className="wrap py-12 sm:py-16">
          <h1 className="rise text-6xl font-black leading-none tracking-[-0.055em] text-ink sm:text-8xl">{getCategoryName(cat)}</h1>

          {subs.length > 0 && (
            <nav aria-label="子分类" className="scrollbar-hide -mx-4 mt-9 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              <Link href={`/?cat=${top}`} className={chipClass(cat === top && sectional)}>
                精选
              </Link>
              <Link href={`/?cat=${top}&view=all`} className={chipClass(cat === top && !sectional)}>
                全部
              </Link>
              {subs.map(s => (
                <Link key={s.type_id} href={`/?cat=${s.type_id}`} className={chipClass(cat === s.type_id)}>
                  {s.type_name}
                </Link>
              ))}
            </nav>
          )}

          {!sectional && (
            <div className="mt-7">
              <FilterBar cat={cat} year={year} area={area} sort={sort} />
            </div>
          )}
        </div>
      </header>

      <div className="wrap pt-12">
        {sectional ? (
          <div className="flex flex-col gap-20">
            {getSubCategoryIds(cat).map(id => (
              <Suspense key={id} fallback={<ShelfSkeleton title={getCategoryName(id)} />}>
                <Shelf typeId={id} title={getCategoryName(id) ?? ''} />
              </Suspense>
            ))}
          </div>
        ) : (
          <Suspense key={`${cat}-${year}-${area}-${sort}-${page}`} fallback={<GridSkeleton />}>
            <Listing cat={cat} year={year} area={area} sort={sort} page={page} />
          </Suspense>
        )}
      </div>
    </>
  );
}

async function Listing({ cat, year, area, sort, page }: {
  cat: number;
  year?: string;
  area?: string;
  sort: string;
  page: number;
}) {
  const y = year && year !== '全部' ? year : undefined;
  const a = area && area !== '全部' ? area : undefined;
  const { list, pagecount, total } = await getTypeListing(page, cat, y, a, sort);

  const query = { cat: String(cat), view: 'all', year: y, area: a, sort: sort !== 'hits' ? sort : undefined };

  return (
    <>
      {total > 0 && (
        <p className="mb-7 text-sm font-medium text-sub">
          共 <span className="font-wide text-base font-semibold tabular-nums text-ink">{total.toLocaleString()}</span> 部
        </p>
      )}
      <VideoGrid videos={list} />
      <div className="mt-16">
        <Pagination current={page} total={Math.min(pagecount, 500)} basePath="/" query={query} />
      </div>
    </>
  );
}
