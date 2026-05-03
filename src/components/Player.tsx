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
      controlBar: {
        skipButtons: {
          forward: 10,
          backward: 10
        }
      },
      responsive: true,
      fluid: true,
      liveui: isLive,
      language: 'ko', // Set language to our custom Korean
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          limitRenditionByPlayerDimensions: false,
          useDevicePixelRatio: true,
          smoothQualityChange: true,
          fastQualityChange: true,
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
        /* Container */
        .video-js {
          width: 100% !important;
          height: 100% !important;
          background-color: #000;
          font-family: var(--font-sans), sans-serif;
        }
        .vjs-fluid {
           padding-top: 0 !important;
        }
        .video-js .vjs-tech {
           object-fit: contain;
        }
        
        /* Error Display */
        .video-js .vjs-error-display .vjs-modal-dialog-content {
          font-size: 1.1rem;
          color: var(--secondary, #f43f5e);
          font-weight: bold;
          padding: 2rem;
          background: rgba(17, 20, 29, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Big Play Button - Premium Style */
        .video-js .vjs-big-play-button {
          background: rgba(17, 20, 29, 0.5) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 50% !important;
          width: 3.5em !important;
          height: 3.5em !important;
          line-height: 3.4em !important;
          margin-top: -1.75em !important;
          margin-left: -1.75em !important;
          color: #fff !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
        }

        .video-js:hover .vjs-big-play-button {
           background: linear-gradient(135deg, #3b82f6, #f43f5e) !important;
           border-color: transparent !important;
           transform: scale(1.15);
           box-shadow: 0 0 25px rgba(244, 63, 94, 0.5) !important;
        }

        .video-js .vjs-big-play-button .vjs-icon-placeholder:before {
          font-size: 2em;
          transition: transform 0.3s ease;
        }
        
        .video-js:hover .vjs-big-play-button .vjs-icon-placeholder:before {
          transform: scale(1.05);
        }

        /* Control Bar - Glassmorphism */
        .video-js .vjs-control-bar {
          background: rgba(17, 20, 29, 0.6) !important; /* var(--card-bg) */
          backdrop-filter: blur(12px) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
          height: 3.5em !important;
          display: flex !important;
          align-items: center !important;
          padding: 0 0.5em !important;
          bottom: 0 !important;
        }

        /* Progress Bar */
        .video-js .vjs-progress-control {
          position: absolute;
          top: -10px;
          left: 0;
          right: 0;
          width: 100%;
          height: 10px;
        }
        
        .video-js .vjs-progress-holder {
          margin: 0 !important;
          height: 4px !important;
          transition: height 0.2s ease;
        }
        
        .video-js .vjs-progress-control:hover .vjs-progress-holder {
          height: 8px !important;
        }

        .video-js .vjs-play-progress {
          background: linear-gradient(90deg, #3b82f6, #f43f5e) !important; /* accent to secondary */
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
        }
        
        .video-js .vjs-play-progress:before {
          color: #fff !important;
          text-shadow: 0 0 5px rgba(244, 63, 94, 0.8) !important;
          font-size: 1.2em !important;
          top: -0.4em !important;
        }

        .video-js .vjs-load-progress div {
          background: rgba(255, 255, 255, 0.15) !important;
        }

        .video-js .vjs-slider {
          background-color: rgba(255, 255, 255, 0.05) !important;
          border-radius: 2px;
        }

        /* Volume Level */
        .video-js .vjs-volume-level {
          background: #3b82f6 !important; /* accent */
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.6) !important;
        }
        
        /* Buttons */
        .video-js .vjs-button > .vjs-icon-placeholder:before {
          font-size: 1.6em;
          line-height: 2.2;
          transition: all 0.2s ease;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .video-js .vjs-button:hover > .vjs-icon-placeholder:before {
          color: #fff;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
          transform: scale(1.1);
        }

        /* Time Text */
        .video-js .vjs-time-control {
          color: rgba(255, 255, 255, 0.8) !important;
          font-size: 0.9em !important;
          line-height: 3.8em !important;
          font-weight: 500;
        }
        
        /* Tooltips */
        .video-js .vjs-mouse-display .vjs-time-tooltip,
        .video-js .vjs-play-progress .vjs-time-tooltip {
          background: rgba(17, 20, 29, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 4px !important;
          color: #fff !important;
          font-family: var(--font-sans);
          font-weight: 600;
        }
      `}</style>
    </>
  );
}
