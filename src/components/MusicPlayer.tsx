'use client';

import { useState, useEffect, useRef } from 'react';
import { useMusic } from '@/context/MusicContext';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, X, Disc3, Loader2, AlertCircle, Music4
} from 'lucide-react';
import Image from 'next/image';

export default function MusicPlayer() {
  const { currentSong, isPlaying, setIsPlaying } = useMusic();
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch play URL when song changes
  useEffect(() => {
    if (!currentSong) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setPlayUrl(null);
      setError(null);
      setQuality('');
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      try {
        const res = await fetch(`/api/music/vkey?mid=${encodeURIComponent(currentSong.mid)}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.url) {
          setPlayUrl(data.url);
          setQuality(data.quality || '');
          setIsPreview(data.preview === true);
        } else {
          setError('版权限制，无法播放此曲目');
        }
      } catch {
        if (!cancelled) setError('网络错误，请稍后再试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentSong]);

  // Set src via ref (avoids empty-string warning)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playUrl) {
      audio.src = playUrl;
      audio.volume = muted ? 0 : volume;
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } else {
      audio.removeAttribute('src');
      audio.load();
    }
  }, [playUrl]);

  // Sync play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !playUrl) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying]);

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);
    setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const fmt = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const albumMid = currentSong.album?.mid;
  const thumbUrl = albumMid ? `https://y.gtimg.cn/music/photo_new/T002R500x500M000${albumMid}.jpg` : null;
  const singerNames = currentSong.singer?.map(s => s.name).join(' / ') ?? '';

  const qualityColor =
    quality === 'Lossless' ? 'from-cyan-400 to-blue-500' :
    quality === 'HiRes'    ? 'from-emerald-400 to-teal-500' :
    quality === 'Preview'  ? 'from-orange-400 to-amber-500' :
                             'from-slate-500 to-slate-600';

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
      />

      {/* ── PLAYER BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 select-none">

        {/* Seek bar — full width, sits above bar */}
        <div
          className="h-1 w-full bg-white/10 cursor-pointer group relative"
          onClick={seek}
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative transition-none"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg scale-0 group-hover:scale-100 transition-transform" />
          </div>
        </div>

        {/* Glass bar */}
        <div className="bg-[#0d0f17]/90 backdrop-blur-2xl border-t border-white/[0.06] shadow-[0_-4px_40px_rgba(0,0,0,0.8)]">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-20 flex items-center gap-4 sm:gap-8">

            {/* ── LEFT: Album + Song info ── */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {/* Album art */}
              <div className="relative shrink-0 w-13 h-13 sm:w-14 sm:h-14">
                <div className="w-full h-full rounded-xl overflow-hidden bg-white/5 border border-white/10 shadow-lg">
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl} alt={currentSong.name} fill
                      className={`object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 size={22} className="text-white/20" />
                    </div>
                  )}
                </div>
                {/* Vinyl ring */}
                {isPlaying && (
                  <div className="absolute inset-0 rounded-xl ring-2 ring-purple-500/20 animate-spin-slow pointer-events-none" />
                )}
              </div>

              {/* Text */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-black text-sm sm:text-base truncate max-w-[180px] sm:max-w-xs">
                    {currentSong.name}
                  </p>
                  {quality && (
                    <span className={`hidden sm:inline-flex text-[9px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r ${qualityColor} text-white/90 tracking-widest uppercase`}>
                      {quality === 'Preview' ? '30s' : quality}
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs sm:text-sm truncate mt-0.5">{singerNames}</p>
              </div>
            </div>

            {/* ── CENTER: Controls ── */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-5 sm:gap-7">
                <button className="text-white/30 hover:text-white/70 transition-colors hidden sm:block"
                  onClick={() => {}}>
                  <SkipBack size={20} fill="currentColor" />
                </button>

                <button
                  onClick={() => { if (!loading && playUrl) setIsPlaying(!isPlaying); }}
                  disabled={loading || !!error}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
                >
                  {loading    ? <Loader2 size={22} className="animate-spin" /> :
                   error      ? <AlertCircle size={22} /> :
                   isPlaying  ? <Pause size={22} fill="currentColor" /> :
                                <Play  size={22} fill="currentColor" className="ml-0.5" />}
                </button>

                <button className="text-white/30 hover:text-white/70 transition-colors hidden sm:block"
                  onClick={() => {}}>
                  <SkipForward size={20} fill="currentColor" />
                </button>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/20 hidden sm:flex">
                <span>{fmt(currentTime)}</span>
                <span>/</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* ── RIGHT: Volume + Close ── */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              {/* Error pill */}
              {error && (
                <span className="hidden md:flex items-center gap-1.5 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-full">
                  <AlertCircle size={12} />
                  {error}
                </span>
              )}

              {/* Volume */}
              <div className="hidden md:flex items-center gap-2.5">
                <button onClick={() => setMuted(!muted)} className="text-white/40 hover:text-white/70 transition-colors">
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.02}
                  value={muted ? 0 : volume}
                  onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
                  className="w-20 accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Close */}
              <button
                onClick={() => { setIsPlaying(false); setPlayUrl(null); setError(null); }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white/70 transition-all"
              >
                <X size={16} />
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
