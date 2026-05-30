import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import { useUser } from "@/context/userContext"
import FavoriteButton from "@/components/FavoriteButton"
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer"

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" }
import { API_URL } from "@/lib/config"
const getToken = () => localStorage.getItem("accessToken")
const authH = (ct = true) => { const h = {}; if (ct) h["Content-Type"] = "application/json"; const t = getToken(); if (t) h.Authorization = `Bearer ${t}`; return h }
const fmt = (s) => (!s || isNaN(s)) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

// ── Helpers ───────────────────────────────────────────────────────────────────
function dicebearUrl(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0a0a0a,111827,1a1a2e,0d1117&fontFamily=sans-serif&fontSize=38&fontWeight=700`
}

// ── Artist Card ───────────────────────────────────────────────────────────────
// imageUrl comes from artists table in SQL; falls back to DiceBear if null
function ArtistCard({ artistName, imageUrl, songCount, onClick }) {
  const [loaded, setLoaded] = useState(false)
  const imgSrc = imageUrl || dicebearUrl(artistName)

  return (
    <div
      onClick={() => onClick(artistName)}
      style={{
        flexShrink: 0,
        width: 110,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        transition: "transform 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{
        width: 80, height: 80, borderRadius: "50%", overflow: "hidden",
        background: "var(--app-surface)",
        border: "2px solid rgba(var(--app-accent-rgb),0.25)",
        boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
        position: "relative",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--app-accent)"; e.currentTarget.style.boxShadow = "0 4px 22px rgba(var(--app-accent-rgb),0.35)" }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.25)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.35)" }}
      >
        {!loaded && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,var(--app-surface) 25%,rgba(var(--app-accent-rgb),0.06) 50%,var(--app-surface) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite" }} />
        )}
        <img
          src={imgSrc}
          alt={artistName}
          onLoad={() => setLoaded(true)}
          onError={e => { e.target.src = dicebearUrl(artistName); setLoaded(true) }}
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }}
        />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "var(--app-text-main)", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 105 }}>{artistName}</div>
        <div style={{ color: "var(--app-text-muted)", fontSize: 10, marginTop: 2 }}>{songCount} song{songCount !== 1 ? "s" : ""}</div>
      </div>
    </div>
  )
}

// ── Artist Songs Modal ────────────────────────────────────────────────────────
function ArtistSongsModal({ artistName, onClose, onPlay, currentSong, currentTime, duration, userId, tr }) {
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [artistImg, setArtistImg] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    let cancelled = false
    // fetch artist image from SQL artists table
    const url = `${SUPABASE_URL}/rest/v1/artists?select=image_url&name=ilike.${encodeURIComponent(artistName)}&limit=1`
    fetch(url, { headers: H })
      .then(r => r.json())
      .then(rows => {
        if (!cancelled) {
          const img = rows?.[0]?.image_url
          setArtistImg(img || dicebearUrl(artistName))
        }
      })
      .catch(() => { if (!cancelled) setArtistImg(dicebearUrl(artistName)) })
    return () => { cancelled = true }
  }, [artistName])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const url = `${SUPABASE_URL}/rest/v1/songs?select=*&artist=ilike.*${encodeURIComponent(artistName)}*&order=created_at.desc`
    fetch(url, { headers: H })
      .then(r => r.json())
      .then(d => { if (!cancelled) setSongs(Array.isArray(d) ? d : []) })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [artistName])

  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [onClose])

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} style={{ background: "var(--app-shell-bg-alt)", border: "1px solid rgba(var(--app-accent-rgb),0.2)", borderRadius: 18, width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 18px 14px", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.1)", background: "rgba(var(--app-accent-rgb),0.03)", flexShrink: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(var(--app-accent-rgb),0.3)", flexShrink: 0, background: "var(--app-surface)" }}>
            {artistImg && <img src={artistImg} alt={artistName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{artistName}</div>
            <div style={{ color: "var(--app-text-muted)", fontSize: 12, marginTop: 2 }}>{loading ? "Loading..." : `${songs.length} song${songs.length !== 1 ? "s" : ""}`}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(var(--app-accent-rgb),0.1)", border: "1px solid rgba(var(--app-accent-rgb),0.2)", borderRadius: "50%", width: 32, height: 32, color: "var(--app-text-main)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
        </div>
        {/* Song list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "10px 12px" }}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 58, borderRadius: 10, marginBottom: 6 }} />)
            : songs.length === 0
            ? <div style={{ textAlign: "center", color: "var(--app-text-muted)", padding: "40px 0", fontSize: 13 }}>No songs found for this artist</div>
            : songs.map(song => {
                const active = currentSong?.id === song.id
                return (
                  <div key={song.id} onClick={() => onPlay(song)}
                    style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 4, background: active ? "rgba(var(--app-accent-rgb),0.1)" : "transparent", border: `1px solid ${active ? "rgba(var(--app-accent-rgb),0.25)" : "transparent"}`, transition: "all 0.15s" }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--app-surface)" }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: active ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
                      <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 1 }}>{fmt(song.duration)}</div>
                    </div>
                    <FavoriteButton song={song} size={28} iconSize={13} />
                  </div>
                )
              })}
        </div>
      </div>
    </div>
  )
}

// ── Artists Section ───────────────────────────────────────────────────────────
function ArtistsSection({ tr }) {
  const navigate = useNavigate()
  const [artistMap, setArtistMap] = useState({})   // { name: count }
  const [displayed, setDisplayed] = useState([])   // random subset shown
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [loading, setLoading] = useState(true)
  const { currentSong, currentTime, duration, playSongFromList, userId } = useArtistContext()

  // Fetch artists that have images in the artists table
  // then count their songs from the songs table
  useEffect(() => {
    let cancelled = false
    // Step 1: get all artists with images from artists table
    const artistsUrl = `${SUPABASE_URL}/rest/v1/artists?select=name,image_url&order=name.asc`
    fetch(artistsUrl, { headers: H })
      .then(r => r.json())
      .then(async artistRows => {
        if (!Array.isArray(artistRows) || artistRows.length === 0) return
        // Step 2: get song counts per artist
        const songsUrl = `${SUPABASE_URL}/rest/v1/songs?select=artist&artist=not.is.null`
        const songsRes = await fetch(songsUrl, { headers: H })
        const songRows = await songsRes.json()
        const countMap = {}
        if (Array.isArray(songRows)) {
          songRows.forEach(r => {
            const a = (r.artist || "").trim()
            if (a) countMap[a.toLowerCase()] = (countMap[a.toLowerCase()] || 0) + 1
          })
        }
        // Build map: { name, imageUrl, count }
        const map = {}
        artistRows.forEach(r => {
          if (r.name && r.image_url) {
            map[r.name] = {
              imageUrl: r.image_url,
              count: countMap[r.name.toLowerCase()] || 0
            }
          }
        })
        if (!cancelled) {
          setArtistMap(map)
          pickRandom(map)
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const pickRandom = (map) => {
    const all = Object.keys(map)
    const shuffled = [...all].sort(() => Math.random() - 0.5)
    setDisplayed(shuffled.slice(0, 10))
  }

  const shuffle = () => pickRandom(artistMap)

  if (!loading && displayed.length === 0) return null

  return (
    <>
      <Section
        title="🎤 Artists"
        action={<button onClick={shuffle} style={{ background: "none", border: "1px solid rgba(var(--app-accent-rgb),0.25)", borderRadius: 7, color: "var(--app-text-muted)", cursor: "pointer", padding: "3px 10px", fontSize: 11, fontFamily: "'DM Sans',sans-serif", transition: "all 0.18s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--app-accent)"; e.currentTarget.style.borderColor = "var(--app-accent)" }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--app-text-muted)"; e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.25)" }}>
          🔀 Shuffle
        </button>}
      >
        <div style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 8, paddingTop: 4, WebkitOverflowScrolling: "touch" }}
          className="h-scroll">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div className="skeleton" style={{ width: 80, height: 80, borderRadius: "50%" }} />
                  <div className="skeleton" style={{ width: 70, height: 10, borderRadius: 4 }} />
                </div>
              ))
            : displayed.map(name => (
                <ArtistCard key={name} artistName={name} imageUrl={artistMap[name]?.imageUrl} songCount={artistMap[name]?.count || 0} onClick={(name) => navigate(`/hero/artist/${encodeURIComponent(name)}`)} />
              ))}
        </div>
        
      </Section>

      {selectedArtist && (
        <ArtistSongsModal
          artistName={selectedArtist}
          onClose={() => setSelectedArtist(null)}
          onPlay={playSongFromList}
          currentSong={currentSong}
          currentTime={currentTime}
          duration={duration}
          userId={userId}
          tr={tr}
        />
      )}
    </>
  )
}

// context bridge so ArtistsSection can access player + userId without prop-drilling
import { createContext, useContext } from "react"
const ArtistCtx = createContext({})
const useArtistContext = () => useContext(ArtistCtx)


// ── Translations ──────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    greeting: (name) => `Assalamu Alaikum, ${name} 👋`,
    home: "Home", search: "Search songs, reciters...", continueListening: "Continue Listening",
    recentlyPlayed: "Recently Played", trending: "Trending Now 🔥", allSongs: "ALL SONGS",
    loading: "LOADING...", loadMore: "Load More", nowPlaying: "NOW PLAYING",
    noSong: "No Song Selected", pickSong: "Pick a song to play", analytics: "Analytics",
    totalSongs: "Total Songs", listeners: "Listeners", saves: "Saves", likes: "Likes ♥",
    shareAudio: "Share Your Audio", uploadDesc: "Upload nasheeds, naats, recitations & more",
    uploadBtn: "Upload Audio", aiRec: "AI Recommendations", addToPlaylist: "ADD TO PLAYLIST",
    addingDots: "Adding…", alreadyIn: "Already in playlist", added: "✓ Added!", failed: "Failed",
    error: "Error", noPlaylists: "No playlists found", loadingDots: "Loading…",
  },
  hi: {
    greeting: (name) => `अस्सलामु अलैकुम, ${name} 👋`, home: "होम", search: "गाने, पाठक खोजें...",
    continueListening: "सुनना जारी रखें", recentlyPlayed: "हाल ही में चलाए गए", trending: "ट्रेंडिंग अभी 🔥",
    allSongs: "सभी गाने", loading: "लोड हो रहा है...", loadMore: "और लोड करें", nowPlaying: "अभी चल रहा है",
    noSong: "कोई गाना नहीं चुना", pickSong: "चलाने के लिए गाना चुनें", analytics: "विश्लेषण",
    totalSongs: "कुल गाने", listeners: "श्रोता", saves: "सहेजे", likes: "पसंद ♥",
    shareAudio: "अपना ऑडियो साझा करें", uploadDesc: "नशीद, नात, तिलावत और अधिक अपलोड करें",
    uploadBtn: "ऑडियो अपलोड करें", aiRec: "AI सिफारिशें", addToPlaylist: "प्लेलिस्ट में जोड़ें",
    addingDots: "जोड़ा जा रहा है…", alreadyIn: "पहले से प्लेलिस्ट में है", added: "✓ जोड़ा गया!",
    failed: "विफल", error: "त्रुटि", noPlaylists: "कोई प्लेलिस्ट नहीं मिली", loadingDots: "लोड हो रहा है…",
  },
  ur: {
    greeting: (name) => `السلام علیکم، ${name} 👋`, home: "ہوم", search: "گانے، قاری تلاش کریں...",
    continueListening: "سننا جاری رکھیں", recentlyPlayed: "حال ہی میں چلائے گئے", trending: "ابھی ٹرینڈنگ 🔥",
    allSongs: "تمام گانے", loading: "لوڈ ہو رہا ہے...", loadMore: "مزید لوڈ کریں", nowPlaying: "ابھی چل رہا ہے",
    noSong: "کوئی گانا منتخب نہیں", pickSong: "چلانے کے لیے گانا منتخب کریں", analytics: "تجزیات",
    totalSongs: "کل گانے", listeners: "سننے والے", saves: "محفوظ", likes: "پسند ♥",
    shareAudio: "اپنا آڈیو شیئر کریں", uploadDesc: "نشید، نعت، تلاوت اور مزید اپلوڈ کریں",
    uploadBtn: "آڈیو اپلوڈ کریں", aiRec: "AI سفارشات", addToPlaylist: "پلے لسٹ میں شامل کریں",
    addingDots: "شامل ہو رہا ہے…", alreadyIn: "پہلے سے پلے لسٹ میں ہے", added: "✓ شامل ہو گیا!",
    failed: "ناکام", error: "خطا", noPlaylists: "کوئی پلے لسٹ نہیں ملی", loadingDots: "لوڈ ہو رہا ہے…",
  },
  ar: {
    greeting: (name) => `السلام عليكم، ${name} 👋`, home: "الرئيسية", search: "ابحث عن أغاني، قراء...",
    continueListening: "تابع الاستماع", recentlyPlayed: "تم تشغيلها مؤخراً", trending: "الأكثر رواجاً 🔥",
    allSongs: "جميع الأغاني", loading: "جارٍ التحميل...", loadMore: "تحميل المزيد", nowPlaying: "يُشغَّل الآن",
    noSong: "لم يتم اختيار أغنية", pickSong: "اختر أغنية للتشغيل", analytics: "التحليلات",
    totalSongs: "إجمالي الأغاني", listeners: "المستمعون", saves: "المحفوظات", likes: "الإعجابات ♥",
    shareAudio: "شارك صوتك", uploadDesc: "ارفع الأناشيد والتلاوات والمزيد", uploadBtn: "رفع الصوت",
    aiRec: "توصيات الذكاء الاصطناعي", addToPlaylist: "إضافة إلى قائمة التشغيل",
    addingDots: "جارٍ الإضافة…", alreadyIn: "موجود بالفعل في القائمة", added: "✓ تمت الإضافة!",
    failed: "فشل", error: "خطأ", noPlaylists: "لا توجد قوائم تشغيل", loadingDots: "جارٍ التحميل…",
  },
}
const t = (lang) => TRANSLATIONS[lang] || TRANSLATIONS.en

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

function AddToPlaylistDropdown({ song, userId, onClose, tr }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(null)
  const [toast, setToast] = useState("")
  const ref = useRef(null)

  useEffect(() => {
    if (!userId || !getToken()) { setLoading(false); return }
    fetch(`${API_URL}/playlists`, { headers: authH(false) })
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
      const r = await fetch(`${API_URL}/playlists/${pl._id}/songs`, {
        method: "POST", headers: authH(),
        body: JSON.stringify({ songId: String(song.id), songName: song.name, artist: song.artist, cover_url: song.cover_url, mp3_url: song.mp3_url, duration: song.duration })
      })
      setToast(r.status === 409 ? tr.alreadyIn : r.ok ? tr.added : tr.failed)
    } catch { setToast(tr.error) }
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
        📋 {tr.addToPlaylist}
      </div>
      {toast
        ? <div style={{ padding: 14, textAlign: "center", color: "var(--app-accent)", fontSize: 13, fontWeight: 600 }}>{toast}</div>
        : loading
        ? <div style={{ padding: 14, color: "var(--app-text-muted)", fontSize: 12, textAlign: "center" }}>{tr.loadingDots}</div>
        : playlists.length === 0
        ? <div style={{ padding: 14, color: "var(--app-text-muted)", fontSize: 12, textAlign: "center" }}>{tr.noPlaylists}</div>
        : playlists.map(pl => (
          <div key={pl._id} onClick={() => add(pl)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: adding === pl._id ? "wait" : "pointer", color: adding === pl._id ? "var(--app-accent)" : "var(--app-text-main)", fontSize: 13, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 15 }}>📋</span>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.name}</span>
            {adding === pl._id && <span style={{ fontSize: 11, color: "var(--app-accent)", animation: "pulse 1s infinite" }}>{tr.addingDots}</span>}
          </div>
        ))}
    </div>
  )
}

function PlusBtn({ song, userId, tr }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        title={tr.addToPlaylist}
        style={{
          width: 30, height: 30, borderRadius: "50%",
          background: open ? "rgba(var(--app-accent-rgb),0.25)" : "rgba(var(--app-accent-rgb),0.1)",
          border: `1px solid ${open ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),0.3)"}`,
          color: "var(--app-accent)", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.18s", lineHeight: 1,
        }}
      >+</button>
      {open && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpen(false)} tr={tr} />}
    </div>
  )
}


