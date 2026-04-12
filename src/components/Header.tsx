'use client';

import { useEffect, useState } from 'react';
import { Search, Tv, X, Menu, Film, PlaySquare, MonitorPlay, PlayCircle, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const MAIN_NAV = [
  { id: 999, label: '首页', icon: <Tv size={16} />, href: '/' },
  { id: 1, label: '电影', icon: <Film size={16} />, href: '/?cat=1' },
  { id: 2, label: '连续剧', icon: <PlaySquare size={16} />, href: '/?cat=2' },
  { id: 3, label: '综艺', icon: <MonitorPlay size={16} />, href: '/?cat=3' },
  { id: 4, label: '动漫', icon: <Tv size={16} />, href: '/?cat=4' },
  { id: 36, label: '短剧', icon: <Film size={16} />, href: '/?cat=36' },
  { id: 48, label: '体育', icon: <Trophy size={16} />, href: '/?cat=48' },
  { id: 777, label: '电视直播', icon: <MonitorPlay size={16} />, href: '/live' },
];

export default function Header() {
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
        <div className="h-16 sm:h-20 flex items-center justify-between gap-4 lg:gap-6 xl:gap-8">

          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-4 group py-2">
              <div className="relative">
                {/* 로고 네온 광채 효과 */}
                <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="absolute inset-0 bg-rose-500/20 blur-2xl group-hover:bg-blue-500/30 transition-all duration-1000"></div>

                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#0a0f18] border border-white/10 flex items-center justify-center relative z-10 overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500 group-hover:border-white/20">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 via-transparent to-blue-500/10 group-hover:opacity-50 transition-opacity"></div>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-[0.1em] bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 group-hover:animate-gradient-x transition-all duration-500">
                  喵喵影视
                </span>
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
                  className={`px-3 xl:px-4 py-2 rounded-full text-xs xl:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-rose-600/20 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] border border-white/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  {isActive && item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar & Theme (Desktop) */}
          <div className="flex items-center gap-2 shrink-0 flex-1 lg:flex-none justify-end">
            <form
              onSubmit={handleSearch}
              className="hidden xl:block w-full max-w-[280px] relative group"
            >
              <div className="relative flex items-center bg-card-bg border border-transparent dark:border-white/5 rounded-full overflow-hidden transition-all duration-300 group-focus-within:border-blue-500/50 group-focus-within:bg-card-bg dark:group-focus-within:bg-slate-950 group-focus-within:shadow-[0_0_15px_rgba(59,130,246,0.15)] h-10 sm:h-11">
                <div className="absolute left-3 w-5 h-5 flex items-center justify-center text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索影视..."
                  className="w-full h-full bg-transparent text-foreground pl-10 pr-16 text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400 font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-0 h-full px-4 text-sm font-bold text-slate-400 hover:text-blue-500 transition-colors flex items-center justify-center"
                >
                  搜索
                </button>
              </div>
            </form>

            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="xl:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-400 hover:bg-card-bg/10 transition-colors"
              aria-label="搜索"
            >
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        <div className={`xl:hidden overflow-hidden transition-all duration-300 ${searchOpen ? 'max-h-24 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
          <form onSubmit={handleSearch} className="relative mt-1">
            <div className="relative flex items-center bg-card-bg border border-white/10/50 dark:border-white/5 rounded-full overflow-hidden focus-within:border-blue-500/50 h-11">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索影片..."
                className="w-full h-full bg-transparent pl-11 pr-20 text-sm focus:outline-none text-foreground font-medium"
              />
              <button type="submit" className="absolute right-1 top-1 bottom-1 bg-blue-500 text-white px-4 text-sm font-bold rounded-full">
                搜索
              </button>
            </div>
          </form>
        </div>


      </div>
    </header>
  );
}
