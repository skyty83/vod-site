'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import PosterImage from './PosterImage';

export interface HeroItem {
  id: string;
  name: string;
  pic: string;
  meta: string[];
  remarks?: string;
  blurb?: string;
}

// 卡组位置: 0 = 当前, 1/2 = 露出在后面的下一部
const DECK = [
  'translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100 z-30',
  'translate-x-[22%] translate-y-[3%] rotate-[7deg] scale-[0.86] opacity-80 z-20',
  'translate-x-[40%] translate-y-[6%] rotate-[13deg] scale-[0.74] opacity-45 z-10',
];
const HIDDEN = 'translate-x-[48%] translate-y-[8%] rotate-[16deg] scale-[0.7] opacity-0 z-0 pointer-events-none';

function subscribeVisibility(cb: () => void) {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
}

export default function HeroStage({ items }: { items: HeroItem[] }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const visible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);

  const n = items.length;
  const current = items[index];
  const running = !hovered && !focused && visible;
  const next = () => setIndex(i => (i + 1) % n);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="本周主推"
      className="relative isolate -mt-[var(--header-h)] overflow-hidden pt-[var(--header-h)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
    >
      {/* 环境光: 当前海报放大模糊作为背景, 切换时交叉淡入 */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 scale-125 opacity-80 blur-[90px] saturate-150 dark:opacity-60">
          {items.map((it, i) => (
            <div
              key={it.id}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
              style={{ backgroundImage: `url("${it.pic}")` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-paper/30 via-paper/70 to-paper" />
      </div>

      <div className="wrap grid min-h-[min(680px,calc(100svh-var(--header-h)-8rem))] items-center gap-10 pb-6 pt-8 lg:grid-cols-12 lg:gap-6 lg:pt-10">
        <div key={current.id} className="order-2 min-w-0 lg:order-1 lg:col-span-7" aria-live={running ? 'off' : 'polite'}>
          <p className="rise font-wide text-xs font-semibold uppercase tracking-[0.2em] text-pop">Now Showing</p>
          <h1
            className="rise mt-5 line-clamp-2 pb-1 text-[clamp(3rem,8vw,8rem)] font-black leading-[0.98] tracking-[-0.055em] text-ink [text-wrap:balance]"
            style={{ '--d': '0.06s' } as React.CSSProperties}
          >
            {current.name}
          </h1>
          <div className="rise mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-base font-bold text-ink/80" style={{ '--d': '0.14s' } as React.CSSProperties}>
            {current.remarks && (
              <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-sm text-onaccent">{current.remarks}</span>
            )}
            {current.meta.map(m => (
              <span key={m}>{m}</span>
            ))}
          </div>
          {current.blurb && (
            <p className="rise mt-5 line-clamp-3 max-w-[42ch] text-lg leading-relaxed text-ink/70" style={{ '--d': '0.2s' } as React.CSSProperties}>
              {current.blurb}
            </p>
          )}
          <div className="rise mt-9" style={{ '--d': '0.26s' } as React.CSSProperties}>
            <Link
              href={`/vod/${current.id}`}
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-accent pl-2 pr-7 text-lg font-bold text-onaccent transition-transform duration-300 ease-[var(--ease-out-expo)] hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="grid size-10 place-items-center rounded-full bg-onaccent text-accent transition-transform duration-300 group-hover:scale-110">
                <Play size={17} fill="currentColor" aria-hidden="true" />
              </span>
              立即播放
            </Link>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-5">
          <div className="relative mx-auto aspect-[2/3] w-[min(52vw,230px)] sm:w-[270px] lg:mr-[14%] lg:w-[min(100%,360px)]">
            {items.map((it, i) => {
              const pos = (i - index + n) % n;
              const cls = DECK[pos] ?? HIDDEN;
              return (
                <div
                  key={it.id}
                  className={`absolute inset-0 origin-bottom-left transition-[transform,opacity] duration-700 ease-[var(--ease-out-expo)] ${cls}`}
                >
                  {pos === 0 ? (
                    <Link
                      href={`/vod/${it.id}`}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="block h-full overflow-hidden rounded-panel bg-card-2 shadow-lift ring-1 ring-line"
                    >
                      <PosterImage src={it.pic} alt="" eager />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setIndex(i)}
                      aria-label={`切换到 ${it.name}`}
                      className="block h-full w-full overflow-hidden rounded-panel bg-card-2 shadow-lift ring-1 ring-line"
                    >
                      <PosterImage src={it.pic} alt="" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 选片轨道: 进度条走完自动切到下一部 */}
      <div className="wrap pb-12">
        <div role="tablist" aria-label="选择主推影片" className="scrollbar-hide -mx-4 flex gap-5 overflow-x-auto px-4 sm:mx-0 sm:gap-8 sm:px-0">
          {items.map((it, i) => {
            const active = i === index;
            return (
              <button
                key={it.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setIndex(i)}
                className="group min-w-[140px] flex-1 pt-2 text-left"
              >
                <span className="block h-[3px] w-full overflow-hidden rounded-full bg-ink/15">
                  {active && (
                    <span
                      key={`${it.id}-${index}`}
                      onAnimationEnd={next}
                      style={{ animationPlayState: running ? 'running' : 'paused' }}
                      className="block h-full origin-left rounded-full bg-[var(--pop)] motion-safe:animate-[progress_8s_linear_forwards]"
                    />
                  )}
                </span>
                <span className="mt-3 flex items-baseline gap-2.5">
                  <span className="font-wide text-[11px] font-semibold tabular-nums text-sub">{String(i + 1).padStart(2, '0')}</span>
                  <span className={`truncate text-sm font-bold transition-colors ${active ? 'text-ink' : 'text-sub group-hover:text-ink'}`}>
                    {it.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
