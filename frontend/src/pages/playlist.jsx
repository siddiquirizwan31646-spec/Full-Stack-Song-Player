import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardNavbar from "@/components/DashboardNavbar";
import FavoriteButton from "@/components/FavoriteButton";
import { Plus, X, ListMusic, Trash2, Play, Music2 } from "lucide-react";
import { useUser } from "@/context/userContext";
import { usePersistentSongPlayer } from "@/hooks/usePersistentSongPlayer";
import NavbarMenu, { useNavbar } from "@/components/ui/NavbarMenu";
import { API_URL } from "@/lib/config";
import PlayerBar from "@/components/ui/PlayerBar";

/* ── helpers ── */
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

/* ════════════════════════════════════════════════════════════════ */
export default function PlaylistPage() {
  const { user, setUser, loading } = useUser();
  const navigate = useNavigate();

  const [playlists,        setPlaylists]        = useState([]);
  const [selectedId,       setSelectedId]       = useState(null);
  const [showCreate,       setShowCreate]       = useState(false);
  const [newName,          setNewName]          = useState("");
  const [creating,         setCreating]         = useState(false);
  const [removing,         setRemoving]         = useState(null);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  const { sidebarOpen, toggleSidebar, closeSidebar } = useNavbar();
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const selected = playlists.find(p => p._id === selectedId) || null;
  const songs    = (selected?.songs || []).map(mapPlaylistSong);

  // ── single hook call with ALL needed values ──
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
    closeSidebar();
    setPlaylistOpen(false);
    navigate(path);
  }, [navigate, closeSidebar]);

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
      if (selectedId === pl._id) resetPlayer();
      toast.success("Playlist deleted");
    } catch (e) { toast.error(e.message || "Unable to delete"); }
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
      if (currentSong?.id === song.id) resetPlayer();
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
        .pl-item:hover{background:rgba(var(--app-accent-rgb),.07)!important}
        .pl-delete:hover{color:#ef4444!important}
        .playlist-panel{width:236px;flex-shrink:0;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),.08);display:flex;flex-direction:column;overflow:hidden;transition:transform .28s cubic-bezier(.4,0,.2,1)}
        .pl-open-btn{display:none!important}
        @media(max-width:768px){
          .playlist-panel{position:fixed;left:0;top:0;bottom:0;z-index:220;width:280px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,.5)}
          .playlist-panel.open{transform:translateX(0)}
          .pl-open-btn{display:flex!important}
          .mob-overlay-pl{display:block;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:215;backdrop-filter:blur(3px)}
        }
        @keyframes qaWave{from{transform:scaleY(.45);opacity:.4}to{transform:scaleY(1.1);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>

      {/* mobile overlay */}
      {playlistOpen && <div className="mob-overlay-pl" onClick={() => setPlaylistOpen(false)} />}

      {/* ── main row ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <NavbarMenu sidebarOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="qa-sidebar-spacer" />

        {/* ══ PLAYLIST PANEL ══ */}
        <div className={`playlist-panel${playlistOpen ? " open" : ""}`}>
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
              <button onClick={() => setPlaylistOpen(false)} className="pl-open-btn"
                style={{
                  width: 26, height: 26, borderRadius: 7, border: "none",
                  background: "transparent", color: "var(--app-text-muted)",
                  cursor: "pointer", alignItems: "center", justifyContent: "center",
                }}>
                <X size={15} strokeWidth={2} />
              </button>
            </div>
          </div>

          {showCreate && (
            <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(var(--app-accent-rgb),.06)", animation: "fadeUp .2s" }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createPlaylist()}
                placeholder="Playlist name…"
                autoFocus
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
        {/* ══ END PLAYLIST PANEL ══ */}

        {/* ══ MAIN CONTENT ══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <DashboardNavbar onToggleSidebar={toggleSidebar} />

          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            background: "var(--app-shell-bg-alt)",
            borderBottom: "1px solid rgba(var(--app-accent-rgb),.08)",
            flexShrink: 0,
          }}>
            <button className="pl-open-btn" onClick={() => setPlaylistOpen(v => !v)} title="My Playlists"
              style={{
                display: "none", alignItems: "center", justifyContent: "center",
                gap: 5, padding: "6px 10px", borderRadius: 8, flexShrink: 0,
                border: "1px solid rgba(var(--app-accent-rgb),.25)",
                background: "rgba(var(--app-accent-rgb),.1)", color: "var(--app-accent)",
                cursor: "pointer", fontSize: 12, fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif",
              }}>
              <ListMusic size={13} strokeWidth={2} />
              Playlists
            </button>
            <span style={{
              color: "var(--app-text-main)", fontSize: 16, fontWeight: 700,
              flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden",
              textOverflow: "ellipsis", maxWidth: 180,
            }}>
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

          {/* ── song list ── */}
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
                <div key={song.id} className="song-row"
                  onClick={() => playSongFromList(song)}
                  style={{
                    display: "grid", gridTemplateColumns: "28px 46px 1fr auto",
                    alignItems: "center", gap: 12, padding: "10px 12px",
                    borderRadius: 12, cursor: "pointer", marginBottom: 3,
                    borderLeft: `3px solid ${active ? "var(--app-accent)" : "transparent"}`,
                    background: active
                      ? "linear-gradient(90deg,rgba(var(--app-accent-rgb),.09),rgba(var(--app-accent-rgb),.03))"
                      : "transparent",
                    boxShadow: active ? "0 2px 12px rgba(var(--app-accent-rgb),.08)" : "none",
                    transition: "background .18s, border-color .18s, box-shadow .18s",
                    animation: `fadeUp .22s ${idx * 0.025}s both`,
                  }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600,
                    color: active ? "var(--app-accent)" : "var(--app-text-muted)",
                    fontFamily: "monospace",
                  }}>
                    {active && isPlaying ? (
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14 }}>
                        {[0, 1, 2].map(b => (
                          <div key={b} style={{
                            width: 3, borderRadius: 2, background: "var(--app-accent)", height: "100%",
                            animation: `qaWave ${0.5 + b * 0.15}s ease-in-out infinite alternate`,
                            animationDelay: `${b * 0.1}s`,
                          }} />
                        ))}
                      </div>
                    ) : String(idx + 1).padStart(2, "0")}
                  </div>
                  <div style={{
                    width: 46, height: 46, borderRadius: 10, overflow: "hidden", flexShrink: 0,
                    background: "linear-gradient(135deg,rgba(var(--app-accent-rgb),.14),var(--app-surface))",
                    border: `1px solid ${active ? "rgba(var(--app-accent-rgb),.35)" : "rgba(var(--app-accent-rgb),.14)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: active ? "0 0 0 2px rgba(var(--app-accent-rgb),.18)" : "none",
                    transition: "border-color .18s, box-shadow .18s",
                  }}>
                    {song.cover_url
                      ? <img src={song.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <Music2 size={18} color="var(--app-accent)" strokeWidth={1.6} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, fontSize: 13, marginBottom: 2,
                      color: active ? "var(--app-accent)" : "var(--app-text-main)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
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
                          height: "100%", borderRadius: 2, background: "var(--app-accent)",
                          width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                          transition: "width .5s linear",
                        }} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {song.duration > 0 && (
                      <span style={{
                        fontSize: 11, color: "var(--app-text-muted)", fontFamily: "monospace",
                        background: "rgba(var(--app-accent-rgb),.06)", padding: "2px 7px", borderRadius: 5,
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
          {/* ── end song list ── */}

        </div>
        {/* ══ END MAIN CONTENT ══ */}

      </div>
      {/* ── end main row ── */}

      {/* ══ PLAYER BAR — same pattern as naat.jsx ══ */}
      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        progressPct={progressPct}
        togglePlay={togglePlay}
        playNext={playNext}
        playPrev={playPrev}
        seekTo={seekTo}
        setVolume={setVolume}
      />

    </div>
  );
}

/* ── Empty state ── */
function Empty({ icon, title, sub, action }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%", textAlign: "center", padding: 24,
    }}>
      <div style={{
        width: 66, height: 66, borderRadius: 16, marginBottom: 12,
        background: "rgba(var(--app-accent-rgb),.08)",
        border: "1px solid rgba(var(--app-accent-rgb),.14)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--app-text-muted)", marginBottom: 6 }}>{title}</div>
      {sub && (
        <div style={{ fontSize: 12, color: "var(--app-text-muted)", maxWidth: 240, lineHeight: 1.6 }}>{sub}</div>
      )}
      {action && (
        <button onClick={action.onClick}
          style={{
            marginTop: 16, padding: "8px 18px", borderRadius: 8, cursor: "pointer",
            border: "1px solid rgba(var(--app-accent-rgb),.26)",
            background: "rgba(var(--app-accent-rgb),.09)", color: "var(--app-accent)",
            fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans',sans-serif",
          }}>
          {action.label}
        </button>
      )}
    </div>
  );
}