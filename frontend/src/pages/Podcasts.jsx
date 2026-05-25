import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "@/components/DashboardNavbar";
import FavoriteButton from "@/components/FavoriteButton";
import { useUser } from "@/context/userContext";
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer";

const SUPABASE_URL = "https://bnxahrapojygsulzfqpw.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJueGFocmFwb2p5Z3N1bHpmcXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDA5MTEsImV4cCI6MjA5Mzk3NjkxMX0.NrdMW-eiiVCQLOUnHN0QZmb3GMnnH6bp0Ah3uP4v5uI";
const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const fmt = (s) => {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

const NAV_ITEMS = [
  { icon: "🏠", label: "Home",      id: "home",      path: "/hero" },
  { icon: "🔍", label: "Explore",   id: "explore",   path: "/explore" },
  { icon: "📖", label: "Quran",     id: "quran",     path: "/quran" },
  { icon: "🎵", label: "Nasheed",   id: "nasheed",   path: "/nasheed" },
  { icon: "🎤", label: "Naat",      id: "naat",      path: "/naat" },
  { icon: "🎼", label: "Qawwali",   id: "qawwali",   path: "/qawwali" },
  { icon: "🎙", label: "Podcasts",  id: "podcasts",  path: "/podcasts" },
  { icon: "📋", label: "Playlists", id: "playlists", path: "/playlists" },
];
const NAV_BOTTOM = [
  { icon: "⬆", label: "Upload Audio", id: "upload",    path: "/upload" },
  { icon: "♡", label: "Favorites",    id: "favorites", path: "/favorites" },
  { icon: "⚙", label: "Settings",     id: "settings",  path: "/settings" },
];

/* ── shared components ───────────────────────────────────────────── */
function Waveform({ isPlaying }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 32 }}>
      {Array.from({ length: 28 }).map((_, i) => {
        const h = 6 + Math.sin(i * 0.8) * 8 + ((i * 7) % 9);
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
        );
      })}
    </div>
  );
}

