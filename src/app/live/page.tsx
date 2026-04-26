'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, MonitorPlay, Wifi, List, Clock, X, ChevronDown, Heart } from 'lucide-react';
import Player from '@/components/Player';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Channel {
   name?: string;
   url?: string;
   group: string;
   logo?: string;
}


export default function LivePage() {
   const { toggleFavoriteChannel, isFavoriteChannel } = useLocalStorage();
   const [channels, setChannels] = useState<Channel[]>([]);
   const [categories, setCategories] = useState<string[]>([]);
   const [activeCategory, setActiveCategory] = useState<string>('');
   const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
   const [channelMenuOpen, setChannelMenuOpen] = useState(false);
   const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [loading, setLoading] = useState(true);
   const [brokenLogos, setBrokenLogos] = useState<Set<string>>(new Set());
   const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

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
            let currentLogo = '';

            for (let i = 0; i < lines.length; i++) {
               const line = lines[i].trim();
               if (line.startsWith('#EXTINF:')) {
                  const groupMatch = line.match(/group-title="([^"]+)"/);
                  currentGroup = groupMatch ? groupMatch[1] : '其他';
                  const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                  currentLogo = logoMatch ? logoMatch[1] : '';
                  const nameIdx = line.lastIndexOf(',');
                  currentName = nameIdx !== -1 ? line.substring(nameIdx + 1).trim() : '未知频道';
               } else if (line.startsWith('http')) {
                  if (currentName) {
                     parsedChannels.push({ name: currentName, url: line, group: currentGroup, logo: currentLogo || undefined });
                     uniqueGroups.add(currentGroup);
                     currentName = '';
                     currentLogo = '';
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
         } catch {
            setLoading(false);
         }
      };
      fetchData();
   }, []);


   const handleChannelSelect = (channel: Channel) => {
      setSelectedChannel(channel);
      setChannelMenuOpen(false);
   };

   const filteredChannels = useMemo(() => {
      const uniqueMap = new Map<string, Channel>();
      channels
         .filter(ch => {
            const chName = ch.name || '';
            const matchesSearch = chName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = showOnlyFavorites ? true : ch.group === activeCategory;
            const matchesFavorite = showOnlyFavorites ? isFavoriteChannel(ch) : true;
            return matchesSearch && matchesCategory && matchesFavorite;
         })
         .forEach(ch => {
            const chName = ch.name || '未知频道';
            if (!uniqueMap.has(chName)) uniqueMap.set(chName, ch);
         });
      return Array.from(uniqueMap.values());
   }, [channels, activeCategory, searchQuery, showOnlyFavorites, isFavoriteChannel]);

   if (loading) return (
      <div className="h-screen bg-[#05070a] flex items-center justify-center">
         <div className="p-10 border border-white/5 rounded-[4rem] bg-card-bg/[0.02] backdrop-blur-3xl flex flex-col items-center gap-8 shadow-2xl">
            <div className="relative w-24 h-24">
               <div className="absolute inset-0 border-[2px] border-blue-500/10 rounded-full animate-[ping_2s_infinite]"></div>
               <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
            <p className="text-[10px] font-black tracking-[1em] text-blue-500 uppercase animate-pulse">正在初始化</p>
         </div>
      </div>
   );

   return (
      <div className="min-h-dvh lg:h-dvh bg-card-bg dark:bg-[#02050a] text-foreground flex flex-col font-sans overflow-x-hidden overflow-y-auto lg:overflow-hidden relative selection:bg-rose-600">
         <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[200px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-600/5 blur-[200px] animate-pulse [animation-delay:3s]"></div>
         </div>

         <div className="flex items-center mt-10 gap-2">
            <button
               onClick={() => setChannelMenuOpen(true)}
               className="lg:hidden w-12 h-12 rounded-2xl bg-card-bg/[0.03] border border-white/[0.05] flex items-center justify-center text-slate-300 hover:text-white transition-all"
            >
               <List size={20} />
            </button>
         </div>

         <main className="flex-1 min-h-0 flex flex-col lg:flex-row lg:overflow-hidden relative z-10  mt-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pb-5 sm:pb-6 gap-4 sm:gap-6">
            {channelMenuOpen && (
               <div
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                  onClick={() => setChannelMenuOpen(false)}
               />
            )}

            <section className="flex-1 min-h-0 flex flex-col gap-4 sm:gap-6 order-1">
               <div className="border border-white/[0.04] bg-card-bg/[0.02] backdrop-blur-3xl rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
                  <div className="relative aspect-video bg-black">
                     <div className="absolute left-4 top-4 z-10 px-3 py-1.5 rounded-full bg-rose-600/20 border border-rose-500/25 text-[10px] font-black tracking-[.35em] uppercase text-rose-200">
                        直播
                     </div>
                     {selectedChannel ? (
                        <Player url={selectedChannel.url || ''} />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center">
                           <div className="flex flex-col items-center gap-3 text-slate-400">
                              <MonitorPlay size={52} className="opacity-25" />
                              <div className="text-sm font-bold">请选择频道</div>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="p-4 sm:p-6 border-t border-white/[0.04]">
                     <div className="text-xl sm:text-2xl font-black tracking-tight">
                        {selectedChannel?.name || '—'}
                     </div>
                     <div className="mt-2 text-sm text-slate-400">
                        高清直播频道
                     </div>
                  </div>
               </div>

               <div className="border border-white/[0.04] bg-black/20 backdrop-blur-3xl rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
                  <div className="p-4 sm:p-6">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <div className="text-sm font-black tracking-tight">播放提示</div>
                     </div>
                     <div className="mt-4 text-sm text-slate-400 leading-relaxed">
                        当前频道正在直播中。加载速度会因网络环境而异。为获得最佳观看体验，请使用稳定的网络连接。
                     </div>
                  </div>
               </div>
            </section>

            <aside
               className={`lg:w-[320px] xl:w-[340px] shrink-0 flex flex-col lg:overflow-hidden lg:self-start order-2 ${channelMenuOpen
                  ? 'fixed inset-y-0 right-0 z-50 w-[86vw] max-w-[360px] translate-x-0'
                  : 'fixed inset-y-0 right-0 z-50 w-[86vw] max-w-[360px] translate-x-full'
                  } lg:static lg:z-auto lg:w-[320px] lg:max-w-none lg:translate-x-0 transition-transform duration-300`}
            >
               <div className="h-full border border-white/[0.04] bg-[#090a0f]/95 lg:bg-card-bg/[0.02] backdrop-blur-3xl rounded-none lg:rounded-3xl flex flex-col overflow-hidden shadow-2xl lg:h-auto lg:max-h-[72dvh]">
                  <div className="p-5 sm:p-6 border-b border-white/[0.04] flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <List size={16} className="text-rose-400" />
                        <span className="text-sm font-black tracking-tight">频道列表</span>
                        <button
                           onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                           className={`ml-2 p-1.5 rounded-lg transition-all ${showOnlyFavorites ? 'text-rose-500 bg-rose-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                           title="仅显示收藏"
                        >
                           <Heart size={16} fill={showOnlyFavorites ? 'currentColor' : 'none'} />
                        </button>
                     </div>
                     <button
                        onClick={() => setChannelMenuOpen(false)}
                        className="lg:hidden w-10 h-10 rounded-2xl bg-black/30 border border-white/[0.06] text-slate-300 hover:text-white flex items-center justify-center"
                     >
                        <X size={18} />
                     </button>
                  </div>

                  <div className="p-4 sm:p-5 border-b border-white/[0.04] space-y-3">
                     <div className="relative">
                        <button
                           onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                           className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-black/30 border border-white/[0.06] text-sm font-bold text-slate-200 hover:bg-black/40 transition-all"
                        >
                           <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              <span>{activeCategory || '选择分类'}</span>
                           </div>
                           <ChevronDown size={16} className={`text-slate-500 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCategoryDropdownOpen && (
                           <>
                              <div className="fixed inset-0 z-10" onClick={() => setIsCategoryDropdownOpen(false)}></div>
                              <div className="absolute top-full left-0 right-0 mt-2 z-20 max-h-[300px] overflow-y-auto custom-scrollbar bg-[#0f1117]/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-2xl p-2 flex flex-col gap-1">
                                 {categories.map(cat => (
                                    <button
                                       key={cat}
                                       onClick={() => {
                                          setActiveCategory(cat);
                                          setIsCategoryDropdownOpen(false);
                                       }}
                                       className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === cat
                                          ? 'bg-rose-600/20 text-rose-400'
                                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                          }`}
                                    >
                                       {cat}
                                    </button>
                                 ))}
                              </div>
                           </>
                        )}
                     </div>

                     <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           placeholder="搜索频道"
                           className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/30 border border-white/[0.06] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-600/40"
                        />
                     </div>
                  </div>

                  <div className="overflow-y-auto custom-scrollbar p-3 sm:p-4 max-h-[55dvh] sm:max-h-[60dvh] lg:max-h-[48dvh] xl:max-h-[30dvh]">
                     <div className="flex flex-col gap-2">
                        {filteredChannels.map(ch => {
                           const isActive = selectedChannel?.name === ch.name;
                           return (
                              <div
                                 key={`${ch.group}-${ch.name}`}
                                 onClick={() => handleChannelSelect(ch)}
                                 className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${isActive
                                    ? 'bg-rose-600/20 border-rose-500/30 text-white'
                                    : 'bg-black/20 border-white/[0.06] text-slate-300 hover:text-white hover:bg-black/30'
                                    }`}
                              >
                                 <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    {ch.logo && !brokenLogos.has(`${ch.group}-${ch.name}`) ? (
                                       <img
                                          src={ch.logo}
                                          alt={ch.name}
                                          className="object-cover"
                                          onError={() => setBrokenLogos(prev => new Set(prev).add(`${ch.group}-${ch.name}`))}
                                       />
                                    ) : (
                                       <MonitorPlay size={18} className="text-slate-500" />
                                    )}
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <div className="text-sm font-black truncate">{ch.name}</div>
                                    <div className="mt-1 text-[11px] text-slate-500 truncate">正在直播</div>
                                 </div>
                                 <button
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       toggleFavoriteChannel(ch);
                                    }}
                                    className={`p-2 rounded-xl transition-all ${isFavoriteChannel(ch) ? 'text-rose-500' : 'text-slate-600 hover:text-white'}`}
                                 >
                                    <Heart size={16} fill={isFavoriteChannel(ch) ? 'currentColor' : 'none'} />
                                 </button>
                                 <div className="shrink-0 text-[10px] font-black tracking-wider text-slate-500">LIVE</div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
            </aside>
         </main>

         <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar { width: 3px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.1); border-radius: 10px; }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
         `}</style>
      </div>
   );
}
