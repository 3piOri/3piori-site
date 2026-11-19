'use client';
import type { MusicSet } from '@/lib/sets';
import { usePlayer } from './PlayerProvider';
export default function PlayButton({ set, large = false }: { set: MusicSet; large?: boolean }) {
  const player = usePlayer();
  const active = player.current?.id === set.id && player.playing;
  return <button className={large ? 'play-button play-button-large' : 'play-button'} onClick={() => player.current?.id === set.id ? player.toggle() : player.play(set)} aria-label={active ? 'Pausar sesión' : 'Reproducir sesión'} title={!set.audio_url ? 'Añade la URL del MP3 en Supabase para habilitar la reproducción' : undefined} disabled={!set.audio_url}>
    {active ? <span className="pause-icon">Ⅱ</span> : <span className="triangle">▶</span>}
  </button>;
}
