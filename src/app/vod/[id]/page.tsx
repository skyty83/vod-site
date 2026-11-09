import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { stripHtml } from '@/lib/format';
import Link from 'next/link';
import { getVideoDetail, parsePlaySources } from '@/lib/api';
import VideoPlayer from '@/components/VideoPlayer';
import VodInfo from '@/components/VodInfo';

interface Props {
  params: Promise<{ id: string }>;
}

// metadata 与页面共用同一次请求
const loadVod = cache((id: string) => getVideoDetail(id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vod = await loadVod(id);
  if (!vod) return { title: '视频详情' };
  return {
    title: vod.vod_name,
    description: stripHtml(vod.vod_blurb || vod.vod_content) || `在线观看 ${vod.vod_name}`,
  };
}

export default async function VodDetailPage({ params }: Props) {
  const { id } = await params;
  const vod = await loadVod(id);
  if (!vod) notFound();
  const sources = parsePlaySources(vod);

  return (
    <div className="relative isolate">
      {/* 环境光: 海报放大模糊作为页面顶部背景 */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 -mt-[var(--header-h)] h-[min(780px,95vh)] overflow-hidden">
        <div
          className="absolute inset-0 scale-125 bg-cover bg-center opacity-60 blur-[110px] saturate-150 dark:opacity-40"
          style={{ backgroundImage: `url("${vod.vod_pic}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-paper/30 via-paper/75 to-paper" />
      </div>

      <div className="wrap pt-4 sm:pt-6">
        <nav aria-label="面包屑" className="mb-4 flex min-w-0 items-center gap-2 text-sm font-medium text-sub">
          <Link href="/" className="shrink-0 hover:text-ink">
            首页
          </Link>
          {vod.type_name && (
            <>
              <span aria-hidden="true">/</span>
              <span className="shrink-0">{vod.type_name}</span>
            </>
          )}
          <span aria-hidden="true">/</span>
          <span className="truncate text-ink">{vod.vod_name}</span>
        </nav>

        <VideoPlayer
          sources={sources}
          meta={{ id: vod.vod_id, name: vod.vod_name, pic: vod.vod_pic, type: vod.type_name }}
        />
        <VodInfo vod={vod} />
      </div>
    </div>
  );
}
