'use client';

import { CategoryItem } from '@/types';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

interface CategoryNavProps {
  categories: CategoryItem[];
  activeId?: number;
  onSelect: (id?: number) => void;
  onFilterChange?: (filters: FilterState) => void;
}

export interface FilterState {
  area?: string;
  year?: string;
  sort?: 'time' | 'hits' | 'score';
}

// ── 정적 필터 데이터 ─────────────────────────────────────────────────────────

const AREAS = ['全部', '大陆', '香港', '台湾', '美国', '韩国', '日本', '英国', '法国', '德国', '泰国', '印度', '其他'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS: string[] = ['全部', ...Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => String(CURRENT_YEAR - i))];

const SORT_OPTIONS = [
  { label: '人气排序', value: 'hits' as const },
  { label: '评分排序', value: 'score' as const },
  { label: '时间排序', value: 'time' as const },
];

import { memo } from 'react';

// ── Tag chip ─────────────────────────────────────────────────────────────────

const Tag = memo(function Tag({
  label,
  value,
  active,
  onSelect,
}: {
  label: string;
  value: string | number | undefined;
  active: boolean;
  onSelect: (value: any) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect(value);
  }, [value, onSelect]);

  return (
    <button
      onClick={handleClick}
      className={`
        shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap
        transition-all duration-300 cursor-pointer select-none
        ${active
          ? 'bg-rose-500/15 text-rose-300 shadow-sm'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {label}
    </button>
  );
});

// ── Row ──────────────────────────────────────────────────────────────────────

function FilterRow({
  label,
  children,
}: {
  label: string;
  labelColor?: 'blue' | 'rose' | 'purple' | 'amber';
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="flex items-center gap-2 py-2 min-h-[44px]">
      {/* Row label */}
      <div className="shrink-0 w-16 flex items-center justify-between px-1 text-[14px] font-bold text-slate-300">
        <span>{label}</span>
        <span className="text-[10px] text-slate-500 opacity-70">▶</span>
      </div>

      {/* Scrollable tag list */}
      <div
        ref={scrollRef}
        className={`flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 pl-2 ${
          isDragging ? 'cursor-grabbing select-none *:pointer-events-none' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default memo(function CategoryNav({ categories, activeId, onSelect, onFilterChange }: CategoryNavProps) {
  const [area, setArea] = useState<string>('全部');
  const [year, setYear] = useState<string>('全部');
  const [sort, setSort] = useState<'time' | 'hits' | 'score'>('hits');

  const topLevel = useMemo(() => categories.filter(c => !c.type_pid || c.type_pid === 0), [categories]);

  const activeTopId = useMemo(() => {
    if (activeId === undefined) return undefined;
    const direct = topLevel.find(c => c.type_id === activeId);
    if (direct) return direct.type_id;
    const parent = categories.find(c => c.type_id === activeId);
    return parent?.type_pid;
  }, [activeId, topLevel, categories]);

  const subCategories = useMemo(() => {
    if (activeTopId === undefined) return [];
    return categories.filter(c => c.type_pid === activeTopId);
  }, [activeTopId, categories]);

  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => { onFilterChangeRef.current = onFilterChange; });

  useEffect(() => {
    onFilterChangeRef.current?.({
      area: area === '全部' ? undefined : area,
      year: year === '全部' ? undefined : year,
      sort,
    });
  }, [area, year, sort]);

  const handleTopSelect = useCallback((id?: number | string) => {
    setArea('全部');
    setYear('全部');
    onSelect(id as number | undefined);
  }, [onSelect]);

  const handleSubSelect = useCallback((id: number | string) => {
    onSelect(id as number);
  }, [onSelect]);

  const isSubSelected = activeId !== undefined && activeId !== activeTopId;

  return (
    <nav
      className="sticky top-16 sm:top-20 z-40 border-b border-white/[0.05]"
      style={{
        background: 'linear-gradient(180deg, rgba(9,10,15,0.97) 0%, rgba(13,16,23,0.95) 100%)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* 상단 미세 그라디언트 라인 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="divide-y divide-white/[0.05]">

          {/* ── 类型 row ── */}
          <FilterRow label="类型">
            <Tag
              label="全部"
              value={undefined}
              active={activeId === undefined}
              onSelect={handleTopSelect}
            />
            {topLevel.map(cat => (
              <Tag
                key={cat.type_id}
                label={cat.type_name}
                value={cat.type_id}
                active={activeId === cat.type_id || activeTopId === cat.type_id}
                onSelect={handleTopSelect}
              />
            ))}
          </FilterRow>

          {/* ── 剧情 row ── 1뎁스 선택 후 서브 카테고리가 있을 때 */}
          {subCategories.length > 0 && (
            <FilterRow label="剧情">
              <Tag
                label="全部"
                value={activeTopId!}
                active={activeTopId === activeId}
                onSelect={handleSubSelect}
              />
              {subCategories.map(sub => (
                <Tag
                  key={sub.type_id}
                  label={sub.type_name}
                  value={sub.type_id}
                  active={activeId === sub.type_id}
                  onSelect={handleSubSelect}
                />
              ))}
            </FilterRow>
          )}

          {/* ── 地区 / 年份 / 排序 — 2뎁스 선택 시에만 ── */}
          {isSubSelected && (
            <>
              <FilterRow label="地区">
                {AREAS.map(a => (
                  <Tag key={a} label={a} value={a} active={area === a} onSelect={setArea} />
                ))}
              </FilterRow>

              <FilterRow label="年份">
                {YEARS.map(y => (
                  <Tag key={y} label={y} value={y} active={year === y} onSelect={setYear} />
                ))}
              </FilterRow>

              <FilterRow label="排序">
                {SORT_OPTIONS.map(opt => (
                  <Tag key={opt.value} label={opt.label} value={opt.value} active={sort === opt.value} onSelect={setSort as any} />
                ))}
              </FilterRow>
            </>
          )}

        </div>
      </div>

      {/* 하단 미세 그라디언트 라인 */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
    </nav>
  );
});
