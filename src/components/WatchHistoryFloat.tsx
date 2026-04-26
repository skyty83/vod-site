'use client';

import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Play, X, History, ChevronRight, Zap, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function WatchHistoryFloat() {
  const { watchHistory } = useLocalStorage();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (watchHistory.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [watchHistory]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
  };

  if (!mounted || !isVisible || watchHistory.length === 0) return null;

  const lastVod = watchHistory[0];

  return (
    <div 
      className={`fixed bottom-28 lg:bottom-10 right-6 z-[9999] transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90'}`}
    >
      <div className="group relative">
        {/* Main Content Card */}
        <div className="relative w-[300px] sm:w-[340px] bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-blue-500/30 transition-all duration-500 overflow-hidden">
          
          {/* Animated Glow Border */}
          <div className="absolute inset-0 rounded-[2.5rem] p-[1px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
             <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-blue-500 via-purple-500 to-rose-500 animate-spin-slow"></div>
          </div>

          <div className="relative z-10 flex items-center gap-4 bg-black/60 backdrop-blur-md rounded-[2.3rem] p-2">
            {/* Poster Circle */}
            <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-blue-500/50 transition-colors">
              <Image
                src={lastVod.vod_pic}
                alt={lastVod.vod_name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                unoptimized
              />
              <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay"></div>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-1">
                <MonitorPlay size={10} className="text-blue-400" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">继续观看</span>
              </div>
              <h3 className="text-sm font-black text-white truncate mb-2 group-hover:text-blue-400 transition-colors">
                {lastVod.vod_name}
              </h3>
              
              <Link 
                href={`/vod/${lastVod.vod_id}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full transition-all active:scale-95 shadow-lg shadow-blue-600/20"
              >
                <Play size={10} fill="currentColor" />
                立即播放
              </Link>
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full blur-md animate-pulse opacity-50"></div>
        <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-rose-500 rounded-full blur-lg animate-pulse opacity-30"></div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
