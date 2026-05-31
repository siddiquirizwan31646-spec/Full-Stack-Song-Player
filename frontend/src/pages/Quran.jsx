import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "@/components/DashboardNavbar";
import FavoriteButton from "@/components/FavoriteButton";
import { useUser } from "@/context/userContext";
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer";
import NavbarMenu, { useNavbar, HamburgerBtn } from "@/components/ui/NavbarMenu"
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

const PARA_NAMES = [
  "Alif Laam Meem", "Sayaqool", "Tilkar Rusul", "Lan Tana Loo", "Wal Mohsanat",
  "La Yuhibbullah", "Wa Iza Samiu", "Wa Lau Annana", "Qalal Malao", "Wa A'lamu",
  "Ya'tazeroon", "Wa Mamin Dabbah", "Wa Ma Ubarri'u", "Rubama", "Subhanallazi",
  "Qal Alam", "Iqtarabo", "Qad Aflaha", "Wa Qalallazina", "Amman Khalaqa",
  "Utlu Ma Oohi'a", "Wa Man Yaqnut", "Wa Mali'a", "Faman Azlamu", "Elahe Yuruddo",
  "Ha'a Meem", "Qala Fama Khatbukum", "Qad Sami'allah", "Tabarakallazi", "Amma",
];


function SmoothProgressBar({ progress, isActive }) {
  return (
    <div style={{ height: 3, background: "var(--app-border)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        width: `${Math.min((progress || 0) * 100, 100)}%`,
        height: "100%",
        background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.4)",
        borderRadius: 2,
        transition: "width 0.5s linear",
      }} />
    </div>
  );
}

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
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 3, height: "100%", background: "var(--app-accent)", borderRadius: 2,
          animation: isPlaying ? `wave ${0.5 + i * 0.15}s ease-in-out infinite alternate` : "none",
          animationDelay: `${i * 0.1}s`, opacity: isPlaying ? 1 : 0.4,
        }} />
      ))}
    </div>
  );
}

