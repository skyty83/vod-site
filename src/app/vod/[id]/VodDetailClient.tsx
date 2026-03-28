'use client';

import { VodItem } from '@/types';
import { parsePlaySources } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Calendar, MapPin, Tag, User, Film, ArrowLeft, Clock } from 'lucide-react';

interface Props {
  vod: VodItem;
}

export default function VodDetailClient({ vod }: Props) {
  const sources = parsePlaySources(vod);
  const score = parseFloat(vod.vod_score || '0');
  const tags = vod.vod_tag?.split(',').filter(Boolean) || [];

  return (
    <main className="flex-1 pb-16">
      {/* Premium Hero Section */}
      <div className="relative pt-12 pb-20 sm:pt-16 sm:pb-24 overflow-hidden bg-slate-950 border-b border-white/5">
        {/* Cinematic Blurred background */}
        {vod.vod_pic && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-950/80 to-slate-950 z-10 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10"></div>
            <Image
              src={vod.vod_pic}
              alt=""
              fill
              className="object-cover blur-[60px] opacity-40 scale-150 saturate-200"
              unoptimized
            />
            {/* Subtle glow orb */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-blue-500/20 blur-[120px] rounded-full z-10 pointer-events-none"></div>
          </div>
        )}

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-all text-sm font-bold mb-8 sm:mb-12 group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md self-start"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            返回首页
          </Link>

          {/* Content Layout */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16 items-center md:items-start">
            {/* Awesome Poster */}
            <div className="w-48 sm:w-56 lg:w-72 shrink-0 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] md:shadow-[0_20px_60px_rgba(59,130,246,0.2)] aspect-[2/3] relative ring-1 ring-white/20 group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_70px_rgba(59,130,246,0.4)]">
              {vod.vod_pic ? (
                <>
                  <Image
                    src={vod.vod_pic}
                    alt={vod.vod_name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <Film size={56} className="text-white/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-white flex-1 min-w-0 flex flex-col items-center md:items-start text-center md:text-left">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-slate-400">
                {vod.vod_name}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-8">
                {/* Remarks */}
                {vod.vod_remarks && (
                  <span className="inline-flex items-center px-4 py-1.5 rounded-md bg-gradient-to-r from-blue-500 to-indigo-500 text-xs sm:text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.4)] text-white tracking-widest ring-1 ring-white/20">
                    {vod.vod_remarks}
                  </span>
                )}

                {/* Score */}
                {score > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-md border border-white/20 shadow-lg">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= Math.round(score / 2) ? 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'text-white/20'}
                          fill={s <= Math.round(score / 2) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="text-amber-400 font-extrabold text-sm sm:text-base ml-1">{score.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 mb-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 w-full shadow-xl">
                {vod.type_name && (
                  <div className="flex items-center justify-center md:justify-start gap-2.5 text-sm sm:text-base font-medium text-white/90">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Film size={16} className="text-blue-400" />
                    </div>
                    <span>{vod.type_name}</span>
                  </div>
                )}
                {vod.vod_year && (
                  <div className="flex items-center justify-center md:justify-start gap-2.5 text-sm sm:text-base font-medium text-white/90">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Calendar size={16} className="text-emerald-400" />
                    </div>
                    <span>{vod.vod_year}年</span>
                  </div>
                )}
                {vod.vod_area && (
                  <div className="flex items-center justify-center md:justify-start gap-2.5 text-sm sm:text-base font-medium text-white/90">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-rose-400" />
                    </div>
                    <span>{vod.vod_area}</span>
                  </div>
                )}
                {vod.vod_duration && (
                  <div className="flex items-center justify-center md:justify-start gap-2.5 text-sm sm:text-base font-medium text-white/90">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-amber-400" />
                    </div>
                    <span>{vod.vod_duration}</span>
                  </div>
                )}
              </div>

              {/* Participants */}
              <div className="space-y-3 mb-8 text-sm sm:text-base w-full">
                {vod.vod_director && (
                  <div className="flex items-start justify-center md:justify-start">
                    <span className="text-blue-400 font-bold shrink-0 mr-3">导演</span>
                    <span className="text-white/90 font-medium">{vod.vod_director}</span>
                  </div>
                )}
                {vod.vod_actor && (
                  <div className="flex items-start justify-center md:justify-start">
                    <span className="text-blue-400 font-bold shrink-0 mr-3">主演</span>
                    <span className="text-white/80 leading-relaxed max-w-2xl">{vod.vod_actor}</span>
                  </div>
                )}
              </div>

              {/* Action Button: Scroll to player */}
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <button 
                  onClick={() => document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all hover:scale-105 focus:outline-none overflow-hidden"
                >
                  <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-[ping_1.5s_ease-out_infinite]"></div>
                  <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="ml-0.5"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>
                  </div>
                  立即播放
                </button>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-8 mt-4 border-t border-white/10 w-full">
                  <Tag size={16} className="text-white/40 mr-2" />
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold text-slate-300 transition-colors shadow-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div id="player-section" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-[-30px] sm:mt-[-40px] relative z-30">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 xl:gap-10 items-start">
          {/* Left Column: Player & Episodes */}
          <div className="flex flex-col gap-8 w-full max-w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl">
            {/* Component title */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]"></span>
                在线播放
              </h2>
              <VideoPlayer sources={sources} />
            </div>
          </div>

          {/* Right Column: Synopsis & Extra Info */}
          <div className="flex flex-col gap-6 sticky top-24">
            {(vod.vod_content || vod.vod_blurb) && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full"></div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-emerald-400 rounded-full"></div>
                  剧情简介
                </h2>
                <div 
                  className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-8 sm:leading-loose whitespace-pre-line text-justify [&>p]:mb-4 last:[&>p]:mb-0 relative z-10"
                  dangerouslySetInnerHTML={{ __html: vod.vod_content || vod.vod_blurb || '' }}
                />
              </section>
            )}

            {/* Ad / Stats / Extra placeholder space for Right column */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 shadow-lg overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center relative z-10">
                 <Film size={28} className="text-blue-500" />
              </div>
              <div className="relative z-10">
                <p className="text-slate-800 dark:text-slate-200 text-lg font-bold mb-1">喵喵影视 高清观影</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">每日海量更新 · 极速免费播放</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
