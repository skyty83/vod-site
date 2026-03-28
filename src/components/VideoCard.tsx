import { VodItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star, Flame, Calendar } from 'lucide-react';

interface VideoCardProps {
  vod: VodItem;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').trim();
}

export default function VideoCard({ vod }: VideoCardProps) {
  const score = parseFloat(vod.vod_score || '0');
  const hasScore = score > 0;
  const blurb = vod.vod_blurb ? stripHtml(vod.vod_blurb) : '';
  const dateStr = vod.vod_time ? vod.vod_time.split(' ')[0] : '';

  // Collect tag items
  const tags: string[] = [];
  if (vod.type_name) tags.push(vod.type_name);
  if (vod.vod_area) tags.push(vod.vod_area);
  if (vod.vod_year) tags.push(vod.vod_year);

  return (
    <Link href={`/vod/${vod.vod_id}`} className="block group">
      <article className="relative bg-white dark:bg-slate-900 rounded-2xl p-1 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/25 z-10 before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500 before:via-purple-500 before:to-rose-500 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-500 before:-z-10 before:rounded-2xl">
        <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden h-full flex flex-col relative z-20 transition-all duration-300">
          {/* Thumbnail */}
          <div className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
            {vod.vod_pic ? (
              <Image
                src={vod.vod_pic}
                alt={vod.vod_name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                className="object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:brightness-50"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Play size={40} className="text-slate-600" />
              </div>
            )}

            {/* ===== DEFAULT badges (visible when NOT hovered) ===== */}
            {/* Score badge top-right */}
            {hasScore && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm border border-amber-500/30 transition-opacity duration-300 group-hover:opacity-0">
                <Star size={14} className="text-amber-400" fill="currentColor" />
                <span className="text-sm font-bold text-amber-400 drop-shadow-md">{score.toFixed(1)}</span>
              </div>
            )}

            {/* Remarks badge top-left */}
            {vod.vod_remarks && (
              <div className="absolute top-5 left-0 bg-gradient-to-r from-blue-600 to-rose-600 rounded-r-lg px-4 h-7 shadow-lg shadow-rose-500/30 transition-opacity duration-300 group-hover:opacity-0">
                <span className="text-xs font-bold text-white tracking-widest">{vod.vod_remarks}</span>
              </div>
            )}

            {/* Year badge bottom-left */}
            {vod.vod_year && (
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md rounded-md px-2.5 h-8 border border-white/10 transition-opacity duration-300 group-hover:opacity-0">
                <span className="text-xs text-white/90 font-medium">{vod.vod_year}</span>
              </div>
            )}

            {/* ===== HOVER OVERLAY with full metadata ===== */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col">
              {/* Play button center */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-50 group-hover:scale-100 transition-all duration-500 ring-2 ring-white/40">
                  <Play size={28} className="text-white ml-1" fill="currentColor" />
                </div>
              </div>

              {/* Info panel sliding up from bottom */}
              <div className="bg-gradient-to-t from-black/95 via-black/85 to-transparent px-4 pt-10 pb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 space-y-3">
                {/* Top row: remarks + score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {vod.vod_remarks && (
                      <span className="inline-flex items-center gap-1 bg-green-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded">
                        <Flame size={12} />
                        {vod.vod_remarks}
                      </span>
                    )}
                  </div>
                  {hasScore && (
                    <span className="text-amber-400 text-base font-black">{score.toFixed(1)}</span>
                  )}
                </div>

                {/* Tags row */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {tags.map((tag, i) => (
                      <span key={i} className="bg-white/15 text-white/90 text-[11px] font-bold px-2.5 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Date */}
                {dateStr && (
                  <p className="text-[11px] text-white/60 font-medium flex items-center gap-1.5">
                    <Calendar size={12} />
                    添加：{dateStr}
                  </p>
                )}

                {/* Actor */}
                {vod.vod_actor && vod.vod_actor !== '' && (
                  <p className="text-[11px] text-white/70 truncate">
                    <span className="text-white/50">主演：</span>{vod.vod_actor}
                  </p>
                )}

                {/* Blurb */}
                {blurb && (
                  <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                    <span className="text-white/50">简介：</span>{blurb}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Info below thumbnail */}
          <div className="p-4 bg-white dark:bg-slate-900 z-20">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug truncate mb-1.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-rose-500 transition-all duration-300">
              {vod.vod_name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate font-medium">
              {vod.type_name}
              {vod.vod_area ? ` · ${vod.vod_area}` : ''}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
