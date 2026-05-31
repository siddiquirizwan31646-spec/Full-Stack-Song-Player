import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import FavoriteButton from "@/components/FavoriteButton"
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer"
import { useUser } from "@/context/userContext"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlay, faPause, faForwardFast, faBackwardFast } from "@fortawesome/free-solid-svg-icons"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" }
const API_URL = import.meta.env.VITE_API_URL || ""
const getToken = () => localStorage.getItem("accessToken")
const authH = (ct = true) => { const h = {}; if (ct) h["Content-Type"] = "application/json"; const t = getToken(); if (t) h.Authorization = `Bearer ${t}`; return h }
const fmt = (s) => (!s || isNaN(s)) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
function dicebearUrl(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0a0a0a,111827,1a1a2e,0d1117&fontFamily=sans-serif&fontSize=38&fontWeight=700`
}

// ── Waveform ──────────────────────────────────────────────────────────────────
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

// ── Top Artists ───────────────────────────────────────────────────────────────
function TopArtists({ navigate, currentArtist }) {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${SUPABASE_URL}/rest/v1/artists?select=name,image_url&order=name.asc`, { headers: H })
      .then(r => r.json())
      .then(async rows => {
        if (!Array.isArray(rows) || rows.length === 0) return
        const songsRes = await fetch(`${SUPABASE_URL}/rest/v1/songs?select=artist&artist=not.is.null`, { headers: H })
        const songRows = await songsRes.json()
        const countMap = {}
        if (Array.isArray(songRows)) songRows.forEach(r => { const a = (r.artist || "").trim(); if (a) countMap[a.toLowerCase()] = (countMap[a.toLowerCase()] || 0) + 1 })
        const all = rows
          .filter(r => r.name && r.image_url)
          .map(r => ({ name: r.name, imageUrl: r.image_url, count: countMap[r.name.toLowerCase()] || 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
        if (!cancelled) setArtists(all)
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 12.5, marginBottom: 12, letterSpacing: "0.05em" }}>
        🎤 Top Artists
      </div>
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div className="qa-skeleton" style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="qa-skeleton" style={{ width: "70%", height: 10, borderRadius: 4, marginBottom: 5 }} />
                <div className="qa-skeleton" style={{ width: "40%", height: 8, borderRadius: 4 }} />
              </div>
            </div>
          ))
        : artists.map(a => {
            const isActive = a.name === currentArtist
            return (
              <div
                key={a.name}
                onClick={() => navigate(`/hero/artist/${encodeURIComponent(a.name)}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "7px 8px",
                  borderRadius: 9, cursor: "pointer", marginBottom: 2,
                  background: isActive ? "rgba(var(--app-accent-rgb),0.1)" : "transparent",
                  border: isActive ? "1px solid rgba(var(--app-accent-rgb),0.2)" : "1px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--app-surface)" }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2px solid ${isActive ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.2)"}`, background: "var(--app-surface)" }}>
                  <img src={a.imageUrl} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.src = dicebearUrl(a.name) }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                  <div style={{ color: "var(--app-text-muted)", fontSize: 10.5, marginTop: 1 }}>{a.count} song{a.count !== 1 ? "s" : ""}</div>
                </div>
                {isActive && <span style={{ color: "var(--app-accent)", fontSize: 10, flexShrink: 0 }}>●</span>}
              </div>
            )
          })}
    </div>
  )
}

