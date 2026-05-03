import { VodItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Clock, Flame, Calendar } from 'lucide-react';

interface VideoCardProps {
  vod: VodItem;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim();
}

import { memo } from 'react';

export default memo(function VideoCard({ vod }: VideoCardProps) {
  const score = parseFloat(vod.vod_score || '0');
  const hasScore = score > 0;
  const blurb = vod.vod_blurb ? stripHtml(vod.vod_blurb) : '';
  const dateStr = vod.vod_time ? vod.vod_time.split(' ')[0] : '';

  // Format duration: expects "HH:MM:SS" or "MM:SS" or raw seconds number
  const formatDuration = (raw?: string): string | null => {
    if (!raw) return null;
    // If it's a number (seconds)
    const asNum = Number(raw);
    if (!isNaN(asNum) && asNum > 0) {
      const h = Math.floor(asNum / 3600);
      const m = Math.floor((asNum % 3600) / 60);
      const s = Math.floor(asNum % 60);
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return `${m}:${String(s).padStart(2, '0')}`;
    }
    // Already formatted string — return as-is if it looks like time
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(raw.trim())) return raw.trim();
    return null;
  };
  const duration = formatDuration(vod.vod_duration);

  // Collect tag items
  const tags: string[] = [];
  if (vod.type_name) tags.push(vod.type_name);
  if (vod.vod_area) tags.push(vod.vod_area);
  if (vod.vod_year) tags.push(vod.vod_year);



  return (
    <Link href={`/vod/${vod.vod_id}`} className="block group">
      {/* Outer wrapper — animated gradient border via padding trick */}
      <article
        className="relative rounded-2xl p-[1px] overflow-hidden transition-all duration-500 hover:-translate-y-2"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.10), rgba(244,63,94,0.08))',
        }}
      >
        {/* Animated gradient border — visible on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #f43f5e, #3b82f6)',
            backgroundSize: '300% 300%',
            animation: 'gradient-x 4s ease infinite',
          }}
        />

        {/* Glow effect behind card on hover */}
        <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 80%, rgba(59,130,246,0.25), rgba(139,92,246,0.15), transparent 70%)',
          }}
        />

        {/* Inner card surface */}
        <div className="relative rounded-[15px] overflow-hidden bg-[#0d1017] group-hover:bg-[#111520] transition-colors duration-500 flex flex-col z-10">

          {/* Thumbnail */}
          <div className="relative aspect-[2/3] overflow-hidden">
            {vod.vod_pic ? (
              <Image
                src={vod.vod_pic}
                alt={vod.vod_name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#11141d] to-[#090a0f] flex items-center justify-center">
                <Play size={40} className="text-blue-500/40" />
              </div>
            )}

            {/* Shimmer overlay on hover */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />

            {/* Top gradient for badges */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />


            {/* ===== DEFAULT badges (visible when NOT hovered) ===== */}
            {/* Score badge top-right */}
            {hasScore && (
              <div className="absolute top-3 right-3 bg-blue-600/80 backdrop-blur-md rounded-lg px-2.5 py-1 flex items-center gap-1 shadow-lg shadow-blue-600/20 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-1">
                <Star size={12} className="text-amber-300" fill="currentColor" />
                <span className="text-xs font-black text-white tracking-wide">{score.toFixed(1)}</span>
              </div>
            )}

            {/* Remarks badge bottom-left */}
            {vod.vod_remarks && (
              <div className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-md rounded-lg px-2.5 h-6 flex items-center shadow-lg shadow-blue-600/20 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-1">
                <span className="text-[10px] font-black text-white tracking-wider uppercase">{vod.vod_remarks}</span>
              </div>
            )}

            {/* Duration badge bottom-right (shown when no hover) */}
            {duration && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/65 backdrop-blur-md rounded-lg px-2 h-6 border border-white/10 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-1 shadow-md">
                <Clock size={9} className="text-blue-400/80" />
                <span className="text-[10px] text-white/90 font-bold tabular-nums tracking-wide">{duration}</span>
              </div>
            )}

            {/* Year badge — only show if no duration */}
            {!duration && vod.vod_year && (
              <div className="absolute bottom-3 right-3 bg-white/[0.08] backdrop-blur-md rounded-lg px-2.5 h-6 flex items-center border border-white/[0.08] transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-1">
                <span className="text-[10px] text-white/80 font-bold tracking-wider">{vod.vod_year}</span>
              </div>
            )}

            {/* ===== HOVER OVERLAY ===== */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col">
              {/* Play button center */}
              <div className="flex-1 flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border border-blue-400/30 scale-75 group-hover:scale-100 transition-all duration-500 shadow-[0_0_30px_rgba(59,130,246,0.35)]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.20))',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <Play size={26} className="text-white ml-0.5 drop-shadow-lg" fill="currentColor" />
                </div>
              </div>

              {/* Info panel sliding up from bottom */}
              <div className="mx-3 mb-3 mt-auto rounded-xl p-3 translate-y-3 group-hover:translate-y-0 transition-transform duration-500 space-y-2 border border-white/[0.06]"
                style={{
                  background: 'linear-gradient(135deg, rgba(17,20,29,0.85), rgba(13,16,23,0.90))',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Top row: remarks + score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {vod.vod_remarks && (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md shadow-blue-500/20">
                        <Flame size={10} />
                        {vod.vod_remarks}
                      </span>
                    )}
                  </div>
                  {hasScore && (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400" fill="currentColor" />
                      <span className="text-amber-400 text-sm font-black">{score.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Tags row */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tags.map((tag, i) => (
                      <span key={i} className="bg-white/[0.06] text-blue-200/80 text-[10px] font-bold px-2 py-0.5 rounded-md border border-white/[0.04]">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Date */}
                {dateStr && (
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <Calendar size={10} className="text-blue-400/60" />
                    添加：{dateStr}
                  </p>
                )}

                {/* Actor */}
                {vod.vod_actor && vod.vod_actor !== '' && (
                  <p className="text-[10px] text-slate-300/70 truncate">
                    <span className="text-blue-400/50">主演：</span>{vod.vod_actor}
                  </p>
                )}

                {/* Blurb */}
                {blurb && (
                  <p className="text-[10px] text-slate-400/80 line-clamp-2 leading-relaxed">
                    <span className="text-blue-400/50">简介：</span>{blurb}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Info below thumbnail */}
          <div className="p-3.5 pb-4">
            <h3 className="text-sm font-black text-slate-100 leading-snug truncate mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-rose-400 transition-all duration-500"
              style={{ backgroundSize: '200% auto' }}
            >
              {vod.vod_name}
            </h3>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-500 truncate font-semibold">
                {vod.type_name}
                {vod.vod_area ? ` · ${vod.vod_area}` : ''}
              </p>
              {hasScore && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Star size={10} className="text-blue-400/60" fill="currentColor" />
                  <span className="text-[10px] font-bold text-blue-400/70">{score.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
});
