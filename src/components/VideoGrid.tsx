import { VodItem } from '@/types';
import VideoCard from './VideoCard';

interface VideoGridProps {
  videos: VodItem[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-200 dark:bg-slate-800 animate-pulse aspect-[2/3] w-full" />
      <div className="p-3 flex flex-col gap-2">
        <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-4 rounded w-full" />
        <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-3 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function VideoGrid({ videos, loading = false }: VideoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">暂无内容</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">请尝试其他分类或搜索关键词</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {videos.map(vod => (
        <VideoCard key={vod.vod_id} vod={vod as import('@/types').VodItem} />
      ))}
    </div>
  );
}
