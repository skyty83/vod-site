'use client';

import { useEffect, useState } from 'react';
import { Search, Tv, X, Menu, Film, PlaySquare, MonitorPlay, PlayCircle, Trophy, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const MAIN_NAV = [
  { id: 999, key: 'home', icon: <Tv size={16} />, href: '/' },
  { id: 1, key: 'movies', icon: <Film size={16} />, href: '/?cat=1' },
  { id: 2, key: 'series', icon: <PlaySquare size={16} />, href: '/?cat=2' },
  { id: 3, key: 'variety', icon: <MonitorPlay size={16} />, href: '/?cat=3' },
  { id: 4, key: 'anime', icon: <Tv size={16} />, href: '/?cat=4' },
  { id: 36, key: 'short', icon: <Film size={16} />, href: '/?cat=36' },
  { id: 48, key: 'sports', icon: <Trophy size={16} />, href: '/?cat=48' },
  { id: 777, key: 'live', icon: <MonitorPlay size={16} />, href: '/live' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCat = searchParams.get('cat') ? parseInt(searchParams.get('cat')!) : undefined;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentLang = (() => {
    const current = i18n.resolvedLanguage || i18n.language || 'zh';
    if (current.startsWith('ko')) return 'ko';
    if (current.startsWith('en')) return 'en';
    return 'zh';
  })();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    i18n.changeLanguage(next);
    window.localStorage.setItem('lang', next);
  };

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
      className={`sticky top-0 z-50 transition-all duration-500 ${scrolled
        ? 'bg-background/80 backdrop-blur-3xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
        : 'bg-background/50 backdrop-blur-sm border-b border-transparent'
        }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-20 flex items-center justify-between gap-4 lg:gap-8">

          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-300 hover:bg-card-bg/10 rounded-full transition-colors"
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
                <span className="text-xl sm:text-2xl font-black tracking-[0.1em] bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 group-hover:animate-gradient-x transition-all duration-500">
                  喵喵影视
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400 mt-1 pl-1 opacity-60 group-hover:text-rose-400 transition-colors duration-500">GLOBAL STREAM</span>
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
                    ? 'bg-gradient-to-r from-blue-600/20 to-rose-600/20 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] border border-white/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  {isActive && item.icon}
                  {t(`nav.${item.key}`)}
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
              <div className="relative flex items-center bg-card-bg border border-transparent dark:border-white/5 rounded-full overflow-hidden transition-all duration-300 group-focus-within:border-blue-500/50 group-focus-within:bg-card-bg dark:group-focus-within:bg-slate-950 group-focus-within:shadow-[0_0_15px_rgba(59,130,246,0.15)] h-10 sm:h-11">
                <div className="absolute left-3 w-5 h-5 flex items-center justify-center text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search.placeholderVideo')}
                  className="w-full h-full bg-transparent text-foreground pl-10 pr-16 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-0 h-full px-4 text-sm font-bold text-slate-400 hover:text-blue-500 transition-colors flex items-center justify-center"
                >
                  {t('common.search')}
                </button>
              </div>
            </form>

            <div className="relative">
              <select
                value={currentLang}
                onChange={handleLanguageChange}
                className="appearance-none h-10 sm:h-11 pl-4 pr-10 rounded-full bg-white/[0.02] border border-white/10 text-slate-300 text-sm font-black tracking-wide hover:bg-white/5 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40"
                aria-label={t('lang.label')}
                title={t('lang.label')}
              >
                <option value="zh">{t('lang.zh')}</option>
                <option value="ko">{t('lang.ko')}</option>
                <option value="en">{t('lang.en')}</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <ChevronDown size={16} />
              </div>
            </div>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-400 hover:bg-card-bg/10 transition-colors"
              aria-label={t('common.search')}
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-24 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
          <form onSubmit={handleSearch} className="relative mt-1">
            <div className="relative flex items-center bg-card-bg border border-white/10/50 dark:border-white/5 rounded-full overflow-hidden focus-within:border-blue-500/50 h-11">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholderMovie')}
                className="w-full h-full bg-transparent pl-11 pr-20 text-sm focus:outline-none text-foreground font-medium"
              />
              <button type="submit" className="absolute right-1 top-1 bottom-1 bg-blue-500 text-white px-4 text-sm font-bold rounded-full">
                {t('common.search')}
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
                      : 'bg-background dark:bg-slate-900/50 text-slate-300'
                      }`}
                  >
                    <span className={`${isActive ? 'text-blue-500' : 'text-slate-400'}`}>{item.icon}</span>
                    {t(`nav.${item.key}`)}
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
