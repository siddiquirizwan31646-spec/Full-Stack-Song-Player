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
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0a0a0a,111827&fontFamily=sans-serif&fontSize=38&fontWeight=700`
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
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400;1,9..40,600&family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.3);border-radius:2px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes qaWave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        @keyframes qaShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

        .qa-skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%);background-size:800px 100%;animation:qaShimmer 1.6s ease infinite}

        /* ── Sidebar ── */
        .qa-sidebar{width:175px;background:#0f0f0f;border-right:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;flex-shrink:0}
        .qa-nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;color:rgba(255,255,255,0.5);margin-bottom:1px;transition:all 0.18s;border-left:3px solid transparent;user-select:none}
        .qa-nav-item:hover{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.85)}
        .qa-nav-item.active{background:rgba(var(--app-accent-rgb),0.12);border-left-color:var(--app-accent);color:var(--app-accent);font-weight:700}

        /* ── Tabs ── */
        .qa-tab{padding:11px 0;font-size:12.5px;font-weight:700;color:rgba(255,255,255,0.4);cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;letter-spacing:0.08em;margin-right:28px;user-select:none;text-transform:uppercase}
        .qa-tab:hover{color:rgba(255,255,255,0.75)}
        .qa-tab.active{color:var(--app-accent);border-bottom-color:var(--app-accent)}

        /* ── Song Row ── */
        .qa-song-row{display:grid;grid-template-columns:32px 44px 1fr auto auto;align-items:center;gap:12px;padding:9px 12px;border-radius:8px;cursor:pointer;transition:background 0.15s;position:relative}
        .qa-song-row:hover{background:rgba(255,255,255,0.04)}
        .qa-song-row.active-row{background:rgba(var(--app-accent-rgb),0.07)}

        /* ── Action Buttons ── */
        .qa-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:50px;cursor:pointer;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;letter-spacing:0.04em;transition:all 0.18s;outline:none;white-space:nowrap;user-select:none}
        .qa-btn-primary{background:var(--app-accent);border:none;color:#000}
        .qa-btn-primary:hover{transform:scale(1.04);filter:brightness(1.1)}
        .qa-btn-outline{background:transparent;border:1.5px solid rgba(255,255,255,0.3);color:#fff}
        .qa-btn-outline:hover{border-color:rgba(255,255,255,0.7);transform:scale(1.03)}
        .qa-btn-icon{background:transparent;border:1.5px solid rgba(255,255,255,0.28);color:rgba(255,255,255,0.7);padding:9px 13px;border-radius:50%;font-size:16px;line-height:1}
        .qa-btn-icon:hover{border-color:rgba(255,255,255,0.65);color:#fff;transform:scale(1.05)}

        /* ── Right panel stat card ── */
        .qa-stat-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:14px}

        /* ── Range inputs ── */
        input[type=range]{-webkit-appearance:none;appearance:none;height:3px;border-radius:2px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--app-accent);cursor:pointer;transition:transform 0.1s}
        input[type=range]:hover::-webkit-slider-thumb{transform:scale(1.2)}

        /* ── Player bar ── */
        .player-bar{background:#0f0f0f;border-top:1px solid rgba(255,255,255,0.07);padding:10px 20px;display:flex;align-items:center;gap:14px;flex-shrink:0}

        /* ── Fade in animation ── */
        .fade-up{animation:fadeUp 0.5s ease both}
        .fade-up-1{animation-delay:0.05s}
        .fade-up-2{animation-delay:0.12s}
        .fade-up-3{animation-delay:0.2s}

        @media(max-width:900px){.qa-sidebar{display:none}}
        @media(max-width:768px){.qa-right-panel{display:none!important}}
        @media(max-width:600px){.player-bar{padding:8px 12px;gap:8px}.qa-player-seek{width:90px!important}.qa-player-vol{display:none!important}}
        @media(max-width:480px){.qa-player-seek{display:none!important}.hero-actions{gap:6px!important}.qa-btn{padding:8px 13px!important;font-size:11.5px!important}}
      `}</style>

      <DashboardNavbar />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div className="qa-sidebar">
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <img src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png" alt="QalbAudio"
              onClick={() => navigate("/")}
              style={{ height: 52, width: "auto", maxWidth: "90%", objectFit: "contain", cursor: "pointer" }} />
          </div>
          <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
            {NAV_ITEMS.map(item => (
              <div key={item.path} className={`qa-nav-item${item.path === "/hero" ? " active" : ""}`} onClick={() => navigate(item.path)}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div style={{ margin: "8px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }} />
            {NAV_BOTTOM.map(item => (
              <div key={item.path} className="qa-nav-item" style={{ color: item.accent ? "var(--app-accent)" : undefined }} onClick={() => navigate(item.path)}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
          {/* Sidebar now-playing mini */}
          {currentSong && (
            <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: 6, overflow: "hidden", background: "#222", flexShrink: 0, position: "relative" }}>
                {currentSong.cover_url
                  ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎵</div>}
                {isPlaying && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying /></div>}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.name}</div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.artist}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>

            {/* ═══════════════════════════════════════════════════════════════
                HERO — Full-width BG image, left 35% dark-to-transparent fade
            ═══════════════════════════════════════════════════════════════ */}
            <div style={{ position: "relative", minHeight: 290, overflow: "hidden" }}>

              {/* 1. Full-width background image — no blur, covers everything */}
              {bgImage ? (
                <img
                  src={bgImage}
                  alt=""
                  onLoad={() => setBgLoaded(true)}
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: "center top",
                    opacity: bgLoaded ? 1 : 0,
                    transition: "opacity 0.7s ease",
                  }}
                />
              ) : (
                <div style={{ position: "absolute", inset: 0, background: "#0d0d0d" }} />
              )}

              {/* 2. LEFT FADE — dark black covers only left ~35%, then fades to transparent */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to right, #0a0a0a 0%, #0a0a0a 22%, rgba(10,10,10,0.92) 30%, rgba(10,10,10,0.55) 38%, rgba(10,10,10,0.18) 50%, transparent 65%)",
                zIndex: 1,
              }} />

              {/* 3. Bottom fade to page background */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 90,
                background: "linear-gradient(to bottom, transparent, #0a0a0a)",
                zIndex: 2,
              }} />

              {/* 4. HERO CONTENT */}
              <div style={{
                position: "relative", zIndex: 3,
                padding: "28px 28px 36px",
                display: "flex", alignItems: "flex-start", gap: 26,
              }}>

                {/* Artist portrait — rounded rect, like reference */}
                <div className="fade-up" style={{
                  width: 180, height: 200, borderRadius: 12, overflow: "hidden",
                  flexShrink: 0, background: "#1a1a1a",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                }}>
                  <img
                    src={artistImg}
                    alt={decodedName}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
                  />
                </div>

                {/* Artist info */}
                <div style={{ flex: 1, minWidth: 0, paddingTop: 8 }}>

                  {/* ARTIST badge */}
                  <div className="fade-up fade-up-1" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em" }}>ARTIST</span>
                    <span style={{
                      color: "var(--app-accent)", fontSize: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 17, height: 17, background: "rgba(var(--app-accent-rgb),0.22)", borderRadius: "50%",
                    }}>✔</span>
                  </div>

                  {/* Artist name — exact weight/size from screenshot */}
                  <h1 className="fade-up fade-up-1" style={{
                    fontSize: "clamp(36px,4.5vw,62px)",
                    fontWeight: 900, color: "#fff", lineHeight: 1.05,
                    letterSpacing: "-0.025em", margin: "0 0 5px",
                    textShadow: "0 2px 24px rgba(0,0,0,0.6)",
                  }}>
                    {decodedName}
                  </h1>

                  {/* Song count */}
                  <div className="fade-up fade-up-1" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12.5, marginBottom: 10 }}>
                    {loading ? "Loading…" : `${songs.length} song${songs.length !== 1 ? "s" : ""}`}
                  </div>

                  {/* Bio — 2-line clamp */}
                  {bio && (
                    <p className="fade-up fade-up-2" style={{
                      color: "rgba(255,255,255,0.62)", fontSize: 13, lineHeight: 1.65,
                      maxWidth: 480, margin: "0 0 16px",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>{bio}</p>
                  )}

                  {/* Stats row */}
                  <div className="fade-up fade-up-2" style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 18, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 16 }}>🎵</span>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: 13.5, lineHeight: 1.1 }}>{loading ? "—" : songs.length}</div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.09em" }}>SONGS</div>
                      </div>
                    </div>
                    {monthlyListeners && (
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 16 }}>🎧</span>
                        <div>
                          <div style={{ color: "#fff", fontWeight: 800, fontSize: 13.5, lineHeight: 1.1 }}>{monthlyListeners}</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.09em" }}>MONTHLY LISTENERS</div>
                        </div>
                      </div>
                    )}
                    {location && (
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 16 }}>📍</span>
                        <div>
                          <div style={{ color: "#fff", fontWeight: 800, fontSize: 13.5, lineHeight: 1.1 }}>{location}</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.09em" }}>FROM</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons — matches screenshot */}
                  <div className="fade-up fade-up-3 hero-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button className="qa-btn qa-btn-primary" onClick={playAll}>
                      <span style={{ fontSize: 11 }}>▶</span> PLAY ALL
                    </button>
                    <button className="qa-btn qa-btn-outline" onClick={shufflePlay}>
                      <span style={{ fontSize: 13 }}>⇄</span> SHUFFLE
                    </button>
                    <button className="qa-btn qa-btn-outline">
                      <span style={{ fontSize: 14 }}>+</span> ADD TO PLAYLIST
                    </button>
                    <button className="qa-btn qa-btn-icon">···</button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── TABS ── */}
            <div style={{
              background: "#0a0a0a", padding: "0 24px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
            }}>
              {["songs", "albums", "about"].map(tab => (
                <div
                  key={tab}
                  className={`qa-tab${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.toUpperCase()}
                </div>
              ))}
            </div>

            {/* ── SONGS TAB ── */}
            {activeTab === "songs" && (
              <div style={{ padding: "18px 20px 80px" }}>

                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 700 }}>
                    All Songs <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>({songs.length})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <select
                      value={sortOrder}
                      onChange={e => setSortOrder(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8, color: "#fff", fontSize: 12, padding: "6px 10px",
                        cursor: "pointer", outline: "none", fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="alpha">A–Z</option>
                    </select>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 17, cursor: "pointer" }}>☰</span>
                  </div>
                </div>

                {/* Song list */}
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="qa-skeleton" style={{ height: 54, borderRadius: 8, marginBottom: 4 }} />
                    ))
                  : sortedSongs.length === 0
                  ? <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: "60px 0", fontSize: 13.5 }}>No songs found</div>
                  : sortedSongs.map((song, idx) => {
                      const active = currentSong?.id === song.id
                      const progress = active && duration > 0 ? currentTime / duration : 0
                      return (
                        <div key={song.id} className={`qa-song-row${active ? " active-row" : ""}`}>

                          {/* Index / waveform */}
                          <div style={{
                            textAlign: "center", fontSize: 12.5, fontWeight: 600,
                            color: active ? "var(--app-accent)" : "rgba(255,255,255,0.3)",
                          }}>
                            {active ? <MiniWave isPlaying={isPlaying} /> : idx + 1}
                          </div>

                          {/* Cover */}
                          <div
                            onClick={() => playSongFromList(song)}
                            style={{
                              width: 44, height: 44, borderRadius: 7, overflow: "hidden",
                              background: "#222", display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: 17, cursor: "pointer",
                              position: "relative", flexShrink: 0,
                            }}
                          >
                            {song.cover_url
                              ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : "🎵"}
                            {active && (
                              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MiniWave isPlaying={isPlaying} />
                              </div>
                            )}
                          </div>

                          {/* Title + tags + progress */}
                          <div onClick={() => playSongFromList(song)} style={{ minWidth: 0, cursor: "pointer" }}>
                            <div style={{
                              color: active ? "var(--app-accent)" : "#fff",
                              fontWeight: 600, fontSize: 13.5,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>{song.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                              {song.music_type && (
                                <span style={{
                                  color: "var(--app-accent)", fontSize: 10,
                                  background: "rgba(var(--app-accent-rgb),0.13)",
                                  padding: "1px 7px", borderRadius: 4, fontWeight: 700, textTransform: "capitalize",
                                }}>{song.music_type}</span>
                              )}
                              {song.location && (
                                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5 }}>{song.location}</span>
                              )}
                            </div>
                            {active && (
                              <div style={{ height: 2, background: "rgba(255,255,255,0.09)", borderRadius: 1, overflow: "hidden", marginTop: 5 }}>
                                <div style={{ width: `${Math.min(progress * 100, 100)}%`, height: "100%", background: "var(--app-accent)", borderRadius: 1, transition: "width 0.5s linear" }} />
                              </div>
                            )}
                          </div>

                          {/* Duration */}
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12.5, fontFamily: "monospace", flexShrink: 0 }}>
                            {fmt(song.duration)}
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                            <FavoriteButton song={song} />
                            <div style={{ position: "relative" }}>
                              <button
                                onClick={e => { e.stopPropagation(); setOpenPlusId(openPlusId === song.id ? null : song.id) }}
                                style={{
                                  width: 28, height: 28, borderRadius: "50%",
                                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.13)",
                                  color: "#fff", fontSize: 16, cursor: "pointer",
                                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                              >+</button>
                              {openPlusId === song.id && (
                                <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpenPlusId(null)} />
                              )}
                            </div>
                            <button
                              style={{
                                width: 28, height: 28, borderRadius: "50%", background: "transparent",
                                border: "none", color: "rgba(255,255,255,0.3)", fontSize: 17,
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
                              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                            >⋮</button>
                          </div>
                        </div>
                      )
                    })}
              </div>
            )}

            {/* ── ALBUMS TAB ── */}
            {activeTab === "albums" && (
              <div style={{ padding: "48px 28px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13.5 }}>
                No albums available yet
              </div>
            )}

            {/* ── ABOUT TAB ── */}
            {activeTab === "about" && (
              <div style={{ padding: "28px 24px", maxWidth: 620 }}>
                {bio
                  ? <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13.5, lineHeight: 1.85, marginBottom: 28 }}>{bio}</p>
                  : <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13.5, marginBottom: 28 }}>No bio available</div>
                }
                {quote && (
                  <div style={{ borderLeft: "3px solid var(--app-accent)", paddingLeft: 20, marginBottom: 28 }}>
                    <div style={{ fontSize: 26, color: "var(--app-accent)", lineHeight: 1, marginBottom: 8 }}>"</div>
                    <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 13.5, fontStyle: "italic", lineHeight: 1.75, marginBottom: 10 }}>{quote}</p>
                    <div style={{ color: "var(--app-accent)", fontSize: 13, fontStyle: "italic", fontWeight: 600 }}>— {decodedName}</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {location && (
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6 }}>
                      📍 {location}
                    </div>
                  )}
                  {monthlyListeners && (
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6 }}>
                      🎧 {monthlyListeners} Monthly Listeners
                    </div>
                  )}
                  {avgRating && (
                    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "6px 14px", fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6 }}>
                      ⭐ {avgRating} Rating
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div
            className="qa-right-panel"
            style={{
              width: 255, background: "#0f0f0f",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
              padding: "22px 16px", display: "flex", flexDirection: "column",
              gap: 20, overflowY: "auto", flexShrink: 0,
            }}
          >
            {/* About */}
            <div>
              <div style={{ color: "var(--app-accent)", fontWeight: 700, fontSize: 12.5, marginBottom: 10, letterSpacing: "0.05em" }}>
                About {decodedName}
              </div>
              {bio
                ? <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.75 }}>{bio}</p>
                : <div className="qa-skeleton" style={{ height: 58, borderRadius: 8 }} />
              }
            </div>

            {/* Top Listeners */}
            <div>
              <div style={{ color: "var(--app-accent)", fontWeight: 700, fontSize: 12.5, marginBottom: 10, letterSpacing: "0.05em" }}>
                Top Listeners
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {["A", "B", "C", "D"].map((l, i) => (
                  <div key={l} style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: `hsl(${i * 55 + 130},35%,28%)`,
                    border: "2px solid #0f0f0f",
                    marginLeft: i === 0 ? 0 : -9,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.7)",
                    zIndex: 4 - i, position: "relative",
                  }}>{l}</div>
                ))}
                {monthlyListeners && (
                  <div style={{ marginLeft: 10, color: "rgba(255,255,255,0.35)", fontSize: 11.5 }}>+{monthlyListeners}</div>
                )}
              </div>
            </div>

            {/* Stat cards */}
            {monthlyListeners && (
              <div className="qa-stat-card">
                <span style={{ fontSize: 20 }}>🎧</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 15.5 }}>{monthlyListeners}</div>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11 }}>Monthly Listeners</div>
                </div>
              </div>
            )}

            <div className="qa-stat-card">
              <span style={{ fontSize: 20 }}>🎵</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 15.5 }}>{loading ? "—" : songs.length}</div>
                <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11 }}>Songs</div>
              </div>
            </div>

            {avgRating && (
              <div className="qa-stat-card">
                <span style={{ fontSize: 20 }}>⭐</span>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 15.5 }}>{avgRating}</div>
                  <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11 }}>Average Rating</div>
                </div>
              </div>
            )}

            {/* Quote card */}
            {quote && (
              <div style={{
                background: "rgba(var(--app-accent-rgb),0.05)",
                border: "1px solid rgba(var(--app-accent-rgb),0.14)",
                borderRadius: 12, padding: "15px 15px 13px",
              }}>
                <div style={{ color: "var(--app-accent)", fontSize: 22, lineHeight: 1, marginBottom: 8 }}>"</div>
                <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 12, fontStyle: "italic", lineHeight: 1.75, marginBottom: 10 }}>{quote}</p>
                <div style={{
                  color: "var(--app-accent)", fontSize: 13, fontStyle: "italic", fontWeight: 700,
                  textAlign: "right", fontFamily: "'Dancing Script', cursive", letterSpacing: "0.02em",
                }}>— {decodedName}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PLAYER BAR
      ═══════════════════════════════════════════════════════════════ */}
      <div className="player-bar">

        {/* Left: current song info */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: 210, minWidth: 0, flexShrink: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 8, overflow: "hidden",
            background: "#222", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 17, flexShrink: 0, position: "relative",
          }}>
            {currentSong?.cover_url
              ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "🎵"}
            {isPlaying && currentSong && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MiniWave isPlaying />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: currentSong ? "#fff" : "rgba(255,255,255,0.28)", fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 148 }}>
              {currentSong?.name || "No Song Selected"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 148 }}>
              {currentSong?.artist || "Pick a song to play"}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Center: playback controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.38)", cursor: "pointer", fontSize: 15, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.38)"}>⇄</button>
          <button onClick={playPrev}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.65)", cursor: "pointer", fontSize: 19, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}>⏮</button>
          <button
            onClick={togglePlay}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "var(--app-accent)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#000", fontSize: 14, fontWeight: 700,
              boxShadow: "0 4px 18px rgba(var(--app-accent-rgb),0.38)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={playNext}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.65)", cursor: "pointer", fontSize: 19, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}>⏭</button>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.38)", cursor: "pointer", fontSize: 15, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.38)"}>↻</button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right: seek */}
        <div className="qa-player-seek" style={{ display: "flex", flexDirection: "column", gap: 3, width: 175, flexShrink: 0 }}>
          <input
            type="range" min={0} max={duration || 0} value={currentTime}
            onChange={e => seekTo(Number(e.target.value))}
            style={{ width: "100%", background: `linear-gradient(to right,var(--app-accent) ${progressPct}%,rgba(255,255,255,0.18) 0%)` }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
            <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="qa-player-vol" style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>🔊</span>
          <input
            type="range" min={0} max={1} step={0.01} value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            style={{ width: 75, background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,rgba(255,255,255,0.18) 0%)` }}
          />
        </div>
      </div>
    </div>
  )
}