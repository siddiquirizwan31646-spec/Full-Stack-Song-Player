import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import FavoriteButton from "@/components/FavoriteButton"
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer"
import { useUser } from "@/context/userContext"

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

// ── Mini Waveform ─────────────────────────────────────────────────────────────
const MiniWave = ({ isPlaying }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 3, height: "100%", background: "var(--app-accent)", borderRadius: 2,
        animation: isPlaying ? `qaWave ${0.5 + i * 0.15}s ease-in-out infinite alternate` : "none",
        animationDelay: `${i * 0.1}s`, opacity: isPlaying ? 1 : 0.4,
      }} />
    ))}
  </div>
)

// ── Add To Playlist Dropdown ──────────────────────────────────────────────────
function AddToPlaylistDropdown({ song, userId, onClose }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(null)
  const [toast, setToast] = useState("")
  const ref = useRef(null)

  useEffect(() => {
    if (!userId || !getToken()) { setLoading(false); return }
    fetch(`${API_URL}/playlists`, { headers: authH(false) })
      .then(r => r.json()).then(d => { if (d.success) setPlaylists(d.playlists) })
      .catch(console.error).finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [onClose])

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
    <div ref={ref} style={{
      position: "absolute", zIndex: 2000, top: "110%", right: 0,
      background: "#1a1a1a", border: "1px solid rgba(var(--app-accent-rgb),0.25)",
      borderRadius: 10, minWidth: 200, boxShadow: "0 16px 48px rgba(0,0,0,0.8)", overflow: "hidden",
    }}>
      <div style={{ padding: "9px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
        📋 ADD TO PLAYLIST
      </div>
      {toast
        ? <div style={{ padding: 14, textAlign: "center", color: "var(--app-accent)", fontSize: 13, fontWeight: 600 }}>{toast}</div>
        : loading
        ? <div style={{ padding: 14, color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center" }}>Loading…</div>
        : playlists.length === 0
        ? <div style={{ padding: 14, color: "rgba(255,255,255,0.4)", fontSize: 12, textAlign: "center" }}>No playlists found</div>
        : playlists.map(pl => (
          <div key={pl._id} onClick={() => add(pl)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", color: adding === pl._id ? "var(--app-accent)" : "#fff", fontSize: 13, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span>📋</span>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.name}</span>
            {adding === pl._id && <span style={{ fontSize: 11, color: "var(--app-accent)" }}>Adding…</span>}
          </div>
        ))}
    </div>
  )
}

// ── Main Artist Page ──────────────────────────────────────────────────────────
export default function ArtistPage() {
  const { artistName } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const userId = user?._id
  const decodedName = decodeURIComponent(artistName || "")

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [artistData, setArtistData] = useState(null)
  const [mongoArtist, setMongoArtist] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [bgLoaded, setBgLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("songs")
  const [openPlusId, setOpenPlusId] = useState(null)
  const [sortOrder, setSortOrder] = useState("newest")

  const {
    currentSong, isPlaying, currentTime, duration, volume, progressPct,
    playSongFromList, togglePlay, playNext, playPrev, seekTo, setVolume,
  } = usePersistentSongPlayer(songs)

  useEffect(() => {
    if (!decodedName) return
    const url = `${SUPABASE_URL}/rest/v1/artists?select=*&name=ilike.${encodeURIComponent(decodedName)}&limit=1`
    fetch(url, { headers: H }).then(r => r.json()).then(rows => setArtistData(rows?.[0] || null)).catch(console.error)
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
    const url = `${SUPABASE_URL}/rest/v1/songs?select=*&artist=ilike.*${encodeURIComponent(decodedName)}*&order=created_at.desc`
    fetch(url, { headers: H }).then(r => r.json()).then(d => setSongs(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false))
  }, [decodedName])

  const artistImg = artistData?.image_url || dicebearUrl(decodedName)
  const bgImage = mongoArtist?.background_image || artistData?.background_image || null
  const bio = mongoArtist?.bio || artistData?.bio || null
  const location = mongoArtist?.location || artistData?.location || null
  const tagline = mongoArtist?.tagline || null
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

  const NAV_ITEMS = [
    { icon: "🏠", label: "Home", path: "/hero" },
    { icon: "🔍", label: "Explore", path: "/explore" },
    { icon: "📖", label: "Quran", path: "/quran" },
    { icon: "🎵", label: "Nasheed", path: "/nasheed" },
    { icon: "🎤", label: "Naat", path: "/naat" },
    { icon: "🎼", label: "Qawwali", path: "/qawwali" },
    { icon: "🎙", label: "Podcasts", path: "/podcasts" },
    { icon: "📋", label: "Playlists", path: "/playlists" },
  ]
  const NAV_BOTTOM = [
    { icon: "⬆", label: "Upload Audio", path: "/upload", accent: true },
    { icon: "♡", label: "Favorites", path: "/favorites" },
    { icon: "⚙", label: "Settings", path: "/settings" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#0a0a0a", color: "#fff", fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.3);border-radius:2px}
        @keyframes qaWave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        @keyframes qaShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .qa-skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%);background-size:800px 100%;animation:qaShimmer 1.6s ease infinite}
        .qa-sidebar{width:220px;background:#111;border-right:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;flex-shrink:0}
        .qa-nav-item{display:flex;align-items:center;gap:14px;padding:11px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:rgba(255,255,255,0.55);margin-bottom:2px;transition:all 0.18s;border-left:3px solid transparent}
        .qa-nav-item:hover{background:rgba(255,255,255,0.06);color:#fff}
        .qa-nav-item.active{background:rgba(var(--app-accent-rgb),0.14);border-left-color:var(--app-accent);color:var(--app-accent);font-weight:700}
        .qa-tab{padding:10px 0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.45);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;letter-spacing:0.03em;margin-right:24px;user-select:none}
        .qa-tab:hover{color:rgba(255,255,255,0.8)}
        .qa-tab.active{color:var(--app-accent);border-bottom-color:var(--app-accent)}
        .qa-song-row{display:flex;align-items:center;gap:14px;padding:10px 14px;border-radius:8px;cursor:pointer;transition:background 0.15s;position:relative}
        .qa-song-row:hover{background:rgba(255,255,255,0.05)}
        .qa-song-row.active-row{background:rgba(var(--app-accent-rgb),0.08)}
        .qa-action-btn{display:flex;align-items:center;gap:8px;padding:10px 22px;border-radius:50px;cursor:pointer;font-size:13px;font-weight:700;transition:all 0.2s;font-family:'DM Sans',sans-serif;white-space:nowrap;outline:none}
        .qa-action-btn.primary{background:var(--app-accent);border:none;color:#000}
        .qa-action-btn.primary:hover{transform:scale(1.04);filter:brightness(1.1)}
        .qa-action-btn.secondary{background:transparent;border:1.5px solid rgba(255,255,255,0.35);color:#fff}
        .qa-action-btn.secondary:hover{border-color:#fff;transform:scale(1.04)}
        .qa-action-btn.icon-btn{background:transparent;border:1.5px solid rgba(255,255,255,0.3);color:#fff;padding:10px 14px;border-radius:50%}
        .qa-action-btn.icon-btn:hover{border-color:#fff;transform:scale(1.06)}
        .qa-stat-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px}
        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer;background:rgba(255,255,255,0.2)}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--app-accent);cursor:pointer}
        .player-bar{background:#111;border-top:1px solid rgba(255,255,255,0.06);padding:12px 20px;display:flex;align-items:center;gap:16px;flex-shrink:0;position:sticky;bottom:0;z-index:50}
        .hero-fade-in{animation:fadeInUp 0.55s ease both}
        @media(max-width:900px){.qa-sidebar{display:none}}
        @media(max-width:768px){.qa-right-panel{display:none!important}}
        @media(max-width:600px){.player-bar{padding:8px 12px;gap:10px}.qa-player-seek{width:100px!important}.qa-player-vol{display:none!important}}
        @media(max-width:480px){.qa-player-seek{display:none!important}.qa-hero-actions{gap:8px!important}.qa-action-btn{padding:9px 14px!important;font-size:12px!important}}
      `}</style>

      <DashboardNavbar />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div className="qa-sidebar">
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png" alt="QalbAudio"
              onClick={() => navigate("/")}
              style={{ height: 56, width: "auto", maxWidth: "90%", objectFit: "contain", cursor: "pointer" }} />
          </div>
          <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
            {NAV_ITEMS.map(item => (
              <div key={item.path} className={`qa-nav-item${item.path === "/hero" ? " active" : ""}`} onClick={() => navigate(item.path)}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>{item.label}
              </div>
            ))}
            <div style={{ margin: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            {NAV_BOTTOM.map(item => (
              <div key={item.path} className="qa-nav-item" style={{ color: item.accent ? "var(--app-accent)" : undefined }} onClick={() => navigate(item.path)}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>{item.label}
              </div>
            ))}
          </nav>
          {currentSong && (
            <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", background: "#222", flexShrink: 0, position: "relative" }}>
                {currentSong.cover_url ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎵</div>}
                {isPlaying && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying /></div>}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.artist}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>

            {/* ── HERO ── */}
            <div style={{ position: "relative", height: 320, overflow: "hidden" }}>

              {/* Full background image — no blur, covers entire hero */}
              {bgImage ? (
                <img src={bgImage} alt="" onLoad={() => setBgLoaded(true)}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", opacity: bgLoaded ? 1 : 0, transition: "opacity 0.6s" }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, background: "#0d0d0d" }} />
              )}

              {/* Dark overlay — stronger on left where text is */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 100%)" }} />

              {/* Bottom fade to page */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, background: "linear-gradient(to bottom, transparent, #0a0a0a)" }} />

              {/* ── ARTIST INFO — bottom left ── */}
              <div className="hero-fade-in" style={{ position: "absolute", zIndex: 2, bottom: 28, left: 28, right: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>

                {/* Left: artist details */}
                <div style={{ minWidth: 0 }}>
                  {/* ARTIST badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em", textTransform: "uppercase" }}>ARTIST</span>
                    <span style={{ color: "var(--app-accent)", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, background: "rgba(var(--app-accent-rgb),0.25)", borderRadius: "50%" }}>✔</span>
                  </div>

                  {/* Artist Name — large bold like reference */}
                  <h1 style={{ margin: "0 0 6px", fontSize: "clamp(32px,5vw,58px)", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em", textShadow: "0 2px 32px rgba(0,0,0,0.8)" }}>
                    {decodedName}
                  </h1>

                  {/* Song count */}
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginBottom: 12 }}>
                    {loading ? "Loading…" : `${songs.length} song${songs.length !== 1 ? "s" : ""}`}
                  </div>

                  {/* Bio — max 2 lines */}
                  {bio && (
                    <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.6, maxWidth: 460, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>{bio}</p>
                  )}

                  {/* Stats */}
                  <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>🎵</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{songs.length}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>SONGS</div>
                      </div>
                    </div>
                    {monthlyListeners && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>🎧</span>
                        <div>
                          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{monthlyListeners}</div>
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>MONTHLY LISTENERS</div>
                        </div>
                      </div>
                    )}
                    {location && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>📍</span>
                        <div>
                          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{location}</div>
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>FROM</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="qa-hero-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button className="qa-action-btn primary" onClick={playAll}>
                      <span style={{ fontSize: 12 }}>▶</span> PLAY ALL
                    </button>
                    <button className="qa-action-btn secondary" onClick={shufflePlay}>
                      <span style={{ fontSize: 13 }}>⇄</span> SHUFFLE
                    </button>
                    <button className="qa-action-btn secondary">
                      <span style={{ fontSize: 13 }}>＋</span> ADD TO PLAYLIST
                    </button>
                    <button className="qa-action-btn icon-btn" style={{ fontSize: 18, letterSpacing: 1 }}>···</button>
                  </div>
                </div>

                {/* Right: tagline — bottom right like reference */}
                {tagline && (
                  <div style={{ flexShrink: 0, maxWidth: 260, textAlign: "right", paddingBottom: 4 }}>
                    <div style={{ color: "var(--app-accent)", fontSize: 28, lineHeight: 1, marginBottom: 4, fontFamily: "Georgia, serif" }}>"</div>
                    <p style={{
                      color: "rgba(255,255,255,0.85)", fontSize: 13.5,
                      fontStyle: "italic", fontWeight: 500, lineHeight: 1.65,
                      margin: "0 0 8px", textShadow: "0 1px 16px rgba(0,0,0,0.9)",
                    }}>{tagline}</p>
                    <div style={{
                      color: "var(--app-accent)", fontSize: 13,
                      fontStyle: "italic", fontWeight: 700,
                      fontFamily: "'Dancing Script', 'Segoe Script', cursive",
                      letterSpacing: "0.02em",
                    }}>— {decodedName}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── TABS ── */}
            <div style={{ background: "#0a0a0a", padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex" }}>
              {["songs", "albums", "about"].map(tab => (
                <div key={tab} className={`qa-tab${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab.toUpperCase()}
                </div>
              ))}
            </div>

            {/* ── SONGS TAB ── */}
            {activeTab === "songs" && (
              <div style={{ padding: "20px 28px 80px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
                    All Songs <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>({songs.length})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontSize: 12, padding: "6px 10px", cursor: "pointer", outline: "none", fontFamily: "'DM Sans',sans-serif" }}>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="alpha">A–Z</option>
                    </select>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer" }}>☰</span>
                  </div>
                </div>

                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="qa-skeleton" style={{ height: 56, borderRadius: 8, marginBottom: 4 }} />
                    ))
                  : sortedSongs.length === 0
                  ? <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: "60px 0", fontSize: 14 }}>No songs found</div>
                  : sortedSongs.map((song, idx) => {
                      const active = currentSong?.id === song.id
                      const progress = active && duration > 0 ? currentTime / duration : 0
                      return (
                        <div key={song.id} className={`qa-song-row${active ? " active-row" : ""}`}>
                          <div style={{ width: 28, flexShrink: 0, textAlign: "center", color: active ? "var(--app-accent)" : "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 600 }}>
                            {active ? <MiniWave isPlaying={isPlaying} /> : idx + 1}
                          </div>
                          <div onClick={() => playSongFromList(song)} style={{ width: 44, height: 44, borderRadius: 6, overflow: "hidden", background: "#222", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", position: "relative" }}>
                            {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
                            {active && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying={isPlaying} /></div>}
                          </div>
                          <div onClick={() => playSongFromList(song)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                            <div style={{ color: active ? "var(--app-accent)" : "#fff", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                              {song.music_type && (
                                <span style={{ color: "var(--app-accent)", fontSize: 10, background: "rgba(var(--app-accent-rgb),0.15)", padding: "1px 7px", borderRadius: 4, fontWeight: 700, textTransform: "capitalize" }}>{song.music_type}</span>
                              )}
                              {song.location && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{song.location}</span>}
                            </div>
                            {active && (
                              <div style={{ height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1, overflow: "hidden", marginTop: 5 }}>
                                <div style={{ width: `${Math.min(progress * 100, 100)}%`, height: "100%", background: "var(--app-accent)", borderRadius: 1, transition: "width 0.5s linear" }} />
                              </div>
                            )}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontFamily: "monospace", flexShrink: 0 }}>{fmt(song.duration)}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <FavoriteButton song={song} />
                            <div style={{ position: "relative" }}>
                              <button onClick={e => { e.stopPropagation(); setOpenPlusId(openPlusId === song.id ? null : song.id) }}
                                style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.16)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>+</button>
                              {openPlusId === song.id && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpenPlusId(null)} />}
                            </div>
                            <button style={{ width: 30, height: 30, borderRadius: "50%", background: "transparent", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>⋮</button>
                          </div>
                        </div>
                      )
                    })}
              </div>
            )}

            {/* ── ALBUMS TAB ── */}
            {activeTab === "albums" && (
              <div style={{ padding: "40px 28px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
                No albums available yet
              </div>
            )}

            {/* ── ABOUT TAB ── */}
            {activeTab === "about" && (
              <div style={{ padding: "28px", maxWidth: 640 }}>
                {bio
                  ? <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.85, margin: "0 0 28px" }}>{bio}</p>
                  : <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, marginBottom: 28 }}>No bio available</div>
                }
                {quote && (
                  <div style={{ borderLeft: "3px solid var(--app-accent)", paddingLeft: 20, marginBottom: 28 }}>
                    <div style={{ fontSize: 28, color: "var(--app-accent)", lineHeight: 1, marginBottom: 8 }}>"</div>
                    <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontStyle: "italic", lineHeight: 1.75, margin: "0 0 10px" }}>{quote}</p>
                    <div style={{ color: "var(--app-accent)", fontSize: 13, fontStyle: "italic", fontWeight: 600 }}>— {decodedName}</div>
                  </div>
                )}
                {/* Extra info pills */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {location && (
                    <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
                      📍 {location}
                    </div>
                  )}
                  {monthlyListeners && (
                    <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
                      🎧 {monthlyListeners} Monthly Listeners
                    </div>
                  )}
                  {avgRating && (
                    <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
                      ⭐ {avgRating} Rating
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="qa-right-panel" style={{ width: 270, background: "#111", borderLeft: "1px solid rgba(255,255,255,0.06)", padding: "24px 18px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flexShrink: 0 }}>

            {/* About */}
            <div>
              <div style={{ color: "var(--app-accent)", fontWeight: 700, fontSize: 13, marginBottom: 10, letterSpacing: "0.04em" }}>About {decodedName}</div>
              {bio
                ? <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.75, margin: 0 }}>{bio}</p>
                : <div className="qa-skeleton" style={{ height: 60, borderRadius: 8 }} />
              }
            </div>

            {/* Top Listeners */}
            <div>
              <div style={{ color: "var(--app-accent)", fontWeight: 700, fontSize: 13, marginBottom: 10, letterSpacing: "0.04em" }}>Top Listeners</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {["A","B","C","D"].map((l, i) => (
                  <div key={l} style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${i * 60 + 120},40%,30%)`, border: "2px solid #111", marginLeft: i === 0 ? 0 : -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", zIndex: 4 - i, position: "relative" }}>
                    {l}
                  </div>
                ))}
                {monthlyListeners && (
                  <div style={{ marginLeft: 10, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>+{monthlyListeners}</div>
                )}
              </div>
            </div>

            {/* Stat cards */}
            {monthlyListeners && (
              <div className="qa-stat-card">
                <span style={{ fontSize: 20 }}>🎧</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{monthlyListeners}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Monthly Listeners</div>
                </div>
              </div>
            )}

            <div className="qa-stat-card">
              <span style={{ fontSize: 20 }}>🎵</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{loading ? "—" : songs.length}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Songs</div>
              </div>
            </div>

            {avgRating && (
              <div className="qa-stat-card">
                <span style={{ fontSize: 20 }}>⭐</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{avgRating}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Average Rating</div>
                </div>
              </div>
            )}

            {/* Quote card */}
            {quote && (
              <div style={{ background: "rgba(var(--app-accent-rgb),0.05)", border: "1px solid rgba(var(--app-accent-rgb),0.15)", borderRadius: 12, padding: "16px 16px 14px" }}>
                <div style={{ color: "var(--app-accent)", fontSize: 24, lineHeight: 1, marginBottom: 8 }}>"</div>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, fontStyle: "italic", lineHeight: 1.75, margin: "0 0 10px" }}>{quote}</p>
                <div style={{ color: "var(--app-accent)", fontSize: 12, fontStyle: "italic", fontWeight: 600, textAlign: "right" }}>— {decodedName}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PLAYER BAR ── */}
      <div className="player-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto", width: 220, minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "#222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, position: "relative" }}>
            {currentSong?.cover_url ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
            {isPlaying && currentSong && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying /></div>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: currentSong ? "#fff" : "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
              {currentSong?.name || "No Song Selected"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>
              {currentSong?.artist || "Pick a song to play"}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 16, padding: 4 }}>⇄</button>
          <button onClick={playPrev} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 20, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}>⏮</button>
          <button onClick={togglePlay}
            style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--app-accent)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 15, fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 16px rgba(var(--app-accent-rgb),0.4)", transition: "transform 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={playNext} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 20, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}>⏭</button>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 16, padding: 4 }}>↻</button>
        </div>

        <div style={{ flex: 1 }} />

        <div className="qa-player-seek" style={{ display: "flex", flexDirection: "column", gap: 3, width: 180, flexShrink: 0 }}>
          <input type="range" min={0} max={duration || 0} value={currentTime} onChange={e => seekTo(Number(e.target.value))}
            style={{ width: "100%", background: `linear-gradient(to right,var(--app-accent) ${progressPct}%,rgba(255,255,255,0.2) 0%)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.35)", fontSize: 10 }}>
            <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="qa-player-vol" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))}
            style={{ width: 80, background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,rgba(255,255,255,0.2) 0%)` }} />
        </div>
      </div>
    </div>
  )
}