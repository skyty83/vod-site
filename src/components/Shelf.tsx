import { getFeed } from '@/lib/api';
import PosterCard from './PosterCard';
import { Row, SectionHead } from './Section';

interface ShelfProps {
  typeId: number;
  title: string;
  kicker?: string;
  /** 排行样式: 大号序号 + 按人气排序 */
  ranked?: boolean;
  limit?: number;
  href?: string;
}

export default async function Shelf({ typeId, title, kicker, ranked = false, limit = 12, href }: ShelfProps) {
  const items = await getFeed(typeId, ranked ? 'hits' : 'time', ranked ? 10 : limit);

  if (items.length === 0) return null;

  return (
    <section className="reveal">
      <SectionHead title={title} kicker={kicker} href={href ?? `/?cat=${typeId}`} />
      <Row>
        {items.map((vod, i) =>
          ranked ? (
            <li key={vod.vod_id} className="group/rank relative flex w-[236px] shrink-0 snap-start items-end justify-end sm:w-[268px]">
              {/* 序号压在海报后面, 悬停时填充为强调色 */}
              <span
                aria-hidden="true"
                className="font-wide text-outline absolute bottom-[3.4rem] left-0 select-none text-[120px] font-extrabold leading-[0.8] tracking-[-0.09em] transition-colors duration-300 group-hover/rank:text-[var(--accent)] group-hover/rank:[-webkit-text-stroke-color:var(--accent)] sm:text-[144px]"
              >
                {i + 1}
              </span>
              <PosterCard vod={vod} className="relative w-[146px] sm:w-[168px]" />
            </li>
          ) : (
            <li key={vod.vod_id} className="w-[150px] shrink-0 snap-start sm:w-[180px]">
              <PosterCard vod={vod} />
            </li>
          )
        )}
      </Row>
    </section>
  );
}
