'use client';

import { Channel } from '@/types';
import { useState } from 'react';
// We'll import VideoPlayer dynamically to avoid SSR issues with hls.js if needed, 
// but since we using 'use client', standard import is fine.
// Actually, hls.js might access window which breaks SSR.
// Let's use dynamic import for VideoPlayer just in case.
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(() => import('./VideoPlayer'), { ssr: false });

interface ChannelListProps {
    channels: Channel[];
}

export default function ChannelList({ channels }: ChannelListProps) {
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

    // Group channels
    const groups = channels.reduce((acc, channel) => {
        const group = channel.group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(channel);
        return acc;
    }, {} as Record<string, Channel[]>);

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8">
            {selectedChannel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
                        <div className="relative aspect-video w-full bg-black">
                            <VideoPlayer url={selectedChannel.url} poster={selectedChannel.logo} />
                        </div>
                        <div className="p-4 flex justify-between items-center bg-zinc-900">
                            <h2 className="text-xl font-bold text-white truncate pr-4">{selectedChannel.name}</h2>
                            <button
                                onClick={() => setSelectedChannel(null)}
                                className="p-2 bg-zinc-800 text-white rounded-full hover:bg-zinc-700 transition-colors shrink-0"
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>
                    {/* Click outside to close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setSelectedChannel(null)} />
                </div>
            )}

            {Object.entries(groups).map(([groupName, groupChannels]) => (
                <section key={groupName} className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800 pb-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {groupName}
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                            {groupChannels.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {groupChannels.map((channel) => (
                            <div
                                key={channel.id}
                                onClick={() => setSelectedChannel(channel)}
                                className="group relative cursor-pointer overflow-hidden rounded-lg bg-white dark:bg-zinc-900 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100 dark:border-zinc-800"
                            >
                                <div className="aspect-video w-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden relative">
                                    {channel.logo ? (
                                        <div className="w-full h-full relative">
                                            {/* Use next/image if domain is configured, else standard img */}
                                            {/* Since domain is unknown, standard img is safer */}
                                            <img
                                                src={channel.logo}
                                                alt={channel.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                                                loading="lazy"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                            <div className="hidden absolute inset-0 flex items-center justify-center text-gray-400">
                                                <span className="text-4xl">📺</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-4xl text-gray-400">📺</span>
                                    )}

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={channel.name}>
                                        {channel.name}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
