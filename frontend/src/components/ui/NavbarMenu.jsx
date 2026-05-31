import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useUser } from "@/context/userContext"

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
  { icon: "⬆", label: "Upload Audio", id: "upload",    path: "/upload" },
  { icon: "♡", label: "Favorites",    id: "favorites", path: "/favorites" },
  { icon: "⚙", label: "Settings",     id: "settings",  path: "/settings" },
]

export function useNavbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const openSidebar   = () => setSidebarOpen(true)
  const closeSidebar  = () => setSidebarOpen(false)
  const toggleSidebar = () => setSidebarOpen(v => !v)
  return { sidebarOpen, openSidebar, closeSidebar, toggleSidebar }
}

export default function NavbarMenu({ sidebarOpen, onClose }) {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { user }    = useUser()
  const displayName = user?.username || "Guest"

  const activeId = [...NAV_ITEMS, ...NAV_BOTTOM]
    .find(i => i.path === location.pathname)?.id || "home"

  const goTo = (path) => { navigate(path); onClose?.() }

  return (
    <>
      <style>{`
        /* ── Sidebar shell ── */
        .qa-nav-sidebar{
          width:200px;
          background:var(--app-shell-bg-alt);
          border-right:1px solid rgba(var(--app-accent-rgb),0.1);
          display:flex;flex-direction:column;flex-shrink:0;
          transition:transform 0.28s cubic-bezier(.4,0,.2,1);
          overflow:hidden;
        }

        /* ── Mobile: slide in from left ── */
        @media(max-width:768px){
          .qa-nav-sidebar{
            position:fixed;left:0;top:0;bottom:0;z-index:200;
            width:240px;transform:translateX(-100%);
            box-shadow:4px 0 40px rgba(0,0,0,0.6);
          }
          .qa-nav-sidebar.open{ transform:translateX(0) }
        }

        /* ── Overlay ── */
        .qa-mob-overlay{
          display:none;position:fixed;inset:0;
          background:rgba(0,0,0,0.6);z-index:199;
          backdrop-filter:blur(3px);
        }
        @media(max-width:768px){ .qa-mob-overlay.visible{ display:block } }

        /* ── Nav item ── */
        .qa-nav-item{
          display:flex;align-items:center;gap:11px;
          padding:9px 12px;border-radius:10px;cursor:pointer;
          margin-bottom:2px;font-size:13px;font-weight:500;
          color:var(--app-text-muted);border-left:3px solid transparent;
          transition:all 0.18s;
        }
        .qa-nav-item:hover{
          background:var(--app-surface);
          color:var(--app-text-main);
        }
        .qa-nav-item.active{
          background:rgba(var(--app-accent-rgb),0.12);
          border-left-color:var(--app-accent);
          color:var(--app-accent);
          font-weight:700;
        }
        .qa-nav-item .nav-icon{
          font-size:16px;flex-shrink:0;width:22px;
          display:flex;align-items:center;justify-content:center;
        }

        /* ── Hamburger btn ── */
        .qa-hamburger{
          display:none;background:none;border:none;
          color:var(--app-text-main);font-size:20px;cursor:pointer;
          padding:6px 8px;border-radius:8px;flex-shrink:0;
          line-height:1;transition:background 0.15s;
        }
        .qa-hamburger:hover{ background:var(--app-surface) }
        @media(max-width:768px){
          .qa-hamburger{ display:flex;align-items:center;justify-content:center }
        }

        /* ── Sidebar logo area ── */
        .qa-sidebar-logo{
          padding:14px 12px 10px;
          border-bottom:1px solid rgba(var(--app-accent-rgb),0.08);
          display:flex;flex-direction:column;align-items:center;gap:4px;
        }

        /* ── Section divider ── */
        .qa-nav-divider{
          margin:8px 10px;
          border:none;border-top:1px solid rgba(var(--app-accent-rgb),0.08);
        }

        /* ── Section label ── */
        .qa-nav-section-label{
          font-size:10px;font-weight:700;letter-spacing:0.1em;
          color:var(--app-text-muted);text-transform:uppercase;
          padding:6px 14px 4px;
        }

        /* ── Upload item special style ── */
        .qa-nav-item.upload-item{
          background:rgba(var(--app-accent-rgb),0.06);
          border:1px solid rgba(var(--app-accent-rgb),0.15);
          color:var(--app-accent);
          margin-top:4px;
        }
        .qa-nav-item.upload-item:hover{
          background:rgba(var(--app-accent-rgb),0.14);
          border-color:rgba(var(--app-accent-rgb),0.3);
        }
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
            style={{
              height: 56, width: "auto", maxWidth: "85%",
              objectFit: "contain", cursor: "pointer", display: "block",
            }}
          />
          <div style={{ fontSize: 11, color: "var(--app-text-muted)", textAlign: "center" }}>
            <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
          </div>
        </div>

        {/* Main nav */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>

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
              className={`qa-nav-item${
                activeId === item.id ? " active" : ""
              }${item.id === "upload" && activeId !== item.id ? " upload-item" : ""}`}
              onClick={() => goTo(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        {/* Bottom version tag */}
        <div style={{
          padding: "10px 14px",
          borderTop: "1px solid rgba(var(--app-accent-rgb),0.08)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, flexShrink: 0,
          }}>🎵</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--app-text-main)" }}>QalbAudio</div>
            <div style={{ fontSize: 10, color: "var(--app-text-muted)" }}>Sound of Soul</div>
          </div>
        </div>
      </div>
    </>
  )
}

export function HamburgerBtn({ onClick }) {
  return (
    <button className="qa-hamburger" onClick={onClick}>☰</button>
  )
}