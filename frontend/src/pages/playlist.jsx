import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Download, ListMusic, Music2, Pause, Play, Repeat2,
  SkipBack, SkipForward, Trash2, Volume2, Plus, X
} from "lucide-react";
import { toast } from "sonner";
import DashboardNavbar from "@/components/DashboardNavbar";
import FavoriteButton from "@/components/FavoriteButton";
import { useUser } from "@/context/userContext";
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer";

import { API_URL } from "@/lib/config";

const fmt = (s) =>
  !s || isNaN(s) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const getAuthHeaders = (includeContentType = true) => {
  const headers = {};
  const token = localStorage.getItem("accessToken");
  if (includeContentType) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const mapPlaylistSong = (song) => ({
  id: song.songId,
  name: song.songName,
  artist: song.artist || "",
  cover_url: song.cover_url || "",
  mp3_url: song.mp3_url || "",
  duration: song.duration || 0,
  addedAt: song.addedAt,
});

const NAV_ITEMS = [
  { icon: "🏠", label: "Home",      id: "home",      path: "/hero" },
  { icon: "🔍", label: "Explore",   id: "explore",   path: "/explore" },
  { icon: "📖", label: "Quran",     id: "quran",     path: "/quran" },
  { icon: "🎵", label: "Nasheed",   id: "nasheed",   path: "/nasheed" },
  { icon: "🎤", label: "Naat",      id: "naat",      path: "/naat" },
  { icon: "🎼", label: "Qawwali",   id: "qawwali",   path: "/qawwali" },
  { icon: "🎙", label: "Podcasts",  id: "podcasts",  path: "/podcasts" },
  { icon: "📋", label: "Playlists", id: "playlists", path: "/playlists" },
];
const NAV_BOTTOM = [
  { icon: "⬆", label: "Upload Audio", id: "upload",    path: "/upload" },
  { icon: "♡", label: "Favorites",    id: "favorites", path: "/favorites" },
  { icon: "⚙", label: "Settings",    id: "settings",  path: "/settings" },
];

/* ─── helpers ─── */
const Artwork = ({ src, size = 44, radius = 10, iconSize = 18 }) => (
  <div style={{
    width: size, height: size, borderRadius: radius, overflow: "hidden", flexShrink: 0,
    background: "linear-gradient(135deg,rgba(var(--app-accent-rgb),.14),var(--app-surface))",
    border: "1px solid rgba(var(--app-accent-rgb),.14)",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    {src
      ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      : <Music2 size={iconSize} color="var(--app-accent)" strokeWidth={1.6} />}
  </div>
);

const Waveform = ({ active }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 2.5, height: 24 }}>
    {Array.from({ length: 20 }).map((_, i) => {
      const base = [5, 9, 13, 7, 11, 16, 8][i % 7];
      return (
        <span key={i} style={{
          width: 3, height: base, borderRadius: 99,
          background: active ? "var(--app-accent)" : "rgba(var(--app-accent-rgb),.25)",
          opacity: active ? 0.55 + (i % 4) * 0.12 : 0.65,
          animation: active ? `qaWave ${0.65 + (i % 5) * 0.14}s ease-in-out infinite alternate` : "none",
          animationDelay: `${i * 0.045}s`,
          transformOrigin: "center", transition: "background 0.3s",
        }} />
      );
    })}
  </div>
);
const MiniWave = ({ isPlaying }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 3, height: "100%", background: "var(--app-accent)", borderRadius: 2,
        animation: isPlaying ? `qaWave ${0.5 + i * 0.15}s ease-in-out infinite alternate` : "none",
        animationDelay: `${i * 0.1}s`, opacity: isPlaying ? 1 : 0.4,
      }} />
    ))}
  </div>
);
const SeekSlider = ({ min = 0, max, value, onChange, style }) => (
  <input type="range" min={min} max={max || 0} value={value} onChange={onChange}
    style={{
      WebkitAppearance: "none", appearance: "none",
      height: 4, borderRadius: 2, outline: "none", cursor: "pointer",
      background: `linear-gradient(to right,var(--app-accent) ${max ? (value / max) * 100 : 0}%,rgba(var(--app-accent-rgb),.18) 0%)`,
      ...style,
    }}
  />
);

