import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useUser } from "@/context/userContext"
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer"

const NAV_ITEMS = [
  { icon: "🏠", label: "Home",      id: "home",      path: "/hero" },
  { icon: "🔍", label: "Explore",   id: "explore",   path: "/explore" },
  { icon: "📖", label: "Quran",     id: "quran",     path: "/quran" },
  { icon: "🎵", label: "Nasheed",   id: "nasheed",   path: "/nasheed" },
  { icon: "🎤", label: "Naat",      id: "naat",      path: "/naat" },
  { icon: "🎼", label: "Qawwali",   id: "qawwali",   path: "/qawwali" },
  { icon: "🎙", label: "Podcasts",  id: "podcasts",  path: "/podcasts" },
  { icon: "📋", label: "Playlists", id: "playlists", path: "/playlists" },
]

const NAV_BOTTOM = [
  { icon: "⊕",  label: "Upload Audio", id: "upload",    path: "/upload",    accent: true },
  { icon: "♡",  label: "Favorites",    id: "favorites", path: "/favorites" },
  { icon: "⚙",  label: "Settings",     id: "settings",  path: "/settings" },
]

export function useNavbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const openSidebar   = () => setSidebarOpen(true)
  const closeSidebar  = () => setSidebarOpen(false)
  const toggleSidebar = () => setSidebarOpen(v => !v)
  return { sidebarOpen, openSidebar, closeSidebar, toggleSidebar }
}

// Mini waveform animation for the now-playing card
const MiniWaveform = ({ isPlaying }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18 }}>
    {Array.from({ length: 12 }).map((_, i) => {
      const baseH = 4 + Math.sin(i * 0.9) * 5 + ((i * 3) % 4)
      return (
        <div key={i} style={{
          width: 2.5,
          height: baseH,
          background: `rgba(var(--app-accent-rgb),${isPlaying ? 0.9 : 0.35})`,
          borderRadius: 2,
          animation: isPlaying
            ? `qaWave ${0.5 + (i % 5) * 0.12}s ease-in-out infinite alternate`
            : "none",
          animationDelay: `${i * 0.05}s`,
          transition: "background 0.4s, height 0.3s",
        }} />
      )
    })}
  </div>
)

