'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Search, MonitorPlay, Tv, Play, Wifi, Globe, Heart, Activity, Radio, Volume2, ShieldCheck, Cpu, AlertCircle, PlayCircle, Loader2, Sparkles, Filter, Info, Terminal, Share2, Layers, Clock, Settings2, BarChart3, ScanEye, CalendarRange, Box, Navigation, Maximize2, VolumeX, Pause, List, ChevronRight } from 'lucide-react';
import Hls from 'hls.js';

interface Channel {
   name: string;
   url: string;
   group: string;
   logo?: string;
}

interface EPGProgram {
   start: string;
   stop: string;
   title: string;
   channel: string;
}

export default function LivePage() {
   const [channels, setChannels] = useState<Channel[]>([]);
   const [categories, setCategories] = useState<string[]>([]);
   const [activeCategory, setActiveCategory] = useState<string>('');
   const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
   const [activeUrlIndex, setActiveUrlIndex] = useState<number>(0);
   const [searchQuery, setSearchQuery] = useState('');
   const [loading, setLoading] = useState(true);
   const [isPlaying, setIsPlaying] = useState(false);
   const [isBuffering, setIsBuffering] = useState(false);
   const [hasError, setHasError] = useState(false);
   const [currentTime, setCurrentTime] = useState<Date | null>(null);
   const [isMuted, setIsMuted] = useState(false);
   const [volume, setVolume] = useState(80);

   // EPG Data
   const [epgData, setEpgData] = useState<Record<string, EPGProgram[]>>({});
   const [epgLoading, setEpgLoading] = useState(false);

   const videoRef = useRef<HTMLVideoElement>(null);
   const hlsRef = useRef<Hls | null>(null);

   useEffect(() => {
      setCurrentTime(new Date());
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
   }, []);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const resM3U = await fetch('https://raw.githubusercontent.com/Jsnzkpg/Jsnzkpg/Jsnzkpg/Jsnzkpg1.m3u');
            const text = await resM3U.text();
            const lines = text.split('\n');
            const parsedChannels: Channel[] = [];
            const uniqueGroups = new Set<string>();
            let currentGroup = '其他';
            let currentName = '';

            for (let i = 0; i < lines.length; i++) {
               const line = lines[i].trim();
               if (line.startsWith('#EXTINF:')) {
                  const groupMatch = line.match(/group-title="([^"]+)"/);
                  currentGroup = groupMatch ? groupMatch[1] : '其他';
                  const nameIdx = line.lastIndexOf(',');
                  currentName = nameIdx !== -1 ? line.substring(nameIdx + 1).trim() : '未知频道';
               } else if (line.startsWith('http')) {
                  if (currentName) {
                     parsedChannels.push({ name: currentName, url: line, group: currentGroup });
                     uniqueGroups.add(currentGroup);
                     currentName = '';
                  }
               }
            }
            const sortedGroups = Array.from(uniqueGroups).sort((a, b) => {
               if (a.includes('央视')) return -1;
               if (b.includes('央视')) return 1;
               return a.localeCompare(b);
            });
            setChannels(parsedChannels);
            setCategories(sortedGroups);
            if (sortedGroups.length > 0) setActiveCategory(sortedGroups[0]);
            if (parsedChannels.length > 0) setSelectedChannel(parsedChannels[0]);
            setLoading(false);
            fetchEPG();
         } catch (err) {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   const fetchEPG = async () => {
      setEpgLoading(true);
      try {
         const res = await fetch('https://live.fanmingming.cn/e.xml');
         const text = await res.text();
         const parser = new DOMParser();
         const xmlDoc = parser.parseFromString(text, "text/xml");
         const programmes = xmlDoc.getElementsByTagName("programme");
         const epgMap: Record<string, EPGProgram[]> = {};
         for (let i = 0; i < programmes.length; i++) {
            const p = programmes[i];
            const channelId = p.getAttribute("channel") || "";
            const title = p.getElementsByTagName("title")[0]?.textContent || "";
            const start = p.getAttribute("start") || "";
            const stop = p.getAttribute("stop") || "";
            if (!epgMap[channelId]) epgMap[channelId] = [];
            epgMap[channelId].push({ start, stop, title, channel: channelId });
         }
         setEpgData(epgMap);
         setEpgLoading(false);
      } catch (err) {
         setEpgLoading(false);
      }
   };

   const currentProgram = useMemo(() => {
      if (!selectedChannel || !currentTime) return null;
      const chName = selectedChannel.name;
      const epgId = Object.keys(epgData).find(id => chName.includes(id) || id.includes(chName.replace(/\s/g, '')));
      if (!epgId) return null;
      const nowStr = currentTime.toISOString().replace(/[-:T]/g, '').slice(0, 14);
      return epgData[epgId].find(p => {
         const pStart = p.start.split(' ')[0];
         const pStop = p.stop.split(' ')[0];
         return nowStr >= pStart && nowStr <= pStop;
      });
   }, [selectedChannel, epgData, currentTime]);

   const availableNodes = useMemo(() => {
      if (!selectedChannel) return [];
      return channels.filter(ch => ch.name === selectedChannel.name);
   }, [selectedChannel, channels]);

   const handleChannelSelect = (channel: Channel) => {
      setHasError(false);
      setSelectedChannel(channel);
      const nodeIdx = channels.filter(ch => ch.name === channel.name).findIndex(ch => ch.url === channel.url);
      setActiveUrlIndex(nodeIdx !== -1 ? nodeIdx : 0);
   };

   useEffect(() => {
      if (!selectedChannel || !videoRef.current) return;
      const video = videoRef.current;
      if (hlsRef.current) hlsRef.current.destroy();
      setHasError(false);
      setIsBuffering(true);
      setIsPlaying(false);
      if (Hls.isSupported()) {
         const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
         hlsRef.current = hls;
         hls.loadSource(selectedChannel.url);
         hls.attachMedia(video);
         hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (videoRef.current) videoRef.current.volume = volume / 100;
            video.play().catch(() => { });
         });
         hls.on(Hls.Events.ERROR, () => { setHasError(true); setIsBuffering(false); });
         hls.on(Hls.Events.FRAG_BUFFERED, () => { setIsBuffering(false); setIsPlaying(true); });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
         video.src = selectedChannel.url;
         video.volume = volume / 100;
         video.play().then(() => setIsPlaying(true)).catch(() => setIsBuffering(false));
      }
   }, [selectedChannel, activeUrlIndex]);

   useEffect(() => {
      if (videoRef.current) {
         videoRef.current.volume = volume / 100;
         videoRef.current.muted = isMuted;
      }
   }, [volume, isMuted]);

   const toggleFullscreen = () => {
      if (!videoRef.current) return;
      if (document.fullscreenElement) {
         document.exitFullscreen();
      } else {
         videoRef.current.requestFullscreen();
      }
   };

   const filteredChannels = useMemo(() => {
      const uniqueMap = new Map<string, Channel>();
      channels.filter(ch => ch.group === activeCategory && ch.name.toLowerCase().includes(searchQuery.toLowerCase())).forEach(ch => {
         if (!uniqueMap.has(ch.name)) uniqueMap.set(ch.name, ch);
      });
      return Array.from(uniqueMap.values());
   }, [channels, activeCategory, searchQuery]);

   if (loading) return (
      <div className="h-screen bg-[#05070a] flex items-center justify-center">
         <div className="p-10 border border-white/5 rounded-[4rem] bg-white/[0.02] backdrop-blur-3xl flex flex-col items-center gap-8 shadow-2xl">
            <div className="relative w-24 h-24">
               <div className="absolute inset-0 border-[2px] border-blue-500/10 rounded-full animate-[ping_2s_infinite]"></div>
               <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-[10px] font-black tracking-[1em] text-blue-500 uppercase animate-pulse">Initializing OS</p>
         </div>
      </div>
   );

   return (
      <div className="h-screen bg-white dark:bg-[#02050a] text-slate-900 dark:text-white flex flex-col font-sans overflow-hidden relative selection:bg-rose-600">

         <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[200px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-600/5 blur-[200px] animate-pulse [animation-delay:3s]"></div>
         </div>

         <header className="h-24 shrink-0 flex items-center justify-between px-10 relative z-50">
            <div className="flex items-center gap-6">
               <div className="hidden sm:flex items-center gap-8 px-8 py-3 bg-white/[0.03] border border-white/[0.05] rounded-[2rem] backdrop-blur-3xl">
                  <div className="flex items-center gap-3 text-slate-500 font-black text-[9px] tracking-[.3em] uppercase">
                     <Clock size={16} className="text-amber-500" />
                     {currentTime && currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="w-px h-6 bg-white/5"></div>
                  <div className="flex items-center gap-3 text-emerald-400 font-black text-[9px] tracking-[.3em] uppercase">
                     <Wifi size={16} /> 120Gbps Node
                  </div>
               </div>
               <button className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-500 hover:text-white transition-all"><Settings2 size={20} /></button>
            </div>
         </header>

         <main className="h-[calc(100vh-6rem)] flex overflow-hidden relative z-10 px-8 pb-8 gap-8">
            <aside className="w-[320px] shrink-0 flex flex-col gap-6 overflow-hidden">
               <div className="flex-1 border border-white/[0.04] bg-white/[0.02] backdrop-blur-3xl rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-white/[0.03] space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="text-[11px] font-black tracking-[.2em] uppercase text-slate-300">Hub Discovery</span>
                     </div>
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">Select a category and explore worldwide broadcast feeds.</p>
                  </div>

                  <div className="p-6 space-y-2 overflow-y-auto custom-scrollbar flex-1">
                     {categories.map(cat => (
                        <button
                           key={cat}
                           onClick={() => setActiveCategory(cat)}
                           className={`w-full flex items-center justify-between px-6 py-5 rounded-[1.8rem] transition-all group ${activeCategory === cat
                              ? 'bg-rose-600 text-white shadow-2xl shadow-rose-600/30 font-black'
                              : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'
                              }`}
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeCategory === cat ? 'bg-white/20' : 'bg-black/40 group-hover:bg-rose-600/20'}`}>
                                 {cat.includes('央视') ? <Tv size={18} /> : (cat.includes('卫视') ? <Radio size={18} /> : <MonitorPlay size={18} />)}
                              </div>
                              <span className="text-[13px] tracking-tight">{cat}</span>
                           </div>
                           <ChevronRight size={14} className={activeCategory === cat ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 transition-opacity'} />
                        </button>
                     ))}
                  </div>
               </div>
            </aside>

            <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
               <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-full">
                  <div className="flex-1 flex flex-col gap-8 overflow-hidden bg-black/40 border border-white/[0.04] backdrop-blur-3xl rounded-[4rem] p-10 relative group/p-sec">
                     <div className="flex items-end justify-between">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 bg-rose-500/10 text-rose-500 text-[9px] font-black tracking-[0.4em] uppercase py-1.5 px-4 rounded-full border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              Now Broadcasting
                           </div>
                           <h2 className="text-6xl font-black tracking-[-0.07em] leading-none uppercase">{selectedChannel?.name}</h2>
                           <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center gap-2 max-w-fit">
                              <Layers size={14} className="text-amber-500" />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-2">Route Index</span>
                              <div className="flex gap-1.5">
                                 {availableNodes.map((n, idx) => (
                                    <button key={idx} onClick={() => { setSelectedChannel(n); setActiveUrlIndex(idx); }} className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all ${activeUrlIndex === idx ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-600 hover:text-white'}`}>{idx + 1}</button>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 min-w-[340px] flex items-center gap-6 group/epg cursor-default">
                           <div className="w-14 h-14 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500"><CalendarRange size={24} /></div>
                           <div className="flex-1">
                              {epgLoading ? <div className="h-4 w-32 bg-white/5 animate-pulse rounded-full"></div> : currentProgram ? (
                                 <div className="space-y-1">
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{currentProgram.start.slice(8, 10)}:{currentProgram.start.slice(10, 12)} - {currentProgram.stop.slice(8, 10)}:{currentProgram.stop.slice(10, 12)}</span>
                                    <p className="text-lg font-black leading-tight truncate max-w-[200px]">{currentProgram.title}</p>
                                 </div>
                              ) : <span className="text-sm font-bold text-slate-700 italic">No Schedule Found</span>}
                           </div>
                        </div>
                     </div>
                     <div className="relative flex-1 bg-black rounded-[4rem] overflow-hidden shadow-[0_60px_100px_rgba(0,0,0,1)] ring-1 ring-white/10 group/player-box">
                        <video ref={videoRef} className="w-full h-full object-contain" onPlay={() => setIsPlaying(true)} onWaiting={() => setIsBuffering(true)} playsInline autoPlay />
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-10 opacity-0 group-hover/player-box:opacity-100 transition-opacity duration-700"></div>
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-[90%] flex items-center justify-between px-10 py-6 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[3rem] opacity-0 group-hover/player-box:opacity-100 group-hover/player-box:translate-y-0 translate-y-6 transition-all duration-700">
                           <div className="flex items-center gap-8">
                              <button onClick={() => videoRef.current ? (isPlaying ? (videoRef.current.pause(), setIsPlaying(false)) : (videoRef.current.play(), setIsPlaying(true))) : null} className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">
                                 {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                              </button>
                              <div className="flex items-center gap-4">
                                 <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-white transition-colors">{isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                                 <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-32 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-rose-600" />
                              </div>
                           </div>
                           <div className="flex items-center gap-10">
                              <div className="flex items-center gap-2"><Activity size={16} className="text-rose-500 px-0.5" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stable Feed</span></div>
                              <button onClick={toggleFullscreen} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all"><Maximize2 size={20} /></button>
                           </div>
                        </div>
                        {isBuffering && <div className="absolute inset-0 z-30 bg-slate-950/20 backdrop-blur-3xl flex flex-col items-center justify-center gap-6"><Loader2 size={64} className="text-rose-500 animate-spin" /><p className="text-[11px] font-black text-white tracking-[1em] uppercase">Syncing Stream...</p></div>}
                        {hasError && <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center p-20 text-center gap-8"><AlertCircle size={48} className="text-rose-500" /><h3 className="text-3xl font-black uppercase tracking-tighter">Connection Terminated</h3><button onClick={() => setSelectedChannel(selectedChannel)} className="px-12 py-4 bg-white text-black font-black rounded-full hover:bg-rose-500 hover:text-white transition-all text-[10px] tracking-widest">RESTORE SIGNAL</button></div>}
                     </div>
                  </div>
               </div>
               <div className="w-full lg:w-[450px] flex flex-col gap-6 overflow-hidden">
                  <div className="p-10 bg-white/[0.02] border border-white/[0.04] backdrop-blur-3xl rounded-[4rem] flex-1 flex flex-col overflow-hidden shadow-2xl">
                     <div className="space-y-6 mb-10 shrink-0">
                        <div className="flex items-center justify-between"><span className="text-[11px] font-black tracking-[.4em] uppercase text-rose-500 flex items-center gap-2"><List size={16} /> Hub Navigator</span><Filter size={18} className="text-slate-500" /></div>
                        <div className="relative group"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-rose-500" size={20} /><input type="text" placeholder="FILTER STATIONS" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/[0.05] rounded-[2rem] py-5 pl-16 pr-8 text-[11px] font-black focus:outline-none transition-all placeholder:text-slate-800 shadow-inner" /></div>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {filteredChannels.map((ch, idx) => {
                           const isS = selectedChannel?.name === ch.name;
                           return (
                              <button key={idx} onClick={() => handleChannelSelect(ch)} className={`w-full group/i flex items-center gap-6 p-6 rounded-[2.8rem] transition-all relative overflow-hidden border ${isS ? 'bg-rose-600 border-rose-400 shadow-[0_20px_40px_-10px_rgba(225,29,72,0.4)] translate-x-1' : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1] hover:scale-[1.02]'}`}>
                                 <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 transition-transform duration-700 ${isS ? 'bg-white/20' : 'bg-black/40 text-slate-700 group-hover/i:text-rose-500'}`}>{isS ? <Volume2 size={24} /> : <span className="text-sm font-black opacity-30 italic">{String(idx + 1).padStart(2, '0')}</span>}</div>
                                 <div className="flex-1 text-left min-w-0"><p className={`font-black text-xl tracking-tighter truncate ${isS ? 'text-white' : 'text-slate-400 group-hover/i:text-slate-200'}`}>{ch.name}</p><span className={`text-[9px] font-black uppercase tracking-widest ${isS ? 'text-rose-200' : 'text-slate-800'}`}>HD Source Approved</span></div>
                                 {isS && <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"></div>}
                              </button>
                           );
                        })}
                     </div>
                  </div>
               </div>
            </div>
         </main>
         <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar { width: 3px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.1); border-radius: 10px; }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
         `}</style>
      </div>
   );
}