function MiniWave({ isPlaying }) {
  return (
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
}

function SmoothProgressBar({ progress, isActive }) {
  return (
    <div style={{ height: 3, background: "var(--app-border)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min((progress || 0) * 100, 100)}%`, height: "100%",
        background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.4)",
        borderRadius: 2, transition: "width 0.5s linear",
      }} />
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────── */
export default function PodcastsPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const displayName = user?.username || "Guest";

  const [songs, setSongs]             = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(0);
  const [view, setView]               = useState("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchTimer = useRef(null);
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
  } = usePersistentSongPlayer(songs);

  const fetchPodcasts = useCallback(async (q = "", p = 0, append = false) => {
    setLoading(true);
    try {
      const from = p * 20;
      let url = `${SUPABASE_URL}/rest/v1/songs?select=*&music_type=eq.podcast&order=created_at.desc&limit=20&offset=${from}`;
      if (q) url += `&or=(name.ilike.*${encodeURIComponent(q)}*,artist.ilike.*${encodeURIComponent(q)}*)`;
      const res = await fetch(url, {
        headers: { ...H, "Range-Unit": "items", Range: `${from}-${from + 19}`, Prefer: "count=exact" },
      });
      const data = await res.json();
      const ct = res.headers.get("Content-Range");
      if (ct) setTotal(parseInt(ct.split("/")[1]) || 0);
      setSongs(prev => append ? [...prev, ...(Array.isArray(data) ? data : [])] : (Array.isArray(data) ? data : []));
    } catch (e) { console.error(e); setSongs([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPodcasts(); }, [fetchPodcasts]);

  const handleSearch = (val) => {
    setSearch(val); setPage(0);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchPodcasts(val, 0, false), 400);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100dvh",
      background: "var(--app-shell-bg)", color: "var(--app-text-main)",
      fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.2);border-radius:2px}

        .nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:3px;font-size:13px;font-weight:500;color:var(--app-text-muted);border-left:3px solid transparent;transition:all 0.18s}
        .nav-item:hover{background:var(--app-surface);color:var(--app-text-main)}
        .nav-item.active{background:rgba(var(--app-accent-rgb),0.12);border-left-color:var(--app-accent);color:var(--app-accent);font-weight:700}

        /* SIDEBAR */
        .sidebar{width:216px;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),0.1);display:flex;flex-direction:column;flex-shrink:0;transition:transform 0.28s cubic-bezier(.4,0,.2,1)}
        @media(max-width:768px){
          .sidebar{position:fixed;left:0;top:0;bottom:0;z-index:200;width:250px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,0.6)}
          .sidebar.open{transform:translateX(0)}
        }

        /* HAMBURGER */
        .hamburger{display:none;background:none;border:none;color:var(--app-text-main);font-size:20px;cursor:pointer;padding:6px 8px;border-radius:8px;flex-shrink:0;line-height:1;transition:background 0.15s}
        .hamburger:hover{background:var(--app-surface)}
        @media(max-width:768px){.hamburger{display:flex;align-items:center;justify-content:center}}

        /* MOBILE OVERLAY */
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;backdrop-filter:blur(3px)}
        @media(max-width:768px){.mob-overlay.visible{display:block}}

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

        /* SEARCH */
        .topbar-search{width:220px}
        @media(max-width:600px){.topbar-search{width:140px}}
        @media(max-width:420px){.topbar-search{display:none}}

        /* HERO BANNER */
        .hero-banner{margin:16px 16px 0;background:linear-gradient(135deg,rgba(var(--app-accent-rgb),0.12) 0%,rgba(29,78,216,0.08) 50%,rgba(15,23,42,0.06) 100%);border:1px solid rgba(var(--app-accent-rgb),0.2);border-radius:14px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between}
        @media(max-width:500px){.hero-banner{padding:14px 16px}.hero-banner-aside{display:none!important}}

        /* SONG GRID */
        .song-grid{display:flex;flex-wrap:wrap;gap:14px}
        @media(max-width:480px){.song-grid{gap:10px}}
        .song-card-wrap{width:150px;flex-shrink:0}
        @media(max-width:480px){.song-card-wrap{width:calc(50% - 5px)}}

        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--app-accent);cursor:pointer;box-shadow:0 0 6px rgba(var(--app-accent-rgb),0.5)}

        @keyframes wave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
        .skeleton{background:linear-gradient(90deg,var(--app-surface) 25%,rgba(var(--app-accent-rgb),0.06) 50%,var(--app-surface) 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}

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
              <div key={item.id}
                className={`nav-item${item.id === "podcasts" ? " active" : ""}`}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />
            {NAV_BOTTOM.map(item => (
              <div key={item.id} className="nav-item"
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

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🎙</span>
              <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700 }}>Podcasts</span>
              <span style={{ background: "rgba(var(--app-accent-rgb),0.15)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(var(--app-accent-rgb),0.3)" }}>
                {loading ? "…" : `${total} episodes`}
              </span>
            </div>

            <div style={{ flex: 1 }} />

            {/* View toggle */}
            <div style={{ display: "flex", background: "var(--app-surface)", borderRadius: 8, padding: 2, border: "1px solid var(--app-border)", flexShrink: 0 }}>
              {["grid", "list"].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  background: view === v ? "rgba(var(--app-accent-rgb),0.2)" : "none",
                  border: "none", borderRadius: 6,
                  color: view === v ? "var(--app-accent)" : "var(--app-text-muted)",
                  cursor: "pointer", padding: "5px 10px", fontSize: 13, transition: "all 0.2s",
                }}>
                  {v === "grid" ? "⊞" : "☰"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="topbar-search" style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--app-text-muted)", fontSize: 13, pointerEvents: "none" }}>🔍</span>
              <input value={search} onChange={e => handleSearch(e.target.value)}
                placeholder="Search podcasts, hosts..."
                style={{
                  background: "var(--app-surface)", border: "1px solid var(--app-border)",
                  borderRadius: 9, padding: "8px 12px 8px 32px", color: "var(--app-text-main)",
                  fontSize: 13, outline: "none", width: "100%", fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "var(--app-accent)"}
                onBlur={e => e.target.style.borderColor = "var(--app-border)"}
              />
            </div>
          </div>

          {/* Scroll area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>

            {/* Hero Banner */}
            <div className="hero-banner">
              <div>
                <div style={{ color: "var(--app-accent)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 5 }}>DEEP LISTENING MODE</div>
                <div style={{ color: "var(--app-text-main)", fontSize: "clamp(16px,3vw,22px)", fontWeight: 800, marginBottom: 4 }}>Podcasts Collection</div>
                <div style={{ color: "var(--app-text-muted)", fontSize: 12 }}>
                  {loading ? "Loading…" : `${total} episodes · Talks, reflections & Islamic conversations`}
                </div>
              </div>
              <div className="hero-banner-aside" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 44, opacity: 0.6 }}>🎙</span>
              </div>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
              {/* Section label */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", flexShrink: 0 }}>
                  {loading ? "LOADING..." : `ALL EPISODES · ${total}`}
                </span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,var(--app-border),transparent)" }} />
              </div>

              {/* LOADING */}
              {loading ? (
                <div className="song-grid">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skeleton song-card-wrap" style={{ height: 190, borderRadius: 12 }} />
                  ))}
                </div>

              /* EMPTY */
              ) : songs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--app-text-muted)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎙</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>No Podcasts Found</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>
                    {search ? `No results for "${search}"` : "Upload some podcasts to get started"}
                  </div>
                  <button onClick={() => navigate("/upload")} style={{
                    marginTop: 20, padding: "10px 24px", borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                    color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  }}>Upload Podcast</button>
                </div>

              /* GRID */
              ) : view === "grid" ? (
                <div className="song-grid">
                  {songs.map(song => {
                    const isActive = currentSong?.id === song.id;
                    const progress = isActive && duration > 0 ? currentTime / duration : 0;
                    return (
                      <div key={song.id} className="song-card-wrap">
                        <div onClick={() => playSongFromList(song)} style={{
                          background: isActive ? "rgba(var(--app-accent-rgb),0.08)" : "var(--app-surface)",
                          border: `1px solid ${isActive ? "rgba(var(--app-accent-rgb),0.35)" : "var(--app-border)"}`,
                          borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s",
                          boxShadow: isActive ? "0 6px 24px rgba(var(--app-accent-rgb),0.2)" : "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.transform = "translateY(-2px)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                          <div style={{ width: "100%", aspectRatio: "1", background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                            {song.cover_url
                              ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <div style={{ fontSize: 36, opacity: 0.4 }}>🎙</div>}
                            <div style={{ position: "absolute", top: 6, right: 6 }}>
                              <FavoriteButton song={song} size={26} iconSize={12} />
                            </div>
                            {isActive && (
                              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MiniWave isPlaying={isPlaying} />
                              </div>
                            )}
                          </div>
                          <div style={{ padding: "10px 10px 12px" }}>
                            <div style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
                            <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist || "Unknown host"}</div>
                            {song.location && <div style={{ color: "var(--app-text-muted)", fontSize: 10, marginTop: 1 }}>{song.location}</div>}
                            <div style={{ display: "flex", gap: 5, marginTop: 8, alignItems: "center" }}>
                              <div style={{ width: 22, height: 22, borderRadius: "50%", background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: isActive ? "#000" : "var(--app-accent)", fontSize: 8 }}>▶</div>
                              <div style={{ flex: 1 }}><SmoothProgressBar progress={isActive ? progress : 0} isActive={isActive} /></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              /* LIST */
              ) : (
                <div>
                  {songs.map((song, idx) => {
                    const isActive = currentSong?.id === song.id;
                    const progress = isActive && duration > 0 ? currentTime / duration : 0;
                    return (
                      <div key={song.id} onClick={() => playSongFromList(song)} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                        borderRadius: 10, cursor: "pointer", marginBottom: 2,
                        borderLeft: `3px solid ${isActive ? "var(--app-accent)" : "transparent"}`,
                        background: isActive ? "rgba(var(--app-accent-rgb),0.06)" : "transparent",
                        transition: "all 0.18s",
                      }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--app-surface)"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ color: "var(--app-text-muted)", fontSize: 11, width: 20, textAlign: "center", fontFamily: "monospace", flexShrink: 0 }}>{idx + 1}</div>
                        <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative", boxShadow: isActive ? "0 0 14px rgba(var(--app-accent-rgb),0.35)" : "none" }}>
                          {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎙"}
                          {isActive && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <MiniWave isPlaying={isPlaying} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
                          <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}{song.location ? ` · ${song.location}` : ""}</span>
                            {song.music_type && (
                              <span style={{ color: "var(--app-accent)", fontSize: 10, background: "rgba(var(--app-accent-rgb),0.1)", padding: "1px 6px", borderRadius: 4, textTransform: "capitalize", flexShrink: 0 }}>{song.music_type}</span>
                            )}
                          </div>
                          {isActive && <div style={{ marginTop: 5 }}><SmoothProgressBar progress={progress} isActive /></div>}
                        </div>
                        <div className="song-duration" style={{ color: "var(--app-text-muted)", fontSize: 12, fontFamily: "monospace", flexShrink: 0 }}>{fmt(song.duration)}</div>
                        <FavoriteButton song={song} />
                        <button onClick={e => { e.stopPropagation(); playSongFromList(song); }} style={{
                          background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.15)",
                          border: "none", borderRadius: "50%", width: 30, height: 30,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isActive ? "#000" : "var(--app-accent)", cursor: "pointer", fontSize: 11, flexShrink: 0, transition: "all 0.18s",
                        }}>▶</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load more */}
              {songs.length < total && !loading && (
                <button onClick={() => { const np = page + 1; setPage(np); fetchPodcasts(search, np, true); }} style={{
                  display: "block", margin: "18px auto 8px",
                  background: "none", border: "1px solid rgba(var(--app-accent-rgb),0.3)",
                  borderRadius: 9, color: "var(--app-text-muted)", cursor: "pointer",
                  padding: "10px 32px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--app-accent)"; e.currentTarget.style.color = "var(--app-accent)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.3)"; e.currentTarget.style.color = "var(--app-text-muted)"; }}
                >Load More</button>
              )}

              <div style={{ height: 16 }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── PLAYER BAR ── */}
      <div className="player-bar">
        <div className="player-progress-line" style={{ width: `${progressPct}%` }} />

        <div className="player-track">
          <div style={{ width: 42, height: 42, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: currentSong ? "0 0 12px rgba(var(--app-accent-rgb),0.25)" : "none", position: "relative" }}>
            {currentSong?.cover_url ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎙"}
            {isPlaying && currentSong && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MiniWave isPlaying={true} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: currentSong ? "var(--app-text-main)" : "var(--app-text-muted)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {currentSong?.name || "No Podcast Selected"}
            </div>
            <div style={{ color: "var(--app-text-muted)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {currentSong?.artist || "Pick a podcast to play"}
            </div>
          </div>
        </div>

        <div className="player-wave"><Waveform isPlaying={isPlaying} /></div>

        <div className="player-controls">
          <button onClick={playPrev} style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--app-text-main)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--app-text-muted)"}>⏮</button>
          <button onClick={togglePlay} style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 14, fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 14px rgba(var(--app-accent-rgb),0.4)", transition: "transform 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={playNext} style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--app-text-main)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--app-text-muted)"}>⏭</button>
          <button style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 14, padding: 4 }}>🔁</button>
        </div>

        <div className="player-seek">
          <input type="range" min={0} max={duration || 0} value={currentTime}
            onChange={e => seekTo(Number(e.target.value))}
            style={{ width: "100%", background: `linear-gradient(to right,var(--app-accent) ${progressPct}%,var(--app-border) 0%)` }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--app-text-muted)", fontSize: 10 }}>
            <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
          </div>
        </div>

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