/* ════════════════════════════════════════════════════════════════ */
export default function PlaylistPage() {
  const { user, setUser, loading } = useUser();
  const navigate  = useNavigate();
  const location  = useLocation();

  const displayName = user?.username || "Guest";

  // derive active nav from current path — never hardcode
  const activeNav = [...NAV_ITEMS, ...NAV_BOTTOM]
    .find(i => i.path === location.pathname)?.id || "playlists";

  const [playlists,        setPlaylists]        = useState([]);
  const [selectedId,       setSelectedId]       = useState(null);
  const [showCreate,       setShowCreate]       = useState(false);
  const [newName,          setNewName]          = useState("");
  const [creating,         setCreating]         = useState(false);
  const [removing,         setRemoving]         = useState(null);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  // two independent mobile drawers — exactly like hero
  const [sidebarOpen,  setSidebarOpen]  = useState(false); // main nav
  const [playlistOpen, setPlaylistOpen] = useState(false); // playlist panel

  const selected = playlists.find(p => p._id === selectedId) || null;
  const songs    = (selected?.songs || []).map(mapPlaylistSong);
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    progressPct,
    playSongFromList,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    setVolume,
    resetPlayer,
  } = usePersistentSongPlayer(songs);

  const goTo = useCallback((path) => {
    setSidebarOpen(false);
    setPlaylistOpen(false);
    navigate(path);
  }, [navigate]);

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    toast.error("Please login to manage your playlists");
    navigate("/login", { replace: true });
  }, [navigate, setUser]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    let ignore = false;
    const load = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) { handleUnauthorized(); return; }
      try {
        setLoadingPlaylists(true);
        const res  = await fetch(`${API_URL}/playlists`, { headers: getAuthHeaders(false) });
        if (res.status === 401 || res.status === 400) { handleUnauthorized(); return; }
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load playlists");
        if (ignore) return;
        setPlaylists(data.playlists);
        setSelectedId(cur =>
          data.playlists.some(p => p._id === cur) ? cur : data.playlists[0]?._id || null
        );
      } catch (e) {
        if (!ignore) toast.error(e.message || "Unable to load playlists");
      } finally {
        if (!ignore) setLoadingPlaylists(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [handleUnauthorized, loading, navigate, user]);

  const createPlaylist = async () => {
    if (!newName.trim()) { toast.error("Enter a playlist name"); return; }
    try {
      setCreating(true);
      const res  = await fetch(`${API_URL}/playlists`, {
        method: "POST", headers: getAuthHeaders(),
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.status === 401 || res.status === 400) { handleUnauthorized(); return; }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setPlaylists(prev => [data.playlist, ...prev]);
      setSelectedId(data.playlist._id);
      setNewName(""); setShowCreate(false);
      toast.success("Playlist created");
    } catch (e) { toast.error(e.message || "Unable to create"); }
    finally { setCreating(false); }
  };

  const deletePlaylist = async (pl) => {
    try {
      const res  = await fetch(`${API_URL}/playlists/${pl._id}`, { method: "DELETE", headers: getAuthHeaders(false) });
      if (res.status === 401 || res.status === 400) { handleUnauthorized(); return; }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setPlaylists(prev => {
        const rest = prev.filter(p => p._id !== pl._id);
        if (selectedId === pl._id) setSelectedId(rest[0]?._id || null);
        return rest;
      });
      if (selectedId === pl._id) {
        resetPlayer();
      }
      toast.success("Playlist deleted");
    } catch (e) { toast.error(e.message || "Unable to delete"); }
  };
const iconBtn = {
  background: "none",
  border: "none",
  color: "var(--app-text-muted)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all .15s",
};
  const removeSong = async (song) => {
    if (!selected) return;
    try {
      setRemoving(song.id);
      const res  = await fetch(`${API_URL}/playlists/${selected._id}/songs/${song.id}`, {
        method: "DELETE", headers: getAuthHeaders(false),
      });
      if (res.status === 401 || res.status === 400) { handleUnauthorized(); return; }
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");
      setPlaylists(prev => prev.map(pl => {
        if (pl._id !== selected._id) return pl;
        return { ...pl, songs: (pl.songs || []).filter(s => String(s.songId) !== String(song.id)) };
      }));
      if (currentSong?.id === song.id) {
        resetPlayer();
      }
      toast.success("Song removed");
    } catch (e) { toast.error(e.message || "Unable to remove"); }
    finally { setRemoving(null); }
  };

  if (loading || !user) return null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100dvh",
      background: "var(--app-shell-bg)", color: "var(--app-text-main)",
      fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),.2);border-radius:2px}
        .song-row:hover{background:rgba(var(--app-accent-rgb),.055)!important}
        .nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:3px;font-size:13px;font-weight:500;color:var(--app-text-muted);border-left:3px solid transparent;transition:all 0.18s}
        .nav-item:hover{background:var(--app-surface);color:var(--app-text-main)}
        .nav-item.active{background:rgba(var(--app-accent-rgb),0.12);border-left-color:var(--app-accent);color:var(--app-accent);font-weight:700}
        .pl-item:hover{background:rgba(var(--app-accent-rgb),.07)!important}
        input[type=range]{-webkit-appearance:none;appearance:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:var(--app-accent);cursor:pointer}
        input[type=range]::-moz-range-thumb{width:13px;height:13px;border:none;border-radius:50%;background:var(--app-accent);cursor:pointer}
        .pl-delete:hover{color:#ef4444!important}

        /* ── sidebar: desktop always visible ── */
        .sidebar{width:216px;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),.1);display:flex;flex-direction:column;flex-shrink:0;transition:transform .28s cubic-bezier(.4,0,.2,1)}

        /* ── playlist panel: desktop always visible ── */
        .playlist-panel{width:236px;flex-shrink:0;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),.08);display:flex;flex-direction:column;overflow:hidden;transition:transform .28s cubic-bezier(.4,0,.2,1)}

        /* ── hamburger: hidden on desktop ── */
        .hamburger{display:none;background:none;border:none;color:var(--app-text-main);font-size:20px;cursor:pointer;padding:6px 8px;border-radius:8px;flex-shrink:0;line-height:1;transition:background .15s}
        .hamburger:hover{background:var(--app-surface)}

        /* ── playlist-open btn: hidden on desktop ── */
        .pl-open-btn{display:none!important}

        /* ── overlays ── */
        .mob-overlay{display:none;position:fixed;inset:0;backdrop-filter:blur(3px)}
        @media(max-width:768px){
          /* nav sidebar → fixed left drawer */
          .sidebar{position:fixed;left:0;top:0;bottom:0;z-index:210;width:250px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,.6)}
          .sidebar.open{transform:translateX(0)}
          /* playlist panel → fixed left drawer (slightly wider, higher z) */
          .playlist-panel{position:fixed;left:0;top:0;bottom:0;z-index:220;width:280px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,.5)}
          .playlist-panel.open{transform:translateX(0)}
          /* show buttons */
          .hamburger{display:flex;align-items:center;justify-content:center}
          .pl-open-btn{display:flex!important}
          /* overlays */
          .mob-overlay-nav{display:block;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:205;backdrop-filter:blur(3px)}
          .mob-overlay-pl{display:block;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:215;backdrop-filter:blur(3px)}
        }

        @keyframes qaWave{from{transform:scaleY(.45);opacity:.4}to{transform:scaleY(1.1);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>

      <DashboardNavbar />

      {/* ── mobile overlays ── */}
      {sidebarOpen  && <div className="mob-overlay-nav" onClick={() => setSidebarOpen(false)} />}
      {playlistOpen && <div className="mob-overlay-pl"  onClick={() => setPlaylistOpen(false)} />}

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ══ NAV SIDEBAR ══ */}
        <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
          {/* Logo */}
          <div style={{
            padding: "14px 12px 10px",
            borderBottom: "1px solid rgba(var(--app-accent-rgb),.08)",
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
              <div key={item.id}
                className={`nav-item${activeNav === item.id ? " active" : ""}`}
                onClick={() => goTo(item.path)}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />
            {NAV_BOTTOM.map(item => (
              <div key={item.id}
                className={`nav-item${activeNav === item.id ? " active" : ""}`}
                style={{ color: item.id === "upload" && activeNav !== item.id ? "var(--app-accent)" : undefined }}
                onClick={() => goTo(item.path)}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* ══ PLAYLIST PANEL ══ */}
        <div className={`playlist-panel${playlistOpen ? " open" : ""}`}>

          {/* header */}
          <div style={{
            padding: "14px 12px 10px",
            borderBottom: "1px solid rgba(var(--app-accent-rgb),.08)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--app-text-main)" }}>My Playlists</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setShowCreate(v => !v)} title="New playlist"
                style={{
                  width: 26, height: 26, borderRadius: 7,
                  border: "1px solid rgba(var(--app-accent-rgb),.28)",
                  background: "rgba(var(--app-accent-rgb),.1)", color: "var(--app-accent)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                <Plus size={14} strokeWidth={2.5} />
              </button>
              {/* close button — only visible on mobile */}
              <button onClick={() => setPlaylistOpen(false)}
                className="pl-open-btn"
                style={{
                  width: 26, height: 26, borderRadius: 7, border: "none",
                  background: "transparent", color: "var(--app-text-muted)",
                  cursor: "pointer", alignItems: "center", justifyContent: "center",
                }}>
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* create form */}
          {showCreate && (
            <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(var(--app-accent-rgb),.06)", animation: "fadeUp .2s" }}>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createPlaylist()}
                placeholder="Playlist name…" autoFocus
                style={{
                  width: "100%", padding: "8px 10px", fontSize: 12, borderRadius: 8,
                  border: "1px solid rgba(var(--app-accent-rgb),.25)",
                  background: "var(--app-surface)", color: "var(--app-text-main)",
                  outline: "none", fontFamily: "'DM Sans',sans-serif",
                }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                <button onClick={createPlaylist} disabled={creating}
                  style={{
                    flex: 1, padding: "6px 0", borderRadius: 7, border: "none",
                    background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                    color: "#000", fontWeight: 700, fontSize: 11.5, cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                  }}>
                  {creating ? "Creating…" : "Create"}
                </button>
                <button onClick={() => { setShowCreate(false); setNewName(""); }}
                  style={{
                    padding: "6px 10px", borderRadius: 7, border: "none",
                    background: "var(--app-surface)", color: "var(--app-text-muted)",
                    fontSize: 11.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 6px" }}>
            {loadingPlaylists ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--app-text-muted)", fontSize: 12 }}>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite", marginBottom: 8 }}>⟳</span><br />
                Loading playlists…
              </div>
            ) : playlists.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--app-text-muted)", fontSize: 12, lineHeight: 1.7 }}>
                No playlists yet.<br />Tap + to create one.
              </div>
            ) : playlists.map(pl => {
              const active = selectedId === pl._id;
              return (
                <div key={pl._id} className="pl-item"
                  onClick={() => { setSelectedId(pl._id); setPlaylistOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, padding: "9px 9px",
                    borderRadius: 10, cursor: "pointer", marginBottom: 2,
                    borderLeft: `3px solid ${active ? "var(--app-accent)" : "transparent"}`,
                    background: active ? "rgba(var(--app-accent-rgb),.1)" : "transparent",
                    transition: "background .15s, border-color .15s",
                  }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: "rgba(var(--app-accent-rgb),.08)",
                    border: "1px solid rgba(var(--app-accent-rgb),.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ListMusic size={15} color="var(--app-accent)" strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 12.5,
                      color: active ? "var(--app-accent)" : "var(--app-text-main)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>{pl.name}</div>
                    <div style={{ fontSize: 10.5, color: "var(--app-text-muted)", marginTop: 1 }}>
                      {(pl.songs?.length || 0)} songs
                    </div>
                  </div>
                  <button className="pl-delete"
                    onClick={e => { e.stopPropagation(); deletePlaylist(pl); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--app-text-muted)", padding: 4, borderRadius: 5,
                      display: "flex", transition: "color .15s", flexShrink: 0,
                    }}>
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ MAIN CONTENT ══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Toolbar — mirrors hero page exactly */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            background: "var(--app-shell-bg-alt)",
            borderBottom: "1px solid rgba(var(--app-accent-rgb),.08)",
            flexShrink: 0,
          }}>
            {/* ☰ hamburger — opens main nav sidebar (mobile only) */}
            <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>

            {/* 📋 playlist panel button (mobile only) */}
            <button
              className="pl-open-btn"
              onClick={() => setPlaylistOpen(v => !v)}
              title="My Playlists"
              style={{
                display: "none", // CSS overrides to flex on mobile
                alignItems: "center", justifyContent: "center",
                gap: 5, padding: "6px 10px", borderRadius: 8, flexShrink: 0,
                border: "1px solid rgba(var(--app-accent-rgb),.25)",
                background: "rgba(var(--app-accent-rgb),.1)", color: "var(--app-accent)",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif",
              }}>
              <ListMusic size={13} strokeWidth={2} />
              Playlists
            </button>

            <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
              {selected ? selected.name : "Playlists"}
            </span>

            {selected && (
              <span style={{
                fontSize: 11, color: "var(--app-accent)", fontWeight: 600,
                padding: "2px 8px", borderRadius: 20, flexShrink: 0,
                background: "rgba(var(--app-accent-rgb),.12)",
                border: "1px solid rgba(var(--app-accent-rgb),.22)",
              }}>
                {songs.length}
              </span>
            )}

            <div style={{ flex: 1 }} />

            {selected && songs.length > 0 && (
              <button onClick={() => playSongFromList(songs[0])}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                  color: "#000", fontWeight: 700, fontSize: 12, flexShrink: 0,
                  fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 6,
                }}>
                <Play size={11} fill="#000" strokeWidth={0} /> Play All
              </button>
            )}
          </div>

          {/* Song list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 8px" }}>
            {!selected ? (
              <Empty
                icon={<ListMusic size={32} color="var(--app-accent)" strokeWidth={1.6} />}
                title="Select or create a playlist"
                sub="Tap Playlists in the toolbar to choose one"
                action={{ label: "Open Playlists", onClick: () => setPlaylistOpen(true) }}
              />
            ) : songs.length === 0 ? (
              <Empty
                icon={<Music2 size={32} color="var(--app-accent)" strokeWidth={1.6} />}
                title="This playlist is empty"
                sub="Go to Home and add songs using the + button"
                action={{ label: "Browse Songs", onClick: () => navigate("/hero") }}
              />
            ) : songs.map((song, idx) => {
  const active = currentSong?.id === song.id;
  return (
    <div
      key={song.id}
      className="song-row"
      onClick={() => playSongFromList(song)}
      style={{
        display: "grid",
        gridTemplateColumns: "28px 46px 1fr auto",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        cursor: "pointer",
        marginBottom: 3,
        borderLeft: `3px solid ${active ? "var(--app-accent)" : "transparent"}`,
        background: active
          ? "linear-gradient(90deg,rgba(var(--app-accent-rgb),.09),rgba(var(--app-accent-rgb),.03))"
          : "transparent",
        boxShadow: active ? "0 2px 12px rgba(var(--app-accent-rgb),.08)" : "none",
        transition: "background .18s, border-color .18s, box-shadow .18s",
        animation: `fadeUp .22s ${idx * 0.025}s both`,
      }}
    >
      {/* Col 1 — index / playing indicator */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 600, color: active ? "var(--app-accent)" : "var(--app-text-muted)",
        fontFamily: "monospace",
      }}>
        {active && isPlaying
          ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
              {[0,1,2].map(b => (
                <div key={b} style={{
                  width: 3, borderRadius: 2, background: "var(--app-accent)",
                  height: "100%",
                  animation: `qaWave ${0.5 + b * 0.15}s ease-in-out infinite alternate`,
                  animationDelay: `${b * 0.1}s`,
                }} />
              ))}
            </div>
          )
          : String(idx + 1).padStart(2, "0")}
      </div>

      {/* Col 2 — artwork */}
      <div style={{
        width: 46, height: 46, borderRadius: 10, overflow: "hidden", flexShrink: 0,
        background: "linear-gradient(135deg,rgba(var(--app-accent-rgb),.14),var(--app-surface))",
        border: `1px solid ${active ? "rgba(var(--app-accent-rgb),.35)" : "rgba(var(--app-accent-rgb),.14)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: active ? "0 0 0 2px rgba(var(--app-accent-rgb),.18)" : "none",
        transition: "border-color .18s, box-shadow .18s",
        position: "relative",
      }}>
        {song.cover_url
          ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Music2 size={18} color="var(--app-accent)" strokeWidth={1.6} />}
      </div>

      {/* Col 3 — title + artist + progress bar when active */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: 13,
          color: active ? "var(--app-accent)" : "var(--app-text-main)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          marginBottom: 2,
        }}>{song.name}</div>
        <div style={{
          fontSize: 11, color: "var(--app-text-muted)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{song.artist || "Unknown artist"}</div>
        {active && (
          <div style={{
            marginTop: 5, height: 2, borderRadius: 2,
            background: "rgba(var(--app-accent-rgb),.15)", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: "var(--app-accent)",
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              transition: "width .5s linear",
            }} />
          </div>
        )}
      </div>

      {/* Col 4 — duration + actions */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
      }}>
        {song.duration > 0 && (
          <span style={{
            fontSize: 11, color: "var(--app-text-muted)", fontFamily: "monospace",
            background: "rgba(var(--app-accent-rgb),.06)",
            padding: "2px 7px", borderRadius: 5,
          }}>
            {fmt(song.duration)}
          </span>
        )}
        <div onClick={e => e.stopPropagation()}>
          <FavoriteButton song={song} />
        </div>
        <button
          onClick={e => { e.stopPropagation(); removeSong(song); }}
          disabled={removing === song.id}
          style={{
            padding: "4px 10px", borderRadius: 7,
            border: "1px solid rgba(239,68,68,.2)",
            background: removing === song.id ? "rgba(239,68,68,.12)" : "rgba(239,68,68,.06)",
            color: "#ef4444", cursor: "pointer", fontSize: 11,
            fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
            transition: "background .15s",
          }}>
          {removing === song.id ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
})}
          </div>
        </div>
      </div>

      {/* ── PLAYER BAR ── */}
      <style>{`
        /* ── Premium Player Bar ── */
        .pbar-root {
          position: sticky;
          bottom: 0;
          z-index: 100;
          flex-shrink: 0;
          background: rgba(10, 10, 12, 0.82);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border-top: 1px solid rgba(var(--app-accent-rgb), 0.13);
          box-shadow: 0 -8px 40px rgba(0,0,0,0.45), 0 -1px 0 rgba(var(--app-accent-rgb),0.07);
          padding: 0 20px;
          height: 80px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          overflow: visible;
        }

        /* progress line */
        .pbar-prog-line {
          position: absolute;
          top: 0; left: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--app-accent-strong), var(--app-accent), rgba(var(--app-accent-rgb),.4));
          border-radius: 0 2px 2px 0;
          transition: width .35s linear;
          pointer-events: none;
        }

        /* LEFT — artwork + meta */
        .pbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          overflow: hidden;
        }
        .pbar-art-wrap {
          position: relative;
          width: 54px;
          height: 54px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(var(--app-accent-rgb),.18), rgba(var(--app-accent-rgb),.05));
          border: 1px solid rgba(var(--app-accent-rgb),.18);
          transition: box-shadow .3s;
        }
        .pbar-art-wrap.playing {
          box-shadow: 0 0 0 2px rgba(var(--app-accent-rgb),.35), 0 4px 20px rgba(var(--app-accent-rgb),.28);
        }
        .pbar-art-wrap img,
        .pbar-art-wrap .pbar-art-fallback {
          width: 100%; height: 100%; object-fit: cover;
          display: flex; align-items: center; justify-content: center; font-size: 22px;
        }
        .pbar-art-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,.38);
          display: flex; align-items: center; justify-content: center;
          border-radius: 12px;
        }
        .pbar-meta { min-width: 0; }
        .pbar-title {
          font-weight: 700; font-size: 13.5px;
          color: var(--app-text-main);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 160px;
          letter-spacing: -.01em;
        }
        .pbar-artist {
          font-size: 11px; color: var(--app-text-muted);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 160px;
          margin-top: 2px;
        }

        /* CENTER — controls + seek */
        .pbar-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          min-width: 0;
          flex-shrink: 0;
        }
        .pbar-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pbar-icon-btn {
          background: none; border: none; cursor: pointer;
          color: var(--app-text-muted);
          width: 34px; height: 34px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: color .15s, background .15s, transform .15s;
          flex-shrink: 0;
        }
        .pbar-icon-btn:hover {
          color: var(--app-text-main);
          background: rgba(var(--app-accent-rgb),.1);
          transform: scale(1.08);
        }
        .pbar-play-btn {
          width: 46px; height: 46px;
          border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--app-accent-strong), var(--app-accent));
          color: #000;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(var(--app-accent-rgb),.45);
          transition: transform .15s, box-shadow .15s;
          flex-shrink: 0;
        }
        .pbar-play-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 26px rgba(var(--app-accent-rgb),.6);
        }
        .pbar-play-btn:active { transform: scale(.96); }

        /* seek row */
        .pbar-seek-row {
          display: flex; align-items: center; gap: 9px;
          width: 380px;
        }
        .pbar-time {
          font-size: 10px; font-family: monospace;
          color: var(--app-text-muted);
          width: 34px; flex-shrink: 0; line-height: 1;
        }
        .pbar-time.right { text-align: right; }

        /* custom range — shared */
        .pbar-range {
          -webkit-appearance: none; appearance: none;
          height: 4px; border-radius: 999px;
          outline: none; cursor: pointer;
          transition: height .18s;
          flex: 1;
        }
        .pbar-range:hover { height: 6px; }
        .pbar-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 2px rgba(var(--app-accent-rgb),.55), 0 2px 8px rgba(0,0,0,.5);
          cursor: pointer;
          transition: transform .15s;
        }
        .pbar-range::-webkit-slider-thumb:hover { transform: scale(1.2); }
        .pbar-range::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%; border: none;
          background: #fff;
          box-shadow: 0 0 0 2px rgba(var(--app-accent-rgb),.55);
          cursor: pointer;
        }

        /* RIGHT — volume + repeat + mobile pl btn */
        .pbar-right {
          display: flex; align-items: center;
          gap: 8px;
          justify-content: flex-end;
          min-width: 0;
          overflow: hidden;
        }
        .pbar-vol-wrap {
          display: flex; align-items: center; gap: 7px;
          flex-shrink: 0;
        }
        .pbar-vol-range {
          -webkit-appearance: none; appearance: none;
          width: 80px; height: 4px; border-radius: 999px;
          outline: none; cursor: pointer;
          transition: height .18s;
        }
        .pbar-vol-range:hover { height: 6px; }
        .pbar-vol-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 13px; height: 13px; border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 2px rgba(var(--app-accent-rgb),.5);
          cursor: pointer;
        }
        .pbar-vol-range::-moz-range-thumb {
          width: 13px; height: 13px; border: none; border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 2px rgba(var(--app-accent-rgb),.5);
          cursor: pointer;
        }

        /* mobile playlist btn — hidden on desktop */
        .pbar-pl-mob-btn {
          display: none !important;
        }

        /* ── Responsive breakpoints ── */
        @media (max-width: 900px) {
          .pbar-seek-row { width: 280px; }
          .pbar-title, .pbar-artist { max-width: 120px; }
        }
        @media (max-width: 768px) {
          .pbar-root {
            height: auto;
            padding: 10px 14px 12px;
            grid-template-columns: 1fr auto;
            grid-template-rows: auto auto;
            gap: 10px 12px;
          }
          .pbar-left  { grid-column: 1; grid-row: 1; }
          .pbar-right { grid-column: 2; grid-row: 1; }
          .pbar-center { grid-column: 1 / -1; grid-row: 2; width: 100%; }
          .pbar-seek-row { width: 100%; }
          .pbar-vol-wrap { display: none; }
          /* show playlist btn */
          .pbar-pl-mob-btn {
            display: flex !important;
            align-items: center; justify-content: center;
            width: 36px; height: 36px; border-radius: 10px;
            border: 1px solid rgba(var(--app-accent-rgb),.28);
            background: rgba(var(--app-accent-rgb),.1);
            color: var(--app-accent);
            cursor: pointer;
            flex-shrink: 0;
            transition: background .15s, transform .15s;
          }
          .pbar-pl-mob-btn:hover {
            background: rgba(var(--app-accent-rgb),.2);
            transform: scale(1.06);
          }
          .pbar-title, .pbar-artist { max-width: 130px; }
        }
        @media (max-width: 480px) {
          .pbar-root { padding: 9px 10px 11px; }
          .pbar-art-wrap { width: 44px; height: 44px; border-radius: 10px; }
          .pbar-title { font-size: 12.5px; max-width: 100px; }
          .pbar-artist { max-width: 100px; }
          .pbar-play-btn { width: 40px; height: 40px; }
          .pbar-icon-btn { width: 30px; height: 30px; }
        }
      `}</style>

      <footer className="pbar-root">
        {/* progress line */}
        <div className="pbar-prog-line" style={{ width: `${progressPct}%` }} />

        {/* ── LEFT: artwork + meta ── */}
        <div className="pbar-left">
          <div className={`pbar-art-wrap${isPlaying ? " playing" : ""}`}>
            {currentSong?.cover_url
              ? <img src={currentSong.cover_url} alt="" />
              : <div className="pbar-art-fallback">🎵</div>
            }
            {isPlaying && currentSong && (
              <div className="pbar-art-overlay">
                <MiniWave isPlaying={isPlaying} />
              </div>
            )}
          </div>
          <div className="pbar-meta">
            <div className="pbar-title">{currentSong?.name || "No Song Selected"}</div>
            <div className="pbar-artist">{currentSong?.artist || "Select a song to play"}</div>
          </div>
        </div>

        {/* ── CENTER: controls + seek ── */}
        <div className="pbar-center">
          {/* controls row */}
          <div className="pbar-controls">
            <button className="pbar-icon-btn" onClick={playPrev} title="Previous">
              <SkipBack size={17} strokeWidth={2} />
            </button>

            <button className="pbar-play-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying
                ? <Pause size={20} fill="#000" strokeWidth={0} />
                : <Play  size={20} fill="#000" strokeWidth={0} style={{ marginLeft: 2 }} />
              }
            </button>

            <button className="pbar-icon-btn" onClick={playNext} title="Next">
              <SkipForward size={17} strokeWidth={2} />
            </button>

            <button className="pbar-icon-btn" title="Repeat" style={{ opacity: .55 }}>
              <Repeat2 size={15} strokeWidth={2} />
            </button>
          </div>

          {/* seek row */}
          <div className="pbar-seek-row">
            <span className="pbar-time">{fmt(currentTime)}</span>
            <input
              type="range"
              className="pbar-range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={e => seekTo(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right,var(--app-accent) ${progressPct}%,rgba(var(--app-accent-rgb),.18) 0%)`,
              }}
            />
            <span className="pbar-time right">{fmt(duration)}</span>
          </div>
        </div>

        {/* ── RIGHT: volume + repeat + mobile playlist btn ── */}
        <div className="pbar-right">
          {/* volume */}
          <div className="pbar-vol-wrap">
            <button className="pbar-icon-btn" style={{ width: 28, height: 28 }} title="Volume">
              <Volume2 size={15} strokeWidth={2} />
            </button>
            <input
              type="range"
              className="pbar-vol-range"
              min={0} max={1} step={0.01}
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right,var(--app-accent) ${volume * 100}%,rgba(var(--app-accent-rgb),.18) 0%)`,
              }}
            />
          </div>

          {/* mobile-only playlist toggle inside player bar */}
          <button
            className="pbar-pl-mob-btn"
            onClick={() => setPlaylistOpen(v => !v)}
            title="My Playlists"
          >
            <ListMusic size={16} strokeWidth={2} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function Empty({ icon, title, sub, action }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: 24 }}>
      <div style={{ width: 66, height: 66, borderRadius: 16, marginBottom: 12, background: "rgba(var(--app-accent-rgb),.08)", border: "1px solid rgba(var(--app-accent-rgb),.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--app-text-muted)", marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--app-text-muted)", maxWidth: 240, lineHeight: 1.6 }}>{sub}</div>}
      {action && (
        <button onClick={action.onClick} style={{ marginTop: 16, padding: "8px 18px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(var(--app-accent-rgb),.26)", background: "rgba(var(--app-accent-rgb),.09)", color: "var(--app-accent)", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
