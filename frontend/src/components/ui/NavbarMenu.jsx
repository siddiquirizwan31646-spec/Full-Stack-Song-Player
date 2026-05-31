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

const MiniWaveform = ({ isPlaying }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 20, width: "100%" }}>
    {Array.from({ length: 20 }).map((_, i) => {
      const baseH = 4 + Math.sin(i * 0.75) * 7 + ((i * 3) % 5)
      return (
        <div key={i} style={{
          flex: 1,
          height: baseH,
          background: `rgba(var(--app-accent-rgb),${isPlaying ? 0.85 : 0.3})`,
          borderRadius: 2,
          animation: isPlaying
            ? `qaWave ${0.45 + (i % 5) * 0.12}s ease-in-out infinite alternate`
            : "none",
          animationDelay: `${i * 0.04}s`,
          transition: "background 0.4s",
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

  const { currentSong, isPlaying, togglePlay } = usePersistentSongPlayer([])

  const activeId = [...NAV_ITEMS, ...NAV_BOTTOM]
    .find(i => i.path === location.pathname)?.id || "home"

  const goTo = (path) => { navigate(path); onClose?.() }

  return (
    <>
      <style>{`
        @keyframes qaWave { from { transform: scaleY(0.3) } to { transform: scaleY(1) } }
        @keyframes qaGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(var(--app-accent-rgb),0.3)} 50%{box-shadow:0 0 0 6px rgba(var(--app-accent-rgb),0)} }
        @keyframes qaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }

        /* ── Sidebar shell — FIXED full height always ── */
        .qa-nav-sidebar {
          width: 210px;
          background: var(--app-shell-bg-alt);
          border-right: 1px solid rgba(var(--app-accent-rgb), 0.12);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(.4,0,.2,1);
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 200;
        }

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

        /* ── Mobile: hidden by default, slides in ── */
        @media(max-width:768px){
          .qa-nav-sidebar {
            width: 240px;
            transform: translateX(-100%);
            box-shadow: 4px 0 40px rgba(0,0,0,0.6);
            z-index: 300;
          }
          .qa-nav-sidebar.open { transform: translateX(0) }
        }

        /* Desktop: always visible, push content right via margin on host */
        @media(min-width:769px){
          .qa-nav-sidebar {
            transform: translateX(0) !important;
          }
        }

        /* ── Overlay ── */
        .qa-mob-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 299;
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

        .qa-nav-item.upload-item {
          color: var(--app-accent);
          font-weight: 700;
        }
        .qa-nav-item.upload-item .nav-icon {
          color: var(--app-accent);
          font-size: 17px;
        }

        /* ── Sidebar logo/brand area at top ── */
        .qa-sidebar-brand {
          padding: 12px 12px 10px;
          border-bottom: 1px solid rgba(var(--app-accent-rgb), 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }

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

        .qa-nav-divider {
          margin: 6px 10px;
          border: none;
          border-top: 1px solid rgba(var(--app-accent-rgb), 0.08);
        }

        /* ── Hamburger btn (shown on mobile) ── */
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

        /* ── Now Playing card ── */
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

        {/* Brand / Logo at top of sidebar — replaces navbar brand on the left */}
        <div className="qa-sidebar-brand">
          <img
            src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
            alt="QalbAudio"
            onClick={() => goTo("/")}
            style={{ height: 60, width: "auto", maxWidth: "88%", objectFit: "contain", cursor: "pointer", display: "block" }}
          />
          <div style={{ fontSize: 10.5, color: "var(--app-text-muted)", textAlign: "center" }}>
            <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
          </div>
        </div>

        {/* Scrollable nav area — Menu items only */}
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
        </nav>

        {/* ── BOTTOM CARD: Library + Now Playing all in one ── */}
        <BottomCard
          navBottom={NAV_BOTTOM}
          activeId={activeId}
          goTo={goTo}
          currentSong={currentSong}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
        />

      </div>
    </>
  )
}
function BottomCard({ navBottom, activeId, goTo, currentSong, isPlaying }) {
  const MOSQUE_BG = "https://i.postimg.cc/pVSDtTMz/Chat-GPT-Image-May-31-2026-06-11-31-PM.png"
  const bgImage = currentSong?.cover_url ? currentSong.cover_url : MOSQUE_BG

  return (
    <div style={{
      margin: "6px 10px 10px",
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid rgba(var(--app-accent-rgb), 0.22)",
      position: "relative",
      flexShrink: 0,
    }}>
      {/* Background image */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }} />

      {/* Grid mesh */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(74,222,128,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(74,222,128,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "16px 16px",
      }} />

      {/* Dark overlay — heavier at bottom */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        background: "linear-gradient(180deg, rgba(2,8,4,0.82) 0%, rgba(2,8,4,0.75) 60%, rgba(2,8,4,0.88) 100%)",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 3 }}>

        {/* Library label */}
        <div style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
          padding: "10px 14px 4px",
        }}>Library</div>

        {/* Library nav items */}
        {navBottom.map(item => (
          <div
            key={item.id}
            onClick={() => goTo(item.path)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 13, fontWeight: activeId === item.id ? 700 : 500,
              color: activeId === item.id
                ? "var(--app-accent)"
                : item.accent
                ? "var(--app-accent)"
                : "rgba(255,255,255,0.75)",
              borderLeft: `3px solid ${activeId === item.id ? "var(--app-accent)" : "transparent"}`,
              background: activeId === item.id ? "rgba(var(--app-accent-rgb),0.12)" : "transparent",
              transition: "all 0.18s",
            }}
            onMouseEnter={e => { if (activeId !== item.id) e.currentTarget.style.background = "rgba(var(--app-accent-rgb),0.08)" }}
            onMouseLeave={e => { if (activeId !== item.id) e.currentTarget.style.background = "transparent" }}
          >
            <span style={{ fontSize: 15, width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {item.icon}
            </span>
            {item.label}
          </div>
        ))}

        {/* Divider */}
        <div style={{ margin: "6px 12px", borderTop: "1px solid rgba(var(--app-accent-rgb),0.12)" }} />

        {/* Now Playing row */}
        <div style={{ padding: "8px 12px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
            {/* Thumbnail */}
            <div style={{
              width: 38, height: 38, borderRadius: 9, overflow: "hidden", flexShrink: 0,
              border: "1px solid rgba(var(--app-accent-rgb),0.35)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.7)",
              background: "rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {currentSong?.cover_url
                ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ fontSize: 16 }}>🎵</div>
              }
            </div>

            {/* Title + artist */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: "#fff", fontWeight: 700, fontSize: 12,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                textShadow: "0 1px 6px rgba(0,0,0,0.9)",
              }}>
                {currentSong?.name || "QalbAudio"}
              </div>
              <div style={{
                color: "rgba(255,255,255,0.5)", fontSize: 10.5, marginTop: 2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {currentSong?.artist || "Pick a song to play"}
              </div>
            </div>

            {/* Heart */}
            <button
              onClick={e => e.stopPropagation()}
              style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--app-accent-strong), var(--app-accent))",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 12px rgba(var(--app-accent-rgb),0.55)",
                fontSize: 12, color: "#041307", transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >♥</button>
          </div>

          {/* Waveform */}
          <MiniWaveform isPlaying={isPlaying} />
        </div>
      </div>
    </div>
  )
}
function NowPlayingCard({ currentSong, isPlaying, togglePlay }) {
  const MOSQUE_BG = "https://i.postimg.cc/pVSDtTMz/Chat-GPT-Image-May-31-2026-06-11-31-PM.png"
  const bgImage = currentSong?.cover_url || MOSQUE_BG

  return (
    <div className="qa-np-card" style={{ minHeight: 100, borderRadius: 16 }}>

      {/* Full background image — high opacity */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: 16,
      }} />

      {/* Grid mesh */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", borderRadius: 16,
        backgroundImage: `
          linear-gradient(rgba(74,222,128,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(74,222,128,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "16px 16px",
      }} />

      {/* Dark overlay — heavier at bottom so text is readable */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, borderRadius: 16,
        background: "linear-gradient(180deg, rgba(2,6,3,0.45) 0%, rgba(2,6,3,0.72) 55%, rgba(2,6,3,0.94) 100%)",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 3, padding: "10px 12px 12px" }}>

        {/* Song info row */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>

          {/* Cover thumbnail */}
          <div style={{
            width: 38, height: 38, borderRadius: 9, overflow: "hidden", flexShrink: 0,
            border: "1px solid rgba(var(--app-accent-rgb),0.35)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.7)",
            background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {currentSong?.cover_url
              ? <img src={currentSong.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ fontSize: 16 }}>🎵</div>
            }
          </div>

          {/* Title + artist */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: "#fff", fontWeight: 700, fontSize: 12,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              fontFamily: "'DM Sans',sans-serif",
              textShadow: "0 1px 6px rgba(0,0,0,0.9)",
            }}>
              {currentSong?.name || "QalbAudio"}
            </div>
            <div style={{
              color: "rgba(255,255,255,0.55)", fontSize: 10.5, marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              fontFamily: "'DM Sans',sans-serif",
            }}>
              {currentSong?.artist || "Pick a song to play"}
            </div>
          </div>

          {/* Heart button */}
          <button
            onClick={e => e.stopPropagation()}
            style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, var(--app-accent-strong), var(--app-accent))",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 12px rgba(var(--app-accent-rgb),0.55)",
              fontSize: 12, color: "#041307",
              transition: "transform 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.12)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >♥</button>
        </div>

        {/* Waveform */}
        <MiniWaveform isPlaying={isPlaying} />
      </div>
    </div>
  )
}
export function HamburgerBtn({ onClick }) {
  return (
    <button className="qa-hamburger" onClick={onClick}>☰</button>
  )
}