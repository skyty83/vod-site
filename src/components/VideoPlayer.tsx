'use client';

import { useState } from 'react';
import { PlaySource, VodItem } from '@/types';
import { Play, List, Info, ChevronRight, Calendar, MapPin, Tag, Film } from 'lucide-react';
import Player from '@/components/Player';

interface VideoPlayerProps {
  sources: PlaySource[];
  vod?: VodItem;
}

export default function VideoPlayer({ sources: allSources, vod }: VideoPlayerProps) {
  // Find the first source that seems to possess m3u8 streams (since we only support HLS natively), falling back to index 0.
  const preferredSource = allSources.find(src => 
    src.name.toLowerCase().includes('m3u8') || 
    src.episodes.some(ep => ep.url.includes('.m3u8'))
  ) || allSources[0];

  const sources = preferredSource ? [preferredSource] : [];
  
  const [activeSource, setActiveSource] = useState(0);
  const [activeEpisode, setActiveEpisode] = useState(0);
  const [activeTab, setActiveTab] = useState<'episodes' | 'info'>('episodes');

  const currentSource = sources[activeSource];
  const currentEpisode = currentSource?.episodes[activeEpisode];
  const currentUrl = currentEpisode?.url || '';

  if (!sources.length || !currentSource?.episodes.length) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center gap-4 shadow-inner border border-slate-800">
        <Play size={56} className="text-white/20" />
        <p className="text-white/40 font-medium tracking-widest text-sm">暂无播放源</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[600px] xl:h-[700px]">
      {/* Left: Player Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-black rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-white/10">
        <div className="w-full h-full relative aspect-video lg:aspect-auto">
           {currentUrl && (
               <Player key={currentUrl} url={currentUrl} autoplay={true} isLive={false} />
           )}
        </div>
      </div>

      {/* Right: Info & Episodes Panel */}
      <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 flex flex-col bg-card-bg/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-xl lg:h-full">
         <div className="flex items-center border-b border-white/5 p-2 gap-2">
            <button
               onClick={() => setActiveTab('episodes')}
               className={`flex-1 py-3 text-sm font-black tracking-widest uppercase transition-all rounded-2xl flex items-center justify-center gap-2 ${
                  activeTab === 'episodes' ? 'bg-rose-600/20 text-rose-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
               }`}
            >
               <List size={16} /> 选集
            </button>
            <button
               onClick={() => setActiveTab('info')}
               className={`flex-1 py-3 text-sm font-black tracking-widest uppercase transition-all rounded-2xl flex items-center justify-center gap-2 ${
                  activeTab === 'info' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
               }`}
            >
               <Info size={16} /> 简介
            </button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
            {activeTab === 'episodes' && (
               <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-2 px-1">
                     <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        共 {currentSource.episodes.length} 集
                     </div>
                     <div className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md">
                        {currentSource.name}
                     </div>
                  </div>
                  {currentSource.episodes.map((ep, i) => {
                     const isActive = activeEpisode === i;
                     return (
                        <button
                           key={i}
                           onClick={() => setActiveEpisode(i)}
                           className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                              isActive
                                 ? 'bg-rose-600/20 border-rose-500/30 text-white shadow-md'
                                 : 'bg-black/20 border-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/10'
                           }`}
                        >
                           <div className="min-w-0 pr-4">
                              <div className={`text-sm font-bold truncate ${isActive ? 'text-rose-400' : ''}`}>
                                 {ep.name}
                              </div>
                           </div>
                           {isActive ? (
                              <div className="flex gap-1 shrink-0">
                                 <span className="w-1 h-3 bg-rose-500 rounded-full animate-[bounce_1s_infinite]"></span>
                                 <span className="w-1 h-3 bg-rose-500 rounded-full animate-[bounce_1s_infinite_0.2s]"></span>
                                 <span className="w-1 h-3 bg-rose-500 rounded-full animate-[bounce_1s_infinite_0.4s]"></span>
                              </div>
                           ) : (
                              <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 shrink-0" />
                           )}
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
                           <div className="w-full h-full flex items-center justify-center"><Film size={24} className="text-white/20"/></div>
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
