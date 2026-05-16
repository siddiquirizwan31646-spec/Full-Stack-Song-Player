import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import { useUser } from "@/context/userContext"
import FavoriteButton from "@/components/FavoriteButton"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" }
const API = import.meta.env.VITE_API_URL
const getToken = () => localStorage.getItem("accessToken")
const authH = (ct = true) => { const h = {}; if (ct) h["Content-Type"] = "application/json"; const t = getToken(); if (t) h.Authorization = `Bearer ${t}`; return h }
const fmt = (s) => (!s || isNaN(s)) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

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

const Waveform = ({ isPlaying }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2, height: 32 }}>
    {Array.from({ length: 28 }).map((_, i) => {
      const h = 6 + Math.sin(i * 0.8) * 8 + ((i * 7) % 9)
      return (
        <div key={i} style={{
          width: 3, height: h,
          background: isPlaying ? `rgba(var(--app-accent-rgb),${0.4 + (i % 3) * 0.2})` : "rgba(var(--app-accent-rgb),0.2)",
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

const ProgressBar = ({ progress, isActive }) => (
  <div style={{ height: 3, background: "var(--app-border)", borderRadius: 2, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min((progress || 0) * 100, 100)}%`, height: "100%",
      background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.4)",
      borderRadius: 2, transition: "width 0.5s linear",
    }} />
  </div>
)

function AddToPlaylistDropdown({ song, userId, onClose }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(null)
  const [toast, setToast] = useState("")
  const ref = useRef(null)

  useEffect(() => {
    if (!userId || !getToken()) { setLoading(false); return }
    fetch(`${API}/playlists`, { headers: authH(false) })
      .then(r => r.json()).then(d => { if (d.success) setPlaylists(d.playlists) }).catch(console.error).finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [onClose])

  const add = async (pl) => {
    setAdding(pl._id)
    try {
      const r = await fetch(`${API}/playlists/${pl._id}/songs`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ songId: String(song.id), songName: song.name, artist: song.artist, cover_url: song.cover_url, mp3_url: song.mp3_url, duration: song.duration })
      })
      setToast(r.status === 409 ? "Already in playlist" : r.ok ? "✓ Added!" : "Failed")
    } catch { setToast("Error") }
    setAdding(null)
    setTimeout(() => { setToast(""); onClose() }, 1200)
  }

  return (
    <div ref={ref} style={{
      position: "absolute", zIndex: 1000, top: "110%", right: 0,
      background: "var(--app-shell-bg-alt)", border: "1px solid rgba(var(--app-accent-rgb),0.25)",
      borderRadius: 12, minWidth: 190, maxWidth: 220,
      boxShadow: "0 12px 40px rgba(0,0,0,0.6)", overflow: "hidden", backdropFilter: "blur(16px)",
    }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--app-border)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
        📋 ADD TO PLAYLIST
      </div>
      {toast
        ? <div style={{ padding: 14, textAlign: "center", color: "var(--app-accent)", fontSize: 13, fontWeight: 600 }}>{toast}</div>
        : loading
        ? <div style={{ padding: 14, color: "var(--app-text-muted)", fontSize: 12, textAlign: "center" }}>Loading…</div>
        : playlists.length === 0
        ? <div style={{ padding: 14, color: "var(--app-text-muted)", fontSize: 12, textAlign: "center" }}>No playlists found</div>
        : playlists.map(pl => (
          <div key={pl._id} onClick={() => add(pl)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: adding === pl._id ? "wait" : "pointer", color: adding === pl._id ? "var(--app-accent)" : "var(--app-text-main)", fontSize: 13, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 15 }}>📋</span>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.name}</span>
            {adding === pl._id && <span style={{ fontSize: 11, color: "var(--app-accent)", animation: "pulse 1s infinite" }}>Adding…</span>}
          </div>
        ))}
    </div>
  )
}

function PlusBtn({ song, userId }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        title="Add to playlist"
        style={{
          width: 30, height: 30, borderRadius: "50%",
          background: open ? "rgba(var(--app-accent-rgb),0.25)" : "rgba(var(--app-accent-rgb),0.1)",
          border: `1px solid ${open ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.3)"}`,
          color: "var(--app-accent)", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.18s", lineHeight: 1,
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.22)"}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.1)" }}
      >+</button>
      {open && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpen(false)} />}
    </div>
  )
}

function SongCard({ song, isActive, onPlay, compact, currentTime, duration, userId }) {
  const progress = isActive && duration > 0 ? currentTime / duration : 0
  const [open, setOpen] = useState(false)

  if (compact) return (
    <div style={{ position: "relative", flexShrink: 0, minWidth: 210, maxWidth: 290, flex: "1 1 210px" }}>
      <div onClick={() => onPlay(song)} style={{
        background: isActive ? "rgba(var(--app-accent-rgb),0.1)" : "var(--app-surface)",
        border: `1px solid ${isActive ? "rgba(var(--app-accent-rgb),0.35)" : "var(--app-border)"}`,
        borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center",
        gap: 12, cursor: "pointer", transition: "all 0.2s",
        boxShadow: isActive ? "0 4px 20px rgba(var(--app-accent-rgb),0.15)" : "none",
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
          {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
          {isActive && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MiniWave isPlaying={true} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
          <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}</div>
          <div style={{ marginTop: 6 }}><ProgressBar progress={isActive ? progress : 0} isActive={isActive} /></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, alignItems: "center" }}>
          <FavoriteButton song={song} size={26} iconSize={13} />
          <button onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
            style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(var(--app-accent-rgb),0.12)", border: "1px solid rgba(var(--app-accent-rgb),0.3)", color: "var(--app-accent)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
      </div>
      {open && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpen(false)} />}
    </div>
  )

  return (
    <div style={{ position: "relative", width: 138, flexShrink: 0 }}>
      <div onClick={() => onPlay(song)} style={{
        background: isActive ? "rgba(var(--app-accent-rgb),0.08)" : "var(--app-surface)",
        border: `1px solid ${isActive ? "rgba(var(--app-accent-rgb),0.3)" : "var(--app-border)"}`,
        borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s",
        boxShadow: isActive ? "0 6px 24px rgba(var(--app-accent-rgb),0.2)" : "0 2px 8px rgba(0,0,0,0.2)",
      }}>
        <div style={{ width: "100%", aspectRatio: "1", background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, overflow: "hidden", position: "relative" }}>
          {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
          {isActive && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Waveform isPlaying={true} />
            </div>
          )}
        </div>
        <div style={{ padding: "10px 10px 12px" }}>
          <div style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
          <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2 }}>{song.artist || "Unknown"}</div>
          <div style={{ display: "flex", gap: 5, marginTop: 8, alignItems: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: isActive ? "#000" : "var(--app-accent)", fontSize: 8, transition: "all 0.2s" }}>▶</div>
            <FavoriteButton song={song} size={22} iconSize={11} />
            <div style={{ flex: 1 }}><ProgressBar progress={isActive ? progress : 0} isActive={isActive} /></div>
            <button onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
              style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(var(--app-accent-rgb),0.12)", border: "1px solid rgba(var(--app-accent-rgb),0.3)", color: "var(--app-accent)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>
      </div>
      {open && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpen(false)} />}
    </div>
  )
}

