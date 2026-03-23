'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | '...')[] = [];
    const delta = 2;
    const range: number[] = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) pages.push(1, '...');
    else pages.push(1);

    pages.push(...range);

    if (currentPage + delta < totalPages - 1) pages.push('...', totalPages);
    else if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2 pb-4">
      <div className="flex items-center gap-1.5">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent shadow-sm mx-1"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Pages */}
        {getPages().map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-slate-400 dark:text-slate-500 font-bold">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${
                currentPage === page
                  ? 'bg-gradient-to-br from-blue-500 to-rose-500 text-white shadow-blue-500/30 shadow-md border-transparent'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent shadow-sm mx-1"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Page Info */}
      <div className="sm:ml-4 text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-sm backdrop-blur-sm">
        {currentPage} <span className="mx-1 opacity-50">/</span> {totalPages} 页
      </div>
    </div>
  );
}
