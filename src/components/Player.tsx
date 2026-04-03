'use client';

import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface PlayerProps {
  url: string;
  autoplay?: boolean;
}

export default function Player({ url, autoplay = true }: PlayerProps) {
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let art: Artplayer | null = null;
    let hls: Hls | null = null;

    if (artRef.current && url) {
      art = new Artplayer({
        container: artRef.current,
        url: url,
        autoplay: autoplay,
        volume: 0.5,
        isLive: true,
        muted: false,
        theme: '#e11d48',
        fullscreen: true,
        setting: true,
        customType: {
          m3u8: function (video: HTMLMediaElement, url: string, art: Artplayer) {
            if (Hls.isSupported()) {
              if (hls) hls.destroy();
              hls = new Hls();
              hls.loadSource(url);
              hls.attachMedia(video);
              
              hls.on(Hls.Events.ERROR, (event, data) => {
                 if (data.fatal) {
                    switch (data.type) {
                       case Hls.ErrorTypes.NETWORK_ERROR:
                          hls?.startLoad();
                          break;
                       case Hls.ErrorTypes.MEDIA_ERROR:
                          hls?.recoverMediaError();
                          break;
                       default:
                          hls?.destroy();
                          break;
                    }
                 }
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
            } else {
              art.notice.show = 'Unsupported video format';
            }
          },
        },
      });
      
      art.on('error', (e) => {
         console.warn('ArtPlayer Error:', e);
         // Try to load again or show graceful message
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (art) {
        art.destroy(false);
      }
    };
  }, [url]);

  return <div ref={artRef} className="w-full h-full" />;
}
