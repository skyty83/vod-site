'use client';

import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface PlayerProps {
  url: string;
  autoplay?: boolean;
  isLive?: boolean;
}

function normalizeUrl(input: string) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return trimmed;
}

function detectArtType(u: string): 'm3u8' | undefined {
  const lower = (u || '').toLowerCase();
  if (!lower) return undefined;
  if (lower.includes('.m3u8') || lower.includes('m3u8')) return 'm3u8';
  return undefined;
}

export default function Player({ url, autoplay = true, isLive = true }: PlayerProps) {
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let art: Artplayer | null = null;
    let hls: Hls | null = null;

    const normalizedUrl = normalizeUrl(url);
    const forcedType = detectArtType(normalizedUrl);

    if (artRef.current && normalizedUrl) {
      art = new Artplayer({
        container: artRef.current,
        url: normalizedUrl,
        ...(forcedType ? { type: forcedType } : {}),
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
              video.load();
            } else {
              video.removeAttribute('src');
              video.load();
              const notice = (art as unknown as { notice?: { show?: ((msg: string) => void) | string } }).notice;
              if (notice) {
                if (typeof notice.show === 'function') notice.show('Unsupported video format');
                else notice.show = 'Unsupported video format';
              }
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
