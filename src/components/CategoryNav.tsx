'use client';

import { CategoryItem } from '@/types';
import { ChevronDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [openDropdown, setOpenDropdown] = useState<DropdownState | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on scroll or resize
  useEffect(() => {
    const close = () => setOpenDropdown(null);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, []);

  const topLevel = categories.filter(c => !c.type_pid);
  const getChildren = (pid: number) => categories.filter(c => c.type_pid === pid && c.type_pid !== undefined);

  const activeClasses = 'bg-gradient-to-br from-blue-500 to-rose-500 text-white shadow-md shadow-blue-500/20 border-transparent';
  const inactiveClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 border';
  const pillClasses = 'px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-sm sm:text-base font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 cursor-pointer';

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
      <nav className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-20 z-40 transition-colors duration-300 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto py-4 sm:py-5 scrollbar-hide">
            {/* All button */}
            <button
              onClick={() => { onSelect(undefined); setOpenDropdown(null); }}
              className={`${pillClasses} ${activeId === undefined ? activeClasses : inactiveClasses}`}
            >
              全部
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
      {mounted && openDropdown && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpenDropdown(null)}
          />
          {/* Dropdown panel — positioned via JS rect */}
          <div
            className="fixed z-[9999] min-w-[180px] p-2 bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-slate-300/50 dark:shadow-black/70 flex flex-col gap-1"
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
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    全部{cat.type_name}
                  </button>
                  {children.length > 0 && (
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-0.5 mx-2" />
                  )}
                  {children.map(child => (
                    <button
                      key={child.type_id}
                      onClick={() => { onSelect(child.type_id); setOpenDropdown(null); }}
                      className={`text-left w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeId === child.type_id
                          ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
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
