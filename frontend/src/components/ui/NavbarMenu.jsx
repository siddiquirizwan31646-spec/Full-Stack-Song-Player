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
  const openSidebar  = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)
  const toggleSidebar = () => setSidebarOpen(v => !v)
  return { sidebarOpen, openSidebar, closeSidebar, toggleSidebar }
}

export default function NavbarMenu({ sidebarOpen, onClose }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useUser()
  const displayName = user?.username || "Guest"

  const activeId = [...NAV_ITEMS, ...NAV_BOTTOM]
    .find(i => i.path === location.pathname)?.id || "home"

  const goTo = (path) => { navigate(path); onClose?.() }

  return (
    <>
      <style>{`
        .qa-nav-sidebar{width:216px;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),0.1);display:flex;flex-direction:column;flex-shrink:0;transition:transform 0.28s cubic-bezier(.4,0,.2,1)}
        @media(max-width:768px){
          .qa-nav-sidebar{position:fixed;left:0;top:0;bottom:0;z-index:200;width:250px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,0.6)}
          .qa-nav-sidebar.open{transform:translateX(0)}
        }
        .qa-mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;backdrop-filter:blur(3px)}
        @media(max-width:768px){.qa-mob-overlay.visible{display:block}}
        .qa-nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:3px;font-size:13px;font-weight:500;color:var(--app-text-muted);border-left:3px solid transparent;transition:all 0.18s}
        .qa-nav-item:hover{background:var(--app-surface);color:var(--app-text-main)}
        .qa-nav-item.active{background:rgba(var(--app-accent-rgb),0.12);border-left-color:var(--app-accent);color:var(--app-accent);font-weight:700}
        .qa-hamburger{display:none;background:none;border:none;color:var(--app-text-main);font-size:20px;cursor:pointer;padding:6px 8px;border-radius:8px;flex-shrink:0;line-height:1;transition:background 0.15s}
        .qa-hamburger:hover{background:var(--app-surface)}
        @media(max-width:768px){.qa-hamburger{display:flex;align-items:center;justify-content:center}}
      `}</style>

      <div
        className={`qa-mob-overlay${sidebarOpen ? " visible" : ""}`}
        onClick={onClose}
      />

      <div className={`qa-nav-sidebar${sidebarOpen ? " open" : ""}`}>
        <div style={{
          padding: "14px 12px 10px",
          borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <img
            src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
            alt="QalbAudio"
            onClick={() => goTo("/")}
            style={{ height: 60, width: "auto", maxWidth: "88%", objectFit: "contain", cursor: "pointer", display: "block" }}
          />
          <div style={{ fontSize: 11, color: "var(--app-text-muted)", textAlign: "center" }}>
            <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              className={`qa-nav-item${activeId === item.id ? " active" : ""}`}
              onClick={() => goTo(item.path)}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />

          {NAV_BOTTOM.map(item => (
            <div
              key={item.id}
              className={`qa-nav-item${activeId === item.id ? " active" : ""}`}
              style={{ color: item.id === "upload" && activeId !== item.id ? "var(--app-accent)" : undefined }}
              onClick={() => goTo(item.path)}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}

export function HamburgerBtn({ onClick }) {
  return (
    <button className="qa-hamburger" onClick={onClick}>☰</button>
  )
}