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

    // Register custom Korean language for video.js
    videojs.addLanguage('ko', {
      "The media could not be loaded, either because the server or network failed or because the format is not supported.": "원본 방송 서버 응답이 없거나, 브라우저 보안(CORS)으로 인해 차단된 채널입니다.",
      "A network error caused the media download to fail part-way.": "네트워크 오류로 영상 다운로드가 중단되었습니다.",
      "The media playback was aborted due to a corruption problem or because the media used features your browser did not support.": "미디어 파일이 손상되었거나 브라우저에서 지원하지 않는 형식입니다.",
      "No compatible source was found for this media.": "호환되는 소스를 찾을 수 없습니다."
    });

    const player = videojs(videoElement, {
      autoplay: autoplay,
      controls: true,
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
          'liveDisplay',
          'fullscreenToggle',
        ],
      },
      responsive: true,
      fill: true,
      liveui: isLive,
      language: 'ko', // Set language to our custom Korean
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
    <div className="vodPlayer relative h-full w-full overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-white/10" data-vjs-player>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="group relative flex h-full w-full items-center justify-center overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />

        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/65 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

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
          background: linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.2));
          backdrop-filter: blur(6px);
        }

        .vodPlayer .vjs-big-play-button {
          border: 0;
          border-radius: 9999px;
          width: 4rem;
          height: 4rem;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #ff0000 0%, #ff0080 50%, #7928ca 100%);
          box-shadow: 0 0 30px rgba(255, 0, 128, 0.4);
          backdrop-filter: blur(4px);
          transition: all 0.2s ease;
          margin: 0;
        }

        .vodPlayer .vjs-big-play-button:hover {
          transform: translate(-50%, -50%) scale(1.1);
          box-shadow: 0 0 40px rgba(255, 0, 128, 0.6);
          filter: brightness(1.1);
        }

        .vodPlayer .vjs-big-play-button .vjs-icon-placeholder:before {
          font-size: 2rem;
          line-height: 4rem;
        }

        .vodPlayer .vjs-slider {
          background-color: rgba(255, 255, 255, 0.18);
        }

        .vodPlayer .vjs-play-progress {
          background: linear-gradient(to right, lab(56.101 79.4329 31.4532) 0%, lab(52.0183 66.11 -78.2316) 50%, lab(54.1736 13.3368 -74.6839) 100%) !important;
        }

        .vodPlayer .vjs-play-progress:before {
          display: block !important;
          color: #fff;
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
