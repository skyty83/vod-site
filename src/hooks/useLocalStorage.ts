'use client';

import { useState, useEffect, useCallback } from 'react';
import { VodItem } from '@/types';

interface Channel {
  name?: string;
  url?: string;
  group: string;
  logo?: string;
}

export function useLocalStorage() {
  const [favoritesVOD, setFavoritesVOD] = useState<VodItem[]>([]);
  const [favoritesChannel, setFavoritesChannel] = useState<Channel[]>([]);
  const [watchHistory, setWatchHistory] = useState<VodItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const favVOD = localStorage.getItem('favorites_vod');
    const favChan = localStorage.getItem('favorites_channel');
    const history = localStorage.getItem('watch_history');

    if (favVOD) setFavoritesVOD(JSON.parse(favVOD));
    if (favChan) setFavoritesChannel(JSON.parse(favChan));
    if (history) setWatchHistory(JSON.parse(history));
  }, []);

  // VOD Favorites
  const toggleFavoriteVOD = useCallback((item: VodItem) => {
    setFavoritesVOD(prev => {
      const exists = prev.find(i => i.vod_id === item.vod_id);
      let updated;
      if (exists) {
        updated = prev.filter(i => i.vod_id !== item.vod_id);
      } else {
        updated = [item, ...prev];
      }
      localStorage.setItem('favorites_vod', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavoriteVOD = useCallback((id: number | string) => {
    return favoritesVOD.some(i => i.vod_id === id);
  }, [favoritesVOD]);

  // Channel Favorites
  const toggleFavoriteChannel = useCallback((item: Channel) => {
    setFavoritesChannel(prev => {
      const key = `${item.group}-${item.name}`;
      const exists = prev.find(i => `${i.group}-${i.name}` === key);
      let updated;
      if (exists) {
        updated = prev.filter(i => `${i.group}-${i.name}` !== key);
      } else {
        updated = [item, ...prev];
      }
      localStorage.setItem('favorites_channel', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavoriteChannel = useCallback((item: Channel) => {
    const key = `${item.group}-${item.name}`;
    return favoritesChannel.some(i => `${i.group}-${i.name}` === key);
  }, [favoritesChannel]);

  // Watch History
  const addToHistory = useCallback((item: VodItem) => {
    setWatchHistory(prev => {
      // Check if already top one to avoid unnecessary updates
      if (prev.length > 0 && prev[0].vod_id === item.vod_id) return prev;
      
      const filtered = prev.filter(i => i.vod_id !== item.vod_id);
      const updated = [item, ...filtered].slice(0, 50);
      localStorage.setItem('watch_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setWatchHistory([]);
    localStorage.removeItem('watch_history');
  }, []);

  return {
    favoritesVOD,
    favoritesChannel,
    watchHistory,
    toggleFavoriteVOD,
    isFavoriteVOD,
    toggleFavoriteChannel,
    isFavoriteChannel,
    addToHistory,
    clearHistory
  };
}
