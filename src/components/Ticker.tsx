import Link from 'next/link';
import { Sparkle } from 'lucide-react';
import { getVideoList } from '@/lib/api';

// 今日更新字幕带。内容复制一份实现无缝滚动, 复制品对读屏隐藏且不可聚焦。
export default async function Ticker() {
  const { list } = await getVideoList(1, undefined, true);
  const items = list
    .filter(v => v.vod_name && v.vod_time)
    .sort((a, b) => new Date(b.vod_time!).getTime() - new Date(a.vod_time!).getTime())
    .slice(0, 14);

  if (items.length === 0) return null;

  return (
    <section aria-label="今日更新" className="relative py-10">
      {/* 交叉的第二条色带, 仅作构图 */}
      <div aria-hidden="true" className="absolute inset-x-[-5%] top-1/2 h-16 -translate-y-1/2 rotate-[2.2deg] bg-ink/90 sm:h-20" />
      <div className="marquee relative -mx-[5%] flex -rotate-[1.8deg] items-stretch bg-accent text-onaccent shadow-lift">
        <span className="font-wide relative z-10 flex shrink-0 items-center bg-onaccent py-0 pl-[calc(5vw+1rem)] pr-4 sm:pl-[calc(5vw+2.5rem)] text-xs font-extrabold uppercase tracking-[0.18em] text-accent sm:pr-6 sm:text-sm">
          New Today
        </span>
        <div className="min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto">
          <div className="marquee-track flex w-max">
            {[0, 1].map(copy => (
              <ul key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 items-center py-4 sm:py-5">
                {items.map(v => (
                  <li key={`${copy}-${v.vod_id}`} className="flex items-center">
                    <Link
                      href={`/vod/${v.vod_id}`}
                      tabIndex={copy === 1 ? -1 : undefined}
                      className="flex items-baseline gap-2.5 whitespace-nowrap px-5 text-xl font-black tracking-[-0.03em] decoration-2 underline-offset-4 hover:underline sm:text-3xl"
                    >
                      {v.vod_name}
                      {v.vod_remarks && <span className="text-xs font-bold opacity-70 sm:text-sm">{v.vod_remarks}</span>}
                    </Link>
                    <Sparkle size={18} fill="currentColor" strokeWidth={0} aria-hidden="true" className="shrink-0" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
