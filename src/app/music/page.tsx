'use client';

import { useState } from 'react';
import {
  Search, Loader2, Play, ExternalLink,
  Disc3, MicVocal,  HeadphonesIcon, Sparkles
} from 'lucide-react';
import { useMusic } from '@/context/MusicContext';
import MusicPlayer from '@/components/MusicPlayer';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

type QQSinger = { name: string };
type QQAlbum = { mid?: string; name?: string };
type QQSongFile = { size_flac?: number; size_320mp3?: number };
type QQSong = {
  id?: number;
  mid: string;
  name: string;
  singer?: QQSinger[];
  album?: QQAlbum;
  file?: QQSongFile;
};

export default function MusicPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QQSong[]>([]);
  const [error, setError] = useState('');
  const { playSong, currentSong, isPlaying } = useMusic();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const payload = {
        'music.search.SearchCgiService': {
          module: 'music.search.SearchCgiService',
          method: 'DoSearchForQQMusicDesktop',
          param: { query: query.trim(), page_num: 1, num_per_page: 40, search_type: 0 },
        },
      };
      const res = await fetch(
        'https://proxy.api.030101.xyz/https://u.y.qq.com/cgi-bin/musicu.fcg',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      const list = data?.['music.search.SearchCgiService']?.data?.body?.song?.list as QQSong[] | undefined;
      if (list?.length) setResults(list);
      else setError(t('music.notFound'));
    } catch {
      setError(t('music.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* ──────────────── HERO ──────────────── */}
      <section className="relative overflow-hidden pt-12 pb-10 px-4">
        {/* Background aurora */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-pink-600/8 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-3xl mx-auto text-center space-y-6">
          {/* Icon badge */}
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase text-purple-400 bg-purple-400/10 border border-purple-400/20 px-3 py-1.5 rounded-full">
            <Sparkles size={12} />
            {t('music.badge')}
            <Sparkles size={12} />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                {t('music.titleA')}
              </span>
              <span className="text-white ml-3">{t('music.titleB')}</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium">
              {t('music.subtitle')}
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="flex items-center h-14 sm:h-16 bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all shadow-2xl">
              <div className="pl-5 text-slate-500 pointer-events-none">
                {loading ? <Loader2 size={20} className="animate-spin text-purple-400" /> : <Search size={20} />}
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('music.placeholder')}
                className="flex-1 h-full bg-transparent text-white font-semibold px-4 focus:outline-none placeholder:text-slate-600 text-sm sm:text-base"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-full px-6 sm:px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm tracking-wide hover:from-indigo-500 hover:to-purple-500 active:scale-95 transition-all disabled:opacity-40"
              >
                {t('common.search')}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ──────────────── CONTENT ──────────────── */}
      <section className="flex-1 max-w-[1300px] w-full mx-auto px-4 sm:px-6 pb-32">

        {/* Error */}
        {error && (
          <p className="text-center text-rose-400/80 bg-rose-500/5 border border-rose-500/10 rounded-2xl py-4 px-6 text-sm font-semibold">
            {error}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-4 mt-6">
            {/* Header row */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5 px-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black tracking-widest text-slate-600 uppercase">#</span>
              <span className="text-xs font-black tracking-widest text-slate-600 uppercase">{t('music.colTrack')}</span>
              </div>
              <div className="hidden sm:flex items-center gap-6 text-xs font-black tracking-widest text-slate-600 uppercase">
              <span className="w-32 text-right">{t('music.colAlbum')}</span>
              <span className="w-16 text-right">{t('music.colQuality')}</span>
              </div>
            </div>

            {/* Track rows */}
            <div className="space-y-1">
              {results.map((song, idx) => {
                const isCurrent = currentSong?.mid === song.mid;
                const playingNow = isCurrent && isPlaying;
                const albumMid = song.album?.mid;
                const thumb = albumMid
                  ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg`
                  : null;
                const hasFlac = (song.file?.size_flac ?? 0) > 0;
                const has320  = (song.file?.size_320mp3 ?? 0) > 0;

                return (
                  <div
                    key={song.id ?? idx}
                    onClick={() => playSong(song)}
                    className={`group flex items-center gap-3 sm:gap-4 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-indigo-600/15 to-purple-600/10 border border-purple-500/20'
                        : 'hover:bg-white/[0.04] border border-transparent hover:border-white/5'
                    }`}
                  >
                    {/* Track number / play indicator */}
                    <div className="w-8 text-center shrink-0">
                      {playingNow ? (
                        <div className="flex items-end justify-center gap-0.5 h-4 mx-auto w-5">
                          <div className="w-1 bg-purple-400 animate-music-bar-1 rounded-full" />
                          <div className="w-1 bg-purple-400 animate-music-bar-2 rounded-full" />
                          <div className="w-1 bg-purple-400 animate-music-bar-3 rounded-full" />
                        </div>
                      ) : (
                        <>
                          <span className={`text-xs font-black font-mono group-hover:hidden ${isCurrent ? 'text-purple-400' : 'text-white/20'}`}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <Play
                            size={14}
                            fill="currentColor"
                            className={`text-purple-400 hidden group-hover:block mx-auto`}
                          />
                        </>
                      )}
                    </div>

                    {/* Album art */}
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-white/5 shrink-0 shadow">
                      {thumb ? (
                        <Image
                          src={thumb} alt={song.name} fill unoptimized
                          className={`object-cover transition-transform duration-500 group-hover:scale-110 ${playingNow ? 'animate-spin-slow' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/30 to-purple-900/30">
                          <Disc3 size={18} className="text-white/15" />
                        </div>
                      )}
                    </div>

                    {/* Song name + artists */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isCurrent ? 'text-purple-300' : 'text-white/90 group-hover:text-white'}`}>
                        {song.name}
                      </p>
                      <p className="text-xs text-white/30 truncate mt-0.5 flex items-center gap-1">
                        <MicVocal size={10} className="shrink-0 opacity-60" />
                        {song.singer?.map((s) => s.name).join(' / ')}
                      </p>
                    </div>

                    {/* Album (desktop) */}
                    <p className="hidden sm:block text-xs text-white/20 truncate w-32 text-right font-medium">
                      {song.album?.name ?? '—'}
                    </p>

                    {/* Quality + link */}
                    <div className="flex items-center gap-2 shrink-0 w-20 justify-end">
                      {hasFlac ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 tracking-widest">FLAC</span>
                      ) : has320 ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 tracking-widest">320K</span>
                      ) : (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/5 text-white/20 border border-white/10 tracking-widest">STD</span>
                      )}
                      <a
                        href={`https://y.qq.com/n/ryqq/songDetail/${song.mid}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-white/10 hover:text-white/50 hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !results.length && !error && (
          <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
            <div className="w-28 h-28 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <HeadphonesIcon size={48} className="text-white/8" />
            </div>
            <div>
              <p className="text-white/15 font-black text-xl">搜索音乐</p>
              <p className="text-white/8 text-sm mt-1">输入歌手、歌曲或专辑名称</p>
            </div>
          </div>
        )}
      </section>

      {/* ──────── MUSIC PLAYER (only on this page) ──────── */}
      <MusicPlayer />
    </div>
  );
}
