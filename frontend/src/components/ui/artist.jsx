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
      setToast(r.status === 409 ? "Already in playlist" : r.ok ? "✓ Added!" : "Failed")
    } catch { setToast("Error") }
    setAdding(null)
    setTimeout(() => { setToast(""); onClose() }, 1200)
  }

  return (
    <div ref={ref} style={{
      position: "absolute", zIndex: 1000, top: "110%", right: 0,
      background: "var(--app-shell-bg-alt)", border: "1px solid rgba(var(--app-accent-rgb),0.25)",
      borderRadius: 12, minWidth: 190,
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
            <span>📋</span>
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.name}</span>
            {adding === pl._id && <span style={{ fontSize: 11, color: "var(--app-accent)" }}>Adding…</span>}
          </div>
        ))}
    </div>
  )
}

export default function ArtistPage() {
  const { artistName } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const userId = user?._id
  const decodedName = decodeURIComponent(artistName || "")

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [artistImg, setArtistImg] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [openPlusId, setOpenPlusId] = useState(null)

  const {
    currentSong, isPlaying, currentTime, duration, volume, progressPct,
    playSongFromList, togglePlay, playNext, playPrev, seekTo, setVolume,
  } = usePersistentSongPlayer(songs)

  // Fetch artist image
  useEffect(() => {
    if (!decodedName) return
    const url = `${SUPABASE_URL}/rest/v1/artists?select=image_url&name=ilike.${encodeURIComponent(decodedName)}&limit=1`
    fetch(url, { headers: H })
      .then(r => r.json())
      .then(rows => setArtistImg(rows?.[0]?.image_url || dicebearUrl(decodedName)))
      .catch(() => setArtistImg(dicebearUrl(decodedName)))
  }, [decodedName])

  // Fetch songs
  useEffect(() => {
    if (!decodedName) return
    setLoading(true)
    const url = `${SUPABASE_URL}/rest/v1/songs?select=*&artist=ilike.*${encodeURIComponent(decodedName)}*&order=created_at.desc`
    fetch(url, { headers: H })
      .then(r => r.json())
      .then(d => setSongs(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [decodedName])

  const playAll = () => { if (songs.length > 0) playSongFromList(songs[0]) }

  const shufflePlay = () => {
    if (songs.length === 0) return
    const random = songs[Math.floor(Math.random() * songs.length)]
    playSongFromList(random)
  }

  const fmt2 = (s) => (!s || isNaN(s)) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-shell-bg)", color: "var(--app-text-main)", fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.2);border-radius:2px}
        @keyframes wave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
        @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
        .skeleton{background:linear-gradient(90deg,var(--app-surface) 25%,rgba(var(--app-accent-rgb),0.06) 50%,var(--app-surface) 75%);background-size:400px 100%;animation:shimmer 1.4s ease infinite}
        .song-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;cursor:pointer;border-left:3px solid transparent;margin-bottom:4px;transition:all 0.18s;position:relative}
        .song-row:hover{background:var(--app-surface)}
        .song-row.active-row{border-left-color:var(--app-accent);background:rgba(var(--app-accent-rgb),0.06)}
        .action-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:10px 18px;border-radius:12px;cursor:pointer;border:1px solid rgba(var(--app-accent-rgb),0.25);background:rgba(var(--app-accent-rgb),0.06);color:var(--app-text-muted);font-size:12px;font-weight:600;transition:all 0.2s;font-family:'DM Sans',sans-serif}
        .action-btn:hover{border-color:var(--app-accent);color:var(--app-accent);background:rgba(var(--app-accent-rgb),0.12)}
        .action-btn.primary{background:linear-gradient(135deg,var(--app-accent-strong),var(--app-accent));border:none;color:#000;font-weight:700}
        .action-btn.primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(var(--app-accent-rgb),0.35)}
        input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--app-accent);cursor:pointer;box-shadow:0 0 6px rgba(var(--app-accent-rgb),0.5)}
        .player-bar{background:var(--app-shell-bg-alt);border-top:1px solid rgba(var(--app-accent-rgb),0.18);padding:10px 16px;display:flex;align-items:center;gap:14px;flex-shrink:0;position:sticky;bottom:0;z-index:20;overflow:hidden}
        .player-progress-line{position:absolute;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--app-accent-strong),var(--app-accent));transition:width 0.5s linear;pointer-events:none}
        @media(max-width:600px){.player-bar{padding:8px 10px;gap:8px}.player-seek{width:100px!important}.player-vol{display:none!important}.artist-header{flex-direction:column!important;align-items:flex-start!important;gap:16px!important}.artist-img{width:120px!important;height:120px!important}.song-duration{display:none!important}}
        @media(max-width:440px){.player-seek{display:none!important}}
      `}</style>

      <DashboardNavbar />

      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ── ARTIST HEADER ── */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.1)", background: "var(--app-shell-bg-alt)" }}>
          <div className="artist-header" style={{ display: "flex", alignItems: "flex-start", gap: 24, maxWidth: 860, margin: "0 auto" }}>

            {/* Artist Image */}
            <div className="artist-img" style={{ width: 180, height: 180, borderRadius: 16, overflow: "hidden", flexShrink: 0, background: "var(--app-surface)", border: "2px solid rgba(var(--app-accent-rgb),0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", position: "relative" }}>
              {!imgLoaded && <div className="skeleton" style={{ position: "absolute", inset: 0 }} />}
              {artistImg && (
                <img src={artistImg} alt={decodedName}
                  onLoad={() => setImgLoaded(true)}
                  onError={e => { e.target.src = dicebearUrl(decodedName); setImgLoaded(true) }}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: imgLoaded ? 1 : 0, transition: "opacity 0.3s" }} />
              )}
            </div>

            {/* Right side */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Artist Name */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Artist</div>
                <h1 style={{ margin: 0, fontSize: "clamp(22px,4vw,36px)", fontWeight: 800, color: "var(--app-text-main)", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{decodedName}</h1>
                <div style={{ color: "var(--app-text-muted)", fontSize: 13, marginTop: 6 }}>
                  {loading ? "Loading songs..." : `${songs.length} song${songs.length !== 1 ? "s" : ""}`}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="action-btn primary" onClick={playAll}>
                  <span style={{ fontSize: 20 }}>▶</span>
                  <span>PLAY ALL</span>
                </button>
                <button className="action-btn" onClick={shufflePlay}>
                  <span style={{ fontSize: 20 }}>🔀</span>
                  <span>SHUFFLE</span>
                </button>
                <button className="action-btn" onClick={() => {
                  // Add all songs to playlist - opens first song's playlist dropdown
                  if (songs.length > 0) setOpenPlusId("bulk")
                }}>
                  <span style={{ fontSize: 20 }}>📋</span>
                  <span>ADD IN PLAYLIST</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SONGS LIST ── */}
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px 20px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>
              {loading ? "LOADING..." : `ALL SONGS · ${songs.length}`}
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,var(--app-border),transparent)" }} />
          </div>

          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 66, borderRadius: 12, marginBottom: 4 }} />
              ))
            : songs.length === 0
            ? (
                <div style={{ textAlign: "center", color: "var(--app-text-muted)", padding: "60px 0", fontSize: 14 }}>
                  No songs found for this artist
                </div>
              )
            : songs.map((song, idx) => {
                const active = currentSong?.id === song.id
                const progress = active && duration > 0 ? currentTime / duration : 0
                return (
                  <div key={song.id} className={`song-row${active ? " active-row" : ""}`}>
                    {/* Index */}
                    <div style={{ width: 24, flexShrink: 0, color: active ? "var(--app-accent)" : "var(--app-text-muted)", fontSize: 12, fontWeight: 600, textAlign: "center" }}>
                      {active ? <MiniWave isPlaying={isPlaying} /> : idx + 1}
                    </div>

                    {/* Cover */}
                    <div onClick={() => playSongFromList(song)} style={{ width: 48, height: 48, borderRadius: 10, overflow: "hidden", background: "var(--app-surface)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, position: "relative", boxShadow: active ? "0 0 14px rgba(var(--app-accent-rgb),0.35)" : "none", cursor: "pointer" }}>
                      {song.cover_url ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎵"}
                      {active && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}><MiniWave isPlaying={isPlaying} /></div>}
                    </div>

                    {/* Info */}
                    <div onClick={() => playSongFromList(song)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                      <div style={{ color: active ? "var(--app-accent)" : "var(--app-text-main)", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.name}</div>
                      <div style={{ color: "var(--app-text-muted)", fontSize: 12, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        {song.music_type && <span style={{ color: "var(--app-accent)", fontSize: 10, background: "rgba(var(--app-accent-rgb),0.1)", padding: "1px 6px", borderRadius: 4, textTransform: "capitalize" }}>{song.music_type}</span>}
                        {song.location && <span>{song.location}</span>}
                      </div>
                      {active && <div style={{ marginTop: 5 }}><ProgressBar progress={progress} isActive /></div>}
                    </div>

                    {/* Duration */}
                    <div className="song-duration" style={{ color: "var(--app-text-muted)", fontSize: 12, fontFamily: "monospace", flexShrink: 0 }}>{fmt2(song.duration)}</div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <FavoriteButton song={song} />
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={e => { e.stopPropagation(); setOpenPlusId(openPlusId === song.id ? null : song.id) }}
                          style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(var(--app-accent-rgb),0.1)", border: "1px solid rgba(var(--app-accent-rgb),0.3)", color: "var(--app-accent)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        {openPlusId === song.id && <AddToPlaylistDropdown song={song} userId={userId} onClose={() => setOpenPlusId(null)} />}
                      </div>
                    </div>
                  </div>
                )
              })}
        </div>
      </div>

      {/* ── PLAYER BAR ── */}
      <div className="player-bar">
        <div className="player-progress-line" style={{ width: `${progressPct}%` }} />
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

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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

        <div className="player-seek" style={{ display: "flex", flexDirection: "column", gap: 3, width: 170, flexShrink: 0 }}>
          <input type="range" min={0} max={duration || 0} value={currentTime} onChange={e => seekTo(Number(e.target.value))}
            style={{ width: "100%", background: `linear-gradient(to right,var(--app-accent) ${progressPct}%,var(--app-border) 0%)` }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--app-text-muted)", fontSize: 10 }}>
            <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="player-vol" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ color: "var(--app-text-muted)", fontSize: 14 }}>🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))}
            style={{ width: 70, background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,var(--app-border) 0%)` }} />
        </div>
      </div>
    </div>
  )
}