'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronLeft, ChevronRight, ListVideo } from 'lucide-react';
import { PlaySource } from '@/types';
import { addHistory, parseHistory, readHistoryRaw } from '@/lib/history';
import Player from '@/components/Player';
import { LogoMark } from '@/components/Logo';

interface VideoPlayerProps {
  sources: PlaySource[];
  meta: { id: string | number; name: string; pic?: string; type?: string };
}

const CHUNK = 50;

export default function VideoPlayer({ sources, meta }: VideoPlayerProps) {
  const [activeSource, setActiveSource] = useState(0);
  // 统一按"正序"下标记录当前集, 排序只影响列表显示
  const [activeEpisode, setActiveEpisode] = useState(0);
  const [desc, setDesc] = useState(false);
  const [viewChunk, setViewChunk] = useState<number | null>(null);
  const [restored, setRestored] = useState(false);

  const source = sources[activeSource];
  const episodes = useMemo(() => source?.episodes ?? [], [source]);
  const episode = episodes[activeEpisode];
  const total = episodes.length;
  const multiEpisode = total > 1;

  // 回到详情页时恢复上次看到的线路和集数
  useEffect(() => {
    const h = parseHistory(readHistoryRaw()).find(i => String(i.id) === String(meta.id));
    if (h?.ep) {
      const si = Math.max(0, sources.findIndex(s => s.name === h.src));
      const ei = sources[si]?.episodes.findIndex(e => e.name === h.ep) ?? -1;
      if (ei >= 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 读取 localStorage 只能在挂载后进行
        setActiveSource(si);
        setActiveEpisode(ei);
      }
    }
    setRestored(true);
  }, [meta.id, sources]);

  useEffect(() => {
    if (!restored || !episode || !source) return;
    addHistory({ id: meta.id, name: meta.name, pic: meta.pic ?? '', type: meta.type, ep: episode.name, src: source.name });
  }, [restored, episode, source, meta.id, meta.name, meta.pic, meta.type]);

  const go = (i: number) => {
    setActiveEpisode(i);
    setViewChunk(null);
  };

  const nextEp = activeEpisode + 1 < total ? activeEpisode + 1 : null;
  const prevEp = activeEpisode > 0 ? activeEpisode - 1 : null;

  const next = useMemo(
    () => (nextEp !== null ? { label: `${meta.name} ${episodes[nextEp].name}`, go: () => go(nextEp) } : null),
    [nextEp, episodes, meta.name]
  );

  if (!source || !episode) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-panel bg-card px-6 text-center ring-1 ring-line">
        <LogoMark className="h-16 w-16" />
        <p className="text-2xl font-black tracking-[-0.04em] text-ink sm:text-3xl">暂无可用的播放源</p>
        <p className="text-sm text-sub">片源站还没有收录这部影片, 稍后再来看看。</p>
      </div>
    );
  }

  const switchSource = (i: number) => {
    // 切换线路时尽量停留在同名的那一集
    const same = sources[i].episodes.findIndex(e => e.name === episode.name);
    setActiveSource(i);
    go(same >= 0 ? same : 0);
  };

  // 分段 (长剧每 50 集一段)
  const chunks = total > CHUNK + 10 ? Math.ceil(total / CHUNK) : 1;
  const chunkOf = (i: number) => Math.floor(i / CHUNK);
  const shownChunk = viewChunk ?? chunkOf(activeEpisode);
  const chunkOrder = Array.from({ length: chunks }, (_, i) => i);
  if (desc) chunkOrder.reverse();
  const range = chunks > 1 ? [shownChunk * CHUNK, Math.min(total, (shownChunk + 1) * CHUNK)] : [0, total];
  const listIdx = Array.from({ length: range[1] - range[0] }, (_, k) => range[0] + k);
  if (desc) listIdx.reverse();

  const showPanel = multiEpisode || sources.length > 1;

  return (
    <div className={`grid gap-5 ${showPanel ? 'lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]' : ''}`}>
      <div className="min-w-0">
        <div className="aspect-video overflow-hidden bg-black shadow-lift ring-1 ring-line sm:rounded-panel max-sm:-mx-4">
          <Player
            url={restored ? episode.url : ''}
            title={meta.name}
            subtitle={multiEpisode ? episode.name : undefined}
            poster={meta.pic}
            resumeKey={`${meta.id}:${source.name}:${episode.name}`}
            next={next}
          />
        </div>

        {/* 正在播放 */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold text-sub">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              正在播放 · {source.name}
            </p>
            <p className="mt-1 truncate text-lg font-black tracking-[-0.03em] text-ink sm:text-xl">
              {multiEpisode ? (
                <>
                  {episode.name}
                  <span className="ml-2 text-sm font-bold tracking-normal text-sub tabular-nums">
                    {activeEpisode + 1} / {total}
                  </span>
                </>
              ) : (
                meta.name
              )}
            </p>
          </div>
          {multiEpisode && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={prevEp === null}
                onClick={() => prevEp !== null && go(prevEp)}
                className="inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-sm font-bold text-ink ring-1 ring-line transition-colors hover:bg-card-2 disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                <span className="hidden sm:inline">上一集</span>
                <span className="sr-only sm:hidden">上一集</span>
              </button>
              <button
                type="button"
                disabled={nextEp === null}
                onClick={() => nextEp !== null && go(nextEp)}
                className="inline-flex h-10 items-center gap-1 rounded-full bg-accent pl-4 pr-3 text-sm font-black text-onaccent transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-35"
              >
                下一集
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {showPanel && (
        <aside aria-label="选集与线路" className="relative min-h-0 overflow-hidden rounded-panel bg-card/85 ring-1 ring-line backdrop-blur-xl">
          <div className={`flex flex-col lg:absolute lg:inset-0 ${multiEpisode ? 'max-h-[30rem] lg:max-h-none' : ''}`}>
            {/* 线路 */}
            {sources.length > 1 && (
              <div className="border-b border-line px-5 pb-4 pt-5">
                <p className="mb-2.5 text-xs font-bold text-sub">播放线路</p>
                <div role="tablist" aria-label="播放线路" className="flex flex-wrap gap-1.5">
                  {sources.map((s, i) => (
                    <button
                      key={s.name + i}
                      type="button"
                      role="tab"
                      aria-selected={i === activeSource}
                      onClick={() => switchSource(i)}
                      className={`h-9 shrink-0 rounded-full px-4 text-xs font-bold transition-colors ${
                        i === activeSource ? 'bg-ink text-paper' : 'bg-card-2 text-ink hover:bg-ink/10'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {multiEpisode && (
              <>
                <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
                  <h2 className="flex items-center gap-2 text-xl font-black leading-none tracking-[-0.04em] text-ink">
                    <ListVideo size={20} aria-hidden="true" className="text-sub" />
                    选集
                    <span className="text-xs font-bold tracking-normal text-sub tabular-nums">共 {total} 集</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setDesc(d => !d)}
                    aria-label={desc ? '当前倒序, 切换为正序' : '当前正序, 切换为倒序'}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-ink ring-1 ring-line transition-colors hover:bg-ink hover:text-paper"
                  >
                    {desc ? <ArrowDownWideNarrow size={14} aria-hidden="true" /> : <ArrowUpNarrowWide size={14} aria-hidden="true" />}
                    {desc ? '倒序' : '正序'}
                  </button>
                </div>

                {chunks > 1 && (
                  <div className="flex flex-wrap gap-1.5 px-5 pb-3">
                    {chunkOrder.map(c => {
                      const from = c * CHUNK + 1;
                      const to = Math.min(total, (c + 1) * CHUNK);
                      const on = c === shownChunk;
                      return (
                        <button
                          key={c}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setViewChunk(c)}
                          className={`relative h-8 shrink-0 rounded-full px-3 text-xs font-bold tabular-nums transition-colors ${
                            on ? 'bg-ink text-paper' : 'text-sub ring-1 ring-line hover:text-ink'
                          }`}
                        >
                          {from}–{to}
                          {c === chunkOf(activeEpisode) && !on && (
                            <span aria-hidden="true" className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <ul className="grid flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-2 overflow-y-auto border-t border-line p-5">
                  {listIdx.map(i => {
                    const ep = episodes[i];
                    const on = i === activeEpisode;
                    return (
                      <li key={ep.url + i}>
                        <button
                          type="button"
                          onClick={() => go(i)}
                          aria-current={on ? 'true' : undefined}
                          title={ep.name}
                          className={`relative h-11 w-full truncate rounded-xl px-2 text-sm font-bold tabular-nums transition-colors duration-200 ${
                            on ? 'bg-accent text-onaccent' : 'bg-card-2 text-ink hover:bg-ink hover:text-paper'
                          }`}
                        >
                          {ep.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
