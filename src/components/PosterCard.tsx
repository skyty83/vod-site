import Link from 'next/link';
import { Play } from 'lucide-react';
import { VodItem } from '@/types';
import { stripHtml } from '@/lib/format';
import PosterImage from './PosterImage';

export default function PosterCard({ vod, className = '' }: { vod: Partial<VodItem>; className?: string }) {
  const score = Number(vod.vod_score);
  // 有更新信息时只显示年份, 避免一行里挤两段文字被截断
  const hasRight = !!vod.vod_remarks || score > 0;
  const meta = (hasRight ? [vod.vod_year] : [vod.vod_year, vod.type_name]).filter(Boolean).join(' ');
  const blurb = stripHtml(vod.vod_blurb).slice(0, 70);

  return (
    <Link href={`/vod/${vod.vod_id}`} className={`group block ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-card bg-card-2 ring-1 ring-line transition duration-500 ease-[var(--ease-out-expo)] group-hover:-translate-y-2 group-hover:shadow-lift group-hover:ring-2 group-hover:ring-accent group-focus-visible:-translate-y-2">
        <PosterImage
          src={vod.vod_pic}
          alt={vod.vod_name ?? ''}
          className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.07]"
        />
        {/* 悬停预览: 简介 + 播放入口 (仅指针设备) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-4 flex-col gap-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3.5 pt-16 opacity-0 transition duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:hidden">
          {blurb && <p className="line-clamp-3 text-xs leading-relaxed text-white/85">{blurb}</p>}
          <span className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full bg-accent pl-3 pr-4 text-[13px] font-bold text-onaccent">
            <Play size={13} fill="currentColor" aria-hidden="true" />
            播放
          </span>
        </div>
      </div>
      <div className="px-0.5 pt-3">
        <h3 className="truncate text-[15px] font-bold tracking-[-0.01em] text-ink">{vod.vod_name}</h3>
        <p className="mt-1 flex items-baseline justify-between gap-2 text-[13px] text-sub">
          <span className="truncate tabular-nums">{meta || ' '}</span>
          {vod.vod_remarks ? (
            <span className="max-w-[58%] shrink-0 truncate font-bold text-pop">{vod.vod_remarks}</span>
          ) : score > 0 ? (
            <span className="shrink-0 font-bold tabular-nums text-pop">{score.toFixed(1)}</span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
