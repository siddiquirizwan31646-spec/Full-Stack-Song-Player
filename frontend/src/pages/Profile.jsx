import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  CircleAlert,
  Loader2,
  Mail,
  MonitorSmartphone,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";
import { useUser } from "@/context/userContext";

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
  { icon: "⬇", label: "Downloads",    id: "downloads", path: "/downloads" },
  { icon: "⚙", label: "Settings",     id: "settings",  path: "/settings" },
];

const detailCardStyle = {
  background: "var(--app-surface)",
  border: "1px solid var(--app-border)",
  boxShadow: "var(--app-shadow)",
  backdropFilter: "blur(24px)",
};

const formatDate = (value) => {
  if (!value) return "Not available";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "long", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date(value));
  } catch { return value; }
};

const toLabel = (value) =>
  String(value || "Not set")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (l) => l.toUpperCase());

const ProfileDetail = ({ icon: Icon, label, value, accent = false }) => (
  <div style={{
    ...detailCardStyle,
    borderRadius: 12, padding: "16px 16px 14px", display: "grid", gap: 8,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--app-text-muted)" }}>
      <Icon size={15} color={accent ? "var(--app-accent)" : "currentColor"} />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
    </div>
    <div style={{ color: "var(--app-text-main)", fontSize: 15, fontWeight: 700, lineHeight: 1.4, wordBreak: "break-all" }}>{value}</div>
  </div>
);

export default function Profile() {
  const navigate = useNavigate();
  const { user, refreshCurrentUser, preferences } = useUser();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        setLoading(true); setError("");
        const nextUser = await refreshCurrentUser();
        if (isMounted && nextUser) setProfile(nextUser);
      } catch (e) {
        if (isMounted) {
          setError(e?.response?.data?.message || e.message || "Unable to load profile details.");
          setProfile(user);
        }
      } finally { if (isMounted) setLoading(false); }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [user?._id]);

  const accountBadges = useMemo(() => [
    {
      label: profile?.isVerified ? "Verified Account" : "Verification Pending",
      color: profile?.isVerified ? "var(--app-accent)" : "#fbbf24",
      background: profile?.isVerified ? "rgba(var(--app-accent-rgb),0.12)" : "rgba(251,191,36,0.14)",
      border: profile?.isVerified ? "1px solid rgba(var(--app-accent-rgb),0.24)" : "1px solid rgba(251,191,36,0.24)",
    },
    {
      label: profile?.isLoggedIn ? "Live Session" : "Signed Out",
      color: profile?.isLoggedIn ? "#22c55e" : "var(--app-text-muted)",
      background: profile?.isLoggedIn ? "rgba(34,197,94,0.12)" : "rgba(148,163,184,0.12)",
      border: profile?.isLoggedIn ? "1px solid rgba(34,197,94,0.24)" : "1px solid rgba(148,163,184,0.16)",
    },
    {
      label: profile?.activePlan || "Community Plan",
      color: "#fbbf24",
      background: "rgba(251,191,36,0.14)",
      border: "1px solid rgba(251,191,36,0.24)",
    },
  ], [profile]);

  const effectivePreferences = profile?.preferences || preferences;
  const displayName = profile?.username || "Guest";

  return (
    <div style={{
      display: "flex", flexDirection: "column", minHeight: "100vh",
      background: "radial-gradient(circle at top right,rgba(var(--app-accent-rgb),0.16),transparent 28%),radial-gradient(circle at bottom left,rgba(var(--app-accent-rgb),0.08),transparent 24%),linear-gradient(180deg,var(--app-shell-bg) 0%,var(--app-shell-bg-alt) 100%)",
      color: "var(--app-text-main)", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.2);border-radius:2px}

        .nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:3px;font-size:13px;font-weight:500;color:var(--app-text-muted);border-left:3px solid transparent;transition:all 0.18s}
        .nav-item:hover{background:var(--app-surface);color:var(--app-text-main)}
        .nav-item.active{background:rgba(var(--app-accent-rgb),0.12);border-left-color:var(--app-accent);color:var(--app-accent);font-weight:700}

        .sidebar{width:216px;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),0.1);display:flex;flex-direction:column;flex-shrink:0;transition:transform 0.28s cubic-bezier(.4,0,.2,1)}
        @media(max-width:768px){
          .sidebar{position:fixed;left:0;top:0;bottom:0;z-index:200;width:250px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,0.6)}
          .sidebar.open{transform:translateX(0)}
        }

        .hamburger{display:none;background:none;border:none;color:var(--app-text-main);font-size:20px;cursor:pointer;padding:6px 8px;border-radius:8px;flex-shrink:0;line-height:1;transition:background 0.15s}
        .hamburger:hover{background:var(--app-surface)}
        @media(max-width:768px){.hamburger{display:flex;align-items:center;justify-content:center}}

        .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;backdrop-filter:blur(3px)}
        @media(max-width:768px){.mob-overlay.visible{display:block}}

        .profile-topbar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--app-shell-bg-alt);border-bottom:1px solid rgba(var(--app-accent-rgb),0.08);flex-shrink:0}

        .profile-shell{flex:1;overflow-y:auto;padding:20px}
        @media(max-width:600px){.profile-shell{padding:12px}}

        .profile-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,0.8fr);gap:20px}
        @media(max-width:960px){.profile-grid{grid-template-columns:1fr}}

        .profile-details-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        @media(max-width:560px){.profile-details-grid{grid-template-columns:1fr}}

        .profile-hover{transition:all 0.24s ease}
        .profile-hover:hover{transform:translateY(-3px);border-color:rgba(var(--app-accent-rgb),0.28)!important;box-shadow:0 24px 60px rgba(0,0,0,0.24)}

        .hero-header{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
        .hero-header-info{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
        .hero-btns{display:flex;gap:10px;flex-wrap:wrap}
        @media(max-width:500px){
          .hero-btns button{padding:9px 13px!important;font-size:12px!important}
        }
      `}</style>

      <DashboardNavbar />

      {/* Mobile overlay */}
      <div className={`mob-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <img
              src="https://i.postimg.cc/DZLCn6Sb/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
              alt="QalbAudio"
              onClick={() => { navigate("/"); setSidebarOpen(false); }}
              style={{ height: 60, width: "auto", maxWidth: "88%", objectFit: "contain", cursor: "pointer", display: "block" }}
            />
            <div style={{ fontSize: 11, color: "var(--app-text-muted)", textAlign: "center" }}>
              <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
            {NAV_ITEMS.map(item => (
              <div key={item.id} className="nav-item"
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />
            {NAV_BOTTOM.map(item => (
              <div key={item.id} className={`nav-item${item.id === "settings" ? " active" : ""}`}
                style={{ color: item.id === "upload" ? "var(--app-accent)" : undefined }}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Topbar */}
          <div className="profile-topbar">
            <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UserRound size={18} color="var(--app-accent)" />
              <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700 }}>Profile</span>
            </div>
          </div>

          {/* Scroll area */}
          <div className="profile-shell">

            {/* Hero card */}
            <motion.section
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
              style={{
                ...detailCardStyle, borderRadius: 16, padding: 22, marginBottom: 20,
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,rgba(var(--app-accent-rgb),0.14),transparent 38%,transparent 62%,rgba(var(--app-accent-rgb),0.1))", pointerEvents: "none" }} />

              <div className="hero-header" style={{ position: "relative" }}>
                <div className="hero-header-info">
                  <div style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", color: "#041307", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, boxShadow: "0 16px 32px rgba(var(--app-accent-rgb),0.26)", flexShrink: 0 }}>
                    {profile?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 999, background: "rgba(var(--app-accent-rgb),0.1)", color: "var(--app-accent)", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Profile Overview
                    </div>
                    <h1 style={{ fontSize: "clamp(22px,4vw,38px)", margin: "12px 0 6px", letterSpacing: "-0.04em" }}>
                      {profile?.username || "Your profile"}
                    </h1>
                    <p style={{ margin: 0, color: "var(--app-text-muted)", maxWidth: 600, lineHeight: 1.7, fontSize: 13 }}>
                      Review account details, membership state, and saved theme preferences.
                    </p>
                  </div>
                </div>

                <div className="hero-btns">
                  <button type="button" onClick={() => navigate("/settings")} style={{ padding: "11px 16px", borderRadius: 999, border: "1px solid var(--app-border)", background: "var(--app-surface)", color: "var(--app-text-main)", cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif" }}>
                    Settings
                  </button>
                  <button type="button" onClick={() => navigate("/hero")} style={{ padding: "11px 16px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", color: "#041307", cursor: "pointer", fontWeight: 800, fontSize: 13, boxShadow: "0 12px 28px rgba(var(--app-accent-rgb),0.24)", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif" }}>
                    Dashboard
                  </button>
                </div>
              </div>

              <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
                {accountBadges.map(badge => (
                  <span key={badge.label} style={{ padding: "8px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: badge.color, background: badge.background, border: badge.border }}>
                    {badge.label}
                  </span>
                ))}
              </div>
            </motion.section>

            {/* Loading / error */}
            {loading ? (
              <div style={{ ...detailCardStyle, borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 12, color: "var(--app-accent)", marginBottom: 20 }}>
                <Loader2 className="animate-spin" size={18} />
                Loading your account details...
              </div>
            ) : error ? (
              <div style={{ ...detailCardStyle, borderRadius: 14, padding: 20, display: "grid", gap: 10, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#f87171", fontWeight: 800 }}>
                  <CircleAlert size={18} /> Unable to refresh profile
                </div>
                <p style={{ margin: 0, color: "var(--app-text-muted)", lineHeight: 1.7 }}>{error}</p>
              </div>
            ) : null}

            {/* Grid */}
            <div className="profile-grid">

              {/* Account Details */}
              <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
                <div className="profile-hover" style={{ ...detailCardStyle, borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <UserRound size={17} color="var(--app-accent)" />
                    <h2 style={{ margin: 0, fontSize: 18 }}>Account Details</h2>
                  </div>
                  <div className="profile-details-grid">
                    <ProfileDetail icon={UserRound}       label="Username"       value={profile?.username || "Not available"} accent />
                    <ProfileDetail icon={Mail}            label="Email"          value={profile?.email || "Not available"} />
                    <ProfileDetail icon={ShieldCheck}     label="Verification"   value={profile?.isVerified ? "Email verified" : "Pending"} accent={profile?.isVerified} />
                    <ProfileDetail icon={BadgeCheck}      label="Plan"           value={profile?.activePlan || "Community plan"} />
                    <ProfileDetail icon={CalendarDays}    label="Joined"         value={formatDate(profile?.createdAt)} />
                    <ProfileDetail icon={CalendarDays}    label="Last Updated"   value={formatDate(profile?.updatedAt)} />
                    <ProfileDetail icon={MonitorSmartphone} label="Session"      value={profile?.isLoggedIn ? "Logged in" : "Signed out"} />
                    <ProfileDetail icon={SlidersHorizontal} label="User ID"      value={profile?._id || "Not available"} />
                  </div>
                </div>
              </motion.section>

              {/* Theme Preferences */}
              <motion.aside initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12 }}>
                <div className="profile-hover" style={{ ...detailCardStyle, borderRadius: 16, padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <Palette size={17} color="var(--app-accent)" />
                    <h2 style={{ margin: 0, fontSize: 18 }}>Theme Preferences</h2>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    <ProfileDetail icon={Palette}           label="Theme Mode"         value={toLabel(effectivePreferences?.themeMode)} accent />
                    <ProfileDetail icon={Palette}           label="Accent Color"        value={effectivePreferences?.accentColor || "Not set"} />
                    <ProfileDetail icon={SlidersHorizontal} label="Interface Density"   value={toLabel(effectivePreferences?.interfaceDensity)} />
                    <ProfileDetail icon={MonitorSmartphone} label="Player Layout"       value={toLabel(effectivePreferences?.playerLayout)} />
                    <ProfileDetail icon={MonitorSmartphone} label="Card Style"          value={toLabel(effectivePreferences?.cardStyle)} />
                    <ProfileDetail icon={ShieldCheck}       label="Animations"          value={effectivePreferences?.animationsEnabled ? "Enabled" : "Reduced"} />
                    <ProfileDetail icon={UserRound}         label="Greeting"            value={effectivePreferences?.showGreeting ? "Shown in navbar" : "Hidden"} />
                    <div style={{ ...detailCardStyle, borderRadius: 12, padding: "16px 16px 14px", display: "grid", gap: 12 }}>
                      <div style={{ color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Rounded Corners</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ color: "var(--app-text-main)", fontSize: 15, fontWeight: 700 }}>{effectivePreferences?.roundedCorners || 24}px</div>
                        <div style={{ width: 52, height: 34, borderRadius: `${Math.min(Number(effectivePreferences?.roundedCorners || 24), 17)}px`, background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", boxShadow: "0 10px 22px rgba(var(--app-accent-rgb),0.22)" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </div>

            <div style={{ height: 24 }} />
          </div>
        </div>
      </div>
    </div>
  );
}