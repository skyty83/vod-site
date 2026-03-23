import { getVideoDetail } from '@/lib/api';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import VodDetailClient from './VodDetailClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vod = await getVideoDetail(Number(id));
  if (!vod) return { title: '视频详情 - 喵喵影视' };
  return {
    title: `${vod.vod_name} - 喵喵影视`,
    description: vod.vod_blurb || vod.vod_content || `在线观看 ${vod.vod_name}`,
  };
}

export default async function VodDetailPage({ params }: Props) {
  const { id } = await params;
  const vod = await getVideoDetail(Number(id));

  if (!vod) notFound();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col">
      <Header />
      <VodDetailClient vod={vod} />
    </div>
  );
}
