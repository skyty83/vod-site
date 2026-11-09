'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Music, Repeat, Repeat1, Shuffle, Disc3, Heart, Loader2, ListMusic,
  ChevronDown, User, Library, Mic2, TrendingUp, AlignLeft,
} from 'lucide-react';

const PLUGIN_URL = 'https://raw.githubusercontent.com/Huibq/keep-alive/master/Music_Free/xiaowo.js';

type RepeatMode = 'none' | 'all' | 'one';
type SearchTab = 'music' | 'album' | 'artist' | 'chart';

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  albumId?: string;
  artistId?: string;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  date?: string;
  description?: string;
}

interface Artist {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  worksNum?: number;
}

interface ChartItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  artwork?: string;
  coverImg?: string;
  playCount?: number;
}

interface ApiResponse {
  error?: string;
  data?: unknown[];
  isEnd?: boolean;
  url?: string;
  rawLrc?: string;
  lrc?: string;
}

// Hot search suggestions
const HOT_QUERIES = ['周杰伦', '邓紫棋', '林俊杰', '薛之谦', '华晨宇', '毛不易', '陈奕迅', '王菲'];

const TABS: { id: SearchTab; label: string; icon: React.ElementType }[] = [
  { id: 'music', label: '单曲', icon: Music },
  { id: 'album', label: '专辑', icon: Library },
  { id: 'artist', label: '歌手', icon: Mic2 },
  { id: 'chart', label: '排行榜', icon: TrendingUp },
];

// Shared class names: every interactive control is a pill
const ICON_BTN = 'inline-flex items-center justify-center rounded-full text-ink transition-colors hover:bg-card-2 disabled:opacity-40 disabled:hover:bg-transparent';
const ICON_BTN_ON = 'inline-flex items-center justify-center rounded-full bg-ink text-paper transition-colors';
const BTN_PRIMARY = 'inline-flex items-center justify-center rounded-full bg-accent text-onaccent transition-transform duration-300 ease-out-expo hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100';
const COVER_CARD = 'relative overflow-hidden rounded-card bg-card-2 ring-1 ring-line transition duration-500 ease-out-expo group-hover:-translate-y-1 group-hover:shadow-lift';

// API call
async function apiCall<T = ApiResponse>(action: string, args: unknown[]): Promise<T> {
  const res = await fetch('/api/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pluginUrl: PLUGIN_URL, action, args }),
  });
  const data = await res.json();
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as T;
}

// Equalizer bars: only animate while actually playing (and motion allowed)
function WaveformBars({ playing, className = 'bg-pop' }: { playing: boolean; className?: string }) {
  return (
    <div className="flex items-end gap-[2px] h-4" aria-hidden="true">
      {[0.6, 1, 0.75, 0.5].map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full ${className} ${playing ? 'musicbar' : ''}`}
          style={{
            height: `${h * 100}%`,
            animationDelay: `${i * 0.12}s`,
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
}

// Cover thumbnail
function CoverThumb({ artwork, playing, className = 'w-12 h-12' }: { artwork?: string; playing: boolean; className?: string }) {
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-card bg-card-2 ring-1 ring-line`}>
      {artwork
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={artwork} alt="" className="w-full h-full object-cover" />
        : (
          <div className="w-full h-full flex items-center justify-center text-sub">
            <Disc3 size={20} strokeWidth={2} className={playing ? 'motion-safe:animate-[spin_8s_linear_infinite]' : ''} />
          </div>
        )}
    </div>
  );
}

