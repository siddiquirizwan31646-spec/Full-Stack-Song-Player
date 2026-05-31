// src/components/PlayerBar.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlay, faPause, faForwardFast, faBackwardFast } from "@fortawesome/free-solid-svg-icons"

const fmt = (s) =>
  !s || isNaN(s)
    ? "0:00"
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

const MiniWave = ({ isPlaying }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{
        width: 3, height: "100%", background: "var(--app-accent)", borderRadius: 2,
        animation: isPlaying ? `wave ${0.5 + i * 0.15}s ease-in-out infinite alternate` : "none",
        animationDelay: `${i * 0.1}s`, opacity: isPlaying ? 1 : 0.4,
      }} />
    ))}
  </div>
)

const Waveform = ({ isPlaying }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2, height: 32 }}>
    {Array.from({ length: 28 }).map((_, i) => {
      const h = 6 + Math.sin(i * 0.8) * 8 + ((i * 7) % 9)
      return (
        <div key={i} style={{
          width: 3, height: h,
          background: isPlaying
            ? `rgba(var(--app-accent-rgb),${0.4 + (i % 3) * 0.2})`
            : "rgba(var(--app-accent-rgb),0.2)",
          borderRadius: 2,
          animation: isPlaying ? `wave ${0.6 + (i % 5) * 0.1}s ease-in-out infinite alternate` : "none",
          animationDelay: `${i * 0.04}s`,
          transition: "background 0.3s",
        }} />
      )
    })}
  </div>
)

export default function PlayerBar({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  progressPct,
  togglePlay,
  playNext,
  playPrev,
  seekTo,
  setVolume,
}) {
  return (
    <>
      <style>{`
        @keyframes wave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        .player-bar{background:var(--app-shell-bg-alt);border-top:1px solid rgba(var(--app-accent-rgb),0.18);padding:10px 16px;display:flex;align-items:center;gap:14px;flex-shrink:0;position:relative;z-index:20;overflow:hidden}
        .player-progress-line{position:absolute;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--app-accent-strong),var(--app-accent));transition:width 0.5s linear;pointer-events:none}
        .player-track{display:flex;align-items:center;gap:10px;flex:0 0 auto;width:200px;min-width:0}
        .player-wave{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .player-controls{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .player-seek{display:flex;flex-direction:column;gap:3px;width:170px;flex-shrink:0}
        .player-vol{display:flex;align-items:center;gap:8px;flex-shrink:0}
        .player-ctrl-btn{background:none;border:none;color:var(--app-text-muted);cursor:pointer;padding:7px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:color 0.15s,background 0.15s;font-size:15px;line-height:1}
        .player-ctrl-btn:hover{color:var(--app-text-main);background:rgba(255,255,255,0.07)}
        .player-ctrl-btn:active{transform:scale(0.92)}
        .player-play-btn{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--app-accent-strong),var(--app-accent));border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#000;flex-shrink:0;box-shadow:0 4px 14px rgba(var(--app-accent-rgb),0.4);transition:transform 0.15s,filter 0.15s}
        .player-play-btn:hover{transform:scale(1.08);filter:brightness(1.1)}
        .player-play-btn:active{transform:scale(0.95)}
        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--app-accent);cursor:pointer;box-shadow:0 0 6px rgba(var(--app-accent-rgb),0.5)}
        @media(max-width:1000px){.player-wave{display:none}}
        @media(max-width:750px){.player-vol{display:none}}
        @media(max-width:600px){.player-bar{padding:8px 10px;gap:8px}.player-track{width:auto;flex:1;min-width:0}.player-seek{width:110px}}
        @media(max-width:450px){.player-seek{display:none}}
      `}</style>

      <div className="player-bar">
        <div className="player-progress-line" style={{ width: `${progressPct}%` }} />

        {/* Track info */}
        <div className="player-track">
          <div style={{
            width: 42, height: 42, borderRadius: 9, overflow: "hidden",
            background: "var(--app-surface)", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, flexShrink: 0,
            boxShadow: currentSong ? "0 0 12px rgba(var(--app-accent-rgb),0.25)" : "none",
            position: "relative",
          }}>
            {currentSong?.cover_url
              ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "🎵"
            }
            {isPlaying && currentSong && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MiniWave isPlaying={true} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: currentSong ? "var(--app-text-main)" : "var(--app-text-muted)",
              fontWeight: 600, fontSize: 13, whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140,
            }}>
              {currentSong?.name || "No Song Selected"}
            </div>
            <div style={{
              color: "var(--app-text-muted)", fontSize: 11, whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140,
            }}>
              {currentSong?.artist || "Pick a song to play"}
            </div>
          </div>
        </div>

        {/* Waveform */}
        <div className="player-wave">
          <Waveform isPlaying={isPlaying} />
        </div>

        {/* Controls */}
        <div className="player-controls">
          <button className="player-ctrl-btn" onClick={playPrev} title="Previous">
            <FontAwesomeIcon icon={faBackwardFast} style={{ fontSize: 15 }} />
          </button>
          <button className="player-play-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} style={{ fontSize: 14, marginLeft: isPlaying ? 0 : 2 }} />
          </button>
          <button className="player-ctrl-btn" onClick={playNext} title="Next">
            <FontAwesomeIcon icon={faForwardFast} style={{ fontSize: 15 }} />
          </button>
          <button className="player-ctrl-btn" title="Repeat" style={{ opacity: 0.5 }}>
            <span style={{ fontSize: 14 }}>🔁</span>
          </button>
        </div>

        {/* Seek */}
        <div className="player-seek">
          <input type="range" min={0} max={duration || 0} value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            style={{ width: "100%", background: `linear-gradient(to right,var(--app-accent) ${progressPct}%,var(--app-border) 0%)` }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--app-text-muted)", fontSize: 10 }}>
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="player-vol">
          <span style={{ color: "var(--app-text-muted)", fontSize: 14, flexShrink: 0 }}>🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ width: 70, background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,var(--app-border) 0%)` }}
          />
        </div>
      </div>
    </>
  )
}