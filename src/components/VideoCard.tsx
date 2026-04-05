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
      <article className="relative bg-card-bg rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:border-transparent z-10 before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-blue-600 before:via-purple-600 before:to-rose-600 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-500 before:blur-xl group-hover:shadow-[0_20px_50px_rgba(236,72,153,0.3)]">
        {/* Animated gradient border overlay */}
        <div className="absolute bg-card-bg rounded-2xl z-0 transition-colors duration-500 group-hover:bg-[#151822]"></div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Thumbnail */}
          <div className="relative aspect-[2/3] overflow-hidden bg-black/10 rounded-t-2xl">
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
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Play size={40} className="text-slate-400" />
              </div>
            )}

            {/* ===== DEFAULT badges (visible when NOT hovered) ===== */}
            {/* Score badge top-right */}
            {hasScore && (
              <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-white/10 shadow-lg shadow-black/30 transition-opacity duration-300 group-hover:opacity-0">
                <Star size={14} className="text-amber-400" fill="currentColor" />
                <span className="text-sm font-bold text-amber-400 drop-shadow-md">{score.toFixed(1)}</span>
              </div>
            )}

            {/* Remarks badge top-left */}
            {vod.vod_remarks && (
              <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-3 h-7 flex items-center shadow-lg shadow-black/20 transition-opacity duration-300 group-hover:opacity-0">
                <span className="text-xs font-bold text-white tracking-widest">{vod.vod_remarks}</span>
              </div>
            )}

            {/* Year badge bottom-left */}
            {vod.vod_year && (
              <div className="absolute bottom-3 right-3 bg-black/55 backdrop-blur-md rounded-full px-3 h-8 flex items-center border border-white/10 transition-opacity duration-300 group-hover:opacity-0">
                <span className="text-xs text-white/90 font-medium">{vod.vod_year}</span>
              </div>
            )}

            {/* ===== HOVER OVERLAY with full metadata ===== */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col">
              {/* Play button center */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.4)] scale-90 group-hover:scale-100 transition-all duration-500 group-hover:animate-pulse-glow">
                  <Play size={28} className="text-white ml-1" fill="currentColor" />
                </div>
              </div>

              {/* Info panel sliding up from bottom */}
              <div className="mx-4 mb-4 mt-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 space-y-3">
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
                      <span key={i} className="bg-card-bg/15 text-white/90 text-[11px] font-bold px-2.5 py-1 rounded">
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
          <div className="p-4 bg-transparent z-20">
            <h3 className="text-base font-black text-white leading-snug truncate mb-1.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-rose-400 group-hover:animate-gradient-x transition-all duration-500">
              {vod.vod_name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 truncate font-bold">
              {vod.type_name}
              {vod.vod_area ? ` · ${vod.vod_area}` : ''}
            </p>
          </div>
        </div>
      </article>
    </Link>
  );
}
