import Link from 'next/link';
import { Play } from 'lucide-react';
import { getFeed } from '@/lib/api';
import PosterCard from './PosterCard';
import PosterImage from './PosterImage';
import { SectionHead } from './Section';

// 1 个大图 + 8 张海报 (数据不足时 4 张)。大图占 2x2, 其余单元刚好铺满 2/4/6 列网格, 不留空格
export default async function Mosaic({ typeId, title, kicker }: { typeId: number; title: string; kicker?: string }) {
  const items = await getFeed(typeId, 'hits', 9);
  const smallCount = items.length >= 9 ? 8 : items.length >= 5 ? 4 : 0;
  if (smallCount === 0) return null;
  const [lead, ...others] = items;
  const rest = others.slice(0, smallCount);

  return (
    <section className="reveal">
      <SectionHead title={title} kicker={kicker} href={`/?cat=${typeId}`} />
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4 lg:grid-cols-6">
        <Link
          href={`/vod/${lead.vod_id}`}
          className="group relative col-span-2 aspect-[4/3] overflow-hidden rounded-panel bg-card-2 ring-1 ring-line md:row-span-2 md:aspect-auto"
        >
          <PosterImage
            src={lead.vod_pic}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-5 pt-28 sm:p-7 sm:pt-36">
            <p className="text-sm font-bold text-white/70">{[lead.vod_year, lead.vod_area].filter(Boolean).join(' ')}</p>
            <h3 className="mt-1.5 line-clamp-2 text-3xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-4xl">
              {lead.vod_name}
            </h3>
            <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-accent pl-4 pr-5 text-sm font-bold text-onaccent transition-transform duration-300 group-hover:scale-[1.04]">
              <Play size={14} fill="currentColor" aria-hidden="true" />
              {lead.vod_remarks || '立即播放'}
            </span>
          </div>
        </Link>
        {rest.map(v => (
          <PosterCard key={v.vod_id} vod={v} />
        ))}
      </div>
    </section>
  );
}
