import Link from 'next/link';

interface PaginationProps {
  current: number;
  total: number;
  basePath: string;
  query?: Record<string, string | undefined>;
}

function pagesAround(current: number, total: number): (number | 'gap')[] {
  const set = new Set<number>([1, total, current]);
  for (let d = 1; d <= 2; d++) {
    if (current - d > 1) set.add(current - d);
    if (current + d < total) set.add(current + d);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

const base = 'inline-flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-bold tabular-nums transition-colors duration-200';

export default function Pagination({ current, total, basePath, query = {} }: PaginationProps) {
  if (total <= 1) return null;

  const href = (page: number) => {
    const p = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => v && p.set(k, v));
    if (page > 1) p.set('page', String(page));
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav aria-label="分页" className="flex flex-wrap items-center justify-center gap-2">
      {current > 1 ? (
        <Link href={href(current - 1)} rel="prev" className={`${base} bg-card text-ink ring-1 ring-line hover:bg-ink hover:text-paper`}>
          上一页
        </Link>
      ) : (
        <span className={`${base} text-sub/60 ring-1 ring-line`}>上一页</span>
      )}

      {pagesAround(current, total).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-sub" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === current ? 'page' : undefined}
            className={`${base} ${
              p === current ? 'bg-accent text-onaccent' : 'text-ink hover:bg-card-2'
            }`}
          >
            {p}
          </Link>
        )
      )}

      {current < total ? (
        <Link href={href(current + 1)} rel="next" className={`${base} bg-card text-ink ring-1 ring-line hover:bg-ink hover:text-paper`}>
          下一页
        </Link>
      ) : (
        <span className={`${base} text-sub/60 ring-1 ring-line`}>下一页</span>
      )}
    </nav>
  );
}
