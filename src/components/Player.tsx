'use client';

import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface PlayerProps {
  url: string;
  autoplay?: boolean;
  isLive?: boolean;
}

export default function Player({ url, autoplay = true, isLive = true }: PlayerProps) {
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
        isLive: isLive,
        muted: false,
        theme: '#e11d48',
        fullscreen: true,
        fullscreenWeb: true,
        pip: true,
        setting: true,
        playbackRate: true,
        aspectRatio: true,
        hotkey: true,
        playsInline: true,
        autoSize: false,
        autoMini: true,
        miniProgressBar: true,
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
        hls.stopLoad();
        hls.detachMedia();
        hls.destroy();
        hls = null;
      }
      if (art) {
        if (art.video) {
          art.video.muted = true;
          art.video.pause();
          art.video.removeAttribute('src');
          art.video.load();
        }
        art.destroy(true);
        art = null;
      }
    };
  }, [url]);

  return <div ref={artRef} className="w-full h-full" />;
}
