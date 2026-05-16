// explore.jsx

import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import FavoriteButton from "@/components/FavoriteButton"
import { useUser } from "@/context/userContext"

const SUPABASE_URL = "https://bnxahrapojygsulzfqpw.supabase.co"
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJueGFocmFwb2p5Z3N1bHpmcXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDA5MTEsImV4cCI6MjA5Mzk3NjkxMX0.NrdMW-eiiVCQLOUnHN0QZmb3GMnnH6bp0Ah3uP4v5uI"
const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
}

const NAV_ITEMS = [
  { icon: "🏠", label: "Home", id: "home", path: "/hero" },
  { icon: "🔍", label: "Explore", id: "explore", path: "/explore" },
  { icon: "📖", label: "Quran", id: "quran", path: "/quran" },
  { icon: "🎵", label: "Nasheed", id: "nasheed", path: "/nasheed" },
  { icon: "🎤", label: "Naat", id: "naat", path: "/naat" },
  { icon: "🎼", label: "Qawwali", id: "qawwali", path: "/qawwali" },
  { icon: "🎙", label: "Podcasts", id: "podcasts", path: "/podcasts" },
  { icon: "📋", label: "Playlists", id: "playlists", path: "/playlists" },
]

const NAV_BOTTOM = [
  { icon: "⬆", label: "Upload Audio", id: "upload", path: "/upload" },
  { icon: "♡", label: "Favorites", id: "favorites", path: "/favorites" },
  { icon: "⚙", label: "Settings", id: "settings", path: "/settings" },
]

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
  const displayName = user?.username || "Guest"

  const [songs, setSongs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [page, setPage] = useState(0)

  const audioRef = useRef(null)
  const searchTimer = useRef(null)
  const playNextRef = useRef(null)

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

  const playSong = useCallback((song) => {
    setCurrentSong(song)
    if (audioRef.current) {
      audioRef.current.src = song.mp3_url
      audioRef.current.volume = volume
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [volume])

  const togglePlay = () => {
    if (!currentSong || !audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
    else { audioRef.current.play(); setIsPlaying(true) }
  }

  const playNext = useCallback(() => {
    const idx = songs.findIndex(s => s.id === currentSong?.id)
    if (idx < songs.length - 1) playSong(songs[idx + 1])
  }, [songs, currentSong, playSong])

  const playPrev = () => {
    const idx = songs.findIndex(s => s.id === currentSong?.id)
    if (idx > 0) playSong(songs[idx - 1])
  }

  useEffect(() => { playNextRef.current = playNext }, [playNext])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onEnd = () => playNextRef.current?.()
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("ended", onEnd)
    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("ended", onEnd)
    }
  }, [])

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0
  const cardProps = { currentSong, isPlaying, onPlay: playSong, currentTime, duration }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "var(--app-shell-bg)", color: "var(--app-text-main)",
      overflow: "hidden", fontFamily: "'DM Sans',sans-serif",
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
        .player-bar{background:var(--app-shell-bg-alt);border-top:1px solid rgba(var(--app-accent-rgb),0.18);padding:10px 16px;display:flex;align-items:center;gap:14px;flex-shrink:0;position:relative;overflow:hidden}
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

        /* GRIDS */
        .continue-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
        @media(max-width:600px){.continue-grid{grid-template-columns:1fr}}

        .explore-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
        @media(max-width:480px){.explore-grid{grid-template-columns:1fr 1fr;gap:10px}}

        /* H-SCROLL */
        .h-scroll{display:flex;gap:14px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}
        .h-scroll::-webkit-scrollbar{height:3px}

        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--app-accent);cursor:pointer;box-shadow:0 0 6px rgba(var(--app-accent-rgb),0.5)}

        @keyframes wave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
        .skeleton{background:linear-gradient(90deg,var(--app-surface) 25%,rgba(var(--app-accent-rgb),0.06) 50%,var(--app-surface) 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}
      `}</style>

      <DashboardNavbar />

      {/* Mobile overlay */}
      <div className={`mob-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
          {/* Logo header — matches hero page */}
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <img
              src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
              alt="QalbAudio"
              onClick={() => { navigate("/"); setSidebarOpen(false) }}
              style={{ height: 60, width: "auto", maxWidth: "88%", objectFit: "contain", cursor: "pointer", display: "block" }}
            />
            <div style={{ fontSize: 11, color: "var(--app-text-muted)", textAlign: "center" }}>
              <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
            {NAV_ITEMS.map(item => (
              <div key={item.id}
                className={`nav-item${item.id === "explore" ? " active" : ""}`}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />
            {NAV_BOTTOM.map(item => (
              <div key={item.id} className="nav-item"
                style={{ color: item.id === "upload" ? "var(--app-accent)" : undefined }}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}>
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
              <span style={{ fontSize: 18 }}>🔍</span>
              <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700 }}>Explore</span>
              <span style={{ background: "rgba(var(--app-accent-rgb),0.15)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(var(--app-accent-rgb),0.3)" }}>
                {loading ? "…" : `${total} tracks`}
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

      {/* ── PLAYER BAR ── */}
      <div className="player-bar">
        <div className="player-progress-line" style={{ width: `${progressPct}%` }} />

        {/* Track info */}
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
              {currentSong?.artist || "Choose audio"}
            </div>
          </div>
        </div>

        {/* Waveform */}
        <div className="player-wave"><Waveform isPlaying={isPlaying} /></div>

        {/* Controls */}
        <div className="player-controls">
          <button onClick={playPrev} title="Previous"
            style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--app-text-main)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--app-text-muted)"}>⏮</button>
          <button onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 14, fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 14px rgba(var(--app-accent-rgb),0.4)", transition: "transform 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={playNext} title="Next"
            style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--app-text-main)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--app-text-muted)"}>⏭</button>
          <button title="Repeat" style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 14, padding: 4 }}>🔁</button>
        </div>

        {/* Seek */}
        <div className="player-seek">
          <input type="range" min={0} max={duration || 0} value={currentTime}
            onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value) }}
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
            onChange={e => { const v = Number(e.target.value); setVolume(v); if (audioRef.current) audioRef.current.volume = v }}
            style={{ width: 70, background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,var(--app-border) 0%)` }}
          />
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  )
}