// ── Add To Playlist Dropdown ──────────────────────────────────────────────────
function AddToPlaylistDropdown({ song, userId, onClose, anchorRef }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(null)
  const [toast, setToast] = useState("")
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!userId || !getToken()) { setLoading(false); return }
    fetch(`${API_URL}/playlists`, { headers: authH(false) })
      .then(r => r.json()).then(d => { if (d.success) setPlaylists(d.playlists) })
      .catch(console.error).finally(() => setLoading(false))
  }, [userId])

  // Delayed listener so the triggering click doesn't instantly close the dropdown
  useEffect(() => {
    const fn = (e) => {
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose()
    }
    const timer = setTimeout(() => document.addEventListener("mousedown", fn), 0)
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", fn) }
  }, [onClose, anchorRef])

  const add = async (pl) => {
    setAdding(pl._id)
    try {
      const r = await fetch(`${API_URL}/playlists/${pl._id}/songs`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ songId: String(song.id), songName: song.name, artist: song.artist, cover_url: song.cover_url, mp3_url: song.mp3_url, duration: song.duration })
      })
      setToast(r.status === 409 ? "Already in playlist" : r.ok ? "✓ Added!" : "Failed")
    } catch { setToast("Error") }
    setAdding(null)
    setTimeout(() => { setToast(""); onClose() }, 1200)
  }

  return (
    <div ref={dropdownRef} style={{
      position: "absolute", zIndex: 2000, top: "110%", right: 0,
      background: "var(--app-shell-bg-alt)", border: "1px solid rgba(var(--app-accent-rgb),0.25)",
      borderRadius: 12, minWidth: 200, boxShadow: "0 16px 48px rgba(0,0,0,0.8)", overflow: "hidden",
      backdropFilter: "blur(16px)",
    }}>
      <div style={{ padding: "9px 14px", borderBottom: "1px solid var(--app-border)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
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
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer", color: adding === pl._id ? "var(--app-accent)" : "var(--app-text-main)", fontSize: 13, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span>📋</span>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.name}</span>
            {adding === pl._id && <span style={{ fontSize: 11, color: "var(--app-accent)" }}>Adding…</span>}
          </div>
        ))}
    </div>
  )
}

