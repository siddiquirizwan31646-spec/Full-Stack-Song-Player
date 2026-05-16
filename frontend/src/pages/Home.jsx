import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/userContext";
import axios from "axios";
import { toast } from "sonner";
import useViewport from "@/hooks/useViewport";
const API = import.meta.env.VITE_API_URL
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  @keyframes wave{from{transform:scaleY(0.4)}to{transform:scaleY(1)}}
  @keyframes ping{75%,100%{transform:scale(2);opacity:0}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),.2);border-radius:2px}
`;

function useScrollFade() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Fade({ children, style = {} }) {
  const [ref, visible] = useScrollFade();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "opacity .7s ease,transform .7s ease", ...style }}>
      {children}
    </div>
  );
}

function PingDot() {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8 }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--app-accent)", opacity: .75, animation: "ping 1.4s infinite" }} />
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--app-accent)", display: "inline-block" }} />
    </span>
  );
}

function UserDropdown({ user, onLogout, navigate, compact }) {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const items = [
    { icon: "🫀", label: "Open Player", to: "/hero" },
    { icon: "📖", label: "My Playlists", to: "/playlists" },
    { icon: "⬆", label: "Upload Audio", to: "/upload" },
    { icon: "♡", label: "Favorites", to: "/favorites" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 10,
        background: open ? "rgba(var(--app-accent-rgb),.15)" : "rgba(var(--app-accent-rgb),.08)",
        border: `1.5px solid ${open ? "rgba(var(--app-accent-rgb),.6)" : "rgba(var(--app-accent-rgb),.25)"}`,
        borderRadius: 999, padding: compact ? "5px" : "5px 14px 5px 5px", cursor: "pointer", transition: "all .22s",
      }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#000", position: "relative" }}>
          {user?.username?.[0]?.toUpperCase() || "U"}
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: "var(--app-accent)", border: "2px solid var(--app-shell-bg)" }} />
        </div>
        {!compact && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--app-text-main)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username || "User"}</span>
              <span style={{ fontSize: 10, color: "var(--app-accent)", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>Listener</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
              <path d="M2 4l4 4 4-4" stroke="var(--app-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          background: "var(--app-shell-bg-alt)", border: "1px solid rgba(var(--app-accent-rgb),.18)",
          borderRadius: 18, minWidth: 200, maxWidth: "calc(100vw - 32px)",
          boxShadow: "0 20px 60px rgba(0,0,0,.5)", overflow: "hidden",
          animation: "dropIn .2s ease", zIndex: 9999,
        }}>
          <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid rgba(var(--app-accent-rgb),.1)", background: "rgba(var(--app-accent-rgb),.05)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17, color: "#000", flexShrink: 0 }}>
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--app-text-main)" }}>{user?.username}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <PingDot />
                <span style={{ fontSize: 11, color: "var(--app-accent)", fontWeight: 600 }}>Active · Listener</span>
              </div>
            </div>
          </div>
          <div style={{ padding: "8px" }}>
            {items.map(({ icon, label, to }) => (
              <button key={label} onClick={() => { navigate(to); setOpen(false); }}
                onMouseEnter={() => setHov(label)} onMouseLeave={() => setHov(null)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "none", background: hov === label ? "rgba(var(--app-accent-rgb),.08)" : "transparent", cursor: "pointer", fontSize: 13.5, color: "var(--app-text-main)", fontWeight: 500, textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}>
                <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>{icon}</span>{label}
              </button>
            ))}
          </div>
          <div style={{ padding: "0 8px 8px" }}>
            <div style={{ height: 1, background: "rgba(var(--app-accent-rgb),.1)", marginBottom: 8 }} />
            <button onClick={() => { onLogout(); setOpen(false); }}
              onMouseEnter={() => setHov("out")} onMouseLeave={() => setHov(null)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "none", background: hov === "out" ? "rgba(239,68,68,.07)" : "transparent", cursor: "pointer", fontSize: 13.5, color: "#ef4444", fontWeight: 600, textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}>
              <span style={{ fontSize: 15, width: 20, textAlign: "center" }}>🚪</span>Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Wave() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 48, justifyContent: "center" }}>
      {Array.from({ length: 36 }).map((_, i) => (
        <div key={i} style={{
          width: 3, height: 8 + Math.sin(i * 0.7) * 14 + (i * 5 % 12),
          background: `rgba(var(--app-accent-rgb),${0.2 + (i % 4) * 0.15})`,
          borderRadius: 2, animation: `wave ${0.8 + (i % 6) * 0.1}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.05}s`,
        }} />
      ))}
    </div>
  );
}

const Btn = ({ onClick, primary, children, full }) => (
  <button onClick={onClick} style={{
    padding: "14px 36px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif", width: full ? "100%" : "auto", transition: "all .2s",
    ...(primary
      ? { background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", color: "#000", border: "none", boxShadow: "0 8px 28px rgba(var(--app-accent-rgb),.3)" }
      : { background: "transparent", color: "var(--app-accent)", border: "1.5px solid rgba(var(--app-accent-rgb),.4)" }),
  }}>{children}</button>
);

const Logo = ({ size = 120, onClick }) => (
  <img src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png" alt="QalbAudio"
    style={{ height: size, width: "auto", objectFit: "contain", cursor: onClick ? "pointer" : "default" }}
    onClick={onClick} />
);

const FEATURES = [
  { icon: "📖", title: "Quran & Recitations", desc: "Stream beautiful recitations from world-renowned reciters." },
  { icon: "🎵", title: "Nasheeds & Naats", desc: "Explore nasheeds, naats, and qawwali from artists worldwide." },
  { icon: "🎙", title: "Islamic Podcasts", desc: "Inspiring lectures, khutbahs, and podcasts to enrich knowledge." },
  { icon: "⬆", title: "Upload Your Audio", desc: "Share recordings — nasheeds, recitations, or lectures." },
  { icon: "♡", title: "Favorites & Playlists", desc: "Save tracks and build custom playlists for every moment." },
  { icon: "🌙", title: "Ramadan Specials", desc: "Curated content: taraweeh, duas, and night playlists." },
];

const STATS = [
  { value: "10K+", label: "Audio Tracks" },
  { value: "500+", label: "Reciters & Artists" },
  { value: "4.9★", label: "Average Rating" },
  { value: "24/7", label: "Streaming" },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const vw = useViewport();
  const mob = vw < 768;
  const tab = vw < 1024;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/user/logout`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } });
    } catch {}
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  };

  const px = mob ? "0 16px" : "0 5%";

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "var(--app-shell-bg)", color: "var(--app-text-main)", overflowX: "hidden" }}>
      <style>{css}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? "var(--app-surface-solid)" : "transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(var(--app-accent-rgb),.1)" : "none",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,.4)" : "none",
        transition: "all .35s", padding: px,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: mob ? "wrap" : "nowrap", gap: mob ? 10 : 16, minHeight: 70, padding: mob ? "8px 0" : 0 }}>
          <Logo size={mob ? 64 : 110} onClick={() => navigate("/")} />

          <div style={{ display: "flex", gap: 10, alignItems: "center", width: mob ? "100%" : "auto", justifyContent: mob ? "space-between" : "flex-end" }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: mob ? "100%" : "auto", justifyContent: "space-between" }}>
                <button onClick={() => navigate("/hero")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(var(--app-accent-rgb),.25)", background: "rgba(var(--app-accent-rgb),.06)", color: "var(--app-accent)", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer", flex: mob ? 1 : "unset", justifyContent: "center" }}>
                  🎵 Open Player
                </button>
                <UserDropdown user={user} onLogout={handleLogout} navigate={navigate} compact={mob} />
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, width: mob ? "100%" : "auto" }}>
                <Btn onClick={() => navigate("/signup")} full={mob}>Sign Up</Btn>
                <Btn onClick={() => navigate("/Login")} primary full={mob}>Login</Btn>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at 60% 40%,rgba(var(--app-accent-rgb),.12) 0%,transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(217,119,6,.08) 0%,transparent 50%),var(--app-shell-bg)",
        position: "relative", overflow: "hidden", padding: mob ? "130px 16px 70px" : "120px 5% 80px", textAlign: "center",
      }}>
        <div style={{ maxWidth: 720, position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(217,119,6,.1)", border: "1px solid rgba(217,119,6,.25)", borderRadius: 24, padding: mob ? "8px 14px" : "8px 20px", marginBottom: 28, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ color: "#d97706", fontSize: 18, fontFamily: "serif" }}>بِسْمِ اللَّهِ</span>
            <span style={{ color: "var(--app-text-muted)", fontSize: 12 }}>· Islamic Audio Platform</span>
          </div>

          <h1 style={{ fontSize: "clamp(38px,6vw,72px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: "-1px" }}>
            Nourish Your{" "}
            <span style={{ background: "linear-gradient(90deg,var(--app-accent),var(--app-accent-strong))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Qalb</span>
            <br />with Sacred Sound
          </h1>

          <p style={{ fontSize: mob ? 15 : 17, lineHeight: 1.8, color: "var(--app-text-muted)", maxWidth: 500, margin: "0 auto 28px" }}>
            Stream Quran recitations, nasheeds, naats, and Islamic podcasts. Your soul deserves the finest spiritual audio.
          </p>

          <Wave />

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 32 }}>
            {user ? (
              <Btn primary onClick={() => navigate("/hero")} full={mob}>Open Player →</Btn>
            ) : (
              <>
                <Btn primary onClick={() => navigate("/Login")} full={mob}>Start Listening →</Btn>
                <Btn onClick={() => navigate("/signup")} full={mob}>Create Account</Btn>
              </>
            )}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "rgba(var(--app-accent-rgb),.06)", borderTop: "1px solid rgba(var(--app-accent-rgb),.1)", borderBottom: "1px solid rgba(var(--app-accent-rgb),.1)", padding: mob ? "32px 16px" : "44px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: mob ? 16 : 24, textAlign: "center" }}>
          {STATS.map(s => (
            <Fade key={s.label}>
              <div style={{ fontSize: mob ? 28 : 38, fontWeight: 900, color: "var(--app-accent)", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--app-text-muted)" }}>{s.label}</div>
            </Fade>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: mob ? "64px 16px" : "96px 5%", background: "var(--app-shell-bg)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Fade style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "inline-block", background: "rgba(var(--app-accent-rgb),.08)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "6px 16px", borderRadius: 20, marginBottom: 14 }}>What's Inside</div>
            <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, lineHeight: 1.2, marginBottom: 12 }}>Everything for Your Spiritual Journey</h2>
            <p style={{ fontSize: 15, color: "var(--app-text-muted)", maxWidth: 440, margin: "0 auto" }}>One platform. Pure audio. Zero distractions.</p>
          </Fade>

          <div style={{ display: "grid", gridTemplateColumns: mob ? "1fr" : tab ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 18 }}>
            {FEATURES.map(f => (
              <Fade key={f.title}>
                <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 16, padding: mob ? "22px 18px" : "28px 24px", transition: "transform .25s,border-color .25s,background .25s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),.25)"; e.currentTarget.style.background = "rgba(var(--app-accent-rgb),.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "var(--app-border)"; e.currentTarget.style.background = "var(--app-surface)"; }}>
                  <div style={{ fontSize: 30, marginBottom: 14 }}>{f.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13.5, color: "var(--app-text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: mob ? "64px 16px" : "96px 5%", background: "radial-gradient(circle at top,rgba(var(--app-accent-rgb),.12) 0%,transparent 45%),var(--app-shell-bg-alt)", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 820, padding: mob ? "36px 20px" : "56px 48px", borderRadius: 24, background: "var(--app-surface)", border: "1px solid var(--app-border)", boxShadow: "0 20px 60px rgba(0,0,0,.45)", textAlign: "center" }}>
          <Fade>
            <img src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png" alt="QalbAudio"
              style={{ width: mob ? 200 : 240, height: "auto", marginBottom: 28, animation: "float 4s ease-in-out infinite", filter: "drop-shadow(0 10px 25px rgba(var(--app-accent-rgb),.25))" }} />
            <h2 style={{ fontSize: "clamp(28px,5vw,50px)", fontWeight: 900, marginBottom: 16, lineHeight: 1.15 }}>
              {user ? "Welcome Back!" : "Ready to Listen?"}
            </h2>
            <p style={{ maxWidth: 560, margin: "0 auto 36px", fontSize: 15, color: "var(--app-text-muted)", lineHeight: 1.9 }}>
              {user ? "Your spiritual audio journey continues. Open the player and nourish your heart." : "Join thousands discovering Quran recitations, nasheeds, duas, and lectures on QalbAudio."}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              {user ? (
                <Btn primary onClick={() => navigate("/hero")} full={mob}>🎧 Open Player</Btn>
              ) : (
                <>
                  <Btn primary onClick={() => navigate("/signup")} full={mob}>Create Free Account</Btn>
                  <Btn onClick={() => navigate("/login")} full={mob}>Login</Btn>
                </>
              )}
            </div>
          </Fade>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "var(--app-shell-bg-alt)", borderTop: "1px solid rgba(var(--app-accent-rgb),.08)", padding: mob ? "28px 16px" : "36px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: mob ? "center" : "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, textAlign: mob ? "center" : "left" }}>
          <Logo size={mob ? 60 : 100} onClick={() => navigate("/")} />
          <p style={{ fontSize: 12, color: "rgba(229,231,235,.25)" }}>© 2026 <span style={{ color: "var(--app-accent)" }}>QalbAudio</span>. All rights reserved.</p>
          <div style={{ display: "flex", gap: 18 }}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <a key={l} href="#" style={{ fontSize: 13, color: "var(--app-text-muted)", textDecoration: "none" }}
                onMouseOver={e => e.target.style.color = "var(--app-accent)"}
                onMouseOut={e => e.target.style.color = "var(--app-text-muted)"}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}