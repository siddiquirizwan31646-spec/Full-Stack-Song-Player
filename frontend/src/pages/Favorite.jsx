import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "@/components/DashboardNavbar";
import FavoriteButton from "@/components/FavoriteButton";
import { useUser } from "@/context/userContext";
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer";

const fmt = (s) =>
  !s || isNaN(s) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const NAV_ITEMS = [
  { icon: "🏠", label: "Home", id: "home", path: "/hero" },
  { icon: "🔍", label: "Explore", id: "explore", path: "/explore" },
  { icon: "📖", label: "Quran", id: "quran", path: "/quran" },
  { icon: "🎵", label: "Nasheed", id: "nasheed", path: "/nasheed" },
  { icon: "🎤", label: "Naat", id: "naat", path: "/naat" },
  { icon: "🎼", label: "Qawwali", id: "qawwali", path: "/qawwali" },
  { icon: "🎙", label: "Podcasts", id: "podcasts", path: "/podcasts" },
  { icon: "📋", label: "Playlists", id: "playlists", path: "/playlists" },
];
const NAV_BOTTOM = [
  { icon: "⬆", label: "Upload Audio", id: "upload", path: "/upload" },
  { icon: "♡", label: "Favorites", id: "favorites", path: "/favorites" },
  { icon: "⚙", label: "Settings", id: "settings", path: "/settings" },
];

const Waveform = ({ isPlaying }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2, height: 32 }}>
    {Array.from({ length: 28 }).map((_, i) => {
      const h = 6 + Math.sin(i * 0.8) * 8 + ((i * 7) % 9);
      return (
        <div key={i} style={{
          width: 3, height: h,
          background: isPlaying ? `rgba(var(--app-accent-rgb),${0.4 + (i % 3) * 0.2})` : "rgba(var(--app-accent-rgb),0.2)",
          borderRadius: 2,
          animation: isPlaying ? `wave ${0.6 + (i % 5) * 0.1}s ease-in-out infinite alternate` : "none",
          animationDelay: `${i * 0.04}s`,
          transition: "background 0.3s",
        }} />
      );
    })}
  </div>
);

const MiniWave = ({ isPlaying }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 3, height: "100%", background: "var(--app-accent)", borderRadius: 2,
        animation: isPlaying ? `wave ${0.5 + i * 0.15}s ease-in-out infinite alternate` : "none",
        animationDelay: `${i * 0.1}s`, opacity: isPlaying ? 1 : 0.4,
      }} />
    ))}
  </div>
);

