'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Film, PlaySquare, MonitorPlay, Tv } from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { label: '首页', icon: Home, href: '/' },
  { label: '电影', icon: Film, href: '/?cat=1' },
  { label: '剧集', icon: PlaySquare, href: '/?cat=2' },
  { label: '综艺', icon: MonitorPlay, href: '/?cat=3' },
  { label: '动漫', icon: Tv, href: '/?cat=4' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCat = searchParams.get('cat');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const currentIndex = MOBILE_NAV_ITEMS.findIndex((item) => {
      if (item.href === '/') {
        return pathname === '/' && !activeCat;
      }
      if (item.href.includes('cat=')) {
        const catId = item.href.split('cat=')[1];
        return pathname === '/' && activeCat === catId;
      }
      return pathname === item.href;
    });
    if (currentIndex !== -1) setActiveIndex(currentIndex);
  }, [pathname, activeCat]);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-8 pt-2 pointer-events-none">
      <div className="max-w-md mx-auto bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(225,29,72,0.1)] h-18 pointer-events-auto relative flex items-center px-1">
        {/* Animated Sliding Indicator */}
        <div
          className="absolute h-18 rounded-[24px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 shadow-[0_4px_20px_rgba(139,92,246,0.4)]"
          style={{
            width: `calc((100% - 8px) / 5)`,
            left: '4px',
            transform: `translateX(calc(${activeIndex} * 100%))`
          }}
        >
          <div className="absolute inset-0 bg-white/20 blur-md animate-gradient-x rounded-[24px]" />
        </div>

        {MOBILE_NAV_ITEMS.map((item, index) => {
          const active = activeIndex === index;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full relative z-10 py-1 transition-all duration-300"
            >
              <div
                className={`transition-all duration-500 flex flex-col items-center gap-0.1 ${active ? 'scale-110 -translate-y-1' : 'opacity-60 scale-90'
                  }`}
              >
                <div className={`relative ${active ? 'text-white' : 'text-slate-100'}`}>
                  <Icon
                    size={22}
                    className={`transition-all duration-500 ${active ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] stroke-[2.5px]' : 'stroke-[1.5px]'}`}
                  />
                  {active && (
                    <div className="absolute -inset-2 bg-white/10 blur-xl rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-black tracking-widest transition-all duration-300 ${active ? 'text-white scale-110' : 'text-slate-300'
                  }`}>
                  {item.label}
                </span>
              </div>

              {/* Tap feedback for touch devices */}
              <div className="absolute inset-0 group active:bg-white/5 rounded-2xl transition-colors duration-100" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
