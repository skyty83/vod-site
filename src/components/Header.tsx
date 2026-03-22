'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Search, Tv, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled
        ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-slate-200/40 dark:shadow-black/40'
        : 'bg-white dark:bg-slate-950 border-transparent'
        }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group py-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 group-hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 blur-md group-hover:opacity-0 transition-opacity"></div>
              <Tv size={24} className="text-white relative z-10" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 group-hover:from-blue-500 group-hover:to-rose-500 transition-all duration-500">
              喵喵影视
            </span>
          </Link>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden sm:block flex-1 max-w-2xl mx-auto relative group px-4"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-rose-500 rounded-full blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-500 mx-4"></div>
            <div className="relative flex items-center bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-full overflow-hidden transition-all duration-300 group-focus-within:border-blue-500/50 group-focus-within:bg-white dark:group-focus-within:bg-slate-950 group-focus-within:shadow-md h-12">
              <div className="absolute left-4 w-6 h-6 flex items-center justify-center text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                <Search size={18} />
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="探索电影、电视剧、动漫..."
                className="w-full h-full bg-transparent text-slate-900 dark:text-slate-100 pl-12 pr-[88px] text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
              />

              <div className="absolute right-1.5 top-1.5 bottom-1.5">
                <button
                  type="submit"
                  className="h-full bg-slate-900 dark:bg-white cursor-pointer text-white dark:text-slate-900 px-5 text-sm font-bold rounded-full hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white transition-all shadow-sm flex items-center justify-center whitespace-nowrap tracking-wider min-w-[70px]"
                >
                  搜索
                </button>
              </div>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0 py-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="sm:hidden w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              aria-label="搜索"
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200 relative overflow-hidden group"
                aria-label="切换主题"
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="group-hover:text-amber-400 transition-colors" />
                ) : (
                  <Moon size={18} className="group-hover:text-blue-500 transition-colors" />
                )}
              </button>
            )}

          </div>
        </div>

        {/* Mobile Search Drop-down */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 flex flex-col justify-end ${searchOpen ? 'max-h-24 opacity-100 pb-4' : 'max-h-0 opacity-0'
            }`}
        >
          <form onSubmit={handleSearch} className="relative group mt-1">
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full overflow-hidden focus-within:border-blue-500/50 focus-within:bg-white dark:focus-within:bg-slate-950 shadow-sm transition-all duration-300 h-12">
              <div className="absolute left-4 w-6 h-6 flex items-center justify-center text-slate-400 group-focus-within:text-blue-500 pointer-events-none">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索影视作品..."
                className="w-full h-full bg-transparent pl-12 pr-[88px] text-sm focus:outline-none text-slate-900 dark:text-slate-100 font-medium"
              />
              <div className="absolute right-1.5 top-1.5 bottom-1.5">
                <button
                  type="submit"
                  className="h-full bg-blue-500 text-white px-5 text-sm font-bold rounded-full hover:bg-blue-600 transition-colors flex items-center justify-center shadow-md shadow-blue-500/30 whitespace-nowrap min-w-[70px]"
                >
                  搜索
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}
