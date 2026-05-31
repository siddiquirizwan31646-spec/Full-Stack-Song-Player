import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import { useUser } from "@/context/userContext"
import FavoriteButton from "@/components/FavoriteButton"
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer"
import NavbarMenu, { useNavbar } from "@/components/ui/NavbarMenu"
import PlayerBar from "@/components/ui/PlayerBar"
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
}

import { API_URL } from "@/lib/config"
const getToken = () => localStorage.getItem("accessToken")
const authH = (ct = true) => {
  const h = {}
  if (ct) h["Content-Type"] = "application/json"
  const t = getToken()
  if (t) h.Authorization = `Bearer ${t}`
  return h
}
const fmt = (s) =>
  !s || isNaN(s)
    ? "0:00"
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

function dicebearUrl(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0a2010,0d1a0a,0a3020&fontFamily=sans-serif&fontSize=38&fontWeight=700&fontColor=4ade80`
}

// ── Waveform ──────────────────────────────────────────────────────────────────
const Waveform = ({ isPlaying, bars = 28, height = 32 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2, height }}>
    {Array.from({ length: bars }).map((_, i) => {
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
    {[0, 1, 2].map((i) => (
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

// ── Add To Playlist ───────────────────────────────────────────────────────────
function AddToPlaylistDropdown({ song, userId, onClose }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(null)
  const [toastMsg, setToastMsg] = useState("")
  const ref = useRef(null)

  useEffect(() => {
    if (!userId || !getToken()) { setLoading(false); return }
    fetch(`${API_URL}/playlists`, { headers: authH(false) })
      .then(r => r.json()).then(d => { if (d.success) setPlaylists(d.playlists) })
      .catch(console.error).finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [onClose])

  const add = async (pl) => {
    setAdding(pl._id)
    try {
      const r = await fetch(`${API_URL}/playlists/${pl._id}/songs`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ songId: String(song.id), songName: song.name, artist: song.artist, cover_url: song.cover_url, mp3_url: song.mp3_url, duration: song.duration }),
      })
      setToastMsg(r.status === 409 ? "Already in playlist" : r.ok ? "✓ Added!" : "Failed")
    } catch { setToastMsg("Error") }
    setAdding(null)
    setTimeout(() => { setToastMsg(""); onClose() }, 1200)
  }

  return (
    <div ref={ref} style={{
      position: "absolute", zIndex: 1000, top: "110%", right: 0,
      background: "var(--app-shell-bg-alt)", border: "1px solid rgba(var(--app-accent-rgb),0.25)",
      borderRadius: 12, minWidth: 190, boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
      overflow: "hidden", backdropFilter: "blur(16px)",
    }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--app-border)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
        📋 ADD TO PLAYLIST
      </div>
      {toastMsg ? (
        <div style={{ padding: 14, textAlign: "center", color: "var(--app-accent)", fontSize: 13, fontWeight: 600 }}>{toastMsg}</div>
      ) : loading ? (
        <div style={{ padding: 14, color: "var(--app-text-muted)", fontSize: 12, textAlign: "center" }}>Loading…</div>
      ) : playlists.length === 0 ? (
        <div style={{ padding: 14, color: "var(--app-text-muted)", fontSize: 12, textAlign: "center" }}>No playlists found</div>
      ) : playlists.map(pl => (
        <div key={pl._id} onClick={() => add(pl)} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
          cursor: adding === pl._id ? "wait" : "pointer",
          color: adding === pl._id ? "var(--app-accent)" : "var(--app-text-main)",
          fontSize: 13, transition: "background 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ fontSize: 15 }}>📋</span>
          <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.name}</span>
          {adding === pl._id && <span style={{ fontSize: 11, color: "var(--app-accent)" }}>Adding…</span>}
        </div>
      ))}
    </div>
  )
}

function PlusBtn({ song, userId }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={e => { e.stopPropagation(); setOpen(v => !v) }} style={{
        width: 28, height: 28, borderRadius: "50%",
        background: open ? "rgba(var(--app-accent-rgb),0.25)" : "rgba(var(--app-accent-rgb),0.1)",
        border: `1px solid ${open ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.3)"}`,
        color: "var(--app-accent)", fontSize: 17, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>+</button>
      {open && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── Artist Card ───────────────────────────────────────────────────────────────
function ArtistCard({ artistName, imageUrl, songCount, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const initials = artistName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
  const imgSrc = imageUrl || dicebearUrl(artistName)

  return (
    <div onClick={() => onClick(artistName)} style={{
      flexShrink: 0, width: 90, cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      transition: "transform 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{
        width: 74, height: 74, borderRadius: "50%", overflow: "hidden",
        background: "linear-gradient(135deg,#0a2010,#1a4020)",
        border: "2px solid rgba(var(--app-accent-rgb),0.3)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--app-accent)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(var(--app-accent-rgb),0.4)" }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.3)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.4)" }}
      >
        {!imageUrl && <span style={{ color: "var(--app-accent)", fontWeight: 800, fontSize: 20, fontFamily: "'DM Sans',sans-serif" }}>{initials}</span>}
        {imageUrl && (
          <>
            {!loaded && <span style={{ position: "absolute", color: "var(--app-accent)", fontWeight: 800, fontSize: 20 }}>{initials}</span>}
            <img src={imgSrc} alt={artistName} onLoad={() => setLoaded(true)} onError={e => e.target.style.display = "none"}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.3s", position: "absolute", inset: 0 }} />
          </>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "var(--app-text-main)", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 88 }}>{artistName}</div>
        <div style={{ color: "var(--app-text-muted)", fontSize: 10, marginTop: 2 }}>{songCount} song{songCount !== 1 ? "s" : ""}</div>
      </div>
    </div>
  )
}

// ── Song thumbnail card ───────────────────────────────────────────────────────
function SongThumbCard({ song, isActive, onPlay, currentTime, duration, userId }) {
  const progress = isActive && duration > 0 ? currentTime / duration : 0
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{ position: "relative", flexShrink: 0, width: 155 }}>
      <div onClick={() => onPlay(song)}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{
          background: isActive ? "rgba(var(--app-accent-rgb),0.08)" : "var(--app-surface)",
          border: `1px solid ${isActive ? "rgba(var(--app-accent-rgb),0.35)" : "var(--app-border)"}`,
          borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s",
          boxShadow: isActive ? "0 6px 24px rgba(var(--app-accent-rgb),0.2)" : hovered ? "0 4px 16px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
          transform: hovered && !isActive ? "translateY(-2px)" : "none",
        }}>
        <div style={{ width: "100%", aspectRatio: "1", background: "var(--app-surface)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
          {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>🎵</span>}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", opacity: isActive || hovered ? 1 : 0, transition: "opacity 0.2s" }}>
            {isActive ? <Waveform isPlaying={true} bars={16} height={28} /> : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--app-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#000", fontWeight: 700 }}>▶</div>}
          </div>
        </div>
        <div style={{ padding: "10px 10px 12px" }}>
          <div style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
          <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist || "Unknown"}</div>
          <div style={{ display: "flex", gap: 5, marginTop: 8, alignItems: "center" }}>
            <FavoriteButton song={song} size={22} iconSize={11} />
            <div style={{ flex: 1 }}><ProgressBar progress={isActive ? progress : 0} isActive={isActive} /></div>
            <button onClick={e => { e.stopPropagation(); setOpen(v => !v) }} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(var(--app-accent-rgb),0.12)", border: "1px solid rgba(var(--app-accent-rgb),0.3)", color: "var(--app-accent)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>
      </div>
      {open && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── Continue Listening card ───────────────────────────────────────────────────
function CLCard({ song, isActive, onPlay, currentTime, duration, userId }) {
  const progress = isActive && duration > 0 ? currentTime / duration : 0
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: "relative", flexShrink: 0, minWidth: 240, maxWidth: 290 }}>
      <div onClick={() => onPlay(song)} style={{
        background: isActive ? "rgba(var(--app-accent-rgb),0.1)" : "var(--app-surface)",
        border: `1px solid ${isActive ? "rgba(var(--app-accent-rgb),0.35)" : "var(--app-border)"}`,
        borderRadius: 14, padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 12, cursor: "pointer", transition: "all 0.2s",
        boxShadow: isActive ? "0 4px 20px rgba(var(--app-accent-rgb),0.15)" : "none",
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
          {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
          {isActive && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying={true} /></div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
          <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}</div>
          <div style={{ marginTop: 6 }}><ProgressBar progress={isActive ? progress : 0} isActive={isActive} /></div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
          <span style={{ color: isActive ? "#000" : "var(--app-accent)", fontSize: 12 }}>▶</span>
        </div>
      </div>
      {open && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── Artists Section ───────────────────────────────────────────────────────────
function ArtistsSection() {
  const navigate = useNavigate()
  const [artistMap, setArtistMap] = useState({})
  const [displayed, setDisplayed] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${SUPABASE_URL}/rest/v1/artists?select=name,image_url&order=name.asc`, { headers: H })
      .then(r => r.json()).then(async artistRows => {
        let rows = Array.isArray(artistRows) ? artistRows : []
        const songsRes = await fetch(`${SUPABASE_URL}/rest/v1/songs?select=artist&artist=not.is.null`, { headers: H })
        const songRows = await songsRes.json()
        const countMap = {}
        if (Array.isArray(songRows)) {
          songRows.forEach(r => { const a = (r.artist || "").trim(); if (a) countMap[a.toLowerCase()] = (countMap[a.toLowerCase()] || 0) + 1 })
        }
        const map = {}
        rows.forEach(r => { if (r.name) map[r.name] = { imageUrl: r.image_url || null, count: countMap[r.name.toLowerCase()] || 0 } })
        if (Array.isArray(songRows)) {
          songRows.forEach(r => { const a = (r.artist || "").trim(); if (a && !map[a]) map[a] = { imageUrl: null, count: countMap[a.toLowerCase()] || 0 } })
        }
        if (!cancelled) { setArtistMap(map); pickRandom(map) }
      }).catch(console.error).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const pickRandom = (map) => {
    const all = Object.keys(map)
    setDisplayed([...all].sort(() => Math.random() - 0.5).slice(0, 12))
  }

  if (!loading && displayed.length === 0) return null
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 15 }}>Artists ›</span>
        <button onClick={() => pickRandom(artistMap)} style={{ background: "none", border: "1px solid rgba(var(--app-accent-rgb),0.3)", borderRadius: 7, color: "var(--app-accent)", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif", padding: "3px 12px", transition: "all 0.18s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >View All ›</button>
      </div>
      <div className="h-scroll">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><div className="skeleton" style={{ width: 74, height: 74, borderRadius: "50%" }} /><div className="skeleton" style={{ width: 60, height: 10, borderRadius: 4 }} /></div>)
          : displayed.map(name => <ArtistCard key={name} artistName={name} imageUrl={artistMap[name]?.imageUrl} songCount={artistMap[name]?.count || 0} onClick={n => navigate(`/hero/artist/${encodeURIComponent(n)}`)} />)
        }
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function QalbAudio() {
  const { user } = useUser()
  const navigate = useNavigate()
  const displayName = user?.username || "Guest"
  const userId = user?._id

  const [songs, setSongs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const { sidebarOpen, toggleSidebar, closeSidebar } = useNavbar()
  const searchTimer = useRef(null)

  const { currentSong, isPlaying, currentTime, duration, volume, progressPct, playSongFromList, togglePlay, playNext, playPrev, seekTo, setVolume } = usePersistentSongPlayer(songs)

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

  // Unified search handler — used by navbar search and nothing else
  const handleSearch = (val) => {
    setSearch(val); setPage(0)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => fetchSongs(val, 0, false), 400)
  }

  const cardProps = { currentTime, duration, userId }

  return (
    // ── ROOT: full viewport height, column flex ──────────────────────────────
    <div className="qa-page-root" style={{
      display: "flex", flexDirection: "column",
      height: "100dvh",
      background: "var(--app-shell-bg)",
      overflow: "hidden",
      // marginLeft gone — handled by CSS class only
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
          *{box-sizing:border-box}
          ::-webkit-scrollbar{width:4px;height:4px}
          ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.2);border-radius:2px}

          .song-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;border-left:3px solid transparent;margin-bottom:2px;transition:all 0.18s;position:relative}
          .song-row:hover{background:var(--app-surface)}
          .song-row.active-row{border-left-color:var(--app-accent);background:rgba(var(--app-accent-rgb),0.06)}

          input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
          input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--app-accent);cursor:pointer;box-shadow:0 0 6px rgba(var(--app-accent-rgb),0.5)}

          @keyframes wave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
          @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
          @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
          @keyframes fadeInUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

          .skeleton{background:linear-gradient(90deg,var(--app-surface) 25%,rgba(var(--app-accent-rgb),0.06) 50%,var(--app-surface) 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}

          /* ── RIGHT PANEL ── */
          .right-panel{width:240px;background:var(--app-shell-bg-alt);border-left:1px solid rgba(var(--app-accent-rgb),0.08);padding:16px 14px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;flex-shrink:0}
          @media(max-width:1100px){.right-panel{display:none}}

          /* ── PLAYER BAR ── */
          .player-bar{
            background:var(--app-shell-bg-alt);
            border-top:1px solid rgba(var(--app-accent-rgb),0.18);
            padding:10px 16px;
            display:flex;align-items:center;gap:14px;
            flex-shrink:0;
            position:relative;
            z-index:20;
            overflow:hidden;
          }
          .player-progress-line{position:absolute;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--app-accent-strong),var(--app-accent));transition:width 0.5s linear;pointer-events:none}
          .player-track{display:flex;align-items:center;gap:10px;flex:0 0 auto;width:200px;min-width:0}
          .player-wave{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden}
          .player-controls{display:flex;align-items:center;gap:10px;flex-shrink:0}
          .player-seek{display:flex;flex-direction:column;gap:3px;width:180px;flex-shrink:0}
          .player-vol{display:flex;align-items:center;gap:8px;flex-shrink:0}
          @media(max-width:1000px){.player-wave{display:none}}
          @media(max-width:750px){.player-vol{display:none}}
          @media(max-width:600px){.player-bar{padding:8px 10px;gap:8px}.player-track{width:auto;flex:1;min-width:0}.player-seek{width:110px}}
          @media(max-width:450px){.player-seek{display:none}}
          @media(max-width: 768px) {.qa-page-root { margin-left: 0}}
          /* HERO BANNER */
          .hero-banner{position:relative;border-radius:18px;overflow:hidden;min-height:280px;display:flex;align-items:flex-end;background:#071a0a;margin-bottom:22px;flex-shrink:0}
.hero-banner-bg{position:absolute;inset:0;background-size:cover;background-position:center 33%;opacity:0.7}
.hero-banner-overlay{position:absolute;inset:0;background:linear-gradient(to right,rgba(4,13,6,0.88) 0%,rgba(4,13,6,0.55) 50%,rgba(4,13,6,0.1) 100%)}
.hero-banner-content{position:relative;z-index:2;padding:15px 20px;width:100%}
.hero-banner-inner{display:flex;align-items:center;justify-content:space-between;gap:12px}
.hero-banner-text{flex:1;min-width:0}
.hero-banner-action{flex-shrink:0}
@media(max-width:480px){
  .hero-banner{min-height:210px}
  .hero-banner-content{padding:18px 16px}
}
          .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
          .view-all-btn{background:none;border:none;color:var(--app-text-muted);cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;transition:color 0.15s}
          .view-all-btn:hover{color:var(--app-accent)}

          .h-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}
          .h-scroll::-webkit-scrollbar{height:3px}

          .cl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
          @media(max-width:600px){.cl-grid{grid-template-columns:1fr 1fr}}
          @media(max-width:380px){.cl-grid{grid-template-columns:1fr}}

          .stat-card{background:var(--app-surface);border:1px solid var(--app-border);border-radius:10px;padding:12px 10px}
          .fade-in-up{animation:fadeInUp 0.45s ease both}
          @media(max-width:500px){.song-duration{display:none!important}}
        `}</style>

      {/* ── LAYOUT: sidebar on left (full height), right side stacks navbar + content + player ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ── SIDEBAR: full height, from very top to very bottom ── */}
        <NavbarMenu sidebarOpen={sidebarOpen} onClose={closeSidebar} />

        {/* ── RIGHT SIDE: navbar + scrollable content + player bar ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* ── NAVBAR — sits at top of right-side column, no border ── */}
          {/* Pass search handlers so navbar search = same as content search */}
          <DashboardNavbar
            onSearch={handleSearch}
            searchValue={search}
            onToggleSidebar={toggleSidebar}
          />

          {/* ── CONTENT ROW: main scroll area + right panel ── */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

            {/* ── MAIN SCROLLABLE CONTENT ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
              {/* HERO BANNER */}
              <div className="hero-banner fade-in-up">
                <div className="hero-banner-bg" style={{ backgroundImage: "url(https://i.postimg.cc/Zn7K81b5/Chat-GPT-Image-May-31-2026-05-18-46-PM.png)" }} />

                {/* Left-side text readability fade */}
                <div style={{
                  position: "absolute", inset: 0, zIndex: 2,
                  background: "linear-gradient(to right, rgba(4,13,6,0.92) 0%, rgba(4,13,6,0.6) 45%, rgba(4,13,6,0.15) 100%)",
                }} />

                {/* Bottom fade — image bleeds into page bg */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", zIndex: 2,
                  background: "linear-gradient(to bottom, transparent 0%, var(--app-shell-bg) 100%)",
                }} />

                <div className="hero-banner-content">
                  <div className="hero-banner-inner">
                    <div className="hero-banner-text">
                      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Assalamu Alaikum,</div>
                      <div style={{ fontSize: "clamp(16px,4vw,26px)", fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>
                        <span style={{ background: "linear-gradient(90deg,var(--app-accent),#86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{displayName} 👋</span>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, lineHeight: 1.5, marginBottom: 0, maxWidth: 200 }}>
                        Discover heart touching nasheeds & soulful recitations.
                      </div>
                    </div>
                    <div className="hero-banner-action">
                      <button onClick={() => navigate("/explore")} style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "10px 16px",
                        background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                        border: "none", borderRadius: 999, color: "#041307",
                        fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 12,
                        cursor: "pointer", whiteSpace: "nowrap",
                        boxShadow: "0 6px 18px rgba(var(--app-accent-rgb),0.4)",
                      }}>
                        Explore Now ✨
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ARTISTS */}
              <ArtistsSection />

              {/* CONTINUE LISTENING */}
              <div style={{ marginBottom: 22 }}>
                <div className="section-header"><span style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 15 }}>Continue Listening</span></div>
                <div className="cl-grid">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: 14, height: 78 }} />)
                    : songs.slice(0, 4).map(s => <CLCard key={s.id} song={s} isActive={currentSong?.id === s.id} onPlay={playSongFromList} {...cardProps} />)
                  }
                </div>
              </div>

              {/* TRENDING NOW */}
              <div style={{ marginBottom: 22 }}>
                <div className="section-header">
                  <span style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 15 }}>Trending Now 🔥</span>
                  <button className="view-all-btn">View All ›</button>
                </div>
                <div className="h-scroll">
                  {(loading ? Array.from({ length: 7 }) : songs.slice(0, 8)).map((s, i) =>
                    s ? <SongThumbCard key={s.id} song={s} isActive={currentSong?.id === s.id} onPlay={playSongFromList} {...cardProps} />
                      : <div key={i} className="skeleton" style={{ width: 155, height: 210, borderRadius: 14, flexShrink: 0 }} />
                  )}
                </div>
              </div>

              {/* RECENTLY PLAYED */}
              <div style={{ marginBottom: 22 }}>
                <div className="section-header">
                  <span style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 15 }}>Recently Played</span>
                  <button className="view-all-btn">View All ›</button>
                </div>
                <div className="h-scroll">
                  {(loading ? Array.from({ length: 5 }) : songs.slice(0, 5)).map((s, i) =>
                    s ? <CLCard key={s.id} song={s} isActive={currentSong?.id === s.id} onPlay={playSongFromList} {...cardProps} />
                      : <div key={i} className="skeleton" style={{ width: 260, height: 78, borderRadius: 14, flexShrink: 0 }} />
                  )}
                </div>
              </div>

              {/* ALL SONGS */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", flexShrink: 0 }}>
                  {loading ? "LOADING..." : `ALL SONGS · ${total}`}
                </span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,var(--app-border),transparent)" }} />
              </div>

              {songs.map(song => {
                const active = currentSong?.id === song.id
                return (
                  <div key={song.id} className={`song-row${active ? " active-row" : ""}`}>
                    <div onClick={() => playSongFromList(song)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative", boxShadow: active ? "0 0 14px rgba(var(--app-accent-rgb),0.35)" : "none" }}>
                        {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
                        {active && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying={isPlaying} /></div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: active ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
                        <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
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
                <button onClick={() => { const p = page + 1; setPage(p); fetchSongs(search, p, true) }}
                  style={{ display: "block", margin: "18px auto 8px", background: "none", border: "1px solid rgba(var(--app-accent-rgb),0.3)", borderRadius: 9, color: "var(--app-text-muted)", cursor: "pointer", padding: "10px 32px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--app-accent)"; e.currentTarget.style.color = "var(--app-accent)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.3)"; e.currentTarget.style.color = "var(--app-text-muted)" }}
                >Load More</button>
              )}
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="right-panel">
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 13 }}>Analytics</span>
                  <span style={{ color: "var(--app-text-muted)", fontSize: 11 }}>This Month ▾</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[{ label: "Total Plays", value: "155", icon: "📈" }, { label: "Listeners", value: "5.8K", icon: "👥" }, { label: "Saves", value: "940", icon: "🔖" }, { label: "Likes", value: "11.2K", icon: "♥" }].map(s => (
                    <div key={s.label} className="stat-card">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ color: "var(--app-text-muted)", fontSize: 10 }}>{s.label}</div>
                        <span style={{ fontSize: 12 }}>{s.icon}</span>
                      </div>
                      <div style={{ color: "var(--app-text-main)", fontWeight: 800, fontSize: 20 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "rgba(var(--app-accent-rgb),0.06)", border: "1px solid rgba(var(--app-accent-rgb),0.15)", borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⬆️</div>
                <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Share Your Audio</div>
                <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>Upload nasheeds, naats, recitations & more</div>
                <button onClick={() => navigate("/upload")} style={{ width: "100%", padding: "9px 0", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", border: "none", borderRadius: 8, color: "#041307", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Upload Audio</button>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "var(--app-text-main)", fontWeight: 600, fontSize: 13 }}>AI Recommendations</span>
                  <span style={{ fontSize: 14 }}>✨</span>
                </div>
                <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginBottom: 8 }}>Based on your listening</div>
                <div style={{ height: 60, background: "var(--app-surface)", borderRadius: 8, overflow: "hidden" }}>
                  <svg viewBox="0 0 200 60" style={{ width: "100%", height: "100%" }}>
                    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--app-accent)" stopOpacity="0.3" /><stop offset="100%" stopColor="var(--app-accent)" stopOpacity="0.02" /></linearGradient></defs>
                    <polyline points="0,55 22,42 44,46 66,30 88,38 110,20 132,30 154,18 176,26 200,14" fill="none" stroke="var(--app-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polygon points="0,55 22,42 44,46 66,30 88,38 110,20 132,30 154,18 176,26 200,14 200,60 0,60" fill="url(#cg)" />
                  </svg>
                </div>
              </div>

              {currentSong && (
                <div style={{ background: "rgba(var(--app-accent-rgb),0.06)", border: "1px solid rgba(var(--app-accent-rgb),0.2)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                  <div style={{ color: "var(--app-text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 10 }}>Now Playing</div>
                  <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", margin: "0 auto 10px", background: "var(--app-surface)", boxShadow: "0 4px 16px rgba(var(--app-accent-rgb),0.25)" }}>
                    {currentSong.cover_url ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎵</div>}
                  </div>
                  <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 13, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.name}</div>
                  <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginBottom: 10 }}>{currentSong.artist}</div>
                  <div style={{ display: "flex", justifyContent: "center" }}><Waveform isPlaying={isPlaying} bars={20} height={28} /></div>
                </div>
              )}
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
      </div>
    </div>
  )
}