export default function QuranPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const displayName = user?.username || "Guest";

  const [songs, setSongs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [view, setView] = useState("list");
  const [activePara, setActivePara] = useState(null);
  const { sidebarOpen, toggleSidebar, closeSidebar } = useNavbar()

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

  const fetchQuran = useCallback(async (q = "", p = 0, append = false, paraFilter = null) => {
    setLoading(true);
    try {
      const from = p * 30;
      let url = `${SUPABASE_URL}/rest/v1/songs?select=*&music_type=eq.quran&order=created_at.desc&limit=30&offset=${from}`;
      if (q) url += `&or=(name.ilike.*${encodeURIComponent(q)}*,artist.ilike.*${encodeURIComponent(q)}*)`;
      if (paraFilter !== null) url += `&para_number=eq.${paraFilter}`;
      const res = await fetch(url, {
        headers: { ...H, "Range-Unit": "items", Range: `${from}-${from + 29}`, Prefer: "count=exact" },
      });
      const data = await res.json();
      const ct = res.headers.get("Content-Range");
      if (ct) setTotal(parseInt(ct.split("/")[1]) || 0);
      setSongs((prev) => (append ? [...prev, ...data] : Array.isArray(data) ? data : []));
    } catch (e) { console.error(e); setSongs([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchQuran(); }, [fetchQuran]);

  const handleSearch = (val) => {
    setSearch(val); setPage(0);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchQuran(val, 0, false, activePara), 400);
  };

  const handleParaFilter = (paraNum) => {
    const next = activePara === paraNum ? null : paraNum;
    setActivePara(next);
    setPage(0);
    fetchQuran(search, 0, false, next);
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

  input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--app-accent);cursor:pointer;box-shadow:0 0 6px rgba(var(--app-accent-rgb),0.5)}

  @keyframes wave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
  @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
  .skeleton{background:linear-gradient(90deg,var(--app-surface) 25%,rgba(var(--app-accent-rgb),0.06) 50%,var(--app-surface) 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}

  .topbar-search{width:220px}
  @media(max-width:600px){.topbar-search{width:140px}}
  @media(max-width:420px){.topbar-search{display:none}}

  .hero-banner{margin:16px 16px 0;background:linear-gradient(135deg,rgba(var(--app-accent-rgb),0.12) 0%,rgba(16,185,129,0.08) 50%,rgba(6,95,70,0.06) 100%);border:1px solid rgba(var(--app-accent-rgb),0.2);border-radius:14px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between}
  @media(max-width:500px){.hero-banner{padding:14px 16px}.hero-banner-emoji{display:none!important}}

  .song-grid{display:flex;flex-wrap:wrap;gap:14px}
  @media(max-width:480px){.song-grid{gap:10px}}
  .song-card-wrap{width:150px;flex-shrink:0;transition:transform 0.2s}
  .song-card-wrap:hover{transform:translateY(-2px)}
  @media(max-width:480px){.song-card-wrap{width:calc(50% - 5px)}}

  .song-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:2px;border-left:3px solid transparent;transition:all 0.18s}
  .song-row:hover{background:var(--app-surface)}
  .song-row.active-row{border-left-color:var(--app-accent);background:rgba(var(--app-accent-rgb),0.06)}

  .para-chips{display:flex;gap:6px;overflow-x:auto;padding:14px 16px 0;-webkit-overflow-scrolling:touch}
  .para-chips::-webkit-scrollbar{height:3px}
  .para-chip{background:var(--app-surface);border:1px solid var(--app-border);border-radius:20px;color:var(--app-text-muted);cursor:pointer;padding:5px 11px;font-size:11px;font-weight:500;font-family:'DM Sans',sans-serif;flex-shrink:0;transition:all 0.2s;white-space:nowrap}
  .para-chip:hover{background:rgba(var(--app-accent-rgb),0.1);border-color:rgba(var(--app-accent-rgb),0.4)}
  .para-chip.active{background:rgba(var(--app-accent-rgb),0.2);border-color:rgba(var(--app-accent-rgb),0.5);color:var(--app-accent);font-weight:700}

  .player-bar{background:var(--app-shell-bg-alt);border-top:1px solid rgba(var(--app-accent-rgb),0.18);padding:10px 16px;display:flex;align-items:center;gap:14px;flex-shrink:0;position:sticky;bottom:0;z-index:20;overflow:hidden}
  .player-progress-line{position:absolute;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--app-accent-strong),var(--app-accent));transition:width 0.5s linear;pointer-events:none}
  .player-track{display:flex;align-items:center;gap:10px;flex:0 0 auto;width:200px;min-width:0}
  .player-wave{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .player-controls{display:flex;align-items:center;gap:10px;flex-shrink:0}
  .player-seek{display:flex;flex-direction:column;gap:3px;width:170px;flex-shrink:0}
  .player-vol{display:flex;align-items:center;gap:8px;flex-shrink:0}
  @media(max-width:1000px){.player-wave{display:none}}
  @media(max-width:750px){.player-vol{display:none}}
  @media(max-width:600px){.player-bar{padding:8px 10px;gap:8px}.player-track{width:auto;flex:1;min-width:0}.player-seek{width:110px}}
  @media(max-width:450px){.player-seek{display:none}}

  @media(max-width:500px){.song-duration{display:none!important}}
`}</style>
      <DashboardNavbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <NavbarMenu sidebarOpen={sidebarOpen} onClose={closeSidebar} />

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--app-shell-bg-alt)", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", flexShrink: 0 }}>
            <HamburgerBtn onClick={toggleSidebar} />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📖</span>
              <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700 }}>Quran</span>
              <span style={{ background: "rgba(var(--app-accent-rgb),0.15)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(var(--app-accent-rgb),0.3)" }}>
                {loading ? "…" : `${total} tracks`}
              </span>
            </div>

            <div style={{ flex: 1 }} />

            {/* View toggle */}
            <div style={{ display: "flex", background: "var(--app-surface)", borderRadius: 8, padding: 2, border: "1px solid var(--app-border)", flexShrink: 0 }}>
              {["grid", "list"].map((v) => (
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
              <input
                value={search} onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search surahs, reciters..."
                style={{
                  background: "var(--app-surface)", border: "1px solid var(--app-border)",
                  borderRadius: 9, padding: "8px 12px 8px 32px", color: "var(--app-text-main)",
                  fontSize: 13, outline: "none", width: "100%", fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--app-accent)"}
                onBlur={(e) => e.target.style.borderColor = "var(--app-border)"}
              />
            </div>
          </div>

          {/* Scroll area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>

            {/* Hero Banner */}
            <div className="hero-banner">
              <div>
                <div style={{ color: "var(--app-accent)", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 5 }}>HOLY QURAN — 30 PARAS</div>
                <div style={{ color: "var(--app-text-main)", fontSize: "clamp(16px,3vw,22px)", fontWeight: 800, marginBottom: 4 }}>القرآن الكريم — The Noble Quran</div>
                <div style={{ color: "var(--app-text-muted)", fontSize: 12 }}>Complete recitations ordered by Para — listen in sequence</div>
              </div>
              <div className="hero-banner-emoji" style={{ fontSize: 44, opacity: 0.6 }}>📖</div>
            </div>

            {/* Para Filter Chips */}
            <div className="para-chips">
              <button
                className={`para-chip${activePara === null ? " active" : ""}`}
                onClick={() => { setActivePara(null); setPage(0); fetchQuran(search, 0, false, null); }}
              >All Paras</button>
              {Array.from({ length: 30 }).map((_, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n}
                    className={`para-chip${activePara === n ? " active" : ""}`}
                    onClick={() => handleParaFilter(n)}
                  >Para {n}</button>
                );
              })}
            </div>

            <div style={{ padding: "14px 16px 0" }}>
              {/* All songs label */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", flexShrink: 0 }}>
                  {loading ? "LOADING..." : `ALL RECITATIONS · ${total}`}
                </span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,var(--app-border),transparent)" }} />
              </div>

              {loading ? (
                <div className="song-grid">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className={`skeleton song-card-wrap`} style={{ height: 190, borderRadius: 12 }} />
                  ))}
                </div>
              ) : songs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--app-text-muted)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>No recitations found</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Try a different search or Para</div>
                </div>
              ) : view === "grid" ? (

                /* GRID VIEW */
                <div className="song-grid">
                  {songs.map((song) => {
                    const isActive = currentSong?.id === song.id;
                    const progress = isActive && duration > 0 ? currentTime / duration : 0;
                    const paraNum = song.para_number;
                    return (
                      <div key={song.id} className="song-card-wrap">
                        <div onClick={() => playSongFromList(song)} style={{
                          background: isActive ? "rgba(var(--app-accent-rgb),0.08)" : "var(--app-surface)",
                          border: `1px solid ${isActive ? "rgba(var(--app-accent-rgb),0.35)" : "var(--app-border)"}`,
                          borderRadius: 14, overflow: "hidden", cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: isActive ? "0 6px 24px rgba(var(--app-accent-rgb),0.2)" : "0 2px 8px rgba(0,0,0,0.2)",
                        }}>
                          <div style={{ width: "100%", aspectRatio: "1", background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                            {song.cover_url
                              ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                  <div style={{ fontSize: 28, opacity: 0.5 }}>📖</div>
                                  {paraNum && (
                                    <div style={{ fontSize: 10, color: "var(--app-accent)", fontWeight: 700, background: "rgba(var(--app-accent-rgb),0.15)", padding: "2px 8px", borderRadius: 10 }}>
                                      Para {paraNum}
                                    </div>
                                  )}
                                </div>
                              )}
                            {paraNum && song.cover_url && (
                              <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(var(--app-accent-rgb),0.9)", borderRadius: 8, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#000" }}>
                                Para {paraNum}
                              </div>
                            )}
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
                            <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist || "Unknown"}</div>
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

              ) : (

                /* LIST VIEW */
                <div>
                  {songs.map((song, idx) => {
                    const isActive = currentSong?.id === song.id;
                    const progress = isActive && duration > 0 ? currentTime / duration : 0;
                    const paraNum = song.para_number;
                    const paraName = paraNum ? PARA_NAMES[paraNum - 1] : null;
                    return (
                      <div key={song.id}
                        className={`song-row${isActive ? " active-row" : ""}`}
                        onClick={() => playSongFromList(song)}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--app-surface)"; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* Para badge */}
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: paraNum ? "rgba(var(--app-accent-rgb),0.12)" : "var(--app-surface)",
                          border: paraNum ? "1px solid rgba(var(--app-accent-rgb),0.25)" : "1px solid var(--app-border)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 700, color: paraNum ? "var(--app-accent)" : "var(--app-text-muted)",
                          fontFamily: "monospace",
                        }}>
                          {paraNum || idx + 1}
                        </div>

                        {/* Cover */}
                        <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative", boxShadow: isActive ? "0 0 14px rgba(var(--app-accent-rgb),0.35)" : "none" }}>
                          {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📖"}
                          {isActive && (
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <MiniWave isPlaying={isPlaying} />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
                          <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}{song.location ? ` · ${song.location}` : ""}</span>
                            {paraName && (
                              <span style={{ color: "var(--app-accent)", fontSize: 10, background: "rgba(var(--app-accent-rgb),0.1)", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>{paraName}</span>
                            )}
                            {song.music_type && (
                              <span style={{ color: "var(--app-accent)", fontSize: 10, background: "rgba(var(--app-accent-rgb),0.1)", padding: "1px 6px", borderRadius: 4, textTransform: "capitalize", flexShrink: 0 }}>{song.music_type}</span>
                            )}
                          </div>
                          {isActive && <div style={{ marginTop: 5 }}><SmoothProgressBar progress={progress} isActive /></div>}
                        </div>

                        <div className="song-duration" style={{ color: "var(--app-text-muted)", fontSize: 12, fontFamily: "monospace", flexShrink: 0 }}>{fmt(song.duration)}</div>
                        <FavoriteButton song={song} />
                        <button onClick={(e) => { e.stopPropagation(); playSongFromList(song); }} style={{
                          background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.15)",
                          border: "none", borderRadius: "50%", width: 30, height: 30,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: isActive ? "#000" : "var(--app-accent)", cursor: "pointer", fontSize: 11, flexShrink: 0,
                          transition: "all 0.18s",
                        }}>▶</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {songs.length < total && (
                <button
                  onClick={() => { const np = page + 1; setPage(np); fetchQuran(search, np, true, activePara); }}
                  style={{
                    display: "block", margin: "18px auto 8px",
                    background: "none", border: "1px solid rgba(var(--app-accent-rgb),0.3)",
                    borderRadius: 9, color: "var(--app-text-muted)", cursor: "pointer",
                    padding: "10px 32px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--app-accent)"; e.currentTarget.style.color = "var(--app-accent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.3)"; e.currentTarget.style.color = "var(--app-text-muted)"; }}
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

        {/* Track info */}
        <div className="player-track">
          <div style={{ width: 42, height: 42, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: currentSong ? "0 0 12px rgba(var(--app-accent-rgb),0.25)" : "none", position: "relative" }}>
            {currentSong?.cover_url ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📖"}
            {isPlaying && currentSong && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MiniWave isPlaying={true} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: currentSong ? "var(--app-text-main)" : "var(--app-text-muted)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {currentSong?.name || "No Recitation Selected"}
            </div>
            <div style={{ color: "var(--app-text-muted)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {currentSong
                ? `${currentSong.artist || "Unknown"}${currentSong.para_number ? ` · Para ${currentSong.para_number}` : ""}`
                : "Pick a recitation to play"}
            </div>
          </div>
        </div>

        {/* Waveform */}
        <div className="player-wave"><Waveform isPlaying={isPlaying} /></div>

        {/* Controls */}
        <div className="player-controls">
          <button onClick={playPrev} title="Previous"
            style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--app-text-main)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--app-text-muted)"}>⏮</button>
          <button onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 14, fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 14px rgba(var(--app-accent-rgb),0.4)", transition: "transform 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={playNext} title="Next"
            style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--app-text-main)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--app-text-muted)"}>⏭</button>
          <button title="Repeat" style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 14, padding: 4 }}>🔁</button>
        </div>

        {/* Seek */}
        <div className="player-seek">
          <input type="range" min={0} max={duration || 0} value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
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
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ width: 70, background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,var(--app-border) 0%)` }}
          />
        </div>
      </div>
    </div>
  );
}
