'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Music, Repeat, Repeat1, Shuffle, Disc3, Heart, Loader2, ListMusic,
  ChevronDown, User, Library, Mic2,
} from 'lucide-react';

const PLUGIN_URL = 'https://fastly.jsdelivr.net/gh/Huibq/keep-alive/Music_Free/xiaowo.js';

type RepeatMode = 'none' | 'all' | 'one';
type SearchTab = 'music' | 'album' | 'artist';

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

// ── Hot search suggestions ────────────────────────────────────────────────────
const HOT_QUERIES = ['周杰伦', '邓紫棋', '林俊杰', '薛之谦', '华晨宇', '毛不易', '陈奕迅', '王菲'];

// ── Waveform bars animation component ────────────────────────────────────────
function WaveformBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-5">
      {[0.6, 1, 0.75, 0.5, 0.9].map((h, i) => (
        <div
          key={i}
          className="w-[3px] bg-violet-400 rounded-full"
          style={{
            height: `${h * 100}%`,
            animation: playing ? `musicbar 0.7s ease-in-out infinite ${i * 0.12}s` : 'none',
            transform: playing ? undefined : `scaleY(${h * 0.4})`,
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
}

// ── Spinning disc artwork ─────────────────────────────────────────────────────
function DiscArt({ artwork, playing, size = 'md' }: { artwork?: string; playing: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-11 h-11' : size === 'lg' ? 'w-full aspect-square' : 'w-14 h-14';
  return (
    <div className={`${sz} rounded-full overflow-hidden bg-gradient-to-br from-violet-900/60 to-purple-900/60 shrink-0 relative shadow-xl`}>
      {artwork
        ? <img src={artwork} alt="" className={`w-full h-full object-cover transition-all duration-700 ${playing ? 'animate-[spin_12s_linear_infinite]' : ''}`} />
        : <div className="w-full h-full flex items-center justify-center">
          <Disc3 size={size === 'lg' ? 64 : size === 'md' ? 24 : 18} className={`text-white/20 ${playing ? 'animate-[spin_8s_linear_infinite]' : ''}`} />
        </div>
      }
      <div className="absolute inset-0 rounded-full ring-4 ring-inset ring-black/30 pointer-events-none" />
      <div className="absolute inset-[35%] rounded-full bg-[#08090e] shadow-inner" />
    </div>
  );
}

// ── Seeker progress bar ───────────────────────────────────────────────────────
function Seeker({ progress, onSeek }: { progress: number; onSeek: (e: React.MouseEvent<HTMLDivElement>) => void }) {
  return (
    <div
      className="h-1.5 bg-white/10 rounded-full relative cursor-pointer group"
      onClick={onSeek}
    >
      <div
        className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md shadow-violet-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

// ── Volume slider ─────────────────────────────────────────────────────────────
function VolumeSlider({ volume, muted, onVolumeChange, onToggleMute }: {
  volume: number; muted: boolean;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
}) {
  return (
    <div className="flex items-center gap-2 w-40">
      <button onClick={onToggleMute} className="text-white/40 hover:text-white transition-colors shrink-0">
        {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full relative cursor-pointer group/vol">
        <input
          type="range" min="0" max="1" step="0.01"
          value={muted ? 0 : volume}
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute left-0 top-0 bottom-0 bg-white/50 group-hover/vol:bg-violet-400 rounded-full transition-colors"
          style={{ width: `${(muted ? 0 : volume) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MusicPage() {
  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('music');
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [page, setPage] = useState(1);
  const [isEnd, setIsEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

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

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    doSearch('周杰伦', 1, true, 'music');
    setSearchQuery('周杰伦');
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

  // ── API call ──────────────────────────────────────────────────────────────
  const apiCall = async (action: string, args: unknown[]) => {
    const res = await fetch('/api/music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pluginUrl: PLUGIN_URL, action, args }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  };

  const doSearch = async (query: string, pageNum = 1, reset = true, tab: SearchTab = activeTab) => {
    if (!query.trim()) return;
    if (reset) {
      setLoading(true);
      setSongs([]); setAlbums([]); setArtists([]);
      setPage(1); setIsEnd(false);
    } else {
      setLoadingMore(true);
    }
    setError('');
    try {
      const actionMap: Record<SearchTab, string> = {
        music: 'search',
        album: 'searchAlbum',
        artist: 'searchArtist',
      };
      const data = await apiCall(actionMap[tab], [query, pageNum, tab]);
      const items = data.data || [];
      if (reset) {
        if (tab === 'music') setSongs(items);
        else if (tab === 'album') setAlbums(items);
        else setArtists(items);
        setCurrentQuery(query);
      } else {
        if (tab === 'music') setSongs(prev => {
          const ids = new Set(prev.map(s => s.id));
          return [...prev, ...items.filter((s: Song) => !ids.has(s.id))];
        });
        else if (tab === 'album') setAlbums(prev => [...prev, ...items]);
        else setArtists(prev => [...prev, ...items]);
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
    if (currentQuery) doSearch(currentQuery, 1, true, tab);
  };

  // ── Playback ──────────────────────────────────────────────────────────────
  const playSongFromQueue = useCallback(async (song: Song, newQueue?: Song[]) => {
    setCurrentSong(song);
    setIsPlaying(false);
    setPlayLoading(true);
    setError('');
    if (newQueue) setQueue(newQueue);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, isMuted]);

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
    setLiked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const cycleRepeat = () => {
    setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none');
  };

  const fmt = (t: number) => {
    if (!t || isNaN(t)) return '0:00';
    return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-36 lg:pb-28 bg-[#06070d] text-white relative overflow-x-hidden">

      {/* ── Hidden audio element ── */}
      <audio
        ref={audioRef}
        onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
      />

      {/* ── Ambient BG ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {currentSong?.artwork && (
          <img
            src={currentSong.artwork}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.08] blur-[140px] scale-125 transition-all duration-[2000ms]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06070d]/70 via-[#06070d]/85 to-[#06070d]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[180px] animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/4 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* ── Main Layout ── */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="flex gap-8">

          {/* ── Left Sidebar (desktop) ── */}
          <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col gap-6 sticky top-6 self-start">

            {/* App title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <span className="text-lg">🐱</span>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-purple-400">喵喵音乐</h1>
                <p className="text-[10px] text-white/30 tracking-widest uppercase mt-0.5">Powered by Kuwo</p>
              </div>
            </div>

            {/* Album artwork */}
            <div className="relative">
              <div className={`relative rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] ring-1 ${isPlaying ? 'ring-violet-500/40' : 'ring-white/5'} transition-all duration-500`}>
                {currentSong?.artwork ? (
                  <img
                    src={currentSong.artwork}
                    alt="cover"
                    className={`w-full aspect-square object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
                  />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-violet-900/30 to-purple-900/30 flex flex-col items-center justify-center gap-4">
                    <Disc3 size={80} className={`text-white/10 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`} />
                    <p className="text-white/20 text-xs font-medium">暂无封面</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {isPlaying && (
                  <div className="absolute bottom-4 left-4">
                    <WaveformBars playing={isPlaying} />
                  </div>
                )}
              </div>
            </div>

            {/* Now playing info */}
            <div className="space-y-1 px-1">
              <h2 className="text-base font-black truncate">{currentSong?.title || '— 暂无播放 —'}</h2>
              <p className="text-sm text-white/50 truncate">{currentSong?.artist || '选择一首歌曲开始播放'}</p>
              {currentSong?.album && <p className="text-xs text-white/25 truncate">{currentSong.album}</p>}
            </div>

            {/* Liked songs quick-count */}
            {liked.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Heart size={14} className="text-rose-400" fill="currentColor" />
                <span className="text-xs text-rose-300 font-medium">已收藏 {liked.size} 首</span>
              </div>
            )}

            {/* Queue panel */}
            {showQueue && queue.length > 0 && (
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">播放队列</span>
                  <span className="text-xs text-white/30">{queue.length} 首</span>
                </div>
                <div className="overflow-y-auto max-h-64 custom-scrollbar">
                  {queue.map((s, i) => (
                    <button
                      key={`${s.id}-${i}`}
                      onClick={() => playSongFromQueue(s)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${currentSong?.id === s.id ? 'bg-violet-600/15 text-violet-300' : 'hover:bg-white/5 text-white/60'}`}
                    >
                      <span className="text-xs w-5 shrink-0 text-center opacity-40">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{s.title}</p>
                        <p className="text-[10px] text-white/30 truncate">{s.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard hint */}
            <div className="flex items-center gap-2 text-[10px] text-white/15 font-mono tracking-wider px-1">
              <span className="px-1.5 py-0.5 rounded border border-white/10">Space</span> 播放
              <span className="px-1.5 py-0.5 rounded border border-white/10 ml-1">←→</span> 切换
              <span className="px-1.5 py-0.5 rounded border border-white/10 ml-1">M</span> 静音
            </div>
          </aside>

          {/* ── Right: Search + List ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Mobile header */}
            <div className="lg:hidden flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <span className="text-sm">🐱</span>
              </div>
              <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-purple-400">喵喵音乐</h1>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch}>
              <div className="relative flex items-center group">
                <Search size={16} className="absolute left-4 text-white/30 group-focus-within:text-violet-400 transition-colors z-10" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索歌曲、歌手、专辑..."
                  className="w-full bg-white/[0.06] hover:bg-white/[0.08] border border-white/10 focus:border-violet-500/50 focus:bg-white/[0.09] rounded-2xl py-3.5 pl-11 pr-28 text-sm transition-all outline-none placeholder:text-white/25"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/20 active:scale-95"
                >
                  搜索
                </button>
              </div>
            </form>

            {/* Hot queries */}
            {!currentQuery && (
              <div className="flex flex-wrap gap-2">
                {HOT_QUERIES.map(q => (
                  <button
                    key={q}
                    onClick={() => { setSearchQuery(q); doSearch(q, 1, true, activeTab); }}
                    className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 text-xs text-white/50 hover:text-violet-300 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/[0.07] pb-0">
              {([
                { id: 'music', label: '单曲', icon: Music },
                { id: 'album', label: '专辑', icon: Library },
                { id: 'artist', label: '歌手', icon: Mic2 },
              ] as { id: SearchTab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-all duration-200 -mb-px ${activeTab === id
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-white/30 hover:text-white/60'
                    }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <span className="font-bold">⚠</span> {error}
              </div>
            )}

            {/* Count badge */}
            {(songs.length > 0 || albums.length > 0 || artists.length > 0) && (
              <div className="flex items-center gap-2 text-[11px] text-white/25 font-medium px-1">
                <span>
                  {activeTab === 'music' ? `已加载 ${songs.length} 首歌曲` :
                    activeTab === 'album' ? `已加载 ${albums.length} 张专辑` :
                      `已加载 ${artists.length} 位歌手`}
                </span>
                {!isEnd && <span className="text-violet-400/50">· 向下滚动加载更多</span>}
                {isEnd && <span className="text-white/15">· 已全部加载</span>}
              </div>
            )}

            {/* ── Music Tab ── */}
            {activeTab === 'music' && (
              <div className="rounded-3xl bg-white/[0.025] border border-white/[0.05] overflow-hidden backdrop-blur-xl">
                {/* List header */}
                <div className="grid grid-cols-[2rem_1fr_auto_auto] sm:grid-cols-[2rem_1fr_1fr_auto_auto] gap-3 px-5 py-3.5 border-b border-white/[0.06] text-[10px] font-extrabold text-white/20 uppercase tracking-widest">
                  <div className="text-center">#</div>
                  <div>歌曲</div>
                  <div className="hidden sm:block">专辑</div>
                  <div className="text-center">♡</div>
                  <div />
                </div>
                <div ref={listRef} className="overflow-y-auto custom-scrollbar max-h-[60vh] lg:max-h-[62vh]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-white/30 animate-pulse">搜索中...</p>
                    </div>
                  ) : songs.length > 0 ? (
                    <div className="p-2">
                      {songs.map((song, i) => {
                        const isActive = currentSong?.id === song.id;
                        const isLiked = liked.has(song.id);
                        return (
                          <div
                            key={`${song.id}-${i}`}
                            onClick={() => playSong(song)}
                            className={`group grid grid-cols-[2rem_1fr_auto_auto] sm:grid-cols-[2rem_1fr_1fr_auto_auto] gap-3 items-center px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-200
                              ${isActive
                                ? 'bg-violet-600/15 border border-violet-500/20'
                                : 'hover:bg-white/[0.05] border border-transparent'
                              }`}
                          >
                            {/* # / waveform */}
                            <div className="flex items-center justify-center shrink-0 h-5">
                              {isActive && isPlaying
                                ? <WaveformBars playing={isPlaying} />
                                : <>
                                  <span className={`text-xs font-bold group-hover:hidden ${isActive ? 'text-violet-400' : 'text-white/25'}`}>{i + 1}</span>
                                  <Play size={12} className="hidden group-hover:block text-white/50 ml-0.5" fill="currentColor" />
                                </>
                              }
                            </div>

                            {/* Title + Artist */}
                            <div className="flex items-center gap-3 min-w-0">
                              {song.artwork
                                ? <img src={song.artwork} alt="" className="w-10 h-10 rounded-xl object-cover shadow-md hidden sm:block shrink-0" />
                                : <div className="w-10 h-10 rounded-xl bg-white/[0.04] hidden sm:flex items-center justify-center shrink-0"><Music size={14} className="text-white/15" /></div>
                              }
                              <div className="min-w-0">
                                <p className={`text-sm font-bold truncate ${isActive ? 'text-violet-300' : 'text-white/90'}`}>{song.title}</p>
                                <p className="text-xs text-white/35 truncate mt-0.5">{song.artist}</p>
                              </div>
                            </div>

                            {/* Album */}
                            <p className="hidden sm:block text-xs text-white/30 truncate pr-2">{song.album}</p>

                            {/* Like */}
                            <button
                              onClick={e => { e.stopPropagation(); toggleLike(song.id); }}
                              className={`p-1.5 transition-all ${isLiked ? 'text-rose-400 scale-110' : 'text-white/15 hover:text-white/50'}`}
                            >
                              <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                            </button>

                            {/* Loading indicator */}
                            <div className="w-4 flex items-center justify-center">
                              {isActive && playLoading && <Loader2 size={12} className="animate-spin text-violet-400" />}
                            </div>
                          </div>
                        );
                      })}

                      {/* Sentinel */}
                      <div ref={sentinelRef} className="py-5 flex items-center justify-center">
                        {loadingMore && (
                          <div className="flex items-center gap-2 text-xs text-white/25">
                            <div className="w-4 h-4 border border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
                            加载更多...
                          </div>
                        )}
                        {isEnd && songs.length > 0 && (
                          <p className="text-xs text-white/15">— 共 {songs.length} 首 —</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/15">
                      <Music size={48} className="opacity-30" />
                      <p className="text-sm">搜索歌曲，开始播放</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Album Tab ── */}
            {activeTab === 'album' && (
              <div className="min-h-48">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-white/30 animate-pulse">搜索中...</p>
                  </div>
                ) : albums.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {albums.map((album, i) => (
                      <div key={`${album.id}-${i}`} className="group flex flex-col gap-3 cursor-pointer" onClick={() => {
                        setActiveTab('music');
                        doSearch(album.artist, 1, true, 'music');
                        setSearchQuery(album.artist);
                      }}>
                        <div className="relative rounded-2xl overflow-hidden aspect-square shadow-xl bg-white/[0.04]">
                          {album.artwork
                            ? <img src={album.artwork} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <div className="w-full h-full flex items-center justify-center"><Library size={36} className="text-white/15" /></div>
                          }
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                            <Play size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                          </div>
                        </div>
                        <div className="min-w-0 px-1">
                          <p className="text-sm font-bold truncate">{album.title}</p>
                          <p className="text-xs text-white/40 truncate mt-0.5">{album.artist}</p>
                          {album.date && <p className="text-[10px] text-white/20 mt-0.5">{album.date}</p>}
                        </div>
                      </div>
                    ))}
                    <div ref={sentinelRef} className="py-2">
                      {loadingMore && <div className="flex items-center gap-2 text-xs text-white/25 px-2"><div className="w-4 h-4 border border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />加载中...</div>}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/15">
                    <Library size={48} className="opacity-30" />
                    <p className="text-sm">搜索专辑</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Artist Tab ── */}
            {activeTab === 'artist' && (
              <div className="min-h-48">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-white/30 animate-pulse">搜索中...</p>
                  </div>
                ) : artists.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {artists.map((artist, i) => (
                      <div key={`${artist.id}-${i}`} className="group flex flex-col items-center gap-3 cursor-pointer" onClick={() => {
                        setActiveTab('music');
                        doSearch(artist.name, 1, true, 'music');
                        setSearchQuery(artist.name);
                      }}>
                        <div className="relative w-full aspect-square rounded-full overflow-hidden shadow-xl bg-white/[0.04] ring-2 ring-transparent group-hover:ring-violet-500/40 transition-all duration-300">
                          {artist.avatar
                            ? <img src={artist.avatar} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            : <div className="w-full h-full flex items-center justify-center"><User size={36} className="text-white/15" /></div>
                          }
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                        </div>
                        <div className="text-center min-w-0 w-full px-1">
                          <p className="text-sm font-bold truncate">{artist.name}</p>
                          {artist.worksNum && <p className="text-xs text-white/30 mt-0.5">{artist.worksNum} 首歌曲</p>}
                        </div>
                      </div>
                    ))}
                    <div ref={sentinelRef} className="py-2">
                      {loadingMore && <div className="flex items-center gap-2 text-xs text-white/25 px-2"><div className="w-4 h-4 border border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />加载中...</div>}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 gap-4 text-white/15">
                    <Mic2 size={48} className="opacity-30" />
                    <p className="text-sm">搜索歌手</p>
                  </div>
                )}
              </div>
            )}

          </div>{/* end right column */}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ── Mobile Fullscreen Player ──
      ═════════════════════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-[60] flex flex-col lg:hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${showFullPlayer ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
      >
        {/* BG */}
        <div className="absolute inset-0 bg-[#0a0b10]" />
        {currentSong?.artwork && (
          <img src={currentSong.artwork} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[80px] scale-110 pointer-events-none transition-all duration-[1500ms]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#0a0b10]/60 to-[#0a0b10] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Drag handle / close */}
          <div className="flex justify-center items-center pt-4 pb-2 shrink-0">
            <button onClick={() => setShowFullPlayer(false)} className="flex flex-col items-center gap-2 group">
              <div className="w-10 h-1 rounded-full bg-white/20 group-active:bg-white/40 transition-colors" />
              <ChevronDown size={16} className="text-white/20" />
            </button>
          </div>

          <div className="flex-1 flex flex-col px-8 pb-8 gap-7 overflow-auto min-h-0">
            {/* Album art */}
            <div className="flex-1 flex items-center justify-center py-2">
              <div className={`w-full max-w-[280px] aspect-square rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] transition-all duration-700 ${isPlaying ? 'scale-100' : 'scale-90 opacity-80'}`}>
                {currentSong?.artwork
                  ? <img src={currentSong.artwork} alt="cover" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-violet-900/30 to-purple-900/30 flex items-center justify-center">
                    <Disc3 size={100} className={`text-white/15 ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`} />
                  </div>
                }
              </div>
            </div>

            {/* Song info */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-black text-white truncate">{currentSong?.title || '—'}</h2>
                <p className="text-sm text-white/50 truncate mt-1">{currentSong?.artist || '请选择音乐'}</p>
              </div>
              <button
                onClick={() => currentSong && toggleLike(currentSong.id)}
                className={`mt-1 shrink-0 p-2 rounded-full transition-all ${currentSong && liked.has(currentSong.id) ? 'text-rose-400 scale-110' : 'text-white/30'}`}
              >
                <Heart size={24} fill={currentSong && liked.has(currentSong.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Seeker */}
            <div className="space-y-2">
              <Seeker progress={progress} onSeek={seekTo} />
              <div className="flex justify-between text-xs text-white/30 font-medium">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-around">
              <button onClick={cycleRepeat} className={`p-2 transition-all ${repeatMode !== 'none' ? 'text-violet-400' : 'text-white/30'}`}>
                {repeatMode === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
              </button>
              <button onClick={playPrev} className="p-2 text-white/70 active:text-white active:scale-90 transition-all">
                <SkipBack size={32} fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                disabled={!currentSong || playLoading}
                className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-transform shadow-2xl disabled:opacity-40"
              >
                {playLoading
                  ? <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  : isPlaying ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />
                }
              </button>
              <button onClick={playNext} className="p-2 text-white/70 active:text-white active:scale-90 transition-all">
                <SkipForward size={32} fill="currentColor" />
              </button>
              <button onClick={() => setShuffle(s => !s)} className={`p-2 transition-all ${shuffle ? 'text-violet-400' : 'text-white/30'}`}>
                <Shuffle size={22} />
              </button>
            </div>

            {/* Volume */}
            <VolumeSlider volume={volume} muted={isMuted} onVolumeChange={handleVolumeChange} onToggleMute={toggleMute} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ── Bottom Player Bar ──
      ═════════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-[96px] lg:bottom-0 left-0 right-0 z-[90] px-3 lg:px-0 pointer-events-none">

        {/* Desktop bg */}
        <div className="hidden lg:block absolute inset-0 bg-[#06070d]/90 backdrop-blur-3xl border-t border-white/[0.06]" />

        {/* Mobile floating pill bg */}
        <div className="lg:hidden absolute inset-0 mx-auto max-w-lg bg-[#141520]/85 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_20px_rgba(139,92,246,0.15)] overflow-hidden">
          {/* pill progress bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5">
            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Desktop progress */}
        <div className="hidden lg:block h-[3px] bg-white/[0.08] cursor-pointer group relative z-10" onClick={seekTo}>
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-violet-500 to-purple-400 transition-[width] duration-200 group-hover:h-[5px] group-hover:-translate-y-[1px]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Mobile mini bar */}
        <div
          className="lg:hidden pointer-events-auto relative z-10 flex items-center gap-3 px-4 h-[68px] cursor-pointer select-none max-w-lg mx-auto"
          onClick={() => currentSong && setShowFullPlayer(true)}
        >
          {/* Disc art */}
          <div className="shrink-0">
            <DiscArt artwork={currentSong?.artwork} playing={isPlaying} size="sm" />
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold text-white truncate">{currentSong?.title || '喵喵音乐'}</p>
            <p className="text-[11px] text-white/40 truncate mt-0.5">{currentSong?.artist || '点击搜索，开始播放'}</p>
          </div>
          {/* Like */}
          <button
            onClick={e => { e.stopPropagation(); currentSong && toggleLike(currentSong.id); }}
            className={`p-2.5 shrink-0 transition-colors ${currentSong && liked.has(currentSong.id) ? 'text-rose-400' : 'text-white/20'}`}
          >
            <Heart size={19} fill={currentSong && liked.has(currentSong.id) ? 'currentColor' : 'none'} />
          </button>
          {/* Play/Pause */}
          <button
            onClick={e => { e.stopPropagation(); togglePlay(); }}
            disabled={!currentSong || playLoading}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-40 shrink-0"
          >
            {playLoading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />
            }
          </button>
        </div>

        {/* Desktop bar */}
        <div className="hidden lg:grid grid-cols-3 pointer-events-auto relative z-10 max-w-screen-xl mx-auto px-6 lg:px-8 h-[72px] items-center gap-4">

          {/* Track info */}
          <div className="flex items-center gap-4 min-w-0">
            <DiscArt artwork={currentSong?.artwork} playing={isPlaying} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentSong?.title || '—'}</p>
              <p className="text-xs text-white/40 truncate mt-0.5">{currentSong?.artist || '等待播放'}</p>
            </div>
            <button
              onClick={() => currentSong && toggleLike(currentSong.id)}
              className={`ml-1 shrink-0 p-1.5 transition-all ${currentSong && liked.has(currentSong.id) ? 'text-rose-400' : 'text-white/20 hover:text-white/50'}`}
            >
              <Heart size={16} fill={currentSong && liked.has(currentSong.id) ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-5">
              <button onClick={() => setShuffle(s => !s)} className={`transition-colors ${shuffle ? 'text-violet-400' : 'text-white/30 hover:text-white'}`}>
                <Shuffle size={16} />
              </button>
              <button onClick={playPrev} className="text-white/50 hover:text-white transition-colors">
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                disabled={!currentSong || playLoading}
                className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl disabled:opacity-40"
              >
                {playLoading
                  ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  : isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />
                }
              </button>
              <button onClick={playNext} className="text-white/50 hover:text-white transition-colors">
                <SkipForward size={20} fill="currentColor" />
              </button>
              <button onClick={cycleRepeat} className={`transition-colors ${repeatMode !== 'none' ? 'text-violet-400' : 'text-white/30 hover:text-white'}`}>
                {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/25 font-mono tabular-nums">
              <span>{fmt(currentTime)}</span>
              <span className="text-white/10">/</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Volume + Queue */}
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setShowQueue(q => !q)}
              className={`p-1.5 transition-colors ${showQueue ? 'text-violet-400' : 'text-white/30 hover:text-white'}`}
              title="播放队列"
            >
              <ListMusic size={18} />
            </button>
            <VolumeSlider volume={volume} muted={isMuted} onVolumeChange={handleVolumeChange} onToggleMute={toggleMute} />
          </div>
        </div>
      </div>

      {/* ── Global styles ── */}
      <style jsx global>{`
        @keyframes musicbar {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.4); }
      `}</style>
    </div>
  );
}
