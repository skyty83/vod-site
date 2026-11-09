'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Hls from 'hls.js';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  SkipForward,
  TriangleAlert,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getProgress, readPrefs, saveProgress, writePrefs } from '@/lib/progress';

/*
 * 自研播放器: 原生 <video> + hls.js, 控件全部自己画。
 *  - m3u8 直连失败 (多为 CORS) 时自动切到 /api/proxy/m3u8 重试一次, 并保持播放位置
 *  - 断点续播 (按剧集), 记住音量 / 倍速
 *  - 画质切换 (hls 多码率时), 倍速, 画中画, 全屏
 *  - 键盘: 空格/K 播放, ←/→ 5 秒, J/L 10 秒, ↑/↓ 音量, F 全屏, M 静音, 0-9 跳转, Shift+N 下一集
 *  - 触屏: 单击显示/隐藏控件, 双击左右两侧快退/快进 10 秒
 *  - 播完自动倒计时进入下一集
 */

export interface PlayerProps {
  url: string;
  title?: string;
  subtitle?: string;
  poster?: string;
  autoplay?: boolean;
  /** 断点续播的键, 默认用 url */
  resumeKey?: string;
  next?: { label: string; go: () => void } | null;
}

type Osd = { id: number; kind: 'play' | 'pause' | 'back' | 'fwd' | 'vol' | 'mute' | 'rate'; text?: string };
type Menu = null | 'main' | 'rate' | 'quality';
type LevelInfo = { index: number; height: number; bitrate: number };

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const AUTO_NEXT_SECONDS = 6;
const noopSubscribe = () => () => {};

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const proxify = (u: string) => `/api/proxy/m3u8?url=${encodeURIComponent(u)}`;
const isHlsUrl = (u: string) => /\.m3u8?(\?|#|$)/i.test(u) || u.includes('.m3u8');

export default function Player({ url, title, subtitle, poster, autoplay = true, resumeKey, next }: PlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const tapTimer = useRef<number | undefined>(undefined);
  const lastTap = useRef(0);
  const lastPointer = useRef<string>('mouse');
  const lastSave = useRef(0);
  const nextRef = useRef(next);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [level, setLevel] = useState(-1);
  const [autoHeight, setAutoHeight] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [active, setActive] = useState(true);
  const [menu, setMenu] = useState<Menu>(null);
  const [osd, setOsd] = useState<Osd | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const pipSupported = mounted && !!document.pictureInPictureEnabled;

  useEffect(() => {
    nextRef.current = next;
  }, [next]);

  // 换集时在渲染阶段重置状态 (同一个 <video> 继续复用, 全屏不会被打断)
  const [loadedUrl, setLoadedUrl] = useState(url);
  if (loadedUrl !== url) {
    setLoadedUrl(url);
    setTime(0);
    setDuration(0);
    setBuffered(0);
    setLevels([]);
    setLevel(-1);
    setAutoHeight(0);
    setWaiting(true);
    setError(null);
    setEnded(false);
    setCountdown(null);
    setToast(null);
  }

  // ── 加载片源 ────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    const key = resumeKey ?? url;
    const hlsMode = isHlsUrl(url) && Hls.isSupported();
    let hls: Hls | null = null;
    let disposed = false;
    let proxied = false;
    let mediaRetries = 0;
    let seekTo = getProgress(key);
    let announce = seekTo > 0;

    const fail = (msg: string) => {
      if (!disposed) setError(msg);
    };

    const onMeta = () => {
      if (seekTo > 0 && video.duration && seekTo < video.duration - 15) {
        video.currentTime = seekTo;
        if (announce) setToast(`已从 ${fmt(seekTo)} 继续播放`);
      }
      seekTo = 0;
      announce = false;
    };

    const tryPlay = () => {
      if (autoplay && !disposed) video.play().catch(() => setWaiting(false));
    };

    // 直连失败 → 走服务端代理重试一次, 保留当前进度
    const retryViaProxy = () => {
      if (proxied || !isHlsUrl(url)) return false;
      proxied = true;
      if (video.currentTime > 1) seekTo = video.currentTime;
      start(proxify(url));
      return true;
    };

    const start = (src: string) => {
      if (hlsMode) {
        hls?.destroy();
        const h = new Hls({ enableWorker: true, maxBufferLength: 45, backBufferLength: 90 });
        hls = h;
        hlsRef.current = h;
        h.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
          setLevels(data.levels.map((l, index) => ({ index, height: l.height, bitrate: l.bitrate })));
          tryPlay();
        });
        h.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setAutoHeight(h.levels[data.level]?.height ?? 0));
        h.on(Hls.Events.ERROR, (_e, data) => {
          if (!data.fatal || disposed) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            if (!retryViaProxy()) fail('网络错误, 视频没能加载出来');
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRetries < 2) {
            mediaRetries++;
            if (mediaRetries === 2) h.swapAudioCodec();
            h.recoverMediaError();
          } else {
            fail('播放出错, 这条线路可能已失效');
          }
        });
        h.loadSource(src);
        h.attachMedia(video);
      } else {
        video.src = src;
        video.load();
        tryPlay();
      }
    };

    const onNativeError = () => {
      if (hlsMode || disposed || !video.error) return;
      if (!retryViaProxy()) fail('视频无法加载, 可能是格式不支持或线路已失效');
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', onNativeError);
    start(url);

    return () => {
      disposed = true;
      saveProgress(key, video.currentTime, video.duration);
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', onNativeError);
      hls?.destroy();
      hlsRef.current = null;
      if (!hlsMode) {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [url, resumeKey, autoplay, reloadKey]);

  // 恢复偏好 (触发 volumechange / ratechange, 状态由事件同步)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const p = readPrefs();
    if (typeof p.volume === 'number') video.volume = clamp(p.volume, 0, 1);
    if (typeof p.muted === 'boolean') video.muted = p.muted;
    if (typeof p.rate === 'number' && RATES.includes(p.rate)) {
      video.defaultPlaybackRate = p.rate;
      video.playbackRate = p.rate;
    }
  }, []);

  // ── 控件显示 / 隐藏 ─────────────────────────────────────────────────────
  const poke = useCallback(() => {
    setActive(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setActive(false), 2800);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(hideTimer.current);
    window.clearTimeout(tapTimer.current);
  }, []);

  const showUI = !playing || active || menu !== null;

  const flash = useCallback((kind: Osd['kind'], text?: string) => {
    setOsd({ id: Date.now(), kind, text });
  }, []);

  // ── 动作 ────────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play().catch(() => {});
    else v.pause();
    flash(v.paused ? 'pause' : 'play');
  }, [flash]);

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v || !Number.isFinite(v.duration)) return;
      v.currentTime = clamp(v.currentTime + delta, 0, v.duration);
      flash(delta < 0 ? 'back' : 'fwd', `${Math.abs(delta)} 秒`);
    },
    [flash]
  );

  const changeVolume = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.volume = clamp(Math.round((v.volume + delta) * 20) / 20, 0, 1);
      v.muted = v.volume === 0;
      flash(v.muted ? 'mute' : 'vol', `${Math.round(v.volume * 100)}%`);
    },
    [flash]
  );

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.5;
    flash(v.muted ? 'mute' : 'vol', v.muted ? '静音' : `${Math.round(v.volume * 100)}%`);
  }, [flash]);

  const setPlaybackRate = (r: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.defaultPlaybackRate = r;
    v.playbackRate = r;
    flash('rate', `${r}x`);
  };

  const setQuality = (idx: number) => {
    const h = hlsRef.current;
    if (!h) return;
    h.currentLevel = idx;
    setLevel(idx);
  };

  const toggleFullscreen = useCallback(() => {
    const root = rootRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
      else doc.webkitExitFullscreen?.();
      return;
    }
    if (root?.requestFullscreen) {
      root
        .requestFullscreen()
        .then(() => {
          // 手机上全屏后尝试锁定横屏, 不支持就算了
          const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
          if (window.matchMedia('(pointer: coarse)').matches) o.lock?.('landscape').catch(() => {});
        })
        .catch(() => {});
    } else if (root?.webkitRequestFullscreen) root.webkitRequestFullscreen();
    else video?.webkitEnterFullscreen?.(); // iOS Safari
  }, []);

  const togglePip = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      /* 用户拒绝或不支持 */
    }
  };

  useEffect(() => {
    const onChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      setFullscreen((doc.fullscreenElement ?? doc.webkitFullscreenElement) === rootRef.current);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  // ── 键盘 ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const root = rootRef.current;
      if (!root) return;
      const inside = root.contains(target);
      // 焦点在页面其它可交互元素上时不抢按键
      if (!inside && target !== document.body) return;
      if (inside && (e.key === ' ' || e.key === 'Enter') && target.closest('button')) return;

      const v = videoRef.current;
      let handled = true;
      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          togglePlay();
          break;
        case 'ArrowLeft':
          seekBy(-5);
          break;
        case 'ArrowRight':
          seekBy(5);
          break;
        case 'j':
        case 'J':
          seekBy(-10);
          break;
        case 'l':
        case 'L':
          seekBy(10);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          // 焦点不在播放器上时保留页面滚动
          if (!inside && !fullscreen) handled = false;
          else changeVolume(e.key === 'ArrowUp' ? 0.05 : -0.05);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'N':
          if (e.shiftKey && nextRef.current) nextRef.current.go();
          else handled = false;
          break;
        default:
          if (/^[0-9]$/.test(e.key) && v && Number.isFinite(v.duration)) {
            v.currentTime = (v.duration * Number(e.key)) / 10;
          } else handled = false;
      }
      if (handled) {
        e.preventDefault();
        poke();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [togglePlay, seekBy, changeVolume, toggleFullscreen, toggleMute, poke, fullscreen]);

  // ── 系统媒体控制 (锁屏 / 耳机按键) ───────────────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: subtitle ? `${title ?? ''} ${subtitle}`.trim() : title,
      artist: '喵喵影视',
      artwork: poster ? [{ src: poster }] : [],
    });
    const set = (a: MediaSessionAction, h: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(a, h);
      } catch {
        /* 不支持的 action */
      }
    };
    set('seekbackward', () => seekBy(-10));
    set('seekforward', () => seekBy(10));
    set('nexttrack', next ? () => nextRef.current?.go() : null);
    return () => {
      set('seekbackward', null);
      set('seekforward', null);
      set('nexttrack', null);
    };
  }, [title, subtitle, poster, next, seekBy]);

  // ── 计时器 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      nextRef.current?.go();
      return;
    }
    const t = window.setTimeout(() => setCountdown(c => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [countdown]);

  // ── 视频事件 ────────────────────────────────────────────────────────────
  const syncBuffered = (v: HTMLVideoElement) => {
    const t = v.currentTime;
    for (let i = 0; i < v.buffered.length; i++) {
      if (v.buffered.start(i) <= t + 0.5 && v.buffered.end(i) >= t) {
        setBuffered(v.buffered.end(i));
        return;
      }
    }
    setBuffered(t);
  };

  const onTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setTime(v.currentTime);
    syncBuffered(v);
    const now = Date.now();
    if (now - lastSave.current > 5000) {
      lastSave.current = now;
      saveProgress(resumeKey ?? url, v.currentTime, v.duration);
    }
  };

  const onVolumeChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setVolume(v.volume);
    setMuted(v.muted);
    writePrefs({ volume: v.volume, muted: v.muted, rate: v.playbackRate });
  };

  const onRateChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    setRate(v.playbackRate);
    writePrefs({ volume: v.volume, muted: v.muted, rate: v.playbackRate });
  };

  const onEndedEvent = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setEnded(true);
    setPlaying(false);
    saveProgress(resumeKey ?? url, e.currentTarget.duration, e.currentTarget.duration);
    if (nextRef.current) setCountdown(AUTO_NEXT_SECONDS);
  };

  // ── 进度条拖动 ──────────────────────────────────────────────────────────
  const ratioAt = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return clamp((clientX - rect.left) / rect.width, 0, 1);
  };

  const onBarDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrub(ratioAt(e.clientX));
  };
  const onBarMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = ratioAt(e.clientX);
    if (scrub !== null) setScrub(r);
    if (e.pointerType === 'mouse' || scrub !== null) setHover(r);
  };
  const onBarUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrub === null) return;
    const v = videoRef.current;
    const r = ratioAt(e.clientX);
    if (v && Number.isFinite(v.duration)) {
      v.currentTime = r * v.duration;
      setTime(v.currentTime);
    }
    setScrub(null);
    if (e.pointerType !== 'mouse') setHover(null);
  };

  // ── 画面点击 / 触屏手势 ─────────────────────────────────────────────────
  const onSurfaceUp = (e: React.PointerEvent<HTMLDivElement>) => {
    lastPointer.current = e.pointerType;
    if (menu) {
      setMenu(null);
      return;
    }
    if (e.pointerType === 'mouse') {
      if (e.button === 0) togglePlay();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const now = Date.now();
    window.clearTimeout(tapTimer.current);
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      if (x < 0.36) seekBy(-10);
      else if (x > 0.64) seekBy(10);
      else togglePlay();
      poke();
      return;
    }
    lastTap.current = now;
    tapTimer.current = window.setTimeout(() => {
      if (showUI && playing) {
        window.clearTimeout(hideTimer.current);
        setActive(false);
      } else poke();
    }, 280);
  };

  const retry = () => {
    setError(null);
    setWaiting(true);
    setReloadKey(k => k + 1);
  };

  const replay = () => {
    const v = videoRef.current;
    if (!v) return;
    setEnded(false);
    setCountdown(null);
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  // ── 派生值 ──────────────────────────────────────────────────────────────
  const progress = scrub ?? (duration ? time / duration : 0);
  const bufferedRatio = duration ? clamp(buffered / duration, 0, 1) : 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const qualityLabel = (l?: LevelInfo) => (l ? (l.height ? `${l.height}P` : `${Math.round(l.bitrate / 1000)}K`) : '');
  const currentQuality = level === -1 ? `自动${autoHeight ? ` · ${autoHeight}P` : ''}` : qualityLabel(levels[level]);
  const showBigPlay = !playing && !waiting && !ended && !error;

  const btn =
    'grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[#c6f432]';

  return (
    <div
      ref={rootRef}
      className={`relative h-full w-full touch-manipulation select-none overflow-hidden bg-black text-white ${showUI ? '' : 'cursor-none'}`}
      onPointerMove={e => {
        if (e.pointerType === 'mouse') poke();
      }}
      onPointerLeave={e => {
        if (e.pointerType === 'mouse' && playing && !menu) setActive(false);
      }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        playsInline
        preload="auto"
        poster={poster}
        onPlay={() => {
          setPlaying(true);
          setEnded(false);
          setCountdown(null);
          poke();
        }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onLoadedData={() => setWaiting(false)}
        onTimeUpdate={onTimeUpdate}
        onProgress={e => syncBuffered(e.currentTarget)}
        onDurationChange={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
        onVolumeChange={onVolumeChange}
        onRateChange={onRateChange}
        onEnded={onEndedEvent}
      />

      {/* 手势层 */}
      <div
        className="absolute inset-0"
        onPointerUp={onSurfaceUp}
        onDoubleClick={() => {
          if (lastPointer.current === 'mouse') toggleFullscreen();
        }}
      />

      {/* 顶部标题 */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 to-transparent px-4 pb-12 pt-3 transition-opacity duration-300 sm:px-6 sm:pt-5 ${
          showUI && (fullscreen || !playing) ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="truncate text-sm font-bold text-white/95 sm:text-lg">
          {title}
          {subtitle && <span className="ml-2 text-[#c6f432]">{subtitle}</span>}
        </p>
      </div>

      {/* 加载中 */}
      {waiting && !error && !ended && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <LoaderCircle className="h-12 w-12 animate-spin text-white/80" strokeWidth={2.25} aria-label="加载中" />
        </div>
      )}

      {/* 中央播放按钮 */}
      {showBigPlay && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="播放"
          className="absolute left-1/2 top-1/2 grid h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#c6f432] text-[#0a0a0c] shadow-[0_20px_50px_-12px_rgb(0_0_0/0.7)] transition-transform duration-300 ease-out-expo hover:scale-110 sm:h-20 sm:w-20"
        >
          <Play className="ml-1 h-8 w-8 fill-current sm:h-9 sm:w-9" />
        </button>
      )}

      {/* 操作反馈 */}
      {osd && !showBigPlay && (
        <div
          key={osd.id}
          className={`player-osd pointer-events-none absolute top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5 ${
            osd.kind === 'back' ? 'left-[16%]' : osd.kind === 'fwd' ? 'right-[16%]' : 'left-1/2 -translate-x-1/2'
          }`}
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-black/55 backdrop-blur-md">
            {osd.kind === 'play' && <Play className="ml-0.5 h-7 w-7 fill-current" />}
            {osd.kind === 'pause' && <Pause className="h-7 w-7 fill-current" />}
            {osd.kind === 'back' && <RotateCcw className="h-7 w-7" />}
            {osd.kind === 'fwd' && <RotateCw className="h-7 w-7" />}
            {osd.kind === 'vol' && <Volume2 className="h-7 w-7" />}
            {osd.kind === 'mute' && <VolumeX className="h-7 w-7" />}
            {osd.kind === 'rate' && <span className="text-lg font-black tabular-nums">{osd.text}</span>}
          </span>
          {osd.text && osd.kind !== 'rate' && (
            <span className="rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-bold tabular-nums backdrop-blur-md">{osd.text}</span>
          )}
        </div>
      )}

      {/* 续播提示 */}
      {toast && (
        <div
          role="status"
          className={`absolute left-4 z-10 flex items-center gap-3 rounded-full bg-black/70 py-1.5 pl-4 pr-1.5 text-sm font-bold backdrop-blur-md transition-[bottom] duration-300 sm:left-6 ${
            showUI ? 'bottom-[92px] sm:bottom-[100px]' : 'bottom-5'
          }`}
        >
          {toast}
          <button
            type="button"
            onClick={() => {
              const v = videoRef.current;
              if (v) v.currentTime = 0;
              setToast(null);
            }}
            className="h-7 rounded-full bg-white/15 px-3 text-xs hover:bg-white/25"
          >
            从头看
          </button>
        </div>
      )}

      {/* 播放结束 */}
      {ended && !error && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/75 p-6 backdrop-blur-sm">
          {next && countdown !== null ? (
            <div className="flex max-w-sm flex-col items-center text-center">
              <p className="text-xs font-bold tracking-[0.2em] text-white/60">即将播放</p>
              <p className="mt-2 line-clamp-2 text-2xl font-black tracking-[-0.03em] sm:text-3xl">{next.label}</p>
              <div className="mt-6 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => next.go()}
                  className="relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full bg-[#c6f432] px-5 text-sm font-black text-[#0a0a0c]"
                >
                  <span
                    aria-hidden="true"
                    className="player-countdown absolute inset-0 origin-left bg-black/12"
                    style={{ animationDuration: `${AUTO_NEXT_SECONDS}s` }}
                  />
                  <SkipForward className="relative h-4 w-4 fill-current" />
                  <span className="relative tabular-nums">立即播放 · {countdown}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCountdown(null)}
                  className="h-11 rounded-full px-5 text-sm font-bold text-white/85 ring-1 ring-white/25 hover:bg-white/10"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={replay}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-black text-black hover:bg-[#c6f432]"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={2.75} /> 重新播放
              </button>
              {next && (
                <button
                  type="button"
                  onClick={() => next.go()}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-white/85 ring-1 ring-white/25 hover:bg-white/10"
                >
                  下一集 <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div role="alert" className="absolute inset-0 z-20 grid place-items-center bg-black/85 p-6 text-center">
          <div className="flex max-w-sm flex-col items-center">
            <TriangleAlert className="h-10 w-10 text-[#c6f432]" strokeWidth={2.25} />
            <p className="mt-4 text-lg font-black sm:text-xl">{error}</p>
            <p className="mt-2 text-sm text-white/60">可以重试, 或者换一个播放线路试试。</p>
            <button
              type="button"
              onClick={retry}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#c6f432] px-6 text-sm font-black text-[#0a0a0c]"
            >
              <RotateCw className="h-4 w-4" strokeWidth={2.75} /> 重试
            </button>
          </div>
        </div>
      )}

      {/* 控制栏 */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2 pb-1.5 pt-16 transition-opacity duration-300 sm:px-4 sm:pb-3 ${
          showUI && !error ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* 进度条 */}
        <div
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-label="播放进度"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${fmt(time)} / ${fmt(duration)}`}
          onPointerDown={onBarDown}
          onPointerMove={onBarMove}
          onPointerUp={onBarUp}
          onPointerCancel={() => setScrub(null)}
          onPointerLeave={() => scrub === null && setHover(null)}
          className="group/bar relative mx-2 flex h-6 touch-none items-center focus-visible:outline-none"
        >
          <div
            className={`relative w-full rounded-full bg-white/20 transition-[height] duration-150 ${
              scrub !== null ? 'h-1.5' : 'h-1 group-hover/bar:h-1.5'
            }`}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${bufferedRatio * 100}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-[#c6f432]" style={{ width: `${progress * 100}%` }} />
            <div
              className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgb(198_244_50/0.35)] transition-transform duration-150 group-focus-visible/bar:scale-100 ${
                scrub !== null ? 'scale-100' : 'scale-0 group-hover/bar:scale-100'
              }`}
              style={{ left: `${progress * 100}%` }}
            />
          </div>
          {hover !== null && duration > 0 && (
            <span
              className="pointer-events-none absolute bottom-full mb-1.5 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-black"
              style={{ left: `clamp(1.5rem, ${hover * 100}%, calc(100% - 1.5rem))` }}
            >
              {fmt(hover * duration)}
            </span>
          )}
        </div>

        {/* 按钮行 */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button type="button" onClick={togglePlay} aria-label={playing ? '暂停' : '播放'} title={playing ? '暂停 (K)' : '播放 (K)'} className={btn}>
            {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
          </button>
          <button type="button" onClick={() => seekBy(-10)} aria-label="后退 10 秒" title="后退 10 秒 (J)" className={`${btn} hidden sm:grid`}>
            <RotateCcw className="h-[18px] w-[18px]" />
          </button>
          <button type="button" onClick={() => seekBy(10)} aria-label="快进 10 秒" title="快进 10 秒 (L)" className={`${btn} hidden sm:grid`}>
            <RotateCw className="h-[18px] w-[18px]" />
          </button>
          {next && (
            <button type="button" onClick={() => next.go()} aria-label={`下一集: ${next.label}`} title="下一集 (Shift+N)" className={btn}>
              <SkipForward className="h-5 w-5 fill-current" />
            </button>
          )}

          <div className="group/vol flex items-center">
            <button type="button" onClick={toggleMute} aria-label={muted ? '取消静音' : '静音'} title="静音 (M)" className={btn}>
              <VolumeIcon className="h-5 w-5" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="音量"
              onChange={e => {
                const v = videoRef.current;
                if (!v) return;
                v.volume = Number(e.target.value);
                v.muted = v.volume === 0;
              }}
              className="player-range hidden w-0 opacity-0 transition-[width,opacity,margin] duration-200 focus-visible:mr-2 focus-visible:w-20 focus-visible:opacity-100 group-hover/vol:mr-2 group-hover/vol:w-20 group-hover/vol:opacity-100 sm:block"
              style={{ '--fill': `${(muted ? 0 : volume) * 100}%` } as React.CSSProperties}
            />
          </div>

          <span className="ml-1 text-[13px] font-bold tabular-nums text-white/95 sm:text-sm">
            {fmt(scrub !== null ? scrub * duration : time)}
            <span className="text-white/50"> / {fmt(duration)}</span>
          </span>

          <span className="flex-1" />

          {rate !== 1 && (
            <span className="mr-1 hidden rounded-full bg-white/12 px-2 py-0.5 text-xs font-black tabular-nums sm:inline">{rate}x</span>
          )}

          {/* 设置菜单 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu(m => (m ? null : 'main'))}
              aria-label="播放设置"
              aria-expanded={menu !== null}
              title="设置"
              className={btn}
            >
              <Settings className={`h-5 w-5 transition-transform duration-300 ${menu ? 'rotate-45' : ''}`} />
            </button>
            {menu && (
              <div className="absolute bottom-full right-0 mb-3 w-60 overflow-hidden rounded-2xl bg-[#141417]/95 p-1.5 text-sm shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] ring-1 ring-white/10 backdrop-blur-xl">
                {menu === 'main' && (
                  <>
                    <MenuRow label="倍速" value={rate === 1 ? '正常' : `${rate}x`} onClick={() => setMenu('rate')} />
                    {levels.length > 1 && <MenuRow label="画质" value={currentQuality} onClick={() => setMenu('quality')} />}
                  </>
                )}
                {menu === 'rate' && (
                  <MenuList
                    title="倍速"
                    onBack={() => setMenu('main')}
                    items={RATES.map(r => ({ key: r, label: r === 1 ? '正常' : `${r}x`, active: r === rate, onClick: () => setPlaybackRate(r) }))}
                  />
                )}
                {menu === 'quality' && (
                  <MenuList
                    title="画质"
                    onBack={() => setMenu('main')}
                    items={[
                      { key: -1, label: `自动${level === -1 && autoHeight ? ` (${autoHeight}P)` : ''}`, active: level === -1, onClick: () => setQuality(-1) },
                      ...[...levels]
                        .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate)
                        .map(l => ({ key: l.index, label: qualityLabel(l), active: l.index === level, onClick: () => setQuality(l.index) })),
                    ]}
                  />
                )}
              </div>
            )}
          </div>

          {pipSupported && (
            <button type="button" onClick={togglePip} aria-label="画中画" title="画中画" className={`${btn} hidden sm:grid`}>
              <PictureInPicture2 className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? '退出全屏' : '全屏'}
            title={fullscreen ? '退出全屏 (F)' : '全屏 (F)'}
            className={btn}
          >
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left font-bold text-white hover:bg-white/10"
    >
      {label}
      <span className="flex items-center gap-1 font-medium text-white/60">
        {value}
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}

function MenuList({
  title,
  onBack,
  items,
}: {
  title: string;
  onBack: () => void;
  items: { key: number; label: string; active: boolean; onClick: () => void }[];
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 w-full items-center gap-1 rounded-xl px-2 font-black text-white hover:bg-white/10"
      >
        <ChevronLeft className="h-4 w-4" />
        {title}
      </button>
      <div className="my-1 h-px bg-white/10" />
      <ul className="max-h-64 overflow-y-auto">
        {items.map(it => (
          <li key={it.key}>
            <button
              type="button"
              onClick={it.onClick}
              aria-pressed={it.active}
              className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-left font-bold tabular-nums hover:bg-white/10 ${
                it.active ? 'text-[#c6f432]' : 'text-white/90'
              }`}
            >
              {it.label}
              {it.active && <Check className="h-4 w-4" strokeWidth={3} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
