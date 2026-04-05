import { getVideoDetail } from '@/lib/api';
import { notFound } from 'next/navigation';
import VodDetailClient from './VodDetailClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vod = await getVideoDetail(id);
  if (!vod) return { title: '视频详情 - 喵喵影视' };
  const rawDesc = vod.vod_blurb || vod.vod_content || `在线观看 ${vod.vod_name}`;
  const plainDesc = rawDesc.replace(/<[^>]+>/g, '').trim();

  return {
    title: `${vod.vod_name} - 喵喵影视`,
    description: plainDesc,
  };
}

export default async function VodDetailPage({ params }: Props) {
  const { id } = await params;
  const vod = await getVideoDetail(id);

  if (!vod) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col">
      <VodDetailClient vod={vod} />
    </div>
  );
}