// ── Three Dots Context Menu ───────────────────────────────────────────────────
function SongContextMenu({ song, onClose, anchorRef, onAddToPlaylist }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const fn = (e) => {
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    const timer = setTimeout(() => document.addEventListener("mousedown", fn), 0)
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", fn) }
  }, [onClose, anchorRef])

  const menuItems = [
    {
      icon: "📋", label: "Add to Playlist",
      action: () => { onClose(); onAddToPlaylist(song.id) }
    },
    {
      icon: "🔗", label: "Copy Link",
      action: () => { navigator.clipboard?.writeText(`${window.location.origin}/hero/artist/${encodeURIComponent(song.artist)}`); onClose() }
    },
    {
      icon: "⬇️", label: "Download",
      action: () => {
        if (song.mp3_url) {
          const a = document.createElement("a"); a.href = song.mp3_url
          a.download = `${song.name}.mp3`; document.body.appendChild(a); a.click(); document.body.removeChild(a)
        }
        onClose()
      }
    },
    {
      icon: "🎤", label: "Go to Artist",
      action: () => { window.location.reload(); onClose() }
    },
    {
      icon: "♡", label: "Add to Favorites",
      action: () => onClose()
    },
  ]

  return (
    <div ref={menuRef} style={{
      position: "absolute", zIndex: 2000, top: "110%", right: 0,
      background: "var(--app-shell-bg-alt)", border: "1px solid rgba(var(--app-accent-rgb),0.25)",
      borderRadius: 12, minWidth: 190, boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
      backdropFilter: "blur(16px)", overflow: "hidden",
    }}>
      <div style={{ padding: "9px 14px", borderBottom: "1px solid var(--app-border)", color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {song.name}
      </div>
      {menuItems.map((item, i) => (
        <div key={i} onClick={item.action}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer", color: "var(--app-text-main)", fontSize: 13, transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Song Row ──────────────────────────────────────────────────────────────────
function SongRow({ song, idx, active, isPlaying, currentTime, duration, playSongFromList, userId, openPlusId, setOpenPlusId, openDotsId, setOpenDotsId }) {
  const progress = active && duration > 0 ? currentTime / duration : 0
  const plusBtnRef = useRef(null)
  const dotsBtnRef = useRef(null)
  const isPlusOpen = openPlusId === song.id
  const isDotsOpen = openDotsId === song.id

  return (
    <div className={`qa-song-row${active ? " active-row" : ""}`}>
      {/* Index / wave */}
      <div style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, color: active ? "var(--app-accent)" : "var(--app-text-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {active ? <MiniWave isPlaying={isPlaying} /> : idx + 1}
      </div>

      {/* Cover */}
      <div onClick={() => playSongFromList(song)} style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, cursor: "pointer", position: "relative", flexShrink: 0, boxShadow: active ? "0 0 14px rgba(var(--app-accent-rgb),0.35)" : "none" }}>
        {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
        {active && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying={isPlaying} /></div>}
      </div>

      {/* Title + meta */}
      <div onClick={() => playSongFromList(song)} style={{ minWidth: 0, cursor: "pointer" }}>
        <div style={{ color: active ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          {song.music_type && <span style={{ color: "var(--app-accent)", fontSize: 10, background: "rgba(var(--app-accent-rgb),0.1)", padding: "1px 7px", borderRadius: 4, fontWeight: 700, textTransform: "capitalize" }}>{song.music_type}</span>}
          {song.location && <span style={{ color: "var(--app-text-muted)", fontSize: 11.5 }}>{song.location}</span>}
        </div>
        {active && (
          <div style={{ height: 2, background: "var(--app-border)", borderRadius: 1, overflow: "hidden", marginTop: 5 }}>
            <div style={{ width: `${Math.min(progress * 100, 100)}%`, height: "100%", background: "var(--app-accent)", borderRadius: 1, transition: "width 0.5s linear" }} />
          </div>
        )}
      </div>

      {/* Duration */}
      <div className="song-duration" style={{ color: "var(--app-text-muted)", fontSize: 12.5, fontFamily: "monospace", flexShrink: 0 }}>{fmt(song.duration)}</div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <FavoriteButton song={song} />

        {/* + Add to playlist */}
        <div style={{ position: "relative" }}>
          <button
            ref={plusBtnRef}
            onClick={(e) => {
              e.stopPropagation()
              setOpenDotsId(null)
              setOpenPlusId(isPlusOpen ? null : song.id)
            }}
            title="Add to playlist"
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: isPlusOpen ? "rgba(var(--app-accent-rgb),0.25)" : "rgba(var(--app-accent-rgb),0.1)",
              border: "1px solid rgba(var(--app-accent-rgb),0.3)",
              color: "var(--app-accent)", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", lineHeight: 1, paddingBottom: 1,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.25)"}
            onMouseLeave={e => { if (!isPlusOpen) e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.1)" }}
          >+</button>
          {isPlusOpen && (
            <AddToPlaylistDropdown
              song={song}
              userId={userId}
              anchorRef={plusBtnRef}
              onClose={() => setOpenPlusId(null)}
            />
          )}
        </div>

        {/* ⋮ Three dots */}
        <div style={{ position: "relative" }}>
          <button
            ref={dotsBtnRef}
            onClick={(e) => {
              e.stopPropagation()
              setOpenPlusId(null)
              setOpenDotsId(isDotsOpen ? null : song.id)
            }}
            title="More options"
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: isDotsOpen ? "var(--app-surface)" : "transparent",
              border: "none",
              color: isDotsOpen ? "var(--app-text-main)" : "var(--app-text-muted)",
              fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--app-text-main)"; e.currentTarget.style.background = "var(--app-surface)" }}
            onMouseLeave={e => { if (!isDotsOpen) { e.currentTarget.style.color = "var(--app-text-muted)"; e.currentTarget.style.background = "transparent" } }}
          >⋮</button>
          {isDotsOpen && (
            <SongContextMenu
              song={song}
              anchorRef={dotsBtnRef}
              onClose={() => setOpenDotsId(null)}
              onAddToPlaylist={(id) => { setOpenDotsId(null); setOpenPlusId(id) }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ArtistPage() {
  const { artistName } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const userId = user?._id
  const displayName = user?.username || "Guest"
  const decodedName = decodeURIComponent(artistName || "")

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [artistData, setArtistData] = useState(null)
  const [mongoArtist, setMongoArtist] = useState(null)
  const [bgLoaded, setBgLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("songs")
  const [openPlusId, setOpenPlusId] = useState(null)
  const [openDotsId, setOpenDotsId] = useState(null)
  const [sortOrder, setSortOrder] = useState("newest")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const {
    currentSong, isPlaying, currentTime, duration, volume, progressPct,
    playSongFromList, togglePlay, playNext, playPrev, seekTo, setVolume,
  } = usePersistentSongPlayer(songs)

  useEffect(() => {
    if (!decodedName) return
    fetch(`${SUPABASE_URL}/rest/v1/artists?select=*&name=ilike.${encodeURIComponent(decodedName)}&limit=1`, { headers: H })
      .then(r => r.json()).then(rows => setArtistData(rows?.[0] || null)).catch(console.error)
  }, [decodedName])

  useEffect(() => {
    if (!decodedName) return
    fetch(`${API_URL}/artists/by-name/${encodeURIComponent(decodedName)}`, { headers: authH(false) })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success) setMongoArtist(d.artist) })
      .catch(() => {})
  }, [decodedName])

  useEffect(() => {
    if (!decodedName) return
    setLoading(true)
    fetch(`${SUPABASE_URL}/rest/v1/songs?select=*&artist=ilike.*${encodeURIComponent(decodedName)}*&order=created_at.desc`, { headers: H })
      .then(r => r.json()).then(d => setSongs(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false))
  }, [decodedName])

  // Close all menus on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") { setOpenPlusId(null); setOpenDotsId(null) } }
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [])

  const artistImg = artistData?.image_url || dicebearUrl(decodedName)
  const bgImage = mongoArtist?.background_image || artistData?.background_image || null
  const bio = mongoArtist?.bio || artistData?.bio || null
  const location = mongoArtist?.location || artistData?.location || null
  const quote = mongoArtist?.quote || null
  const monthlyListeners = mongoArtist?.monthly_listeners || null
  const avgRating = mongoArtist?.avg_rating || null

  const sortedSongs = [...songs].sort((a, b) => {
    if (sortOrder === "newest") return new Date(b.created_at) - new Date(a.created_at)
    if (sortOrder === "oldest") return new Date(a.created_at) - new Date(b.created_at)
    return a.name.localeCompare(b.name)
  })

  const playAll = () => { if (songs.length > 0) playSongFromList(songs[0]) }
  const shufflePlay = () => { if (songs.length > 0) playSongFromList(songs[Math.floor(Math.random() * songs.length)]) }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-shell-bg)", color: "var(--app-text-main)", fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400;1,9..40,600&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.2);border-radius:2px}
        ::-webkit-scrollbar-track{background:transparent}

        @keyframes wave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}

        .qa-skeleton{background:linear-gradient(90deg,var(--app-surface) 25%,rgba(var(--app-accent-rgb),0.06) 50%,var(--app-surface) 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}

        .qa-sidebar{width:216px;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),0.1);display:flex;flex-direction:column;flex-shrink:0;transition:transform 0.28s cubic-bezier(.4,0,.2,1)}
        @media(max-width:768px){.qa-sidebar{position:fixed;left:0;top:0;bottom:0;z-index:200;width:250px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,0.6)}.qa-sidebar.open{transform:translateX(0)}}
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;backdrop-filter:blur(3px)}
        @media(max-width:768px){.mob-overlay.visible{display:block}}

        .nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:3px;font-size:13px;font-weight:500;color:var(--app-text-muted);border-left:3px solid transparent;transition:all 0.18s}
        .nav-item:hover{background:var(--app-surface);color:var(--app-text-main)}
        .nav-item.active{background:rgba(var(--app-accent-rgb),0.12);border-left-color:var(--app-accent);color:var(--app-accent);font-weight:700}

        .qa-tab{padding:11px 0;font-size:12.5px;font-weight:700;color:var(--app-text-muted);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;letter-spacing:0.08em;margin-right:28px;user-select:none;text-transform:uppercase}
        .qa-tab:hover{color:var(--app-text-main)}
        .qa-tab.active{color:var(--app-accent);border-bottom-color:var(--app-accent)}

        .qa-song-row{display:grid;grid-template-columns:28px 44px 1fr auto auto;align-items:center;gap:12px;padding:9px 12px;border-radius:10px;cursor:default;transition:background 0.15s;position:relative;border-left:3px solid transparent;margin-bottom:2px}
        .qa-song-row:hover{background:var(--app-surface)}
        .qa-song-row.active-row{border-left-color:var(--app-accent);background:rgba(var(--app-accent-rgb),0.06)}
        @media(max-width:480px){.qa-song-row{grid-template-columns:24px 38px 1fr auto;gap:8px;padding:8px 8px}.qa-song-row .song-duration{display:none}}

        .qa-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:50px;cursor:pointer;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;letter-spacing:0.04em;transition:all 0.18s;outline:none;white-space:nowrap;user-select:none}
        .qa-btn-primary{background:linear-gradient(135deg,var(--app-accent-strong),var(--app-accent));border:none;color:#000}
        .qa-btn-primary:hover{transform:scale(1.04);filter:brightness(1.1)}
        .qa-btn-outline{background:transparent;border:1.5px solid rgba(255,255,255,0.3);color:var(--app-text-main)}
        .qa-btn-outline:hover{border-color:rgba(255,255,255,0.7);transform:scale(1.03)}
        .qa-btn-icon{background:transparent;border:1.5px solid rgba(255,255,255,0.28);color:var(--app-text-muted);padding:9px 13px;border-radius:50%;font-size:16px;line-height:1}
        .qa-btn-icon:hover{border-color:rgba(255,255,255,0.65);color:var(--app-text-main);transform:scale(1.05)}
        @media(max-width:480px){.qa-btn{padding:8px 14px;font-size:12px}.qa-btn-icon{padding:8px 11px}}

        .qa-stat-card{background:var(--app-surface);border:1px solid var(--app-border);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:14px}

        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--app-accent);cursor:pointer;box-shadow:0 0 6px rgba(var(--app-accent-rgb),0.5)}

        .player-bar{background:var(--app-shell-bg-alt);border-top:1px solid rgba(var(--app-accent-rgb),0.18);padding:10px 16px;display:flex;align-items:center;gap:14px;flex-shrink:0;position:sticky;bottom:0;z-index:20;overflow:hidden}
        .player-progress-line{position:absolute;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--app-accent-strong),var(--app-accent));transition:width 0.5s linear;pointer-events:none}
        .player-wave{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden}
        .player-controls{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .player-seek{display:flex;flex-direction:column;gap:3px;width:170px;flex-shrink:0}
        .player-vol{display:flex;align-items:center;gap:8px;flex-shrink:0}
        @media(max-width:1000px){.player-wave{display:none}}
        @media(max-width:750px){.player-vol{display:none}}
        @media(max-width:600px){.player-bar{padding:8px 10px;gap:8px}.player-seek{width:110px}}
        @media(max-width:450px){.player-seek{display:none}}

        /* Player icon buttons */
        .player-ctrl-btn{background:none;border:none;color:var(--app-text-muted);cursor:pointer;padding:7px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:color 0.15s,background 0.15s;font-size:15px;line-height:1}
        .player-ctrl-btn:hover{color:var(--app-text-main);background:rgba(255,255,255,0.07)}
        .player-ctrl-btn:active{transform:scale(0.92)}
        .player-play-btn{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--app-accent-strong),var(--app-accent));border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#000;flex-shrink:0;box-shadow:0 4px 14px rgba(var(--app-accent-rgb),0.4);transition:transform 0.15s,filter 0.15s}
        .player-play-btn:hover{transform:scale(1.08);filter:brightness(1.1)}
        .player-play-btn:active{transform:scale(0.95)}

        .qa-right-panel{width:240px;background:var(--app-shell-bg-alt);border-left:1px solid rgba(var(--app-accent-rgb),0.08);padding:20px 16px;display:flex;flex-direction:column;gap:20px;overflow-y:auto;flex-shrink:0}
        @media(max-width:1100px){.qa-right-panel{display:none}}

        .hamburger{display:none;background:none;border:none;color:var(--app-text-main);font-size:20px;cursor:pointer;padding:6px 8px;border-radius:8px;flex-shrink:0;line-height:1;transition:background 0.15s}
        .hamburger:hover{background:var(--app-surface)}
        @media(max-width:768px){.hamburger{display:flex;align-items:center;justify-content:center}}

        .fade-up{animation:fadeUp 0.5s ease both}
        .fade-up-1{animation-delay:0.05s}
        .fade-up-2{animation-delay:0.12s}
        .fade-up-3{animation-delay:0.2s}

        .hero-artist-portrait{position:absolute;top:16px;left:16px;z-index:4;display:flex;flex-direction:column;align-items:center;gap:6px;animation:fadeIn 0.6s ease 0.1s both}
        .hero-artist-portrait-img{width:72px;height:96px;border-radius:10px;overflow:hidden;border:2px solid rgba(var(--app-accent-rgb),0.55);box-shadow:0 4px 20px rgba(0,0,0,0.7),0 0 0 1px rgba(var(--app-accent-rgb),0.15);background:var(--app-surface);flex-shrink:0}
        .hero-artist-portrait-img img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
        .hero-artist-portrait-label{font-size:9.5px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:0.1em;text-transform:uppercase;text-align:center;max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 6px rgba(0,0,0,0.9)}

        @media(max-width:600px){
          .hero-artist-portrait-img{width:56px;height:74px;border-radius:8px}
          .hero-hero-content{padding:0 14px 24px !important}
          .hero-title{font-size:clamp(26px,7vw,46px) !important}
          .hero-stats{gap:16px !important}
          .hero-buttons{gap:7px !important}
          .hero-buttons .qa-btn-outline-hide{display:none}
          .songs-header{flex-direction:column;align-items:flex-start !important;gap:10px}
          .songs-header-right{width:100%;justify-content:space-between}
          .about-chips{flex-direction:column;gap:7px !important}
        }
        @media(max-width:400px){.hero-artist-portrait-img{width:46px;height:62px}}
      `}</style>

      <DashboardNavbar />
      <div className={`mob-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ══ SIDEBAR ══ */}
        <div className={`qa-sidebar${sidebarOpen ? " open" : ""}`}>
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
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", position: "relative", display: "flex", flexDirection: "column" }}>

            {/* Mobile toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "var(--app-shell-bg-alt)", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", flexShrink: 0 }}>
              <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
              <span style={{ color: "var(--app-text-main)", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{decodedName}</span>
            </div>

            {/* ══ HERO ══ */}
            <div style={{ position: "relative", height: 380, overflow: "hidden", flexShrink: 0 }}>
              {bgImage ? (
                <img src={bgImage} alt="" onLoad={() => setBgLoaded(true)}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", opacity: bgLoaded ? 1 : 0, transition: "opacity 0.7s ease" }} />
              ) : (
                <img src={artistImg} alt={decodedName}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", filter: "blur(18px) brightness(0.45)", transform: "scale(1.08)" }} />
              )}

              <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to right, #0a0a0a 0%, #0a0a0a 18%, rgba(10,10,10,0.88) 28%, rgba(10,10,10,0.45) 40%, rgba(10,10,10,0.1) 55%, transparent 68%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 110, background: "linear-gradient(to bottom, transparent, var(--app-shell-bg))", zIndex: 2 }} />

              {/* Artist portrait */}
              <div className="hero-artist-portrait">
                <div className="hero-artist-portrait-img">
                  <img src={artistImg} alt={decodedName} onError={e => { e.target.src = dicebearUrl(decodedName) }} />
                </div>
                <div className="hero-artist-portrait-label">{decodedName}</div>
              </div>

              {/* Hero content */}
              <div className="hero-hero-content" style={{ position: "absolute", inset: 0, zIndex: 3, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 32px 36px", paddingLeft: 108 }}>
                <div className="fade-up fade-up-1" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.14em" }}>ARTIST</span>
                  <span style={{ color: "var(--app-accent)", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, background: "rgba(var(--app-accent-rgb),0.22)", borderRadius: "50%" }}>✔</span>
                </div>
                <h1 className="fade-up fade-up-1 hero-title" style={{ fontSize: "clamp(28px,4.5vw,72px)", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em", margin: "0 0 8px", textShadow: "0 2px 32px rgba(0,0,0,0.7)" }}>
                  {decodedName}
                </h1>
                <div className="fade-up fade-up-1" style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: bio ? 10 : 18 }}>
                  {loading ? "Loading…" : `${songs.length} song${songs.length !== 1 ? "s" : ""}`}
                </div>
                {bio && (
                  <p className="fade-up fade-up-2" style={{ color: "rgba(255,255,255,0.6)", fontSize: 13.5, lineHeight: 1.65, maxWidth: 520, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{bio}</p>
                )}
                <div className="fade-up fade-up-2 hero-stats" style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 20, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 16 }}>🎵</span>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>{loading ? "—" : songs.length}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.09em" }}>SONGS</div>
                    </div>
                  </div>
                  {monthlyListeners && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 16 }}>🎧</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>{monthlyListeners}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.09em" }}>MONTHLY LISTENERS</div>
                      </div>
                    </div>
                  )}
                  {location && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 16 }}>📍</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.1 }}>{location}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.09em" }}>FROM</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="fade-up fade-up-3 hero-buttons" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <button className="qa-btn qa-btn-primary" onClick={playAll}><span style={{ fontSize: 11 }}>▶</span> PLAY ALL</button>
                  <button className="qa-btn qa-btn-outline" onClick={shufflePlay}><span style={{ fontSize: 13 }}>⇄</span> SHUFFLE</button>
                  <button className="qa-btn qa-btn-outline qa-btn-outline-hide"><span style={{ fontSize: 14 }}>+</span> ADD TO PLAYLIST</button>
                  <button className="qa-btn qa-btn-icon">···</button>
                </div>
              </div>
            </div>

            {/* ── TABS ── */}
            <div style={{ background: "var(--app-shell-bg)", padding: "0 24px", borderBottom: "1px solid var(--app-border)", display: "flex", flexShrink: 0, overflowX: "auto" }}>
              {["songs", "albums", "about"].map(tab => (
                <div key={tab} className={`qa-tab${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab.toUpperCase()}
                </div>
              ))}
            </div>

            {/* ── TAB CONTENT ── */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {activeTab === "songs" && (
                <div style={{ padding: "18px 16px 80px" }}>
                  <div className="songs-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ color: "var(--app-text-main)", fontSize: 13.5, fontWeight: 700 }}>
                      All Songs <span style={{ color: "var(--app-text-muted)", fontWeight: 500 }}>({songs.length})</span>
                    </div>
                    <div className="songs-header-right" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                        style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 8, color: "var(--app-text-main)", fontSize: 12, padding: "6px 10px", cursor: "pointer", outline: "none", fontFamily: "'DM Sans',sans-serif" }}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="alpha">A–Z</option>
                      </select>
                      <span style={{ color: "var(--app-text-muted)", fontSize: 17, cursor: "pointer" }}>☰</span>
                    </div>
                  </div>

                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="qa-skeleton" style={{ height: 54, borderRadius: 10, marginBottom: 4 }} />
                      ))
                    : sortedSongs.length === 0
                    ? <div style={{ textAlign: "center", color: "var(--app-text-muted)", padding: "60px 0", fontSize: 13.5 }}>No songs found</div>
                    : sortedSongs.map((song, idx) => (
                        <SongRow
                          key={song.id}
                          song={song}
                          idx={idx}
                          active={currentSong?.id === song.id}
                          isPlaying={isPlaying}
                          currentTime={currentTime}
                          duration={duration}
                          playSongFromList={playSongFromList}
                          userId={userId}
                          openPlusId={openPlusId}
                          setOpenPlusId={setOpenPlusId}
                          openDotsId={openDotsId}
                          setOpenDotsId={setOpenDotsId}
                        />
                      ))}
                </div>
              )}

              {activeTab === "albums" && (
                <div style={{ padding: "48px 28px", textAlign: "center", color: "var(--app-text-muted)", fontSize: 13.5 }}>No albums available yet</div>
              )}

              {activeTab === "about" && (
                <div style={{ padding: "28px 20px", maxWidth: 620 }}>
                  {bio
                    ? <p style={{ color: "var(--app-text-muted)", fontSize: 13.5, lineHeight: 1.85, marginBottom: 28 }}>{bio}</p>
                    : <div style={{ color: "var(--app-text-muted)", fontSize: 13.5, marginBottom: 28 }}>No bio available</div>
                  }
                  {quote && (
                    <div style={{ borderLeft: "3px solid var(--app-accent)", paddingLeft: 20, marginBottom: 28 }}>
                      <div style={{ fontSize: 26, color: "var(--app-accent)", lineHeight: 1, marginBottom: 8 }}>"</div>
                      <p style={{ color: "var(--app-text-muted)", fontSize: 13.5, fontStyle: "italic", lineHeight: 1.75, marginBottom: 10 }}>{quote}</p>
                      <div style={{ color: "var(--app-accent)", fontSize: 13, fontStyle: "italic", fontWeight: 600 }}>— {decodedName}</div>
                    </div>
                  )}
                  <div className="about-chips" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {location && <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "var(--app-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>📍 {location}</div>}
                    {monthlyListeners && <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "var(--app-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>🎧 {monthlyListeners} Monthly Listeners</div>}
                    {avgRating && <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "var(--app-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>⭐ {avgRating} Rating</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div className="qa-right-panel">
            <div>
              <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 12.5, marginBottom: 10, letterSpacing: "0.05em" }}>About {decodedName}</div>
              {bio
                ? <p style={{ color: "var(--app-text-muted)", fontSize: 12, lineHeight: 1.75 }}>{bio}</p>
                : <div className="qa-skeleton" style={{ height: 58, borderRadius: 8 }} />
              }
            </div>
            <TopArtists navigate={navigate} currentArtist={decodedName} />
            {monthlyListeners && (
              <div className="qa-stat-card">
                <span style={{ fontSize: 20 }}>🎧</span>
                <div>
                  <div style={{ color: "var(--app-text-main)", fontWeight: 800, fontSize: 15.5 }}>{monthlyListeners}</div>
                  <div style={{ color: "var(--app-text-muted)", fontSize: 11 }}>Monthly Listeners</div>
                </div>
              </div>
            )}
            <div className="qa-stat-card">
              <span style={{ fontSize: 20 }}>🎵</span>
              <div>
                <div style={{ color: "var(--app-text-main)", fontWeight: 800, fontSize: 15.5 }}>{loading ? "—" : songs.length}</div>
                <div style={{ color: "var(--app-text-muted)", fontSize: 11 }}>Songs</div>
              </div>
            </div>
            {avgRating && (
              <div className="qa-stat-card">
                <span style={{ fontSize: 20 }}>⭐</span>
                <div>
                  <div style={{ color: "var(--app-text-main)", fontWeight: 800, fontSize: 15.5 }}>{avgRating}</div>
                  <div style={{ color: "var(--app-text-muted)", fontSize: 11 }}>Average Rating</div>
                </div>
              </div>
            )}
            {quote && (
              <div style={{ background: "rgba(var(--app-accent-rgb),0.05)", border: "1px solid rgba(var(--app-accent-rgb),0.14)", borderRadius: 12, padding: "15px 15px 13px" }}>
                <div style={{ color: "var(--app-accent)", fontSize: 22, lineHeight: 1, marginBottom: 8 }}>"</div>
                <p style={{ color: "var(--app-text-muted)", fontSize: 12, fontStyle: "italic", lineHeight: 1.75, marginBottom: 10 }}>{quote}</p>
                <div style={{ color: "var(--app-accent)", fontSize: 13, fontStyle: "italic", fontWeight: 700, textAlign: "right", fontFamily: "'Dancing Script', cursive" }}>— {decodedName}</div>
              </div>
            )}
            {currentSong && (
              <div style={{ background: "rgba(var(--app-accent-rgb),0.06)", border: "1px solid rgba(var(--app-accent-rgb),0.2)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                <div style={{ color: "var(--app-text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>NOW PLAYING</div>
                <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", margin: "0 auto 10px", background: "var(--app-surface)" }}>
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
      </div>

      {/* ══ PLAYER BAR ══ */}
      <div className="player-bar">
        <div className="player-progress-line" style={{ width: `${progressPct}%` }} />

        {/* Track info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto", width: 200, minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: currentSong ? "0 0 12px rgba(var(--app-accent-rgb),0.25)" : "none", position: "relative" }}>
            {currentSong?.cover_url ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
            {isPlaying && currentSong && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying={true} /></div>}
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

        {/* Controls — FontAwesome icons */}
        <div className="player-controls">
          <button className="player-ctrl-btn" onClick={playPrev} title="Previous">
            <FontAwesomeIcon icon={faBackwardFast} style={{ fontSize: 15 }} />
          </button>

          <button className="player-play-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            <FontAwesomeIcon
              icon={isPlaying ? faPause : faPlay}
              style={{ fontSize: 14, marginLeft: isPlaying ? 0 : 2 }}
            />
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
          <input type="range" min={0} max={duration || 0} value={currentTime} onChange={e => seekTo(Number(e.target.value))}
            style={{ width: "100%", background: `linear-gradient(to right,var(--app-accent) ${progressPct}%,var(--app-border) 0%)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--app-text-muted)", fontSize: 10 }}>
            <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="player-vol">
          <span style={{ color: "var(--app-text-muted)", fontSize: 14, flexShrink: 0 }}>🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))}
            style={{ width: 70, background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,var(--app-border) 0%)` }} />
        </div>
      </div>
    </div>
  )
}