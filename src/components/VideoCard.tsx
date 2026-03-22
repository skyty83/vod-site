import { VodItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';

interface VideoCardProps {
  vod: VodItem;
}

export default function VideoCard({ vod }: VideoCardProps) {
  const score = parseFloat(vod.vod_score || '0');
  const hasScore = score > 0;

  return (
    <Link href={`/vod/${vod.vod_id}`} className="block group">
      <article className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30">
        {/* Thumbnail */}
        <div className="relative aspect-[2/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          {vod.vod_pic ? (
             <Image
              src={vod.vod_pic}
              alt={vod.vod_name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <Play size={32} className="text-slate-600" />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-rose-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-2xl scale-50 group-hover:scale-100 transition-transform duration-300 pl-1">
              <Play size={24} className="text-slate-900" fill="currentColor" />
            </div>
          </div>

          {/* Score badge */}
          {hasScore && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm">
              <Star size={10} className="text-amber-400" fill="currentColor" />
              <span className="text-xs font-bold text-amber-400">{score.toFixed(1)}</span>
            </div>
          )}

          {/* Remarks badge */}
          {vod.vod_remarks && (
            <div className="absolute top-2 left-0 bg-gradient-to-r from-blue-500 to-rose-500 rounded-r-lg px-2 py-0.5 shadow-md">
              <span className="text-[10px] font-bold text-white tracking-wide">{vod.vod_remarks}</span>
            </div>
          )}

          {/* Year badge */}
          {vod.vod_year && (
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
              <span className="text-[10px] text-white/90 font-medium">{vod.vod_year}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 mb-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
            {vod.vod_name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {vod.type_name}
            {vod.vod_area ? ` · ${vod.vod_area}` : ''}
          </p>
        </div>
      </article>
    </Link>
  );
}
