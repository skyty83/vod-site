'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, MonitorPlay, Tv, Wifi, Radio, Volume2, CalendarRange, List, ChevronRight, Clock, Settings2, Layers, Filter } from 'lucide-react';
import Player from '@/components/Player';

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
   const [currentTime, setCurrentTime] = useState<Date | null>(null);

   // EPG Data
   const [epgData, setEpgData] = useState<Record<string, EPGProgram[]>>({});
   const [epgLoading, setEpgLoading] = useState(false);

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
      setSelectedChannel(channel);
      const nodeIdx = channels.filter(ch => ch.name === channel.name).findIndex(ch => ch.url === channel.url);
      setActiveUrlIndex(nodeIdx !== -1 ? nodeIdx : 0);
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
      <div className="h-screen bg-white dark:bg-[#02050a] text-slate-900 dark:text-white flex flex-col font-sans overflow-y-auto lg:overflow-hidden relative selection:bg-rose-600">

         <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[200px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-600/5 blur-[200px] animate-pulse [animation-delay:3s]"></div>
         </div>

         <header className="h-20 sm:h-24 shrink-0 flex items-center justify-between px-4 sm:px-10 relative z-50">
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

         <main className="lg:h-[calc(100vh-6rem)] flex flex-col lg:flex-row lg:overflow-hidden relative z-10 px-4 sm:px-8 pb-8 gap-4 sm:gap-8">
            <aside className="w-full lg:w-[280px] xl:w-[320px] shrink-0 flex flex-col gap-6 lg:overflow-hidden">
               <div className="flex-1 border border-white/[0.04] bg-white/[0.02] backdrop-blur-3xl rounded-3xl lg:rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
                  <div className="p-5 lg:p-8 border-b border-white/[0.03] space-y-2 lg:space-y-4 hidden lg:block">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="text-[11px] font-black tracking-[.2em] uppercase text-slate-300">Hub Discovery</span>
                     </div>
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">Select a category and explore worldwide broadcast feeds.</p>
                  </div>

                  <div className="p-3 lg:p-6 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto custom-scrollbar flex-1 lg:space-y-2 scrollbar-hide">
                     {categories.map(cat => (
                        <button
                           key={cat}
                           onClick={() => setActiveCategory(cat)}
                           className={`shrink-0 lg:w-full flex items-center justify-between px-4 lg:px-6 py-3 lg:py-5 rounded-2xl lg:rounded-[1.8rem] transition-all group ${activeCategory === cat
                              ? 'bg-rose-600 text-white shadow-xl lg:shadow-2xl shadow-rose-600/30 font-black'
                              : 'text-slate-500 hover:text-white hover:bg-white/[0.04] bg-white/[0.02] lg:bg-transparent'
                              }`}
                        >
                           <div className="flex items-center gap-3 lg:gap-4">
                              <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center transition-all ${activeCategory === cat ? 'bg-white/20' : 'bg-black/40 group-hover:bg-rose-600/20'}`}>
                                 {cat.includes('央视') ? <Tv size={16} className="lg:w-[18px] lg:h-[18px]" /> : (cat.includes('卫视') ? <Radio size={16} className="lg:w-[18px] lg:h-[18px]" /> : <MonitorPlay size={16} className="lg:w-[18px] lg:h-[18px]" />)}
                              </div>
                              <span className="text-xs lg:text-[13px] tracking-tight whitespace-nowrap">{cat}</span>
                           </div>
                           <ChevronRight size={14} className={`hidden lg:block ${activeCategory === cat ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 transition-opacity'}`} />
                        </button>
                     ))}
                  </div>
               </div>
            </aside>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-8 lg:overflow-hidden">
               <div className="flex-1 flex flex-col lg:overflow-hidden min-h-[50vh] lg:h-full">
                  <div className="flex-1 flex flex-col gap-4 sm:gap-8 lg:overflow-hidden bg-black/40 border border-white/[0.04] backdrop-blur-3xl rounded-3xl lg:rounded-[4rem] p-4 sm:p-6 lg:p-10 relative group/p-sec">
                     <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="space-y-2 sm:space-y-4">
                           <div className="flex items-center gap-2 bg-rose-500/10 text-rose-500 text-[9px] font-black tracking-[0.4em] uppercase py-1.5 px-4 rounded-full border border-rose-500/20 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              Now Broadcasting
                           </div>
                           <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black tracking-[-0.07em] leading-none uppercase truncate">{selectedChannel?.name}</h2>
                           <div className="bg-white/5 border border-white/5 p-2 rounded-xl flex items-center gap-2 w-fit">
                              <Layers size={14} className="text-amber-500" />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-2">Route Index</span>
                              <div className="flex gap-1.5">
                                 {availableNodes.map((n, idx) => (
                                    <button key={idx} onClick={() => { setSelectedChannel(n); setActiveUrlIndex(idx); }} className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all ${activeUrlIndex === idx ? 'bg-amber-500 text-black' : 'bg-white/5 text-slate-600 hover:text-white'}`}>{idx + 1}</button>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl lg:rounded-[2.5rem] p-4 lg:p-8 sm:min-w-[280px] lg:min-w-[340px] flex items-center gap-4 lg:gap-6 group/epg cursor-default">
                           <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0"><CalendarRange size={20} className="lg:w-6 lg:h-6" /></div>
                           <div className="flex-1 min-w-0">
                              {epgLoading ? <div className="h-4 w-32 bg-white/5 animate-pulse rounded-full"></div> : currentProgram ? (
                                 <div className="space-y-1">
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{currentProgram.start.slice(8, 10)}:{currentProgram.start.slice(10, 12)} - {currentProgram.stop.slice(8, 10)}:{currentProgram.stop.slice(10, 12)}</span>
                                    <p className="text-lg font-black leading-tight truncate max-w-[200px]">{currentProgram.title}</p>
                                 </div>
                              ) : <span className="text-sm font-bold text-slate-700 italic">No Schedule Found</span>}
                           </div>
                        </div>
                     </div>
                     <div className="relative flex-1 bg-black rounded-2xl lg:rounded-[4rem] overflow-hidden shadow-[0_30px_50px_rgba(0,0,0,0.8)] lg:shadow-[0_60px_100px_rgba(0,0,0,1)] ring-1 ring-white/10 group/player-box min-h-[250px]">
                        {selectedChannel && <Player key={selectedChannel.url} url={selectedChannel.url} />}
                     </div>
                  </div>
               </div>
               <div className="w-full lg:w-[380px] xl:w-[450px] shrink-0 flex flex-col gap-4 sm:gap-6 lg:overflow-hidden pb-10 lg:pb-0 h-[400px] lg:h-auto">
                  <div className="p-4 sm:p-6 lg:p-10 bg-white/[0.02] border border-white/[0.04] backdrop-blur-3xl rounded-3xl lg:rounded-[4rem] flex-1 flex flex-col overflow-hidden shadow-2xl">
                     <div className="space-y-4 lg:space-y-6 mb-6 lg:mb-10 shrink-0">
                        <div className="flex items-center justify-between"><span className="text-[10px] lg:text-[11px] font-black tracking-[.4em] uppercase text-rose-500 flex items-center gap-2"><List size={16} /> Hub Navigator</span><Filter size={18} className="text-slate-500 hidden sm:block" /></div>
                        <div className="relative group"><Search className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-rose-500" size={18} /><input type="text" placeholder="FILTER STATIONS" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/[0.05] rounded-[1.5rem] lg:rounded-[2rem] py-3 lg:py-5 pl-12 lg:pl-16 pr-6 lg:pr-8 text-[10px] lg:text-[11px] font-black focus:outline-none transition-all placeholder:text-slate-700 shadow-inner" /></div>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 lg:space-y-4 pr-1 lg:pr-2">
                        {filteredChannels.map((ch, idx) => {
                           const isS = selectedChannel?.name === ch.name;
                           return (
                              <button key={idx} onClick={() => handleChannelSelect(ch)} className={`w-full group/i flex items-center gap-3 lg:gap-6 p-3 lg:p-6 rounded-[1.5rem] lg:rounded-[2.8rem] transition-all relative overflow-hidden border ${isS ? 'bg-rose-600 border-rose-400 shadow-[0_10px_30px_-5px_rgba(225,29,72,0.4)] lg:translate-x-1' : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1] hover:scale-[1.02]'}`}>
                                 <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-3xl flex items-center justify-center shrink-0 transition-transform duration-700 ${isS ? 'bg-white/20' : 'bg-black/40 text-slate-700 group-hover/i:text-rose-500'}`}>{isS ? <Volume2 size={20} className="lg:w-6 lg:h-6" /> : <span className="text-xs lg:text-sm font-black opacity-30 italic">{String(idx + 1).padStart(2, '0')}</span>}</div>
                                 <div className="flex-1 text-left min-w-0"><p className={`font-black text-base lg:text-xl tracking-tighter truncate ${isS ? 'text-white' : 'text-slate-400 group-hover/i:text-slate-200'}`}>{ch.name}</p><span className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest ${isS ? 'text-rose-200' : 'text-slate-800'}`}>HD Source Approved</span></div>
                                 {isS && <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-white shadow-[0_0_10px_white]"></div>}
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
