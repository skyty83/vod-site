'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronDown } from 'lucide-react';

const AREAS = ['全部', '大陆', '香港', '台湾', '美国', '韩国', '日本', '英国', '法国', '德国', '泰国', '印度', '其他'];
const THIS_YEAR = new Date().getFullYear();
const YEARS = ['全部', ...Array.from({ length: THIS_YEAR - 1989 }, (_, i) => String(THIS_YEAR - i))];
const SORTS = [
  { label: '人气', value: 'hits' },
  { label: '评分', value: 'score' },
  { label: '最新', value: 'time' },
];

interface FilterBarProps {
  cat: number;
  year?: string;
  area?: string;
  sort: string;
}

function Select({ label, value, options, onChange, disabled }: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-bold text-sub">
      {label}
      <span className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          className="h-11 min-w-32 appearance-none rounded-full bg-card pl-4 pr-10 text-sm font-bold text-ink ring-1 ring-line transition-shadow hover:ring-ink/30 focus:outline-none focus:ring-2 focus:ring-[var(--pop)] disabled:opacity-60"
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sub" />
      </span>
    </label>
  );
}

export default function FilterBar({ cat, year, area, sort }: FilterBarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const go = (next: { year?: string; area?: string; sort?: string }) => {
    const merged = { year, area, sort, ...next };
    const p = new URLSearchParams({ cat: String(cat), view: 'all' });
    if (merged.year && merged.year !== '全部') p.set('year', merged.year);
    if (merged.area && merged.area !== '全部') p.set('area', merged.area);
    if (merged.sort && merged.sort !== 'hits') p.set('sort', merged.sort);
    startTransition(() => router.push(`/?${p.toString()}`, { scroll: false }));
  };

  const toOptions = (arr: string[]) => arr.map(v => ({ label: v, value: v }));

  return (
    <div className="flex flex-wrap items-end gap-3" role="group" aria-label="筛选">
      <Select label="地区" value={area ?? '全部'} options={toOptions(AREAS)} onChange={v => go({ area: v })} disabled={pending} />
      <Select label="年份" value={year ?? '全部'} options={toOptions(YEARS)} onChange={v => go({ year: v })} disabled={pending} />
      <Select label="排序" value={sort} options={SORTS} onChange={v => go({ sort: v })} disabled={pending} />
    </div>
  );
}