export default function QalbAudio() {
  const { user } = useUser()
  const navigate = useNavigate()
  const displayName = user?.username || "Guest"
  const userId = user?._id

  const [songs, setSongs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [page, setPage] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const audioRef = useRef(null)
  const searchTimer = useRef(null)
  const playNextRef = useRef(null)

  const fetchSongs = useCallback(async (q = "", p = 0, append = false) => {
    setLoading(true)
    try {
      const from = p * 20
      let url = `${SUPABASE_URL}/rest/v1/songs?select=*&order=created_at.desc&limit=20&offset=${from}`
      if (q) url += `&or=(name.ilike.*${encodeURIComponent(q)}*,artist.ilike.*${encodeURIComponent(q)}*)`
      const res = await fetch(url, { headers: { ...H, "Range-Unit": "items", Range: `${from}-${from + 19}`, Prefer: "count=exact" } })
      const data = await res.json()
      const ct = res.headers.get("Content-Range")
      if (ct) setTotal(parseInt(ct.split("/")[1]) || 0)
      setSongs(prev => append ? [...prev, ...data] : data)
    } catch (e) { console.error(e) }
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
    if (audioRef.current) { audioRef.current.src = song.mp3_url; audioRef.current.volume = volume; audioRef.current.play(); setIsPlaying(true) }
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
    const a = audioRef.current; if (!a) return
    const onTime = () => setCurrentTime(a.currentTime)
    const onMeta = () => setDuration(a.duration)
    const onEnd = () => playNextRef.current?.()
    a.addEventListener("timeupdate", onTime); a.addEventListener("loadedmetadata", onMeta); a.addEventListener("ended", onEnd)
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("loadedmetadata", onMeta); a.removeEventListener("ended", onEnd) }
  }, [])

  const cardProps = { currentTime, duration, userId }
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--app-shell-bg)", color: "var(--app-text-main)", fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>
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
        @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}

        .skeleton{background:linear-gradient(90deg,var(--app-surface) 25%,rgba(var(--app-accent-rgb),0.06) 50%,var(--app-surface) 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}

        /* SIDEBAR */
        .sidebar{width:216px;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),0.1);display:flex;flex-direction:column;flex-shrink:0;transition:transform 0.28s cubic-bezier(.4,0,.2,1)}
        @media(max-width:768px){
          .sidebar{position:fixed;left:0;top:0;bottom:0;z-index:200;width:250px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,0.6)}
          .sidebar.open{transform:translateX(0)}
        }

        /* RIGHT PANEL */
        .right-panel{width:234px;background:var(--app-shell-bg-alt);border-left:1px solid rgba(var(--app-accent-rgb),0.08);padding:16px 14px;display:flex;flex-direction:column;gap:18px;overflow-y:auto;flex-shrink:0}
        @media(max-width:1100px){.right-panel{display:none}}

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

        /* CONTINUE LISTENING GRID */
        .cl-wrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
        @media(max-width:600px){.cl-wrap{grid-template-columns:1fr 1fr}}
        @media(max-width:380px){.cl-wrap{grid-template-columns:1fr}}

        /* CARD SCROLL */
        .h-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}
        .h-scroll::-webkit-scrollbar{height:3px}

        /* SONG LIST ACTIONS - hide duration on mobile */
        @media(max-width:500px){.song-duration{display:none!important}}
      `}</style>

      <DashboardNavbar />

      {/* Mobile overlay */}
      <div className={`mob-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
          {/* Logo header */}
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
              <div key={item.id} className={`nav-item${item.id === "home" ? " active" : ""}`}
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
            <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>Home</span>
            <div style={{ flex: 1 }} />
            <div style={{ position: "relative", width: "min(230px, 100%)" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--app-text-muted)", fontSize: 13, pointerEvents: "none" }}>🔍</span>
              <input
                value={search} onChange={e => handleSearch(e.target.value)}
                placeholder="Search songs, reciters..."
                style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 9, padding: "8px 12px 8px 32px", color: "var(--app-text-main)", fontSize: 13, outline: "none", width: "100%", fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "var(--app-accent)"}
                onBlur={e => e.target.style.borderColor = "var(--app-border)"}
              />
            </div>
          </div>

          {/* Scroll area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            <h1 style={{ fontSize: "clamp(15px,3.5vw,22px)", fontWeight: 700, margin: "0 0 18px" }}>
              Assalamu Alaikum, <span style={{ color: "var(--app-accent)" }}>{displayName}</span> 👋
            </h1>

            {/* Continue Listening */}
            <Section title="Continue Listening">
              <div className="cl-wrap">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ borderRadius: 14, height: 78 }} />
                  ))
                  : songs.slice(0, 4).map(s => (
                    <SongCard key={s.id} song={s} isActive={currentSong?.id === s.id} onPlay={playSong} compact {...cardProps} />
                  ))}
              </div>
            </Section>

            {/* Recently Played + Trending */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginBottom: 24 }}>
              {[{ label: "Recently Played", sl: [0, 5] }, { label: "Trending Now 🔥", sl: [5, 10] }].map(({ label, sl }) => (
                <Section key={label} title={label}>
                  <div className="h-scroll">
                    {(loading ? Array.from({ length: 4 }) : songs.slice(...sl)).map((s, i) =>
                      s
                        ? <SongCard key={s.id} song={s} isActive={currentSong?.id === s.id} onPlay={playSong} {...cardProps} />
                        : <div key={i} className="skeleton" style={{ width: 138, height: 190, borderRadius: 14, flexShrink: 0 }} />
                    )}
                  </div>
                </Section>
              ))}
            </div>

            {/* All Songs header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", flexShrink: 0 }}>
                {loading ? "LOADING..." : `ALL SONGS · ${total}`}
              </span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,var(--app-border),transparent)" }} />
            </div>

            {/* Song rows */}
            {songs.map(song => {
              const active = currentSong?.id === song.id
              return (
                <div key={song.id} className={`song-row${active ? " active-row" : ""}`}>
                  <div onClick={() => playSong(song)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    {/* Cover with animation */}
                    <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative", transition: "box-shadow 0.2s", boxShadow: active ? "0 0 14px rgba(var(--app-accent-rgb),0.35)" : "none" }}>
                      {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
                      {active && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <MiniWave isPlaying={isPlaying} />
                        </div>
                      )}
                    </div>
                    {/* Song info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: active ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
                      <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 5, flexWrap: "nowrap", overflow: "hidden" }}>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}{song.location ? ` · ${song.location}` : ""}</span>
                        {song.music_type && <span style={{ color: "var(--app-accent)", fontSize: 10, background: "rgba(var(--app-accent-rgb),0.1)", padding: "1px 6px", borderRadius: 4, textTransform: "capitalize", flexShrink: 0 }}>{song.music_type}</span>}
                      </div>
                      {active && <div style={{ marginTop: 5 }}><ProgressBar progress={duration > 0 ? currentTime / duration : 0} isActive /></div>}
                    </div>
                    <div className="song-duration" style={{ color: "var(--app-text-muted)", fontSize: 12, fontFamily: "monospace", flexShrink: 0 }}>{fmt(song.duration)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <FavoriteButton song={song} />
                    <PlusBtn song={song} userId={userId} />
                  </div>
                </div>
              )
            })}

            {songs.length < total && (
              <button
                onClick={() => { const p = page + 1; setPage(p); fetchSongs(search, p, true) }}
                style={{ display: "block", margin: "18px auto 8px", background: "none", border: "1px solid rgba(var(--app-accent-rgb),0.3)", borderRadius: 9, color: "var(--app-text-muted)", cursor: "pointer", padding: "10px 32px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--app-accent)"; e.currentTarget.style.color = "var(--app-accent)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.3)"; e.currentTarget.style.color = "var(--app-text-muted)" }}
              >Load More</button>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          {/* Analytics */}
          <div>
            <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Analytics</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[{ label: "Total Songs", value: total || 0 }, { label: "Listeners", value: "5.8K" }, { label: "Saves", value: "940" }, { label: "Likes ♥", value: "11.2K" }].map(s => (
                <div key={s.label} style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 8, padding: "10px 8px" }}>
                  <div style={{ color: "var(--app-text-muted)", fontSize: 10 }}>{s.label}</div>
                  <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 18, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload CTA */}
          <div style={{ background: "rgba(var(--app-accent-rgb),0.06)", border: "1px solid rgba(var(--app-accent-rgb),0.15)", borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>⬆</div>
            <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Share Your Audio</div>
            <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>Upload nasheeds, naats, recitations & more</div>
            <button onClick={() => navigate("/upload")} style={{ width: "100%", padding: "9px 0", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Upload Audio</button>
          </div>

          {/* Chart */}
          <div>
            <div style={{ color: "var(--app-text-main)", fontWeight: 600, fontSize: 13, marginBottom: 10 }}>AI Recommendations</div>
            <div style={{ height: 56, background: "var(--app-surface)", borderRadius: 8, overflow: "hidden" }}>
              <svg viewBox="0 0 180 56" style={{ width: "100%", height: "100%" }}>
                <polyline points="0,50 20,36 40,40 60,26 80,33 100,18 120,28 140,16 160,23 180,13" fill="none" stroke="var(--app-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="0,50 20,36 40,40 60,26 80,33 100,18 120,28 140,16 160,23 180,13 180,56 0,56" fill="rgba(var(--app-accent-rgb),0.08)" />
              </svg>
            </div>
          </div>

          {/* Now Playing card */}
          {currentSong && (
            <div style={{ background: "rgba(var(--app-accent-rgb),0.06)", border: "1px solid rgba(var(--app-accent-rgb),0.2)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ color: "var(--app-text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>NOW PLAYING</div>
              <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", margin: "0 auto 10px", background: "var(--app-surface)", flexShrink: 0 }}>
                {currentSong.cover_url
                  ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎵</div>}
              </div>
              <div style={{ color: "var(--app-text-main)", fontWeight: 600, fontSize: 13, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.name}</div>
              <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginBottom: 10 }}>{currentSong.artist}</div>
              <div style={{ display: "flex", justifyContent: "center" }}><Waveform isPlaying={isPlaying} /></div>
            </div>
          )}
        </div>
      </div>

      {/* ── PLAYER BAR ── */}
      <div className="player-bar">
        {/* Progress line at top of bar */}
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
              {currentSong?.artist || "Pick a song to play"}
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

        {/* Seek bar */}
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

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,rgba(var(--app-accent-rgb),0.2),transparent)" }} />
      </div>
      {children}
    </div>
  )
}