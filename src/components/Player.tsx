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

    const videoElement = document.createElement("video-js");
    videoElement.classList.add('vjs-big-play-centered');
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
      responsive: true,
      fluid: true,
      liveui: isLive,
      language: 'ko', // Set language to our custom Korean
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          limitRenditionByPlayerDimensions: false,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false
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
    <>
      <div className="w-full h-full relative" data-vjs-player>
        <div ref={containerRef} className="w-full h-full" />
      </div>
      <style jsx global>{`
        .video-js {
          width: 100% !important;
          height: 100% !important;
          background-color: #000;
        }
        .vjs-fluid {
           padding-top: 0 !important;
        }
        .video-js .vjs-tech {
           object-fit: contain;
        }
        .video-js .vjs-error-display .vjs-modal-dialog-content {
          font-size: 1.1rem;
          color: #f43f5e;
          font-weight: bold;
          padding: 2rem;
        }
        .video-js .vjs-big-play-button {
          background-color: rgba(225, 29, 72, 0.8) !important;
          border-color: transparent !important;
          border-radius: 50% !important;
          width: 2.5em !important;
          height: 2.5em !important;
          line-height: 2.3em !important;
          margin-top: -1.25em !important;
          margin-left: -1.25em !important;
        }
        .video-js:hover .vjs-big-play-button {
           background-color: rgba(225, 29, 72, 1) !important;
        }
        .video-js .vjs-control-bar {
          background-color: rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(10px);
        }
        .video-js .vjs-play-progress, .video-js .vjs-volume-level {
          background-color: #e11d48 !important;
        }
        .video-js .vjs-load-progress div {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }
        .video-js .vjs-slider {
          background-color: rgba(255, 255, 255, 0.1) !important;
        }
      `}</style>
    </>
  );
}
