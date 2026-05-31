import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Heart, LogOut, Music2, Settings, Upload, User, ChevronDown, Bot, X, Command } from "lucide-react";
import { useUser } from "@/context/userContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { API_URL } from "@/lib/config";
import ChatBotPopup from "./ChatBotPopup";
import { HamburgerBtn } from "@/components/ui/NavbarMenu";
// FIX 1: import FontAwesome properly
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
library.add(fas);

const MENU_ITEMS = [
  { icon: User,    label: "Profile",     path: "/profile" },
  { icon: Music2,  label: "Playlists",   path: "/playlists" },
  { icon: Heart,   label: "Favorites",   path: "/favorites" },
  { icon: Upload,  label: "Upload Audio",path: "/upload" },
  { icon: Settings,label: "Settings",    path: "/settings" },
];

const PingDot = ({ color = "var(--app-accent)" }) => (
  <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
    <span style={{
      position: "absolute", inset: 0, borderRadius: "50%", background: color,
      opacity: 0.75, animation: "navPing 1.4s cubic-bezier(0,0,0.2,1) infinite",
    }} />
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
  </span>
);

// onSearch: callback from parent (QalbAudio), onToggleSidebar: hamburger on mobile
const DashboardNavbar = ({ onSearch, searchValue, onToggleSidebar }) => {
  const { user, setUser, preferences } = useUser();
  const navigate = useNavigate();
  const [scrolled, setScrolled]         = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chatOpen, setChatOpen]         = useState(false);
  const [isMobile, setIsMobile]         = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 760 : false
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    const onResize = () => setIsMobile(window.innerWidth < 760);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const logoutHandle = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      await axios.post(`${API_URL}/user/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.log("Logout error:", e.response?.data);
    } finally {
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const avatarLetter = user?.username?.[0]?.toUpperCase() || "U";
  const radius       = useMemo(() => Math.max(16, Math.min(28, preferences?.roundedCorners || 24)), [preferences?.roundedCorners]);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes navPing { 75%,100%{ transform:scale(2);opacity:0 } }
        @keyframes chatbotGlow {
          0%,100%{ box-shadow:0 0 0 0 rgba(var(--app-accent-rgb),0.4) }
          50%{ box-shadow:0 0 0 8px rgba(var(--app-accent-rgb),0) }
        }
        .nav-dropdown-item:hover{ background:rgba(var(--app-accent-rgb),0.1)!important;color:var(--app-text-main)!important }
        .avatar-btn:hover{ border-color:rgba(var(--app-accent-rgb),0.46)!important;box-shadow:0 0 0 4px rgba(var(--app-accent-rgb),0.08)!important }
        .nav-outline-btn:hover{ border-color:rgba(var(--app-accent-rgb),0.46)!important;color:var(--app-text-main)!important;background:rgba(var(--app-accent-rgb),0.08)!important }
        .nav-primary-btn:hover{ transform:translateY(-1px);box-shadow:0 14px 30px rgba(var(--app-accent-rgb),0.28)!important }

        .chatbot-icon-btn{
          position:relative;width:38px;height:38px;border-radius:50%;
          background:rgba(var(--app-accent-rgb),0.1);border:1px solid rgba(var(--app-accent-rgb),0.28);
          display:flex;align-items:center;justify-content:center;cursor:pointer;
          transition:all 0.25s ease;flex-shrink:0;
        }
        .chatbot-icon-btn:hover{ background:rgba(var(--app-accent-rgb),0.18)!important;border-color:rgba(var(--app-accent-rgb),0.55)!important;transform:scale(1.06) }
        .chatbot-icon-btn.active{ background:linear-gradient(135deg,var(--app-accent-strong),var(--app-accent));border-color:transparent;animation:chatbotGlow 2s ease-in-out infinite }
        .chatbot-icon-btn.active svg{ color:#041307!important }
        .chatbot-badge{ position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:var(--app-accent);border:2px solid var(--app-surface-solid) }

        .notif-btn{
          position:relative;width:38px;height:38px;border-radius:50%;
          background:rgba(var(--app-accent-rgb),0.08);border:1px solid rgba(var(--app-accent-rgb),0.2);
          display:flex;align-items:center;justify-content:center;cursor:pointer;
          transition:all 0.2s ease;flex-shrink:0;
        }
        .notif-btn:hover{ background:rgba(var(--app-accent-rgb),0.18);border-color:rgba(var(--app-accent-rgb),0.4) }
        .notif-dot{ position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--app-accent);border:2px solid var(--app-surface-solid) }

        .dashboard-nav-shell{
          padding: 0 20px;
          min-height: 60px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
        }

        .nav-search-wrap{
          flex: 1;
          max-width: 480px;
          margin: 0 auto;
          position: relative;
        }
        .nav-search-input{
          width:100%;background:rgba(var(--app-accent-rgb),0.06);
          border:1px solid rgba(var(--app-accent-rgb),0.18);border-radius:999px;
          padding:9px 16px 9px 40px;color:var(--app-text-main);
          font-family:'DM Sans',sans-serif;font-size:13px;outline:none;
          transition:all 0.2s ease;
        }
        .nav-search-input:focus{ background:rgba(var(--app-accent-rgb),0.1);border-color:rgba(var(--app-accent-rgb),0.4);box-shadow:0 0 0 3px rgba(var(--app-accent-rgb),0.08) }
        .nav-search-input::placeholder{ color:var(--app-text-muted) }
        .nav-search-icon{ position:absolute;left:14px;top:50%;transform:translateY(-50%);pointer-events:none }
        .nav-search-kbd{ position:absolute;right:12px;top:50%;transform:translateY(-50%);background:rgba(var(--app-accent-rgb),0.12);border:1px solid rgba(var(--app-accent-rgb),0.2);border-radius:6px;padding:2px 7px;font-size:10px;color:var(--app-text-muted);font-family:monospace }

        .dashboard-greeting{ font-size:13px;color:var(--app-text-muted);font-family:'DM Sans',sans-serif;font-weight:500;white-space:nowrap }

        .dashboard-ramadan-badge{
          display:flex;align-items:center;gap:6px;
          background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.22);
          border-radius:999px;padding:5px 11px;color:#fbbf24;
          font-size:11px;font-weight:700;font-family:'DM Sans',sans-serif;
          letter-spacing:0.06em;text-transform:uppercase;white-space:nowrap;
        }

        .nav-auth-row{ display:flex;align-items:center;gap:10px }

        .nav-hamburger-mobile { display: none; }
        @media(max-width:768px){ .nav-hamburger-mobile { display: flex; } }

        @media(max-width:960px){
          .nav-search-wrap{ max-width:280px }
          .dashboard-greeting{ display:none!important }
        }
        @media(max-width:760px){
          .dashboard-nav-shell{ padding:8px 12px;min-height:54px;gap:10px }
          .dashboard-ramadan-badge{ display:none!important }
          .nav-search-wrap{ max-width:none }
          .nav-search-kbd{ display:none }
          .nav-user-row{ gap:6px!important }
          .chatbot-icon-btn,.notif-btn{ width:34px;height:34px }
        }
        @media(max-width:480px){
          .dashboard-nav-shell{ padding:6px 10px; gap:8px }
          .nav-search-wrap{ display:block; max-width:none; flex:1 }
          .nav-search-input{ padding:8px 10px 8px 34px; font-size:12px }
          .nav-search-kbd{ display:none }
          .nav-auth-row button{ padding:8px 14px!important;font-size:12.5px!important }
        }
      `}</style>

      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22,1,0.36,1] }}
        style={{
          position: "sticky", top: 0, zIndex: 100, width: "100%",
          background: "var(--app-surface)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderBottom: "none",
          transition: "all 0.35s ease",
          boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,height:2,
          background:"linear-gradient(90deg,transparent 0%,rgba(var(--app-accent-rgb),0) 10%,rgba(var(--app-accent-rgb),0.55) 35%,var(--app-accent) 50%,rgba(var(--app-accent-rgb),0.55) 65%,rgba(var(--app-accent-rgb),0) 90%,transparent 100%)",
          pointerEvents:"none",
        }} />

        <div className="dashboard-nav-shell">

          {/* Hamburger — mobile only */}
          <div className="nav-hamburger-mobile">
            <HamburgerBtn onClick={onToggleSidebar} />
          </div>

          {/* Search */}
          {onSearch ? (
            <div className="nav-search-wrap">
              <span className="nav-search-icon">
                {/* FIX 2: FontAwesomeIcon now properly imported above */}
                <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 13, color: "var(--app-text-muted)" }} />
              </span>
              <input
                className="nav-search-input"
                value={searchValue || ""}
                onChange={e => onSearch(e.target.value)}
                placeholder="Search nasheeds, reciters, artists..."
              />
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* RIGHT: USER ACTIONS */}
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22, duration: 0.42 }}
            style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}
          >
            {user ? (
              <div className="nav-user-row" style={{ display: "flex", alignItems: "center", gap: 10 }}>

                {/* Ramadan badge */}
                <div className="dashboard-ramadan-badge">🌙 Ramadan</div>

                {/* Greeting */}
                {preferences?.showGreeting !== false && (
                  <span className="dashboard-greeting">
                    Assalamu Alaikum,{" "}
                    <span style={{
                      fontWeight: 800,
                      background: "linear-gradient(90deg,var(--app-text-main),var(--app-accent))",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                      {user.username || "User"}
                    </span>
                  </span>
                )}

                {/* Chatbot */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  className={`chatbot-icon-btn ${chatOpen ? "active" : ""}`}
                  onClick={() => setChatOpen(p => !p)}
                  title="QalbAudio Assistant"
                >
                  {chatOpen
                    ? <X size={15} color="var(--app-accent)" />
                    : <Bot size={15} color="var(--app-accent)" />
                  }
                  {!chatOpen && <span className="chatbot-badge" />}
                </motion.button>

                {/* Avatar dropdown */}
                <DropdownMenu onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="avatar-btn"
                      style={{
                        background: "rgba(var(--app-accent-rgb),0.08)",
                        border: "1px solid rgba(var(--app-accent-rgb),0.24)",
                        borderRadius: 999,
                        padding: isMobile ? "4px" : "4px 10px 4px 4px",
                        display: "flex", alignItems: "center", gap: 8,
                        cursor: "pointer", transition: "all 0.25s ease", height: "auto",
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        <Avatar style={{ width: 32, height: 32 }}>
                          <AvatarImage src="" alt={user.username || "User"} />
                          <AvatarFallback style={{
                            background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                            color: "#041307", fontSize: 12, fontWeight: 800, fontFamily: "'DM Sans',sans-serif",
                          }}>
                            {avatarLetter}
                          </AvatarFallback>
                        </Avatar>
                        <div style={{
                          position: "absolute", bottom: 0, right: 0,
                          width: 9, height: 9, borderRadius: "50%",
                          background: "#22c55e", border: "2px solid var(--app-surface-solid)",
                        }} />
                      </div>
                      {!isMobile && (
                        <>
                          <span style={{
                            fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
                            color: "var(--app-text-main)", maxWidth: 90,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {user.username}
                          </span>
                          <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={13} color="var(--app-text-muted)" />
                          </motion.div>
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    sideOffset={12}
                    style={{
                      background: "var(--app-surface-solid)",
                      border: "1px solid rgba(var(--app-accent-rgb),0.18)",
                      borderRadius: radius,
                      boxShadow: "0 24px 70px rgba(0,0,0,0.26)",
                      minWidth: 240,
                      width: isMobile ? "min(260px,calc(100vw - 32px))" : "auto",
                      maxWidth: "calc(100vw - 32px)",
                      padding: 8,
                    }}
                  >
                    <div style={{
                      padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                      borderBottom: "1px solid rgba(var(--app-accent-rgb),0.1)", marginBottom: 6,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: "#041307",
                        boxShadow: "0 10px 24px rgba(var(--app-accent-rgb),0.28)", flexShrink: 0,
                      }}>
                        {avatarLetter}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 14,
                          color: "var(--app-text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {user.username}
                        </div>
                        <div style={{
                          fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "var(--app-text-muted)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2,
                        }}>
                          {user.email}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                          <PingDot />
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "var(--app-accent)", fontWeight: 700 }}>
                            Active Session
                          </span>
                        </div>
                      </div>
                    </div>

                    <DropdownMenuGroup>
                      {MENU_ITEMS.map(({ icon: Icon, label, path }) => (
                        <DropdownMenuItem
                          key={label}
                          className="nav-dropdown-item"
                          onClick={() => navigate(path)}
                          style={{
                            color: "var(--app-text-main)", fontFamily: "'DM Sans',sans-serif",
                            cursor: "pointer", borderRadius: Math.max(12, radius - 10),
                            padding: "10px 12px", fontSize: 13.5, gap: 10,
                            margin: "2px 0", transition: "all 0.15s ease",
                          }}
                        >
                          <Icon size={14} color="var(--app-accent)" />
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>

                    <div style={{ height: 1, background: "rgba(var(--app-accent-rgb),0.1)", margin: "6px 0" }} />

                    <DropdownMenuItem
                      onClick={logoutHandle}
                      className="nav-dropdown-item"
                      style={{
                        color: "#f87171", fontFamily: "'DM Sans',sans-serif",
                        cursor: "pointer", borderRadius: Math.max(12, radius - 10),
                        padding: "10px 12px", fontSize: 13.5, gap: 10, margin: "2px 0",
                      }}
                    >
                      <LogOut size={14} />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            ) : (
              <div className="nav-auth-row">
                <Link to="/login" style={{ textDecoration: "none" }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="nav-outline-btn"
                    style={{
                      padding: "9px 20px", borderRadius: 999,
                      border: "1px solid rgba(var(--app-accent-rgb),0.24)",
                      background: "transparent", color: "var(--app-text-main)",
                      fontFamily: "'DM Sans',sans-serif", fontWeight: 700,
                      fontSize: 13.5, cursor: "pointer", transition: "all 0.2s ease",
                    }}
                  >
                    Login
                  </motion.button>
                </Link>
                <Link to="/signup" style={{ textDecoration: "none" }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="nav-primary-btn"
                    style={{
                      padding: "9px 22px", borderRadius: 999, border: "none",
                      background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                      color: "#041307", fontFamily: "'DM Sans',sans-serif",
                      fontWeight: 800, fontSize: 13.5, cursor: "pointer",
                      boxShadow: "0 10px 22px rgba(var(--app-accent-rgb),0.24)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Get Started
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>

        </div>
      </motion.nav>

      <AnimatePresence>
        {chatOpen && (
          <ChatBotPopup onClose={() => setChatOpen(false)} user={user} />
        )}
      </AnimatePresence>
    </>
  );
};

export default DashboardNavbar;