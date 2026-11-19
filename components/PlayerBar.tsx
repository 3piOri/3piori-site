'use client';
import { usePlayer } from './PlayerProvider';
function clock(n: number) { if (!Number.isFinite(n)) return '00:00'; return `${Math.floor(n / 60).toString().padStart(2,'0')}:${Math.floor(n % 60).toString().padStart(2,'0')}`; }
export default function PlayerBar() {
  const p = usePlayer();
  if (!p.current) return null;
  return <div className="player-bar"><div className="player-track"><div className="player-cover"><img src={p.current.cover_url} alt="" /></div><div className="player-track-copy"><strong>{p.current.title}</strong><span>3π Ori · {p.current.genre}</span></div></div><div className="player-controls"><button onClick={p.toggle} className="player-toggle" disabled={!p.current.audio_url}>{p.playing ? 'Ⅱ' : '▶'}</button><div className="timeline"><span>{clock(p.progress)}</span><input aria-label="Posición de reproducción" type="range" min="0" max={p.duration || 0} value={Math.min(p.progress, p.duration || 0)} onChange={e => p.seek(Number(e.target.value))} /><span>{clock(p.duration)}</span></div></div><div className="player-note">NOW PLAYING <i /></div></div>;
}
