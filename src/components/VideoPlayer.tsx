'use client';

import { useState } from 'react';
import { PlaySource, VodItem } from '@/types';
import { Play, List, Info, ChevronRight, Calendar, MapPin, Tag, Film } from 'lucide-react';
import Player from '@/components/Player';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useEffect } from 'react';

interface VideoPlayerProps {
   sources: PlaySource[];
   vod?: VodItem;
}

export default function VideoPlayer({ sources: allSources, vod }: VideoPlayerProps) {
   const { addToHistory } = useLocalStorage();
   // Find the first source that seems to possess m3u8 streams (since we only support HLS natively), falling back to index 0.
   const sources = allSources;

   const [activeSource, setActiveSource] = useState(0);
   const [activeEpisode, setActiveEpisode] = useState(0);
   const [activeTab, setActiveTab] = useState<'episodes' | 'info'>('episodes');

   const currentSource = sources[activeSource];
   const currentEpisode = currentSource?.episodes[activeEpisode];
   const currentUrl = currentEpisode?.url || '';

   useEffect(() => {
      if (currentUrl && vod) {
         addToHistory(vod);
      }
   }, [currentUrl, vod, addToHistory]);

   if (!sources.length || !currentSource?.episodes.length) {
      return (
         <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center gap-4 shadow-inner border border-slate-800">
            <Play size={56} className="text-white/20" />
            <p className="text-white/40 font-medium tracking-widest text-sm">暂无播放源</p>
         </div>
      );
   }

   const handleVideoEnded = () => {
      if (activeEpisode < currentSource.episodes.length - 1) {
         setActiveEpisode((prev) => prev + 1);
      }
   };

   return (
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[600px] xl:h-[700px]">
         {/* Left: Player Area */}
         <div className="flex-1 min-w-0 flex flex-col bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
            <div className="w-full h-full relative aspect-video lg:aspect-auto">
               {currentUrl && (
                  <Player key={currentUrl} url={currentUrl} autoplay={true} isLive={false} onEnded={handleVideoEnded} />
               )}
            </div>
         </div>

         {/* Right: Info & Episodes Panel */}
         <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 flex flex-col bg-card-bg/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl lg:h-full">
            <div className="flex items-center border-b border-white/5 p-2 gap-2">
               <button
                  onClick={() => setActiveTab('episodes')}
                  className={`flex-1 py-3 text-sm font-black tracking-widest uppercase transition-all rounded-2xl flex cursor-pointer items-center justify-center gap-2 ${activeTab === 'episodes' ? 'bg-rose-600/20 text-rose-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }`}
               >
                  <List size={16} /> 选集
               </button>
               <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-3 text-sm font-black tracking-widest uppercase transition-all rounded-2xl flex cursor-pointer items-center justify-center gap-2 ${activeTab === 'info' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                     }`}
               >
                  <Info size={16} /> 简介
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
               {activeTab === 'episodes' && (
                  <div className="flex flex-col gap-2">
                     {sources.length > 1 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                           {sources.map((src, idx) => (
                              <button
                                 key={idx}
                                 onClick={() => { setActiveSource(idx); setActiveEpisode(0); }}
                                 className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeSource === idx
                                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                                    }`}
                              >
                                 {src.name}
                              </button>
                           ))}
                        </div>
                     )}
                     <div className="flex items-center justify-between mb-2 px-1">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                           共 {currentSource.episodes.length} 集
                        </div>
                        {/* <div className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md">
                           {currentSource.name}
                        </div> */}
                     </div>
                     {currentSource.episodes.map((ep, i) => {
                        const isActive = activeEpisode === i;
                        return (
                           <button
                              key={i}
                              onClick={() => setActiveEpisode(i)}
                              className={`w-full text-left p-3 rounded-2xl border relative overflow-hidden transition-all duration-300 flex items-center  cursor-pointer justify-between group ${isActive
                                 ? 'bg-gradient-to-r from-rose-600/20 to-orange-600/10 border-rose-500/40 text-white shadow-[0_0_20px_rgba(225,29,72,0.15)] ring-1 ring-rose-500/20'
                                 : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/10 hover:shadow-xl'
                                 }`}
                           >
                              {isActive && (
                                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-rose-500 rounded-r-md shadow-[0_0_12px_rgba(225,29,72,0.8)]" />
                              )}

                              <div className="min-w-0 pr-4 flex items-center gap-3 relative z-10">
                                 <div className={`flex flex-col items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-300 ${isActive
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-500/50 scale-105'
                                    : 'bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-white group-hover:scale-110'
                                    }`}>
                                    <Play size={14} className={isActive ? "fill-current ml-0.5" : "ml-0.5 transition-transform group-hover:scale-110"} />
                                 </div>
                                 <div className={`text-sm font-black tracking-wide truncate transition-all duration-300 ${isActive
                                    ? 'text-rose-400'
                                    : 'group-hover:translate-x-1'
                                    }`}>
                                    {ep.name}
                                 </div>
                              </div>

                              <div className="relative z-10 shrink-0 flex items-center mr-1">
                                 {isActive ? (
                                    <div className="flex gap-1 items-end h-3.5">
                                       <span className="w-1 h-2 bg-rose-400 rounded-sm animate-[pulse_1s_ease-in-out_infinite]"></span>
                                       <span className="w-1 h-3.5 bg-rose-500 rounded-sm animate-[pulse_1s_ease-in-out_infinite_0.15s]"></span>
                                       <span className="w-1 h-2.5 bg-rose-400 rounded-sm animate-[pulse_1s_ease-in-out_infinite_0.3s]"></span>
                                    </div>
                                 ) : (
                                    <div className="w-6 h-6 rounded-full bg-white/0 group-hover:bg-white/10 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                                       <ChevronRight size={14} className="text-slate-600 group-hover:text-white transition-colors" />
                                    </div>
                                 )}
                              </div>
                           </button>
                        );
                     })}
                  </div>
               )}

               {activeTab === 'info' && vod && (
                  <div className="flex flex-col gap-6">
                     <div className="flex gap-4">
                        <div className="w-28 sm:w-32 shrink-0 rounded-xl overflow-hidden aspect-[2/3] relative bg-white/5 border border-white/10 shadow-lg">
                           {vod.vod_pic ? (
                              <img src={vod.vod_pic} alt={vod.vod_name} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center"><Film size={24} className="text-white/20" /></div>
                           )}
                        </div>
                        <div className="flex flex-col min-w-0 py-1">
                           {vod.vod_remarks && (
                              <div className="self-start px-2 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-black rounded uppercase tracking-wider mb-2">
                                 {vod.vod_remarks}
                              </div>
                           )}
                           <h3 className="text-lg sm:text-xl font-black text-white leading-tight tracking-tight mb-3 line-clamp-2">
                              {vod.vod_name}
                           </h3>

                           <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs font-bold text-slate-300 mb-4">
                              {vod.vod_year && <span className="flex items-center gap-1"><Calendar size={12} className="text-emerald-400" />{vod.vod_year}</span>}
                              {vod.vod_area && <span className="flex items-center gap-1"><MapPin size={12} className="text-rose-400" />{vod.vod_area}</span>}
                              {vod.type_name && <span className="flex items-center gap-1"><Tag size={12} className="text-blue-400" />{vod.type_name}</span>}
                           </div>

                           <div className="space-y-1.5 text-[11px] sm:text-xs">
                              {vod.vod_director && (
                                 <div className="text-slate-300 line-clamp-1">
                                    <span className="text-slate-500 font-bold mr-2">导演</span>
                                    <span className="text-white font-medium">{vod.vod_director}</span>
                                 </div>
                              )}
                              {vod.vod_actor && (
                                 <div className="text-slate-300 line-clamp-2 leading-relaxed">
                                    <span className="text-slate-500 font-bold mr-2">主演</span>
                                    <span className="text-white font-medium">{vod.vod_actor}</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                           <div className="w-1 h-3.5 bg-rose-500 rounded-full" />
                           <h4 className="text-sm font-black text-white">剧情简介</h4>
                        </div>
                        <div
                           className="text-xs text-slate-400 leading-relaxed whitespace-pre-line relative z-10"
                           dangerouslySetInnerHTML={{ __html: vod.vod_content || vod.vod_blurb || '暂无剧情介绍' }}
                        />
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
