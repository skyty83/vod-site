'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Search, Tv, X, Menu, Film, PlaySquare, MonitorPlay, PlayCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const MAIN_NAV = [
  { id: 999, name: '首页', icon: <Tv size={16} />, href: '/' },
  { id: 1, name: '电影', icon: <Film size={16} />, href: '/?cat=1' },
  { id: 2, name: '连续剧', icon: <PlaySquare size={16} />, href: '/?cat=2' },
  { id: 3, name: '综艺', icon: <MonitorPlay size={16} />, href: '/?cat=3' },
  { id: 4, name: '动漫', icon: <Tv size={16} />, href: '/?cat=4' },
  { id: 36, name: '短剧', icon: <Film size={16} />, href: '/?cat=36' },
  { id: 777, name: '电视直播', icon: <MonitorPlay size={16} />, href: '/live' },
];

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCat = searchParams.get('cat') ? parseInt(searchParams.get('cat')!) : undefined;

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
      setMobileMenuOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 border-b ${scrolled
        ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-slate-200/80 dark:border-white/5 shadow-lg shadow-black/5 dark:shadow-black/40'
        : 'bg-white dark:bg-slate-950 border-slate-200/50 dark:border-white/5 shadow-sm'
        }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-20 flex items-center justify-between gap-4 lg:gap-8">

          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/" className="flex items-center gap-4 group py-2">
              <div className="relative">
                <div className="absolute inset-0 bg-rose-500/20 blur-2xl group-hover:bg-purple-500/30 transition-colors duration-1000"></div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0a0f18] border border-white/10 flex items-center justify-center relative z-10 overflow-hidden shadow-2xl group-hover:scale-105 transition-transform">
                   <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 via-transparent to-purple-500/20"></div>
                   <PlayCircle size={22} className="text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-[0.1em] bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-rose-400 to-purple-600">
                  喵喵影视
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500 dark:text-slate-400 mt-1 pl-1 opacity-60">GLOBAL STREAM</span>
              </div>
            </Link>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1.5 flex-1">
            {MAIN_NAV.map((item) => {
              const isActive = (pathname === '/live' && item.href === '/live') ||
                (pathname === '/' && activeCat === item.id) ||
                (pathname === '/' && activeCat === undefined && item.href === '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${isActive
                    ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {isActive && item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar & Theme (Desktop) */}
          <div className="flex items-center gap-2 shrink-0 flex-1 lg:flex-none justify-end">
            <form
              onSubmit={handleSearch}
              className="hidden md:block w-full max-w-[280px] relative group"
            >
              <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-white/5 rounded-full overflow-hidden transition-all duration-300 group-focus-within:border-blue-500/50 group-focus-within:bg-white dark:group-focus-within:bg-slate-950 group-focus-within:shadow-[0_0_15px_rgba(59,130,246,0.15)] h-10 sm:h-11">
                <div className="absolute left-3 w-5 h-5 flex items-center justify-center text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索影视..."
                  className="w-full h-full bg-transparent text-slate-900 dark:text-slate-100 pl-10 pr-16 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-0 h-full px-4 text-sm font-bold text-slate-500 hover:text-blue-500 transition-colors flex items-center justify-center"
                >
                  搜索
                </button>
              </div>
            </form>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="搜索"
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="切换主题"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-24 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
          <form onSubmit={handleSearch} className="relative mt-1">
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-full overflow-hidden focus-within:border-blue-500/50 h-11">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索影片..."
                className="w-full h-full bg-transparent pl-11 pr-20 text-sm focus:outline-none text-slate-900 dark:text-slate-100 font-medium"
              />
              <button type="submit" className="absolute right-1 top-1 bottom-1 bg-blue-500 text-white px-4 text-sm font-bold rounded-full">
                搜索
              </button>
            </div>
          </form>
        </div>

        {/* Mobile Nav Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-[85vh] opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
          <div className="pt-4 border-t border-slate-100 dark:border-white/5">
            <nav className="grid grid-cols-2 gap-3">
              {MAIN_NAV.map((item) => {
                const isActive = (pathname === '/live' && item.href === '/live') ||
                  (pathname === '/' && activeCat === item.id) ||
                  (pathname === '/' && activeCat === undefined && item.href === '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                      ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30'
                      : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    <span className={`${isActive ? 'text-blue-500' : 'text-slate-400'}`}>{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