export default function NavbarMenu({ sidebarOpen, onClose }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useUser()
  const displayName = user?.username || "Guest"

  // Access persistent player state for the now-playing card
  const { currentSong, isPlaying, togglePlay } = usePersistentSongPlayer([])

  const activeId = [...NAV_ITEMS, ...NAV_BOTTOM]
    .find(i => i.path === location.pathname)?.id || "home"

  const goTo = (path) => { navigate(path); onClose?.() }

  return (
    <>
      <style>{`
        @keyframes qaWave { from { transform: scaleY(0.3) } to { transform: scaleY(1) } }
        @keyframes qaPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes qaGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(var(--app-accent-rgb),0.3)} 50%{box-shadow:0 0 0 6px rgba(var(--app-accent-rgb),0)} }
        @keyframes qaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes qaShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }

        /* ── Sidebar shell ── */
        .qa-nav-sidebar {
          width: 210px;
          background: var(--app-shell-bg-alt);
          border-right: 1px solid rgba(var(--app-accent-rgb), 0.12);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          /* Height handled by parent flex layout: fills between navbar and player */
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(.4,0,.2,1);
          position: relative;
        }

        /* Subtle top-to-bottom gradient overlay inside sidebar */
        .qa-nav-sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg,
            rgba(var(--app-accent-rgb),0.03) 0%,
            transparent 40%,
            transparent 70%,
            rgba(var(--app-accent-rgb),0.04) 100%
          );
          pointer-events: none;
          z-index: 0;
        }

        /* ── Mobile: slide in from left ── */
        @media(max-width:768px){
          .qa-nav-sidebar {
            position: fixed;
            left: 0;
            /* top = navbar height (~60px), bottom = player bar (~68px) */
            top: 60px;
            bottom: 68px;
            z-index: 200;
            width: 240px;
            transform: translateX(-100%);
            box-shadow: 4px 0 40px rgba(0,0,0,0.6);
          }
          .qa-nav-sidebar.open { transform: translateX(0) }
        }

        /* ── Overlay ── */
        .qa-mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 199;
          backdrop-filter: blur(3px);
        }
        @media(max-width:768px){
          .qa-mob-overlay.visible { display: block }
        }

        /* ── Nav item ── */
        .qa-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border-radius: 10px;
          cursor: pointer;
          margin-bottom: 2px;
          font-size: 13px;
          font-weight: 500;
          color: var(--app-text-muted);
          border-left: 3px solid transparent;
          transition: all 0.18s ease;
          position: relative;
          z-index: 1;
        }
        .qa-nav-item:hover {
          background: rgba(var(--app-accent-rgb), 0.07);
          color: var(--app-text-main);
          border-left-color: rgba(var(--app-accent-rgb), 0.3);
        }
        .qa-nav-item.active {
          background: rgba(var(--app-accent-rgb), 0.13);
          border-left-color: var(--app-accent);
          color: var(--app-accent);
          font-weight: 700;
          box-shadow: inset 0 0 20px rgba(var(--app-accent-rgb), 0.04);
        }
        .qa-nav-item .nav-icon {
          font-size: 15px;
          flex-shrink: 0;
          width: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .qa-nav-item:hover .nav-icon { transform: scale(1.15) }
        .qa-nav-item.active .nav-icon { animation: qaFloat 2.5s ease-in-out infinite }

        /* ── Upload item ── */
        .qa-nav-item.upload-item {
          color: var(--app-accent);
          font-weight: 700;
        }
        .qa-nav-item.upload-item .nav-icon {
          color: var(--app-accent);
          font-size: 17px;
        }

        /* ── Sidebar logo area ── */
        .qa-sidebar-logo {
          padding: 14px 12px 10px;
          border-bottom: 1px solid rgba(var(--app-accent-rgb), 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          position: relative;
          z-index: 1;
        }

        /* ── Section label ── */
        .qa-nav-section-label {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--app-text-muted);
          text-transform: uppercase;
          padding: 6px 14px 4px;
          opacity: 0.6;
          position: relative;
          z-index: 1;
        }

        /* ── Section divider ── */
        .qa-nav-divider {
          margin: 6px 10px;
          border: none;
          border-top: 1px solid rgba(var(--app-accent-rgb), 0.08);
        }

        /* ── Hamburger btn ── */
        .qa-hamburger {
          display: none;
          background: none;
          border: none;
          color: var(--app-text-main);
          font-size: 20px;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 8px;
          flex-shrink: 0;
          line-height: 1;
          transition: background 0.15s;
        }
        .qa-hamburger:hover { background: var(--app-surface) }
        @media(max-width:768px){
          .qa-hamburger { display: flex; align-items: center; justify-content: center }
        }

        /* ── Bottom Now Playing Card ── */
        .qa-np-card {
          position: relative;
          z-index: 1;
          margin: 8px 10px 10px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(var(--app-accent-rgb), 0.22);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          flex-shrink: 0;
        }
        .qa-np-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(var(--app-accent-rgb), 0.25);
        }
        .qa-np-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0.22;
          filter: blur(0px);
        }
        .qa-np-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(4,20,8,0.55) 0%, rgba(4,20,8,0.85) 100%);
        }
        .qa-np-content {
          position: relative;
          z-index: 2;
          padding: 10px 12px 12px;
        }
        .qa-np-grid {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          overflow: hidden;
          opacity: 0.18;
        }

        /* ── Play btn in card ── */
        .qa-np-play-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, var(--app-accent-strong), var(--app-accent));
          color: #041307;
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.15s;
          animation: qaGlow 2.5s ease-in-out infinite;
        }
        .qa-np-play-btn:hover { transform: scale(1.1) }
      `}</style>

      {/* Mobile overlay */}
      <div
        className={`qa-mob-overlay${sidebarOpen ? " visible" : ""}`}
        onClick={onClose}
      />

      <div className={`qa-nav-sidebar${sidebarOpen ? " open" : ""}`}>

        {/* Logo + username */}
        <div className="qa-sidebar-logo">
          <img
            src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
            alt="QalbAudio"
            onClick={() => goTo("/")}
            style={{ height: 52, width: "auto", maxWidth: "85%", objectFit: "contain", cursor: "pointer", display: "block" }}
          />
          <div style={{ fontSize: 10.5, color: "var(--app-text-muted)", textAlign: "center" }}>
            <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
          </div>
        </div>

        {/* Scrollable nav area */}
        <nav style={{ flex: 1, padding: "10px 8px 6px", overflowY: "auto", position: "relative", zIndex: 1 }}>

          <div className="qa-nav-section-label">Menu</div>

          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              className={`qa-nav-item${activeId === item.id ? " active" : ""}`}
              onClick={() => goTo(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}

          <hr className="qa-nav-divider" />

          <div className="qa-nav-section-label">Library</div>

          {NAV_BOTTOM.map(item => (
            <div
              key={item.id}
              className={`qa-nav-item${activeId === item.id ? " active" : ""}${item.accent && activeId !== item.id ? " upload-item" : ""}`}
              onClick={() => goTo(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        {/* ── Now Playing Card at bottom ── */}
        <NowPlayingCard currentSong={currentSong} isPlaying={isPlaying} togglePlay={togglePlay} />

      </div>
    </>
  )
}

function NowPlayingCard({ currentSong, isPlaying, togglePlay }) {
  const BG = "https://i.postimg.cc/Zn7K81b5/Chat-GPT-Image-May-31-2026-05-18-46-PM.png"

  return (
    <div className="qa-np-card" style={{ minHeight: currentSong ? 110 : 90 }}>
      {/* Mosque background */}
      <div className="qa-np-bg" style={{ backgroundImage: `url(${currentSong?.cover_url || BG})` }} />

      {/* Grid dot overlay */}
      <div className="qa-np-grid">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="npgrid" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--app-accent)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#npgrid)" />
        </svg>
      </div>

      <div className="qa-np-overlay" />

      <div className="qa-np-content">
        {currentSong ? (
          <>
            {/* Song info row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {/* Cover */}
              <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: "rgba(0,0,0,0.4)", flexShrink: 0, border: "1px solid rgba(var(--app-accent-rgb),0.3)" }}>
                {currentSong.cover_url
                  ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎵</div>
                }
              </div>
              {/* Title */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'DM Sans',sans-serif" }}>{currentSong.name}</div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentSong.artist}</div>
              </div>
              {/* Play/pause */}
              <button className="qa-np-play-btn" onClick={e => { e.stopPropagation(); togglePlay?.() }}>
                {isPlaying ? "⏸" : "▶"}
              </button>
            </div>
            {/* Waveform */}
            <MiniWaveform isPlaying={isPlaying} />
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(var(--app-accent-rgb),0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, border: "1px solid rgba(var(--app-accent-rgb),0.25)" }}>🎵</div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>QalbAudio</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9.5 }}>Sound of Soul</div>
              </div>
            </div>
            <MiniWaveform isPlaying={false} />
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9.5, marginTop: 6, fontFamily: "'DM Sans',sans-serif" }}>Pick a song to play</div>
          </>
        )}
      </div>
    </div>
  )
}

export function HamburgerBtn({ onClick }) {
  return (
    <button className="qa-hamburger" onClick={onClick}>☰</button>
  )
}