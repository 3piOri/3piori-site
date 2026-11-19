'use client';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { MusicSet } from '@/lib/sets';

type PlayerState = { current: MusicSet | null; playing: boolean; progress: number; duration: number; play: (set: MusicSet) => void; toggle: () => void; seek: (value: number) => void; audioRef: React.RefObject<HTMLAudioElement> };
const PlayerContext = createContext<PlayerState | null>(null);
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<MusicSet | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const play = (set: MusicSet) => {
    if (!set.audio_url) return;
    if (current?.id === set.id) { audioRef.current?.play(); setPlaying(true); return; }
    setCurrent(set); setProgress(0); setPlaying(true);
  };
  const toggle = () => { const a = audioRef.current; if (!a || !current?.audio_url) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } };
  const seek = (value: number) => { if (audioRef.current && duration) { audioRef.current.currentTime = value; setProgress(value); } };
  useEffect(() => { const a = audioRef.current; if (!a || !current?.audio_url) return; a.src = current.audio_url; a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }, [current]);
  useEffect(() => { const a = audioRef.current; if (!a) return; const time = () => setProgress(a.currentTime); const meta = () => setDuration(a.duration || 0); const ended = () => setPlaying(false); a.addEventListener('timeupdate', time); a.addEventListener('loadedmetadata', meta); a.addEventListener('ended', ended); return () => { a.removeEventListener('timeupdate', time); a.removeEventListener('loadedmetadata', meta); a.removeEventListener('ended', ended); }; }, []);
  const value = useMemo(() => ({ current, playing, progress, duration, play, toggle, seek, audioRef }), [current, playing, progress, duration]);
  return <PlayerContext.Provider value={value}>{children}<audio ref={audioRef} preload="none" /></PlayerContext.Provider>;
}
export function usePlayer() { const value = useContext(PlayerContext); if (!value) throw new Error('usePlayer must be used inside PlayerProvider'); return value; }