const ProgressBar = ({ progress, isActive }) => (
  <div style={{ height: 3, background: "var(--app-border)", borderRadius: 2, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min((progress || 0) * 100, 100)}%`, height: "100%",
      background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.4)",
      borderRadius: 2, transition: "width 0.5s linear",
    }} />
  </div>
);

export default function FavoritePage() {
  const { user, favoriteSongs } = useUser();
  const navigate = useNavigate();
  const displayName = user?.username || "Guest";
  const userId = user?._id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    progressPct,
    playSongFromList,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    setVolume,
  } = usePersistentSongPlayer(favoriteSongs);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-shell-bg)", color: "var(--app-text-main)", fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.2);border-radius:2px}

        .nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:3px;font-size:13px;font-weight:500;color:var(--app-text-muted);border-left:3px solid transparent;transition:all 0.18s}
        .nav-item:hover{background:var(--app-surface);color:var(--app-text-main)}
        .nav-item.active{background:rgba(var(--app-accent-rgb),0.12);border-left-color:var(--app-accent);color:var(--app-accent);font-weight:700}

        .song-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;border-left:3px solid transparent;margin-bottom:2px;transition:all 0.18s;position:relative}
        .song-row:hover{background:var(--app-surface)}
        .song-row.active-row{border-left-color:var(--app-accent);background:rgba(var(--app-accent-rgb),0.06)}

        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--app-accent);cursor:pointer;box-shadow:0 0 6px rgba(var(--app-accent-rgb),0.5)}

        @keyframes wave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}

        /* SIDEBAR */
        .sidebar{width:216px;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),0.1);display:flex;flex-direction:column;flex-shrink:0;transition:transform 0.28s cubic-bezier(.4,0,.2,1)}
        @media(max-width:768px){
          .sidebar{position:fixed;left:0;top:0;bottom:0;z-index:200;width:250px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,0.6)}
          .sidebar.open{transform:translateX(0)}
        }

        /* PLAYER */
        .player-bar{background:var(--app-shell-bg-alt);border-top:1px solid rgba(var(--app-accent-rgb),0.18);padding:10px 16px;display:flex;align-items:center;gap:14px;flex-shrink:0;position:sticky;bottom:0;z-index:20;overflow:hidden}
        .player-progress-line{position:absolute;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--app-accent-strong),var(--app-accent));transition:width 0.5s linear;pointer-events:none}
        .player-track{display:flex;align-items:center;gap:10px;flex:0 0 auto;width:200px;min-width:0}
        .player-wave{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .player-controls{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .player-seek{display:flex;flex-direction:column;gap:3px;width:170px;flex-shrink:0}
        .player-vol{display:flex;align-items:center;gap:8px;flex-shrink:0}

        @media(max-width:1000px){.player-wave{display:none}}
        @media(max-width:750px){.player-vol{display:none}}
        @media(max-width:600px){
          .player-bar{padding:8px 10px;gap:8px}
          .player-track{width:auto;flex:1;min-width:0}
          .player-seek{width:110px}
        }
        @media(max-width:450px){.player-seek{display:none}}

        /* HAMBURGER */
        .hamburger{display:none;background:none;border:none;color:var(--app-text-main);font-size:20px;cursor:pointer;padding:6px 8px;border-radius:8px;flex-shrink:0;line-height:1;transition:background 0.15s}
        .hamburger:hover{background:var(--app-surface)}
        @media(max-width:768px){.hamburger{display:flex;align-items:center;justify-content:center}}

        /* MOBILE OVERLAY */
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;backdrop-filter:blur(3px)}
        @media(max-width:768px){.mob-overlay.visible{display:block}}

        /* HIDE DURATION ON MOBILE */
        @media(max-width:500px){.song-duration{display:none!important}}
      `}</style>

      <DashboardNavbar />

      {/* Mobile overlay */}
      <div className={`mob-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <img
              src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
              alt="QalbAudio"
              onClick={() => { navigate("/"); setSidebarOpen(false); }}
              style={{ height: 60, width: "auto", maxWidth: "88%", objectFit: "contain", cursor: "pointer", display: "block" }}
            />
            <div style={{ fontSize: 11, color: "var(--app-text-muted)", textAlign: "center" }}>
              <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
            {NAV_ITEMS.map(item => (
              <div key={item.id} className={`nav-item${item.id === "home" ? " active" : ""}`}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />
            {NAV_BOTTOM.map(item => (
              <div key={item.id}
                className={`nav-item${item.id === "favorites" ? " active" : ""}`}
                style={{ color: item.id === "upload" ? "var(--app-accent)" : undefined }}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--app-shell-bg-alt)", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", flexShrink: 0 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
            <span style={{ fontSize: 16 }}>♥</span>
            <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>Favorites</span>
            <span style={{ fontSize: 11, color: "var(--app-accent)", fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(var(--app-accent-rgb),0.12)", border: "1px solid rgba(var(--app-accent-rgb),0.22)" }}>
              {favoriteSongs.length} songs
            </span>
            <div style={{ flex: 1 }} />
            {favoriteSongs.length > 0 && (
              <button
                onClick={() => playSongFromList(favoriteSongs[0])}
                style={{ padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", color: "#000", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                ▶ Play All
              </button>
            )}
          </div>

          {/* Hero banner */}
          <div style={{ margin: "14px 16px 0", background: "linear-gradient(135deg,rgba(var(--app-accent-rgb),0.13) 0%,rgba(var(--app-accent-rgb),0.07) 55%,transparent 100%)", border: "1px solid rgba(var(--app-accent-rgb),0.16)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <div style={{ color: "var(--app-accent)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", marginBottom: 4 }}>YOUR SAVED COLLECTION</div>
              <div style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 800, marginBottom: 3, lineHeight: 1.3 }}>Songs close to the heart</div>
              <div style={{ color: "var(--app-text-muted)", fontSize: 12, lineHeight: 1.5 }}>Save tracks from any page, play them all here.</div>
            </div>
            <div style={{ fontSize: 38, opacity: 0.55, flexShrink: 0, marginLeft: 12 }}>♥</div>
          </div>

          {/* Song list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 8px" }}>
            {favoriteSongs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--app-text-muted)" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>♡</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--app-text-main)", marginBottom: 6 }}>No favorites yet</div>
                <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 260, margin: "0 auto" }}>
                  Tap the heart icon on any song and it will appear here.
                </div>
                <button
                  onClick={() => navigate("/hero")}
                  style={{ marginTop: 18, padding: "9px 20px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(var(--app-accent-rgb),0.28)", background: "rgba(var(--app-accent-rgb),0.09)", color: "var(--app-accent)", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
                  Browse Songs
                </button>
              </div>
            ) : (
              favoriteSongs.map((song, index) => {
                const isActive = String(currentSong?.id) === String(song.id);
                const progress = isActive && duration > 0 ? currentTime / duration : 0;
                return (
                  <div
                    key={song.id}
                    className={`song-row${isActive ? " active-row" : ""}`}
                    style={{ animation: `fadeUp .2s ${index * 0.022}s both` }}
                  >
                    <div onClick={() => playSongFromList(song)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      {/* Index */}
                      <div style={{ width: 18, textAlign: "center", flexShrink: 0, fontSize: 11, color: isActive ? "var(--app-accent)" : "var(--app-text-muted)", fontFamily: "monospace" }}>
                        {isActive && isPlaying ? <span style={{ fontSize: 8 }}>▶</span> : index + 1}
                      </div>

                      {/* Cover */}
                      <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative", boxShadow: isActive ? "0 0 14px rgba(var(--app-accent-rgb),0.35)" : "none", transition: "box-shadow 0.2s" }}>
                        {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
                        {isActive && (
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <MiniWave isPlaying={isPlaying} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
                        <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap", overflow: "hidden" }}>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist || "Unknown artist"}{song.location ? ` · ${song.location}` : ""}</span>
                          {song.music_type && (
                            <span style={{ color: "var(--app-accent)", fontSize: 10, background: "rgba(var(--app-accent-rgb),0.1)", padding: "1px 6px", borderRadius: 4, textTransform: "capitalize", flexShrink: 0 }}>
                              {song.music_type}
                            </span>
                          )}
                        </div>
                        {isActive && <div style={{ marginTop: 5 }}><ProgressBar progress={progress} isActive /></div>}
                      </div>

                      <div className="song-duration" style={{ color: "var(--app-text-muted)", fontSize: 12, fontFamily: "monospace", flexShrink: 0 }}>{fmt(song.duration)}</div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <FavoriteButton song={song} />
                      <button
                        onClick={(e) => { e.stopPropagation(); playSongFromList(song); }}
                        style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.15)", color: isActive ? "#000" : "var(--app-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10 }}>
                        ▶
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── PLAYER BAR ── */}
      <div className="player-bar">
        <div className="player-progress-line" style={{ width: `${progressPct}%` }} />

        {/* Track */}
        <div className="player-track">
          <div style={{ width: 42, height: 42, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: currentSong ? "0 0 12px rgba(var(--app-accent-rgb),0.25)" : "none", position: "relative" }}>
            {currentSong?.cover_url ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
            {isPlaying && currentSong && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MiniWave isPlaying={true} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: currentSong ? "var(--app-text-main)" : "var(--app-text-muted)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {currentSong?.name || "No Song Selected"}
            </div>
            <div style={{ color: "var(--app-text-muted)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {currentSong?.artist || "Pick a song to play"}
            </div>
          </div>
        </div>

        {/* Waveform */}
        <div className="player-wave"><Waveform isPlaying={isPlaying} /></div>

        {/* Controls */}
        <div className="player-controls">
          <button onClick={playPrev} style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--app-text-main)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--app-text-muted)"}>⏮</button>
          <button onClick={togglePlay}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 14, fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 14px rgba(var(--app-accent-rgb),0.4)", transition: "transform 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={playNext} style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--app-text-main)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--app-text-muted)"}>⏭</button>
          <button style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 14, padding: 4 }}>🔁</button>
        </div>

        {/* Seek */}
        <div className="player-seek">
          <input type="range" min={0} max={duration || 0} value={currentTime}
            onChange={e => seekTo(Number(e.target.value))}
            style={{ width: "100%", background: `linear-gradient(to right,var(--app-accent) ${progressPct}%,var(--app-border) 0%)` }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--app-text-muted)", fontSize: 10 }}>
            <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="player-vol">
          <span style={{ color: "var(--app-text-muted)", fontSize: 14, flexShrink: 0 }}>🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            style={{ width: 70, background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,var(--app-border) 0%)` }}
          />
        </div>
      </div>
    </div>
  );
}
