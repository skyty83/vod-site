'use client';

import { VodItem } from '@/types';
import { parsePlaySources } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Calendar, MapPin, Tag, Film, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  vod: VodItem;
}

export default function VodDetailClient({ vod }: Props) {
  const { t } = useTranslation();
  const sources = parsePlaySources(vod);

  return (
    <main className="flex-1 pb-16 bg-background">
      {/* Cinematic Hero Section */}
      <div className="relative h-[220px] sm:h-[260px] flex items-center justify-center overflow-">
              <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pt-16 sm:pt-20 pb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-all text-sm font-bold group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md self-start"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            {t('vod.backHome')}
          </Link>
        </div>
      </div>

      {/* Content & Player Section */}
      <div id="player-section" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-30">
        <div className="flex flex-col gap-7">
          <section className="bg-card-bg/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/45">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full animate-pulse-glow" />
                {t('vod.nowPlaying')}
              </h2>
            </div>
            <div className="p-0 sm:p-4">
              <VideoPlayer 
                sources={sources} 
                vod={vod}
              />
            </div>
          </section>

          {/* VIP Banner */}
          <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/80 border border-white/10 rounded-3xl p-7 flex flex-col items-center text-center gap-4 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30 relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <Film size={28} className="text-blue-400" />
            </div>
            <div className="relative z-10 space-y-1">
              <p className="text-white text-lg font-black tracking-widest">{t('vod.vipTitle')}</p>
              <p className="text-blue-200/60 text-sm font-bold">{t('vod.vipDesc')}</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
