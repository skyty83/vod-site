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
    <main className="flex-1 pb-12">
      {/* Hero Section */}
      <div className="relative pt-8 pb-12 overflow-hidden bg-slate-950 border-b border-slate-800">
        {/* Blurred background */}
        {vod.vod_pic && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-950/80 to-slate-950 z-10"></div>
            <Image
              src={vod.vod_pic}
              alt=""
              fill
              className="object-cover blur-3xl opacity-30 scale-125 saturate-150"
              unoptimized
            />
          </div>
        )}

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium mb-8 group bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm self-start"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            返回首页
          </Link>

          {/* Content Layout */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 lg:gap-12 items-start">
            {/* Poster */}
            <div className="w-40 sm:w-48 lg:w-56 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/40 aspect-[2/3] relative ring-1 ring-white/20">
              {vod.vod_pic ? (
                <Image
                  src={vod.vod_pic}
                  alt={vod.vod_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <Film size={48} className="text-white/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-white flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 leading-tight tracking-tight drop-shadow-md pb-1 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                {vod.vod_name}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Remarks */}
                {vod.vod_remarks && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-rose-500 text-xs font-bold shadow-lg shadow-blue-500/30 text-white tracking-wider">
                    {vod.vod_remarks}
                  </span>
                )}

                {/* Score */}
                {score > 0 && (
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= Math.round(score / 2) ? 'text-amber-400' : 'text-white/20'}
                          fill={s <= Math.round(score / 2) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <span className="text-amber-400 font-bold ml-1">{score.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mb-6">
                {vod.type_name && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Film size={16} className="text-blue-400" />
                    <span>{vod.type_name}</span>
                  </div>
                )}
                {vod.vod_year && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Calendar size={16} className="text-blue-400" />
                    <span>{vod.vod_year}年</span>
                    {vod.vod_pubdate && <span className="opacity-50">· {vod.vod_pubdate}</span>}
                  </div>
                )}
                {vod.vod_area && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <MapPin size={16} className="text-rose-400" />
                    <span>{vod.vod_area}</span>
                    {vod.vod_lang && <span className="opacity-50">· {vod.vod_lang}</span>}
                  </div>
                )}
                {vod.vod_duration && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Clock size={16} className="text-rose-400" />
                    <span>{vod.vod_duration}</span>
                  </div>
                )}
              </div>

              {/* Participants */}
              <div className="space-y-2 mb-6 text-sm text-white/70">
                {vod.vod_director && (
                  <div className="flex items-start">
                    <User size={16} className="text-white/40 mt-0.5 shrink-0 mr-2" />
                    <span className="text-white/50 w-12 shrink-0">导演：</span>
                    <span>{vod.vod_director}</span>
                  </div>
                )}
                {vod.vod_actor && (
                  <div className="flex items-start">
                    <User size={16} className="text-white/40 mt-0.5 shrink-0 mr-2" />
                    <span className="text-white/50 w-12 shrink-0">主演：</span>
                    <span className="leading-relaxed">{vod.vod_actor}</span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                  <Tag size={14} className="text-white/30" />
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-0.5 rounded-md text-xs font-medium text-white/80 transition-colors cursor-default"
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">
          {/* Left Column: Player & Episodes */}
          <div className="flex flex-col gap-8 w-full max-w-full overflow-hidden">
            {/* Component title */}
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-rose-500 rounded-full blur-[1px]"></span>
                在线播放
              </h2>
              <VideoPlayer sources={sources} />
            </div>
          </div>

          {/* Right Column: Synopsis & Extra Info */}
          <div className="flex flex-col gap-6">
            {(vod.vod_content || vod.vod_blurb) && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                  剧情简介
                </h2>
                <div className="text-slate-600 dark:text-slate-400 text-sm leading-8 whitespace-pre-line text-justify">
                  {vod.vod_content || vod.vod_blurb}
                </div>
              </section>
            )}

            {/* Ad / Stats / Extra placeholder space for Right column */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3">
              <Film size={32} className="text-slate-400 dark:text-slate-500" />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">看视频就上 喵喵影视</p>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold tracking-wider">每日更新 · 免费观看</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
