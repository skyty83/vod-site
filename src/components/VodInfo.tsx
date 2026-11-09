import Link from 'next/link';
import { Star } from 'lucide-react';
import { VodItem } from '@/types';
import { stripHtml } from '@/lib/format';
import PosterImage from './PosterImage';
import Synopsis from './Synopsis';

const splitNames = (s?: string) =>
  (s ?? '')
    .split(/[,，、/|]+/)
    .map(x => x.trim())
    .filter(Boolean);

export default function VodInfo({ vod }: { vod: VodItem }) {
  const synopsis = stripHtml(vod.vod_content || vod.vod_blurb);
  const score = Number(vod.vod_score);
  const directors = splitNames(vod.vod_director);
  const actors = splitNames(vod.vod_actor).slice(0, 16);
  const tags = splitNames(vod.vod_class).filter(t => t !== vod.type_name);
  const facts = [
    ['类型', vod.type_name],
    ['年份', vod.vod_year],
    ['地区', vod.vod_area],
    ['语言', vod.vod_lang],
    ['片长', vod.vod_duration],
    ['更新', vod.vod_remarks],
  ].filter(([, v]) => v && v.trim() && v !== '0') as [string, string][];

  return (
    <section className="mt-12 grid gap-8 sm:mt-16 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
      {/* 海报 */}
      <div className="hidden md:block">
        <div className="sticky top-[calc(var(--header-h)+1.5rem)]">
          <div className="relative aspect-[2/3] overflow-hidden rounded-panel bg-card-2 shadow-lift ring-1 ring-line">
            <PosterImage src={vod.vod_pic} alt={vod.vod_name} />
            {vod.vod_remarks && (
              <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-accent px-2.5 py-1 text-xs font-black text-onaccent">
                {vod.vod_remarks}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.05em] text-ink sm:text-6xl">{vod.vod_name}</h1>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {score > 0 && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3 text-sm font-black text-paper tabular-nums">
              <Star size={14} className="fill-accent text-accent" aria-hidden="true" />
              {score.toFixed(1)}
            </span>
          )}
          {[vod.vod_year, vod.vod_area, vod.type_name, ...tags].filter(Boolean).map((t, i) => (
            <span key={`${t}${i}`} className="inline-flex h-8 items-center rounded-full px-3 text-sm font-bold text-ink/80 ring-1 ring-line">
              {t}
            </span>
          ))}
        </div>

        <Synopsis text={synopsis || '暂无简介'} />

        {(directors.length > 0 || actors.length > 0) && (
          <div className="mt-10 space-y-6">
            {directors.length > 0 && <People label="导演" names={directors} />}
            {actors.length > 0 && <People label="主演" names={actors} />}
          </div>
        )}

        {facts.length > 0 && (
          <dl className="mt-10 grid grid-cols-2 border-t border-line sm:grid-cols-3">
            {facts.map(([k, v]) => (
              <div key={k} className="border-b border-line py-4 pr-4">
                <dt className="text-xs font-bold text-sub">{k}</dt>
                <dd className="mt-1 truncate text-[15px] font-bold text-ink" title={v}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

function People({ label, names }: { label: string; names: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[3.5rem_1fr] sm:items-baseline">
      <h3 className="text-xs font-bold text-sub">{label}</h3>
      <ul className="flex flex-wrap gap-1.5">
        {names.map(n => (
          <li key={n}>
            <Link
              href={`/search?q=${encodeURIComponent(n)}`}
              className="inline-flex h-8 items-center rounded-full bg-card-2 px-3 text-sm font-bold text-ink transition-colors hover:bg-accent hover:text-onaccent"
            >
              {n}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
