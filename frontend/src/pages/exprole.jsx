// explore.jsx

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import FavoriteButton from "@/components/FavoriteButton"
import { useUser } from "@/context/userContext"
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer"
import NavbarMenu, { useNavbar, HamburgerBtn } from "@/components/ui/NavbarMenu"
import PlayerBar from "@/components/ui/PlayerBar"
const SUPABASE_URL = "https://bnxahrapojygsulzfqpw.supabase.co"
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJueGFocmFwb2p5Z3N1bHpmcXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDA5MTEsImV4cCI6MjA5Mzk3NjkxMX0.NrdMW-eiiVCQLOUnHN0QZmb3GMnnH6bp0Ah3uP4v5uI"
const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
}

const fmt = (s) =>
  !s || isNaN(s)
    ? "0:00"
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

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
)

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
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--app-text-main)", flexShrink: 0 }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,rgba(var(--app-accent-rgb),0.2),transparent)" }} />
      </div>
      {children}
    </div>
  )
}

function SongCard({ song, currentSong, isPlaying, onPlay, currentTime, duration }) {
  const active = currentSong?.id === song.id
  const progress = active && duration > 0 ? currentTime / duration : 0

  return (
    <div
      onClick={() => onPlay(song)}
      style={{
        background: active ? "rgba(var(--app-accent-rgb),0.08)" : "var(--app-surface)",
        border: `1px solid ${active ? "rgba(var(--app-accent-rgb),0.3)" : "var(--app-border)"}`,
        borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all 0.2s",
        boxShadow: active ? "0 6px 24px rgba(var(--app-accent-rgb),0.2)" : "0 2px 8px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.transform = "translateY(-2px)" }}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ width: "100%", aspectRatio: "1", overflow: "hidden", position: "relative" }}>
        {song.cover_url
          ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, background: "var(--app-surface)" }}>🎵</div>
        }
        <div style={{ position: "absolute", top: 6, right: 6 }}>
          <FavoriteButton song={song} size={26} iconSize={12} />
        </div>
        {active && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waveform isPlaying={isPlaying} />
          </div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--app-accent)" : "var(--app-text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {song.name}
        </div>
        <div style={{ marginTop: 4, color: "var(--app-text-muted)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {song.artist || "Unknown"}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 10, background: "rgba(var(--app-accent-rgb),0.12)", color: "var(--app-accent)", textTransform: "capitalize", flexShrink: 0 }}>
            {song.music_type || "audio"}
          </span>
          <div style={{ flex: 1 }}><SmoothProgressBar progress={progress} isActive={active} /></div>
        </div>
      </div>
    </div>
  )
}

function ContinueCard({ song, currentSong, isPlaying, onPlay, currentTime, duration }) {
  const active = currentSong?.id === song.id
  const progress = active && duration > 0 ? currentTime / duration : 0

  return (
    <div
      onClick={() => onPlay(song)}
      style={{
        background: active ? "rgba(var(--app-accent-rgb),0.08)" : "var(--app-surface)",
        border: `1px solid ${active ? "rgba(var(--app-accent-rgb),0.3)" : "var(--app-border)"}`,
        borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer", transition: "all 0.2s",
        boxShadow: active ? "0 4px 20px rgba(var(--app-accent-rgb),0.15)" : "none",
      }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 12, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        {song.cover_url
          ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--app-surface)", fontSize: 20 }}>🎵</div>
        }
        {active && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MiniWave isPlaying={isPlaying} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--app-accent)" : "var(--app-text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {song.name}
        </div>
        <div style={{ marginTop: 3, fontSize: 11, color: "var(--app-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {song.artist || "Unknown"}
        </div>
        {active && <div style={{ marginTop: 6 }}><SmoothProgressBar progress={progress} isActive={active} /></div>}
      </div>
      <FavoriteButton song={song} />
    </div>
  )
}

export default function Explore() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [songs, setSongs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const { sidebarOpen, toggleSidebar, closeSidebar } = useNavbar()
  const searchTimer = useRef(null)

  const {
    currentSong, isPlaying, currentTime, duration,
    volume, progressPct, playSongFromList, togglePlay,
    playNext, playPrev, seekTo, setVolume,
  } = usePersistentSongPlayer(songs)

  const fetchSongs = useCallback(async (q = "", p = 0, append = false) => {
    setLoading(true)
    try {
      const from = p * 20
      let url = `${SUPABASE_URL}/rest/v1/songs?select=*&order=created_at.desc&limit=20&offset=${from}`
      if (q) url += `&or=(name.ilike.*${encodeURIComponent(q)}*,artist.ilike.*${encodeURIComponent(q)}*,music_type.ilike.*${encodeURIComponent(q)}*)`
      const res = await fetch(url, {
        headers: { ...H, "Range-Unit": "items", Range: `${from}-${from + 19}`, Prefer: "count=exact" },
      })
      const data = await res.json()
      const ct = res.headers.get("Content-Range")
      if (ct) setTotal(parseInt(ct.split("/")[1]) || 0)
      setSongs(prev => append ? [...prev, ...data] : (Array.isArray(data) ? data : []))
    } catch (e) { console.error(e); setSongs([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSongs() }, [fetchSongs])

  const handleSearch = (val) => {
    setSearch(val); setPage(0)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchSongs(val, 0, false), 400)
  }

  const cardProps = { currentSong, isPlaying, onPlay: playSongFromList, currentTime, duration }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100dvh",
      background: "var(--app-shell-bg)", color: "var(--app-text-main)",
      overflow: "hidden", fontFamily: "'DM Sans',sans-serif",
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

        .continue-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
        @media(max-width:600px){.continue-grid{grid-template-columns:1fr}}

        .explore-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
        @media(max-width:480px){.explore-grid{grid-template-columns:1fr 1fr;gap:10px}}

        .h-scroll{display:flex;gap:14px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}
        .h-scroll::-webkit-scrollbar{height:3px}

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

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <NavbarMenu sidebarOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="qa-sidebar-spacer" />
        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          <DashboardNavbar onToggleSidebar={toggleSidebar} />

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--app-shell-bg-alt)", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", flexShrink: 0 }}>


            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700 }}>Explore</span>
              <span style={{ background: "rgba(var(--app-accent-rgb),0.15)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(var(--app-accent-rgb),0.3)" }}>
                {loading ? "…" : `${total} Files`}
              </span>
            </div>

            <div style={{ flex: 1 }} />

            <div className="topbar-search" style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--app-text-muted)", fontSize: 13, pointerEvents: "none" }}>🔍</span>
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search songs, reciters..."
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
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

            <h1 style={{ fontSize: "clamp(16px,3.5vw,24px)", fontWeight: 800, margin: "0 0 20px" }}>
              Explore Islamic Audio <span style={{ color: "var(--app-accent)" }}>✨</span>
            </h1>

            {/* Continue Listening */}
            <Section title="Continue Listening">
              <div className="continue-grid">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ borderRadius: 14, height: 82 }} />
                  ))
                  : songs.slice(0, 4).map(song => (
                    <ContinueCard key={song.id} song={song} {...cardProps} />
                  ))}
              </div>
            </Section>

            {/* Trending */}
            <Section title="Trending Now 🔥">
              <div className="h-scroll">
                {(loading ? Array.from({ length: 6 }) : songs.slice(0, 10)).map((song, i) =>
                  song
                    ? <div key={song.id} style={{ minWidth: 170, maxWidth: 190, flex: "0 0 auto" }}>
                      <SongCard song={song} {...cardProps} />
                    </div>
                    : <div key={i} className="skeleton" style={{ width: 170, height: 220, borderRadius: 16, flexShrink: 0 }} />
                )}
              </div>
            </Section>

            {/* All Songs label */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", flexShrink: 0 }}>
                {loading ? "LOADING..." : `ALL AUDIO · ${total}`}
              </span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,var(--app-border),transparent)" }} />
            </div>

            {/* All songs grid */}
            {loading
              ? <div className="explore-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 230, borderRadius: 16 }} />
                ))}
              </div>
              : songs.length === 0
                ? <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--app-text-muted)" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>No songs found</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Try a different search term</div>
                </div>
                : <div className="explore-grid">
                  {songs.map(song => (
                    <SongCard key={song.id} song={song} {...cardProps} />
                  ))}
                </div>
            }

            {songs.length < total && (
              <button
                onClick={() => { const p = page + 1; setPage(p); fetchSongs(search, p, true) }}
                style={{
                  display: "block", margin: "18px auto 8px",
                  background: "none", border: "1px solid rgba(var(--app-accent-rgb),0.3)",
                  borderRadius: 9, color: "var(--app-text-muted)", cursor: "pointer",
                  padding: "10px 32px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--app-accent)"; e.currentTarget.style.color = "var(--app-accent)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.3)"; e.currentTarget.style.color = "var(--app-text-muted)" }}
              >Load More</button>
            )}

            <div style={{ height: 12 }} />
          </div>
        </div>
      </div>
      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        progressPct={progressPct}
        togglePlay={togglePlay}
        playNext={playNext}
        playPrev={playPrev}
        seekTo={seekTo}
        setVolume={setVolume}
      />
    </div>
  )
}