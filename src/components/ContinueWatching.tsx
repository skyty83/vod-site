'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { clearHistory, parseHistory, readHistoryRaw, subscribeHistory } from '@/lib/history';
import PosterImage from './PosterImage';
import { Row } from './Section';

export default function ContinueWatching() {
  const raw = useSyncExternalStore(subscribeHistory, readHistoryRaw, () => '');
  const items = useMemo(() => parseHistory(raw).slice(0, 12), [raw]);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-7 flex items-end justify-between gap-4">
        <h2 className="text-4xl font-black leading-none tracking-[-0.045em] text-ink sm:text-6xl">继续观看</h2>
        <button
          type="button"
          onClick={clearHistory}
          className="inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-bold text-sub ring-1 ring-line transition-colors hover:bg-card-2 hover:text-ink"
        >
          清空记录
        </button>
      </div>
      <Row>
        {items.map(item => (
          <li key={item.id} className="w-[290px] shrink-0 snap-start sm:w-[340px]">
            <Link
              href={`/vod/${item.id}`}
              className="group grid grid-cols-[92px_1fr] gap-4 rounded-panel bg-card p-3 ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:bg-card-2 hover:shadow-lift"
            >
              <div className="aspect-[2/3] overflow-hidden rounded-card bg-card-2">
                <PosterImage src={item.pic} alt="" />
              </div>
              <div className="flex min-w-0 flex-col justify-between py-1.5">
                <div>
                  <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-[-0.01em] text-ink">{item.name}</h3>
                  {item.ep && <p className="mt-1.5 truncate text-sm text-sub">上次看到 {item.ep}</p>}
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent py-1.5 pl-2.5 pr-3.5 text-sm font-bold text-onaccent">
                  <Play size={12} fill="currentColor" aria-hidden="true" />
                  继续播放
                </span>
              </div>
            </Link>
          </li>
        ))}
      </Row>
    </section>
  );
}
