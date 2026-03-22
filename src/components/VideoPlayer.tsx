'use client';

import { useEffect, useRef, useState } from 'react';
import { PlaySource } from '@/types';
import { Play, Loader } from 'lucide-react';

interface VideoPlayerProps {
  sources: PlaySource[];
}

export default function VideoPlayer({ sources }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeSource, setActiveSource] = useState(1);
  const [activeEpisode, setActiveEpisode] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const currentSource = sources[activeSource];
  const currentEpisode = currentSource?.episodes[activeEpisode];
  const currentUrl = currentEpisode?.url || '';

  useEffect(() => {
    if (!currentUrl || !videoRef.current) return;

    setLoading(true);
    setError(false);

    const video = videoRef.current;

    const loadVideo = async () => {
      try {
        // Check if it's HLS
        if (currentUrl.includes('.m3u8')) {
          const Hls = (await import('hls.js')).default;
          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
            });
            hls.loadSource(currentUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setLoading(false);
              video.play().catch(() => { });
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) {
                setError(true);
                setLoading(false);
              }
            });
            return () => hls.destroy();
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = currentUrl;
            video.addEventListener('loadedmetadata', () => {
              setLoading(false);
              video.play().catch(() => { });
            });
          }
        } else {
          // Regular video
          video.src = currentUrl;
          video.addEventListener('loadedmetadata', () => setLoading(false));
          video.play().catch(() => { });
        }
      } catch {
        setError(true);
        setLoading(false);
      }
    };

    const cleanup = loadVideo();
    return () => {
      video.src = '';
      void cleanup;
    };
  }, [currentUrl]);

  const pillClasses = "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 cursor-pointer flex-shrink-0";
  const activeClasses = "bg-gradient-to-br from-blue-500 to-rose-500 text-white shadow-md shadow-blue-500/20 border-transparent";
  const inactiveClasses = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300";

  if (!sources.length || !currentSource?.episodes.length) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center gap-4 shadow-inner border border-slate-800">
        <Play size={56} className="text-white/20" />
        <p className="text-white/40 font-medium tracking-widest text-sm">暂无播放源</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Player */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 mx-auto">
        {loading && (
          <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <Loader size={48} className="text-blue-500 animate-spin" />
            <p className="text-white/60 text-sm font-medium tracking-widest">视频加载中...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-10 bg-black/95 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-rose-400 font-medium">播放失败，请尝试切换线路</p>
          </div>
        )}

        <video
          ref={videoRef}
          controls
          className="w-full h-full object-contain bg-black"
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
        />
      </div>

      <div className="flex flex-col gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm">
        {/* Source Selector */}
        {sources.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider w-12 flex-shrink-0">
              线路
            </div>
            {sources.map((src, i) => (
              <button
                key={i}
                onClick={() => { setActiveSource(i); setActiveEpisode(0); }}
                className={`${pillClasses} ${activeSource === i ? activeClasses : inactiveClasses}`}
              >
                {src.name || `线路${i + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Separator if both exist */}
        {sources.length > 1 && currentSource.episodes.length > 1 && (
          <div className="h-px w-full bg-slate-200 dark:bg-slate-800/60 my-1"></div>
        )}

        {/* Episode Selector */}
        {currentSource.episodes.length > 1 && (
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-3">
              选集 ({currentSource.episodes.length})
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
              {currentSource.episodes.map((ep, i) => (
                <button
                  key={i}
                  onClick={() => setActiveEpisode(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeEpisode === i
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {ep.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