function SongCard({ song, isActive, onPlay, compact, currentTime, duration, userId, tr }) {
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
          {isActive && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying={true} /></div>}
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
      {open && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpen(false)} tr={tr} />}
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
          {isActive && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.38)", display: "flex", alignItems: "center", justifyContent: "center" }}><Waveform isPlaying={true} /></div>}
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
      {open && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpen(false)} tr={tr} />}
    </div>
  )
}


export default function QalbAudio() {
  const { user, preferences } = useUser()
  const navigate = useNavigate()
  const displayName = user?.username || "Guest"
  const userId = user?._id
  const tr = t(preferences?.language || "en")

  const [songs, setSongs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchTimer = useRef(null)
  const {
    currentSong, isPlaying, currentTime, duration, volume, progressPct,
    playSongFromList, togglePlay, playNext, playPrev, seekTo, setVolume,
  } = usePersistentSongPlayer(songs)

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

  const cardProps = { currentTime, duration, userId, tr }

  // context value for ArtistsSection
  const artistCtxVal = { currentSong, currentTime, duration, playSongFromList, userId }

  return (
    <ArtistCtx.Provider value={artistCtxVal}>
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
        @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
        .skeleton{background:linear-gradient(90deg,var(--app-surface) 25%,rgba(var(--app-accent-rgb),0.06) 50%,var(--app-surface) 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}
        .sidebar{width:216px;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),0.1);display:flex;flex-direction:column;flex-shrink:0;transition:transform 0.28s cubic-bezier(.4,0,.2,1)}
        @media(max-width:768px){.sidebar{position:fixed;left:0;top:0;bottom:0;z-index:200;width:250px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,0.6)}.sidebar.open{transform:translateX(0)}}
        .right-panel{width:234px;background:var(--app-shell-bg-alt);border-left:1px solid rgba(var(--app-accent-rgb),0.08);padding:16px 14px;display:flex;flex-direction:column;gap:18px;overflow-y:auto;flex-shrink:0}
        @media(max-width:1100px){.right-panel{display:none}}
        .hamburger{display:none;background:none;border:none;color:var(--app-text-main);font-size:20px;cursor:pointer;padding:6px 8px;border-radius:8px;flex-shrink:0;line-height:1;transition:background 0.15s}
        .hamburger:hover{background:var(--app-surface)}
        @media(max-width:768px){.hamburger{display:flex;align-items:center;justify-content:center}}
        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;backdrop-filter:blur(3px)}
        @media(max-width:768px){.mob-overlay.visible{display:block}}
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
        .cl-wrap{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
        @media(max-width:600px){.cl-wrap{grid-template-columns:1fr 1fr}}
        @media(max-width:380px){.cl-wrap{grid-template-columns:1fr}}
        .h-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}
        .h-scroll::-webkit-scrollbar{height:3px}
        @media(max-width:500px){.song-duration{display:none!important}}
      `}</style>

      <DashboardNavbar />
      <div className={`mob-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* SIDEBAR */}
        <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <img src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png" alt="QalbAudio"
              onClick={() => { navigate("/"); setSidebarOpen(false) }}
              style={{ height: 60, width: "auto", maxWidth: "88%", objectFit: "contain", cursor: "pointer", display: "block" }} />
            <div style={{ fontSize: 11, color: "var(--app-text-muted)", textAlign: "center" }}>
              <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
            {NAV_ITEMS.map(item => (
              <div key={item.id} className={`nav-item${item.id === "home" ? " active" : ""}`}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>{item.label}
              </div>
            ))}
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />
            {NAV_BOTTOM.map(item => (
              <div key={item.id} className="nav-item"
                style={{ color: item.id === "upload" ? "var(--app-accent)" : undefined }}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>{item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--app-shell-bg-alt)", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", flexShrink: 0 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
            <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{tr.home}</span>
            <div style={{ flex: 1 }} />
            <div style={{ position: "relative", width: "min(230px, 100%)" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--app-text-muted)", fontSize: 13, pointerEvents: "none" }}>🔍</span>
              <input value={search} onChange={e => handleSearch(e.target.value)}
                placeholder={tr.search}
                style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 9, padding: "8px 12px 8px 32px", color: "var(--app-text-main)", fontSize: 13, outline: "none", width: "100%", fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "var(--app-accent)"}
                onBlur={e => e.target.style.borderColor = "var(--app-border)"} />
            </div>
          </div>

          {/* Scroll area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            <h1 style={{ fontSize: "clamp(15px,3.5vw,22px)", fontWeight: 700, margin: "0 0 18px" }}>
              {tr.greeting(displayName)}
            </h1>

            {/* ── ARTISTS SECTION ── */}
            <ArtistsSection tr={tr} />

            <Section title={tr.continueListening}>
              <div className="cl-wrap">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ borderRadius: 14, height: 78 }} />)
                  : songs.slice(0, 4).map(s => <SongCard key={s.id} song={s} isActive={currentSong?.id === s.id} onPlay={playSongFromList} compact {...cardProps} />)}
              </div>
            </Section>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginBottom: 24 }}>
              {[{ label: tr.recentlyPlayed, sl: [0, 5] }, { label: tr.trending, sl: [5, 10] }].map(({ label, sl }) => (
                <Section key={label} title={label}>
                  <div className="h-scroll">
                    {(loading ? Array.from({ length: 4 }) : songs.slice(...sl)).map((s, i) =>
                      s ? <SongCard key={s.id} song={s} isActive={currentSong?.id === s.id} onPlay={playSongFromList} {...cardProps} />
                        : <div key={i} className="skeleton" style={{ width: 138, height: 190, borderRadius: 14, flexShrink: 0 }} />
                    )}
                  </div>
                </Section>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", flexShrink: 0 }}>
                {loading ? tr.loading : `${tr.allSongs} · ${total}`}
              </span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,var(--app-border),transparent)" }} />
            </div>

            {songs.map(song => {
              const active = currentSong?.id === song.id
              return (
                <div key={song.id} className={`song-row${active ? " active-row" : ""}`}>
                  <div onClick={() => playSongFromList(song)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, position: "relative", transition: "box-shadow 0.2s", boxShadow: active ? "0 0 14px rgba(var(--app-accent-rgb),0.35)" : "none" }}>
                      {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
                      {active && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying={isPlaying} /></div>}
                    </div>
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
                    <PlusBtn song={song} userId={userId} tr={tr} />
                  </div>
                </div>
              )
            })}

            {songs.length < total && (
              <button onClick={() => { const p = page + 1; setPage(p); fetchSongs(search, p, true) }}
                style={{ display: "block", margin: "18px auto 8px", background: "none", border: "1px solid rgba(var(--app-accent-rgb),0.3)", borderRadius: 9, color: "var(--app-text-muted)", cursor: "pointer", padding: "10px 32px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--app-accent)"; e.currentTarget.style.color = "var(--app-accent)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.3)"; e.currentTarget.style.color = "var(--app-text-muted)" }}>
                {tr.loadMore}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div>
            <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{tr.analytics}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[{ label: tr.totalSongs, value: total || 0 }, { label: tr.listeners, value: "5.8K" }, { label: tr.saves, value: "940" }, { label: tr.likes, value: "11.2K" }].map(s => (
                <div key={s.label} style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 8, padding: "10px 8px" }}>
                  <div style={{ color: "var(--app-text-muted)", fontSize: 10 }}>{s.label}</div>
                  <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 18, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(var(--app-accent-rgb),0.06)", border: "1px solid rgba(var(--app-accent-rgb),0.15)", borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>⬆</div>
            <div style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{tr.shareAudio}</div>
            <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>{tr.uploadDesc}</div>
            <button onClick={() => navigate("/upload")} style={{ width: "100%", padding: "9px 0", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>{tr.uploadBtn}</button>
          </div>

          <div>
            <div style={{ color: "var(--app-text-main)", fontWeight: 600, fontSize: 13, marginBottom: 10 }}>{tr.aiRec}</div>
            <div style={{ height: 56, background: "var(--app-surface)", borderRadius: 8, overflow: "hidden" }}>
              <svg viewBox="0 0 180 56" style={{ width: "100%", height: "100%" }}>
                <polyline points="0,50 20,36 40,40 60,26 80,33 100,18 120,28 140,16 160,23 180,13" fill="none" stroke="var(--app-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="0,50 20,36 40,40 60,26 80,33 100,18 120,28 140,16 160,23 180,13 180,56 0,56" fill="rgba(var(--app-accent-rgb),0.08)" />
              </svg>
            </div>
          </div>

          {currentSong && (
            <div style={{ background: "rgba(var(--app-accent-rgb),0.06)", border: "1px solid rgba(var(--app-accent-rgb),0.2)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ color: "var(--app-text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>{tr.nowPlaying}</div>
              <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", margin: "0 auto 10px", background: "var(--app-surface)" }}>
                {currentSong.cover_url ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎵</div>}
              </div>
              <div style={{ color: "var(--app-text-main)", fontWeight: 600, fontSize: 13, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.name}</div>
              <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginBottom: 10 }}>{currentSong.artist}</div>
              <div style={{ display: "flex", justifyContent: "center" }}><Waveform isPlaying={isPlaying} /></div>
            </div>
          )}
        </div>
      </div>

      {/* PLAYER BAR */}
      <div className="player-bar">
        <div className="player-progress-line" style={{ width: `${progressPct}%` }} />
        <div className="player-track">
          <div style={{ width: 42, height: 42, borderRadius: 9, overflow: "hidden", background: "var(--app-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: currentSong ? "0 0 12px rgba(var(--app-accent-rgb),0.25)" : "none", position: "relative" }}>
            {currentSong?.cover_url ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
            {isPlaying && currentSong && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying={true} /></div>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: currentSong ? "var(--app-text-main)" : "var(--app-text-muted)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {currentSong?.name || tr.noSong}
            </div>
            <div style={{ color: "var(--app-text-muted)", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
              {currentSong?.artist || tr.pickSong}
            </div>
          </div>
        </div>
        <div className="player-wave"><Waveform isPlaying={isPlaying} /></div>
        <div className="player-controls">
          <button onClick={playPrev} style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--app-text-main)"} onMouseLeave={e => e.currentTarget.style.color = "var(--app-text-muted)"}>⏮</button>
          <button onClick={togglePlay}
            style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 14, fontWeight: 700, flexShrink: 0, boxShadow: "0 4px 14px rgba(var(--app-accent-rgb),0.4)", transition: "transform 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >{isPlaying ? "⏸" : "▶"}</button>
          <button onClick={playNext} style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 18, padding: 4, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--app-text-main)"} onMouseLeave={e => e.currentTarget.style.color = "var(--app-text-muted)"}>⏭</button>
          <button style={{ background: "none", border: "none", color: "var(--app-text-muted)", cursor: "pointer", fontSize: 14, padding: 4 }}>🔁</button>
        </div>
        <div className="player-seek">
          <input type="range" min={0} max={duration || 0} value={currentTime} onChange={e => seekTo(Number(e.target.value))}
            style={{ width: "100%", background: `linear-gradient(to right,var(--app-accent) ${progressPct}%,var(--app-border) 0%)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--app-text-muted)", fontSize: 10 }}>
            <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
          </div>
        </div>
        <div className="player-vol">
          <span style={{ color: "var(--app-text-muted)", fontSize: 14, flexShrink: 0 }}>🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))}
            style={{ width: 70, background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,var(--app-border) 0%)` }} />
        </div>
      </div>
    </div>
    </ArtistCtx.Provider>
  )
}

function Section({ title, children, action }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,rgba(var(--app-accent-rgb),0.2),transparent)" }} />
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      {children}
    </div>
  )
}