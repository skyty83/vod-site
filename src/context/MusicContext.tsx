'use client';

import React, { createContext, useContext, useState } from 'react';

export interface Song {
  id: number;
  mid: string;
  name: string;
  singer: { name: string }[];
  album: { name: string; mid?: string };
}

interface MusicContextType {
  currentSong: Song | null;
  playSong: (song: Song) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  return (
    <MusicContext.Provider value={{ currentSong, playSong, isPlaying, setIsPlaying }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
