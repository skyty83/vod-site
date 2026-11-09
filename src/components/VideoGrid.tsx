import { VodItem } from '@/types';
import PosterCard from './PosterCard';
import { LogoMark } from './Logo';
import { AllLink } from './Section';

export default function VideoGrid({ videos }: { videos: Partial<VodItem>[] }) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-panel bg-card px-6 py-20 text-center ring-1 ring-line">
        <LogoMark className="mb-6 h-16 w-16" />
        <h3 className="text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">没有找到相关内容</h3>
        <p className="mt-3 max-w-sm text-sm text-sub">换一个关键词, 或者调整筛选条件再试试。</p>
        <div className="mt-8">
          <AllLink href="/" label="回到首页" />
        </div>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {videos.map(vod => (
        <li key={vod.vod_id}>
          <PosterCard vod={vod} />
        </li>
      ))}
    </ul>
  );
}
