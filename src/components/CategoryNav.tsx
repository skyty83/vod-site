'use client';

import { CategoryItem } from '@/types';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface CategoryNavProps {
  categories: CategoryItem[];
  activeId?: number;
  onSelect: (id?: number) => void;
}

interface DropdownState {
  catId: number;
  rect: DOMRect;
}

export default function CategoryNav({ categories, activeId, onSelect }: CategoryNavProps) {
  const { t } = useTranslation();
  const [openDropdown, setOpenDropdown] = useState<DropdownState | null>(null);

  useEffect(() => {

    const close = () => setOpenDropdown(null);
    window.addEventListener('scroll', close, { passive: true, capture: true });
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('resize', close);
    };
  }, []);

  const topLevel = categories.filter(c => !c.type_pid);
  const getChildren = (pid: number) => categories.filter(c => c.type_pid === pid && c.type_pid !== undefined);

  const activeClasses = 'bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] border-transparent animate-gradient-x';
  const inactiveClasses = 'bg-[#11141d]/80 text-slate-400 border-white/5 hover:bg-white/5 hover:text-white hover:border-white/20 border shadow-inner shadow-black/50';
  const pillClasses = 'px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-sm sm:text-base font-black whitespace-nowrap transition-all duration-300 flex items-center gap-2 cursor-pointer';

  const handleDropdownToggle = (catId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openDropdown?.catId === catId) {
      setOpenDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setOpenDropdown({ catId, rect });
    }
  };

  return (
    <>
      <nav className="bg-[#090a0f]/80 backdrop-blur-3xl border-b border-white/5 sticky top-16 sm:top-20 z-40 transition-colors duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-rose-500/5 z-0 pointer-events-none"></div>
          <div className="flex items-center gap-3 overflow-x-auto py-4 sm:py-5 scrollbar-hide relative z-10">
            {/* All button */}
            <button
              onClick={() => { onSelect(undefined); setOpenDropdown(null); }}
              className={`${pillClasses} ${activeId === undefined ? activeClasses : inactiveClasses}`}
            >
              {t('common.all')}
            </button>

            {topLevel.map(cat => {
              const children = getChildren(cat.type_id);
              const isActive = activeId === cat.type_id || children.some(c => c.type_id === activeId);

              if (children.length === 0) {
                return (
                  <button
                    key={cat.type_id}
                    onClick={() => { onSelect(cat.type_id); setOpenDropdown(null); }}
                    className={`${pillClasses} ${isActive ? activeClasses : inactiveClasses}`}
                  >
                    {cat.type_name}
                  </button>
                );
              }

              return (
                <div key={cat.type_id} className="relative shrink-0">
                  <button
                    onClick={(e) => handleDropdownToggle(cat.type_id, e)}
                    className={`${pillClasses} cursor-pointer pr-4 sm:pr-5 ${isActive ? activeClasses : inactiveClasses}`}
                  >
                    {cat.type_name}
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 shrink-0 opacity-70 ${openDropdown?.catId === cat.type_id ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Portal dropdown — renders outside nav so it never gets clipped */}
      { openDropdown && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpenDropdown(null)}
          />
          {/* Dropdown panel — positioned via JS rect */}
          <div
            className="fixed z-[9999] min-w-[180px] p-2 bg-card-bg/98 backdrop-blur-2xl border border-card-border rounded-2xl shadow-2xl shadow-slate-300/50 dark:shadow-black/70 flex flex-col gap-1"
            style={{
              top: openDropdown.rect.bottom + 10,
              left: openDropdown.rect.left,
            }}
          >
            {(() => {
              const cat = topLevel.find(c => c.type_id === openDropdown.catId);
              if (!cat) return null;
              const children = getChildren(cat.type_id);
              return (
                <>
                  <button
                    onClick={() => { onSelect(cat.type_id); setOpenDropdown(null); }}
                    className={`text-left w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeId === cat.type_id
                      ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      : 'text-slate-300 dark:text-slate-200 hover:bg-card-bg/10'
                      }`}
                  >
                    {t('common.allWith', { name: cat.type_name })}
                  </button>
                  {children.length > 0 && (
                    <div className="h-px bg-card-bg/5 my-0.5 mx-2" />
                  )}
                  {children.map(child => (
                    <button
                      key={child.type_id}
                      onClick={() => { onSelect(child.type_id); setOpenDropdown(null); }}
                      className={`text-left w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeId === child.type_id
                        ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : 'text-slate-300 dark:text-slate-200 hover:bg-card-bg/10'
                        }`}
                    >
                      {child.type_name}
                    </button>
                  ))}
                </>
              );
            })()}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
