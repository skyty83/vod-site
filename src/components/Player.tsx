'use client';

import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import PlayerType from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface PlayerProps {
  url: string;
  autoplay?: boolean;
  isLive?: boolean;
  onEnded?: () => void;
}

export default function Player({ url, autoplay = true, isLive = true, onEnded }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerType | null>(null);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    if (!containerRef.current) return;

    const videoElement = document.createElement('video-js');
    videoElement.classList.add('video-js', 'vjs-big-play-centered');
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('crossorigin', 'anonymous');
    containerRef.current.appendChild(videoElement);

    // Register custom Chinese language for video.js
    videojs.addLanguage('zh', {
      "The media could not be loaded, either because the server or network failed or because the format is not supported.": "视频无法加载。可能是服务器无响应，或由于浏览器安全策略(CORS)导致被拦截。",
      "A network error caused the media download to fail part-way.": "网络错误导致视频下载中途失败。",
      "The media playback was aborted due to a corruption problem or because the media used features your browser did not support.": "由于视频文件损坏或浏览器不支持该格式，播放已终止。",
      "No compatible source was found for this media.": "未找到兼容的视频源。"
    });

    const player = videojs(videoElement, {
      autoplay: autoplay,
      controls: true,
      preload: 'auto',
      controlBar: {
        skipButtons: {
          forward: 10,
          backward: 10
        },
        children: [
          'progressControl',
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'timeDivider',
          'durationDisplay',
          'customControlSpacer',
          'fullscreenToggle',
        ],
      },
      responsive: true,
      fill: true,
      language: 'zh', // Set language to our custom Chinese
      html5: {
        vhs: {
          overrideNative: !videojs.browser.IS_SAFARI, // Safari handles HLS better natively
          enableLowInitialPlaylist: true,
          limitRenditionByPlayerDimensions: false,
          useDevicePixelRatio: true,
          smoothQualityChange: true,
          fastQualityChange: true,
          allowSeeksWithinUnsafeLiveWindow: true,
          withCredentials: false,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false
      },
      userActions: {
        hotkeys: true,
        doubleClick: true
      }
    });

    playerRef.current = player;

    player.on('ended', () => {
      if (onEndedRef.current) onEndedRef.current();
    });

    player.on('error', () => {
      console.warn('Video.js error:', player.error());
    });

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (player && url) {
      // Determine source type based on URL or isLive flag
      let type = 'video/mp4';
      if (url.includes('.m3u8') || url.includes('.m3u') || isLive) {
        type = 'application/x-mpegURL';
      }

      player.src({
        src: url,
        type: type
      });

      player.load();

      if (autoplay) {
        const playPromise = player.play();
        if (playPromise !== undefined) {
          playPromise.catch((e: Error) => {
            console.log('Autoplay prevented or playback failed:', e.message);
          });
        }
      }
    }
  }, [url, autoplay, isLive]);

  return (
    <div className="vodPlayer relative h-full w-full overflow-hidden bg-black shadow-lg ring-1 ring-white/10" data-vjs-player>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="group relative flex h-full w-full items-center justify-center overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 to-transparent" />

      </div>

      <style jsx global>{`
        .vodPlayer .video-js {
          width: 100% !important;
          height: 100% !important;
          border-radius: 1rem;
          overflow: hidden;
          background-color: transparent;
        }

        .vodPlayer .vjs-tech {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%);
        }

        .vodPlayer .vjs-poster {
          background-size: contain;
        }

        .vodPlayer .vjs-control-bar {
          height: 4.5rem !important;
          background: transparent !important;
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          padding: 0 1rem 0.5rem 1rem !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Progress Bar - Top Full Width */
        .vodPlayer .vjs-progress-control {
          width: 100% !important;
          height: 24px !important;
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
        }

        .vodPlayer .vjs-progress-holder {
          height: 4px !important;
          margin: 0 !important;
          width: 100% !important;
        }

        /* Lower Controls Row Container */
        .vodPlayer .vjs-control-bar > * {
          height: 2rem !important;
          position: relative !important;
          top: auto !important;
          bottom: auto !important;
          display: flex !important;
          align-items: center !important;
        }

        .vodPlayer .vjs-control-bar > .vjs-control:not(.vjs-progress-control) {
          justify-content: center !important;
        }

        /* Custom spacing for the bottom row */
        .vodPlayer .vjs-play-toggle { width: 3.5rem !important; }
        .vodPlayer .vjs-volume-panel { width: 8rem !important; }
        .vodPlayer .vjs-fullscreen-toggle { width: 3.5rem !important; }

        .vodPlayer .vjs-current-time,
        .vodPlayer .vjs-duration,
        .vodPlayer .vjs-time-divider {
          font-size: 0.9rem !important;
          padding: 0 3px !important;
          min-width: auto !important;
          width: auto !important;
        }

        .vodPlayer .vjs-custom-control-spacer {
          flex: 1 !important;
          display: block !important;
        }

        .vodPlayer .vjs-button > .vjs-icon-placeholder:before {
          font-size: 1.6rem !important;
          line-height: 2rem !important;
          position: relative !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vodPlayer .vjs-volume-panel {
          display: flex !important;
          align-items: center !important;
        }
        
        .vodPlayer .vjs-volume-panel .vjs-volume-control {
          display: flex !important;
          align-items: center !important;
        }

        .vodPlayer .vjs-duration {
          color: rgba(255, 255, 255, 0.5);
        }

        .vodPlayer .vjs-custom-control-spacer {
          display: flex !important;
          flex: 1 !important;
        }

        .vodPlayer .vjs-big-play-button {
          border: 0;
          border-radius: 9999px;
          width: 5.5rem;
          height: 5.5rem;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #ff0000 0%, #ff0080 50%, #7928ca 100%);
          box-shadow: 0 0 45px rgba(255, 0, 128, 0.5);
          backdrop-filter: blur(4px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          margin: 0;
        }

        .vodPlayer .vjs-big-play-button:hover {
          transform: translate(-50%, -50%) scale(1.15);
          box-shadow: 0 0 60px rgba(255, 0, 128, 0.7);
          filter: brightness(1.1);
        }

        .vodPlayer .vjs-big-play-button .vjs-icon-placeholder:before {
          font-size: 2.8rem;
          line-height: 5.5rem;
        }

        .vodPlayer .vjs-slider {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .vodPlayer .vjs-play-progress {
          background: linear-gradient(90deg, #ff0000 0%, #ff0080 50%, #7928ca 100%) !important;
          border-radius: 3px;
        }

        .vodPlayer .vjs-play-progress:before {
          display: block !important;
          color: #fff;
          font-size: 1.3rem !important;
          top: -5px !important;
          text-shadow: 0 0 10px rgba(0,0,0,0.5);
        }

        .vodPlayer .vjs-load-progress div {
          background: rgba(255, 255, 255, 0.3);
        }

        .vodPlayer .vjs-volume-level {
          background: linear-gradient(90deg, #ff0000 0%, #ff0080 100%) !important;
        }

        .vodPlayer .vjs-live-control {
          color: rgba(255, 255, 255, 0.85);
        }

        .vodPlayer .vjs-error-display {
          border-radius: 1rem;
        }
      `}</style>
    </div>
  );
}