// Seek bar: pill track with lime fill
function Seeker({ progress, onSeek, label = '播放进度' }: { progress: number; onSeek: (e: React.MouseEvent<HTMLDivElement>) => void; label?: string }) {
  return (
    <div
      className="group relative w-full py-2 cursor-pointer"
      onClick={onSeek}
      title={label}
    >
      <div className="relative h-1.5 rounded-full bg-card-2 ring-1 ring-line">
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${progress}%` }}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-ink ring-2 ring-accent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    </div>
  );
}

// Volume slider
function VolumeSlider({ volume, muted, onVolumeChange, onToggleMute, className = 'w-40' }: {
  volume: number; muted: boolean;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  className?: string;
}) {
  const silent = muted || volume === 0;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={onToggleMute}
        aria-label={silent ? '取消静音' : '静音'}
        className={`${ICON_BTN} w-9 h-9 shrink-0`}
      >
        {silent ? <VolumeX size={18} strokeWidth={2} /> : <Volume2 size={18} strokeWidth={2} />}
      </button>
      <div className="relative flex-1 h-1.5 rounded-full bg-card-2 ring-1 ring-line">
        <input
          type="range" min="0" max="1" step="0.01"
          aria-label="音量"
          value={muted ? 0 : volume}
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
          className="absolute -inset-y-2 inset-x-0 w-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-ink"
          style={{ width: `${(muted ? 0 : volume) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-sub">
      <Loader2 size={28} strokeWidth={2} className="motion-safe:animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-sub rounded-panel bg-card ring-1 ring-line">
      <span className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-card-2">
        <Icon size={28} strokeWidth={2} />
      </span>
      <p className="text-sm font-bold">{text}</p>
    </div>
  );
}

function LoadMore({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-sub">
      <Loader2 size={14} strokeWidth={2} className="motion-safe:animate-spin" />
      加载更多...
    </div>
  );
}

// Main page
export default function MusicPage() {
  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('music');
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [page, setPage] = useState(1);
  const [isEnd, setIsEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Lyrics state
  const [lyrics, setLyrics] = useState<string>('');
  const [showLyrics, setShowLyrics] = useState(false);

  // ── Player state ──────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [playLoading, setPlayLoading] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [shuffle, setShuffle] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const currentLiked = !!currentSong && liked.has(currentSong.id);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadCharts();
    doSearch('SHE', 1, true, 'music');
    setSearchQuery('SHE');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); playNext(); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); playPrev(); }
      if (e.code === 'KeyM') { toggleMute(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong, isPlaying, queue]);

  // ── Infinite scroll ───────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isEnd && !loadingMore && !loading && currentQuery) {
          loadMore();
        }
      },
      { root: listRef.current, rootMargin: '120px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnd, loadingMore, loading, currentQuery, page, activeTab]);

  const loadCharts = async () => {
    try {
      const data = await apiCall<ChartItem[] | { data?: ChartItem[] }>('getTopLists', []);
      // API returns array or object with data field
      const list = Array.isArray(data) ? data : (data.data || []);
      setCharts(list);
    } catch { /* silently ignore */ }
  };

  const fetchLyrics = useCallback(async (song: Song) => {
    setLyrics('');
    try {
      const data = await apiCall('getLyric', [song]);
      const raw: string = data?.rawLrc || data?.lrc || '';
      // Strip timestamps, keep text
      const cleaned = raw.replace(/\[\d+:\d+\.?\d*\]/g, '').replace(/\[.+\]/g, '').trim();
      setLyrics(cleaned || '暂无歌词');
    } catch { setLyrics('暂无歌词'); }
  }, []);

  const doSearch = async (query: string, pageNum = 1, reset = true, tab: SearchTab = activeTab) => {
    if (!query.trim() || tab === 'chart') return;
    if (reset) {
      setLoading(true);
      setSongs([]); setAlbums([]); setArtists([]);
      setPage(1); setIsEnd(false);
    } else {
      setLoadingMore(true);
    }
    setError('');
    try {
      // All search types use the same 'search' action with different type param
      const typeMap: Record<string, string> = { music: 'music', album: 'album', artist: 'artist' };
      const data = await apiCall('search', [query, pageNum, typeMap[tab] || 'music']);
      const items = data.data || [];
      if (reset) {
        if (tab === 'music') setSongs(items as Song[]);
        else if (tab === 'album') setAlbums(items as Album[]);
        else setArtists(items as Artist[]);
        setCurrentQuery(query);
      } else {
        if (tab === 'music') setSongs(prev => {
          const ids = new Set(prev.map(s => s.id));
          return [...prev, ...(items as Song[]).filter(s => !ids.has(s.id))];
        });
        else if (tab === 'album') setAlbums(prev => [...prev, ...(items as Album[])]);
        else setArtists(prev => [...prev, ...(items as Artist[])]);
      }
      setIsEnd(data.isEnd ?? items.length === 0);
      setPage(pageNum);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (isEnd || loadingMore || loading || !currentQuery) return;
    doSearch(currentQuery, page + 1, false, activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnd, loadingMore, loading, currentQuery, page, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) doSearch(searchQuery, 1, true, activeTab);
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    if (tab === 'chart') { if (charts.length === 0) loadCharts(); return; }
    if (currentQuery) doSearch(currentQuery, 1, true, tab);
  };

  const searchAsMusic = (q: string) => {
    setActiveTab('music');
    doSearch(q, 1, true, 'music');
    setSearchQuery(q);
  };

  // ── Playback ──────────────────────────────────────────────────────────────
  const playSongFromQueue = useCallback(async (song: Song, newQueue?: Song[]) => {
    setCurrentSong(song);
    setIsPlaying(false);
    setPlayLoading(true);
    setError('');
    setLyrics('');
    if (newQueue) setQueue(newQueue);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    // Fetch lyrics in parallel
    fetchLyrics(song);
    try {
      const data = await apiCall('getMediaSource', [song, 'standard']);
      const audioUrl = data.url;
      if (!audioUrl) throw new Error('No audio URL returned');
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.volume = isMuted ? 0 : volume;
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err: unknown) {
      setError('播放失败: ' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setPlayLoading(false);
    }
  }, [volume, isMuted, fetchLyrics]);

  const playSong = useCallback((song: Song) => {
    playSongFromQueue(song, songs.length > 0 ? songs : undefined);
  }, [playSongFromQueue, songs]);

  const playNext = useCallback(() => {
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex(s => s.id === currentSong.id);
    if (idx === -1) return;
    let nextIdx: number;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (idx < queue.length - 1) {
      nextIdx = idx + 1;
    } else if (repeatMode === 'all') {
      nextIdx = 0;
    } else return;
    playSongFromQueue(queue[nextIdx]);
  }, [currentSong, queue, shuffle, repeatMode, playSongFromQueue]);

  const playPrev = useCallback(() => {
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex(s => s.id === currentSong.id);
    if (idx === -1) return;
    const prevIdx = idx > 0 ? idx - 1 : (repeatMode === 'all' ? queue.length - 1 : 0);
    playSongFromQueue(queue[prevIdx]);
  }, [currentSong, queue, repeatMode, playSongFromQueue]);

  const handleEnded = useCallback(() => {
    if (repeatMode === 'one') {
      audioRef.current?.play();
    } else {
      playNext();
    }
  }, [repeatMode, playNext]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error); }
  }, [currentSong, isPlaying]);

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    audioRef.current.volume = next ? 0 : volume;
  }, [isMuted, volume]);

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLiked(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const cycleRepeat = () => {
    setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none');
  };

  const fmt = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  };

  const playIcon = (size: number, mlClass = '') =>
    playLoading
      ? <Loader2 size={size} strokeWidth={2} className="motion-safe:animate-spin" />
      : isPlaying
        ? <Pause size={size} strokeWidth={2} fill="currentColor" />
        : <Play size={size} strokeWidth={2} fill="currentColor" className={mlClass} />;

  const repeatActive = repeatMode !== 'none';

  // Render
  return (
    <div className="min-h-screen pb-40 bg-paper text-ink overflow-x-hidden">

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />

      <div className="wrap pt-8 pb-10 lg:pt-14">
        {/* Page title */}
        <header className="mb-8 lg:mb-12">
          <p className="font-wide text-pop text-sm sm:text-base font-extrabold mb-2">MUSIC</p>
          <h1 className="text-5xl sm:text-7xl font-black tracking-[-0.045em] leading-[0.95]">喵喵音乐</h1>
        </header>

        <div className="flex gap-8 xl:gap-10">

          {/* Left sidebar (desktop) */}
          <aside className="hidden lg:flex w-80 shrink-0 flex-col gap-4 sticky top-[calc(var(--header-h)+1.5rem)] self-start">

            <div className="rounded-panel bg-card ring-1 ring-line p-4 flex flex-col gap-4">
              {/* Now playing art */}
              <div className="relative overflow-hidden rounded-card bg-card-2 shadow-lift">
                {currentSong?.artwork ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentSong.artwork} alt="封面" className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square flex flex-col items-center justify-center gap-3 text-sub">
                    <Disc3 size={72} strokeWidth={2} className={isPlaying ? 'motion-safe:animate-[spin_8s_linear_infinite]' : ''} />
                    <p className="text-xs">暂无封面</p>
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-ink text-paper pl-2.5 pr-3 h-8">
                    <WaveformBars playing={isPlaying} className="bg-accent" />
                    <span className="text-xs font-bold">播放中</span>
                  </div>
                )}
              </div>

              {/* Now playing info */}
              <div className="min-w-0 px-1">
                <h2 className="text-2xl font-black tracking-[-0.035em] truncate">{currentSong?.title || '暂无播放'}</h2>
                <p className="text-sm text-sub truncate mt-1">{currentSong?.artist || '选择一首歌曲开始播放'}</p>
                {currentSong?.album && <p className="text-xs text-sub truncate mt-0.5">{currentSong.album}</p>}
              </div>

              {/* Liked songs quick-count */}
              {liked.size > 0 && (
                <div className="inline-flex self-start items-center gap-2 px-3 h-8 rounded-full bg-card-2">
                  <Heart size={14} strokeWidth={2} className="text-pop" fill="currentColor" />
                  <span className="text-xs font-bold tabular-nums">已收藏 {liked.size} 首</span>
                </div>
              )}
            </div>

            {/* Lyrics panel */}
            {currentSong && lyrics && (
              <div className="rounded-panel bg-card ring-1 ring-line p-2">
                <button
                  onClick={() => setShowLyrics(s => !s)}
                  aria-expanded={showLyrics}
                  className="w-full flex items-center justify-between px-4 h-11 rounded-full hover:bg-card-2 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <AlignLeft size={16} strokeWidth={2} />
                    <span className="text-sm font-black tracking-[-0.035em]">歌词</span>
                  </span>
                  <span className="text-xs text-sub">{showLyrics ? '收起' : '展开'}</span>
                </button>
                {showLyrics && (
                  <div className="px-4 pt-2 pb-3 max-h-56 overflow-y-auto shelf-scroll">
                    <p className="text-sm text-sub leading-7 whitespace-pre-wrap">{lyrics}</p>
                  </div>
                )}
              </div>
            )}

            {/* Queue panel */}
            {showQueue && queue.length > 0 && (
              <div className="rounded-panel bg-card ring-1 ring-line p-2">
                <div className="flex items-center justify-between px-3 pt-2 pb-2">
                  <span className="text-sm font-black tracking-[-0.035em]">播放队列</span>
                  <span className="text-xs text-sub tabular-nums">{queue.length} 首</span>
                </div>
                <div className="overflow-y-auto max-h-72 shelf-scroll flex flex-col gap-0.5">
                  {queue.map((s, i) => {
                    const active = currentSong?.id === s.id;
                    return (
                      <button
                        key={`${s.id}-${i}`}
                        onClick={() => playSongFromQueue(s)}
                        aria-current={active ? 'true' : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-card transition-colors hover:bg-card-2 ${active ? 'bg-card-2' : ''}`}
                      >
                        <span className="w-5 shrink-0 flex justify-center">
                          {active && isPlaying
                            ? <WaveformBars playing={isPlaying} />
                            : <span className={`text-xs tabular-nums ${active ? 'text-pop font-bold' : 'text-sub'}`}>{i + 1}</span>}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold truncate ${active ? 'text-pop' : 'text-ink'}`}>{s.title}</p>
                          <p className="text-xs text-sub truncate">{s.artist}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Keyboard hint */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-2 text-xs text-sub">
              <kbd className="px-2 py-0.5 rounded-full ring-1 ring-line font-sans">Space</kbd> 播放
              <kbd className="px-2 py-0.5 rounded-full ring-1 ring-line font-sans">←→</kbd> 切换
              <kbd className="px-2 py-0.5 rounded-full ring-1 ring-line font-sans">M</kbd> 静音
            </div>
          </aside>

          {/* Right: search + results */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 flex items-center">
                <Search size={18} strokeWidth={2} className="absolute left-4 text-sub pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索歌曲、歌手、专辑..."
                  aria-label="搜索音乐"
                  className="w-full h-12 rounded-full bg-card ring-1 ring-line pl-12 pr-4 text-sm text-ink placeholder:text-sub outline-none focus-visible:ring-2 focus-visible:ring-pop transition-shadow"
                />
              </div>
              <button type="submit" className={`${BTN_PRIMARY} h-12 px-6 text-sm font-black shrink-0`}>
                搜索
              </button>
            </form>

            {/* Hot queries */}
            {!currentQuery && (
              <div className="flex flex-wrap gap-2">
                {HOT_QUERIES.map(q => (
                  <button
                    key={q}
                    onClick={() => { setSearchQuery(q); doSearch(q, 1, true, activeTab); }}
                    className="inline-flex items-center h-9 px-4 rounded-full bg-card ring-1 ring-line text-sm font-bold transition-colors hover:bg-card-2"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Tabs + count */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex max-w-full overflow-x-auto scrollbar-hide rounded-full bg-card ring-1 ring-line p-1" role="tablist">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const on = activeTab === id;
                  return (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={on}
                      onClick={() => handleTabChange(id)}
                      className={`inline-flex items-center justify-center gap-1.5 shrink-0 px-4 sm:px-5 h-10 rounded-full text-sm font-bold transition-colors ${on ? 'bg-ink text-paper' : 'text-sub hover:text-ink hover:bg-card-2'}`}
                    >
                      <Icon size={15} strokeWidth={2} />
                      {label}
                    </button>
                  );
                })}
              </div>

              {(songs.length > 0 || albums.length > 0 || artists.length > 0) && activeTab !== 'chart' && (
                <div className="flex items-center gap-1.5 text-xs text-sub tabular-nums">
                  <span>
                    {activeTab === 'music' ? `已加载 ${songs.length} 首歌曲` :
                      activeTab === 'album' ? `已加载 ${albums.length} 张专辑` :
                        activeTab === 'artist' ? `已加载 ${artists.length} 位歌手` : ''}
                  </span>
                  {isEnd
                    ? <span>- 已全部加载</span>
                    : <span>- 向下滚动加载更多</span>}
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div role="alert" className="flex items-center gap-3 px-3 py-3 rounded-card bg-card ring-1 ring-line text-ink text-sm">
                <span className="shrink-0 inline-flex items-center h-6 px-2.5 rounded-full bg-ink text-paper text-xs font-bold">错误</span>
                <span className="min-w-0 break-words">{error}</span>
              </div>
            )}

            {/* Music tab */}
            {activeTab === 'music' && (
              <div className="rounded-panel bg-card ring-1 ring-line p-2 sm:p-3">
                {/* List header */}
                <div className="grid grid-cols-[2rem_1fr_auto_1.25rem] sm:grid-cols-[2rem_1fr_1fr_auto_1.25rem] gap-3 px-3 pt-1 pb-2 text-xs text-sub">
                  <div className="text-center">#</div>
                  <div>歌曲</div>
                  <div className="hidden sm:block">专辑</div>
                  <div className="text-center">收藏</div>
                  <div />
                </div>
                <div ref={listRef} className="overflow-y-auto shelf-scroll max-h-[60vh] lg:max-h-[62vh]">
                  {loading ? (
                    <Spinner label="搜索中..." />
                  ) : songs.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {songs.map((song, i) => {
                        const isActive = currentSong?.id === song.id;
                        const isLiked = liked.has(song.id);
                        return (
                          <div
                            key={`${song.id}-${i}`}
                            role="button"
                            tabIndex={0}
                            aria-current={isActive ? 'true' : undefined}
                            onClick={() => playSong(song)}
                            onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) playSong(song); }}
                            className={`group grid grid-cols-[2rem_1fr_auto_1.25rem] sm:grid-cols-[2rem_1fr_1fr_auto_1.25rem] gap-3 items-center px-3 py-2 rounded-card cursor-pointer transition-colors hover:bg-card-2 ${isActive ? 'bg-card-2' : ''}`}
                          >
                            {/* # / equalizer */}
                            <div className="flex items-center justify-center shrink-0 h-5">
                              {isActive && isPlaying
                                ? <WaveformBars playing={isPlaying} />
                                : <>
                                  <span className={`text-sm tabular-nums group-hover:hidden ${isActive ? 'text-pop font-black' : 'text-sub font-bold'}`}>{i + 1}</span>
                                  <Play size={14} strokeWidth={2} className="hidden group-hover:block ml-0.5" fill="currentColor" />
                                </>
                              }
                            </div>

                            {/* Title + artist */}
                            <div className="flex items-center gap-3 min-w-0">
                              {song.artwork
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={song.artwork} alt="" className="w-11 h-11 rounded-card ring-1 ring-line object-cover hidden sm:block shrink-0" />
                                : <div className="w-11 h-11 rounded-card bg-card-2 hidden sm:flex items-center justify-center shrink-0 text-sub"><Music size={16} strokeWidth={2} /></div>
                              }
                              <div className="min-w-0">
                                <p className={`text-sm font-bold truncate ${isActive ? 'text-pop' : 'text-ink'}`}>{song.title}</p>
                                <p className="text-xs text-sub truncate mt-0.5">{song.artist}</p>
                              </div>
                            </div>

                            {/* Album */}
                            <p className="hidden sm:block text-xs text-sub truncate pr-2">{song.album}</p>

                            {/* Like */}
                            <button
                              onClick={e => toggleLike(song.id, e)}
                              aria-label={isLiked ? '取消收藏' : '收藏'}
                              aria-pressed={isLiked}
                              className={`${ICON_BTN} w-9 h-9 justify-self-center ${isLiked ? 'text-pop' : 'text-sub hover:text-ink'}`}
                            >
                              <Heart size={16} strokeWidth={2} fill={isLiked ? 'currentColor' : 'none'} />
                            </button>

                            {/* Loading indicator */}
                            <div className="w-5 flex items-center justify-center">
                              {isActive && playLoading && <Loader2 size={14} strokeWidth={2} className="motion-safe:animate-spin text-pop" />}
                            </div>
                          </div>
                        );
                      })}

                      {/* Sentinel */}
                      <div ref={sentinelRef} className="py-5 flex items-center justify-center">
                        <LoadMore loading={loadingMore} />
                        {isEnd && songs.length > 0 && (
                          <p className="text-xs text-sub tabular-nums">共 {songs.length} 首</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-sub">
                      <span className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-card-2">
                        <Music size={28} strokeWidth={2} />
                      </span>
                      <p className="text-sm font-bold">搜索歌曲，开始播放</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Album tab */}
            {activeTab === 'album' && (
              <div className="min-h-48">
                {loading ? (
                  <Spinner label="搜索中..." />
                ) : albums.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                    {albums.map((album, i) => (
                      <button
                        key={`${album.id}-${i}`}
                        onClick={() => searchAsMusic(album.artist)}
                        className="group text-left flex flex-col gap-3 rounded-card"
                      >
                        <div className={`${COVER_CARD} aspect-square w-full`}>
                          {album.artwork
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={album.artwork} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-sub"><Library size={36} strokeWidth={2} /></div>
                          }
                        </div>
                        <div className="min-w-0 px-0.5">
                          <p className="text-sm font-bold truncate">{album.title}</p>
                          <p className="text-xs text-sub truncate mt-0.5">{album.artist}</p>
                          {album.date && <p className="text-xs text-sub mt-0.5 tabular-nums">{album.date}</p>}
                        </div>
                      </button>
                    ))}
                    <div ref={sentinelRef} className="col-span-full py-2 flex justify-center">
                      <LoadMore loading={loadingMore} />
                    </div>
                  </div>
                ) : (
                  <Empty icon={Library} text="搜索专辑" />
                )}
              </div>
            )}

            {/* Artist tab */}
            {activeTab === 'artist' && (
              <div className="min-h-48">
                {loading ? (
                  <Spinner label="搜索中..." />
                ) : artists.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                    {artists.map((artist, i) => (
                      <button
                        key={`${artist.id}-${i}`}
                        onClick={() => searchAsMusic(artist.name)}
                        className="group text-left flex flex-col gap-3 rounded-card"
                      >
                        <div className={`${COVER_CARD} aspect-square w-full`}>
                          {artist.avatar
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={artist.avatar} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-sub"><User size={36} strokeWidth={2} /></div>
                          }
                        </div>
                        <div className="min-w-0 w-full px-0.5">
                          <p className="text-sm font-bold truncate">{artist.name}</p>
                          {artist.worksNum ? <p className="text-xs text-sub mt-0.5 tabular-nums">{artist.worksNum} 首歌曲</p> : null}
                        </div>
                      </button>
                    ))}
                    <div ref={sentinelRef} className="col-span-full py-2 flex justify-center">
                      <LoadMore loading={loadingMore} />
                    </div>
                  </div>
                ) : (
                  <Empty icon={Mic2} text="搜索歌手" />
                )}
              </div>
            )}

            {/* Chart tab */}
            {activeTab === 'chart' && (
              <div className="min-h-48">
                {charts.length === 0 ? (
                  <Spinner label="加载排行榜..." />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                    {charts.map((chart, i) => (
                      <button
                        key={`${chart.id}-${i}`}
                        onClick={() => searchAsMusic(chart.title || chart.name || '')}
                        className="group text-left flex flex-col gap-3 rounded-card"
                      >
                        <div className={`${COVER_CARD} aspect-square w-full`}>
                          {chart.coverImg || chart.artwork
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={chart.coverImg || chart.artwork} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-sub"><TrendingUp size={36} strokeWidth={2} /></div>
                          }
                          <span className="absolute right-3 bottom-3 inline-flex w-11 h-11 items-center justify-center rounded-full bg-accent text-onaccent shadow-lift opacity-0 translate-y-2 transition duration-300 ease-out-expo group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0">
                            <Play size={18} strokeWidth={2} fill="currentColor" className="ml-0.5" />
                          </span>
                        </div>
                        <div className="min-w-0 px-0.5">
                          <p className="text-sm font-bold truncate">{chart.title || chart.name}</p>
                          {chart.description && <p className="text-xs text-sub truncate mt-0.5">{chart.description}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Mobile fullscreen player */}
      <div
        className={`fixed inset-0 z-[70] flex flex-col lg:hidden bg-paper overflow-hidden transition-transform duration-500 ease-out-expo ${showFullPlayer ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
        aria-hidden={!showFullPlayer}
      >
        {/* Ambient: blurred current cover */}
        {currentSong?.artwork && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentSong.artwork} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-50 scale-125 pointer-events-none" />
        )}
        <div className="absolute inset-0 bg-paper/60 pointer-events-none" aria-hidden="true" />

        <div className="relative flex justify-center items-center pt-4 pb-2 shrink-0">
          <button
            onClick={() => setShowFullPlayer(false)}
            aria-label="收起播放器"
            className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-card ring-1 ring-line text-ink transition-colors hover:bg-card-2"
          >
            <ChevronDown size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="relative flex-1 flex flex-col px-6 pb-8 gap-6 overflow-auto min-h-0">
          {/* Album art */}
          <div className="flex-1 flex items-center justify-center py-2">
            <div className="w-full max-w-[300px] aspect-square rounded-card bg-card-2 shadow-lift overflow-hidden">
              {currentSong?.artwork
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={currentSong.artwork} alt="封面" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-sub">
                  <Disc3 size={100} strokeWidth={2} className={isPlaying ? 'motion-safe:animate-[spin_8s_linear_infinite]' : ''} />
                </div>
              }
            </div>
          </div>

          {/* Song info */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-3xl font-black tracking-[-0.035em] truncate">{currentSong?.title || '暂无播放'}</h2>
              <p className="text-sm text-sub truncate mt-1">{currentSong?.artist || '请选择音乐'}</p>
            </div>
            <button
              onClick={() => currentSong && toggleLike(currentSong.id)}
              aria-label={currentLiked ? '取消收藏' : '收藏'}
              aria-pressed={currentLiked}
              className={`${currentLiked ? ICON_BTN_ON : `${ICON_BTN} bg-card ring-1 ring-line`} w-11 h-11 shrink-0`}
            >
              <Heart size={20} strokeWidth={2} fill={currentLiked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Seeker */}
          <div className="space-y-1">
            <Seeker progress={progress} onSeek={seekTo} />
            <div className="flex justify-between text-xs text-sub tabular-nums">
              <span>{fmt(currentTime)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2">
            <button onClick={cycleRepeat} aria-label="循环模式" className={`${repeatActive ? ICON_BTN_ON : ICON_BTN} w-11 h-11`}>
              {repeatMode === 'one' ? <Repeat1 size={20} strokeWidth={2} /> : <Repeat size={20} strokeWidth={2} />}
            </button>
            <button onClick={playPrev} aria-label="上一首" className={`${ICON_BTN} w-12 h-12`}>
              <SkipBack size={24} strokeWidth={2} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              disabled={!currentSong || playLoading}
              aria-label={isPlaying ? '暂停' : '播放'}
              className={`${BTN_PRIMARY} w-20 h-20 shadow-lift`}
            >
              {playIcon(30, 'ml-1')}
            </button>
            <button onClick={playNext} aria-label="下一首" className={`${ICON_BTN} w-12 h-12`}>
              <SkipForward size={24} strokeWidth={2} fill="currentColor" />
            </button>
            <button onClick={() => setShuffle(s => !s)} aria-label="随机播放" aria-pressed={shuffle} className={`${shuffle ? ICON_BTN_ON : ICON_BTN} w-11 h-11`}>
              <Shuffle size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Volume */}
          <VolumeSlider volume={volume} muted={isMuted} onVolumeChange={handleVolumeChange} onToggleMute={toggleMute} className="w-full" />
        </div>
      </div>

      {/* Bottom player bar */}
      <div className="fixed inset-x-0 bottom-0 z-[45]">
        <div className="wrap">
          <div className="relative mb-3 rounded-panel bg-card/85 backdrop-blur-xl ring-1 ring-line shadow-lift">

            {/* Mobile mini bar */}
            <div className="lg:hidden relative">
              <div
                className="flex items-center gap-3 pl-2.5 pr-2.5 h-[72px] cursor-pointer select-none"
                onClick={() => currentSong && setShowFullPlayer(true)}
              >
                <CoverThumb artwork={currentSong?.artwork} playing={isPlaying} className="w-12 h-12" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{currentSong?.title || '喵喵音乐'}</p>
                  <p className="text-xs text-sub truncate mt-0.5">{currentSong?.artist || '点击搜索，开始播放'}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); if (currentSong) toggleLike(currentSong.id); }}
                  aria-label={currentLiked ? '取消收藏' : '收藏'}
                  aria-pressed={currentLiked}
                  className={`${ICON_BTN} w-10 h-10 shrink-0 ${currentLiked ? 'text-pop' : 'text-sub'}`}
                >
                  <Heart size={19} strokeWidth={2} fill={currentLiked ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); togglePlay(); }}
                  disabled={!currentSong || playLoading}
                  aria-label={isPlaying ? '暂停' : '播放'}
                  className={`${BTN_PRIMARY} w-12 h-12 shrink-0`}
                >
                  {playIcon(20, 'ml-0.5')}
                </button>
              </div>
              <div className="absolute left-5 right-5 bottom-1.5 h-1 rounded-full bg-card-2 overflow-hidden" aria-hidden="true">
                <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Desktop bar */}
            <div className="hidden lg:grid grid-cols-[1fr_minmax(0,1.4fr)_1fr] h-[88px] items-center gap-6 px-3 pr-5">

              {/* Track info */}
              <div className="flex items-center gap-3 min-w-0">
                <CoverThumb artwork={currentSong?.artwork} playing={isPlaying} className="w-16 h-16" />
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${isPlaying ? 'text-pop' : 'text-ink'}`}>{currentSong?.title || '暂无播放'}</p>
                  <p className="text-xs text-sub truncate mt-0.5">{currentSong?.artist || '等待播放'}</p>
                </div>
                <button
                  onClick={() => currentSong && toggleLike(currentSong.id)}
                  aria-label={currentLiked ? '取消收藏' : '收藏'}
                  aria-pressed={currentLiked}
                  className={`${ICON_BTN} w-9 h-9 shrink-0 ${currentLiked ? 'text-pop' : 'text-sub hover:text-ink'}`}
                >
                  <Heart size={17} strokeWidth={2} fill={currentLiked ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Controls + progress */}
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => setShuffle(s => !s)} aria-label="随机播放" aria-pressed={shuffle} className={`${shuffle ? ICON_BTN_ON : ICON_BTN} w-9 h-9`}>
                    <Shuffle size={16} strokeWidth={2} />
                  </button>
                  <button onClick={playPrev} aria-label="上一首" className={`${ICON_BTN} w-10 h-10`}>
                    <SkipBack size={18} strokeWidth={2} fill="currentColor" />
                  </button>
                  <button
                    onClick={togglePlay}
                    disabled={!currentSong || playLoading}
                    aria-label={isPlaying ? '暂停' : '播放'}
                    className={`${BTN_PRIMARY} w-12 h-12 mx-1`}
                  >
                    {playIcon(20, 'ml-0.5')}
                  </button>
                  <button onClick={playNext} aria-label="下一首" className={`${ICON_BTN} w-10 h-10`}>
                    <SkipForward size={18} strokeWidth={2} fill="currentColor" />
                  </button>
                  <button onClick={cycleRepeat} aria-label="循环模式" className={`${repeatActive ? ICON_BTN_ON : ICON_BTN} w-9 h-9`}>
                    {repeatMode === 'one' ? <Repeat1 size={16} strokeWidth={2} /> : <Repeat size={16} strokeWidth={2} />}
                  </button>
                </div>
                <div className="flex items-center gap-3 w-full text-xs text-sub tabular-nums">
                  <span className="w-10 text-right shrink-0">{fmt(currentTime)}</span>
                  <Seeker progress={progress} onSeek={seekTo} />
                  <span className="w-10 shrink-0">{fmt(duration)}</span>
                </div>
              </div>

              {/* Queue + volume */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowQueue(q => !q)}
                  aria-label="播放队列"
                  aria-pressed={showQueue}
                  className={`${showQueue ? ICON_BTN_ON : ICON_BTN} w-9 h-9`}
                  title="播放队列"
                >
                  <ListMusic size={17} strokeWidth={2} />
                </button>
                <VolumeSlider volume={volume} muted={isMuted} onVolumeChange={handleVolumeChange} onToggleMute={toggleMute} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes musicbar {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .musicbar {
            animation: musicbar 0.7s ease-in-out infinite;
          }
        }
      `}</style>
    </div>
  );
}
