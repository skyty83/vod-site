import ChannelList from '@/components/ChannelList';
import { getChannels } from '@/lib/api';

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const channels = await getChannels();

  return (
    <div className="flex flex-col min-h-screen">
      <ChannelList channels={channels} />
    </div>
  );
}
