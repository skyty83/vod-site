'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
    url: string;
    poster?: string;
}

export default function VideoPlayer({ url, poster }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls: Hls | null = null;

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = url;
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [url]);

    return (
        <video
            ref={videoRef}
            controls
            className="w-full h-full aspect-video bg-black rounded-lg object-contain"
            poster={poster}
        />
    );
}
