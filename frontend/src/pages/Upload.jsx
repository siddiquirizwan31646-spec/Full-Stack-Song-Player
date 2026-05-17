import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  Database,
  FileSpreadsheet,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Lock,
  Music4,
  PencilLine,
  PlayCircle,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";
import { useUser } from "@/context/userContext";
import { canAccessUploadCenter } from "@/lib/config";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://bnxahrapojygsulzfqpw.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJueGFocmFwb2p5Z3N1bHpmcXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDA5MTEsImV4cCI6MjA5Mzk3NjkxMX0.NrdMW-eiiVCQLOUnHN0QZmb3GMnnH6bp0Ah3uP4v5uI";
const SONGS_TABLE = "songs";
const AUDIO_BUCKET = import.meta.env.VITE_SUPABASE_AUDIO_BUCKET || "songs";
const IMAGE_BUCKET = import.meta.env.VITE_SUPABASE_IMAGE_BUCKET || "songs";
const AUDIO_PREFIX = import.meta.env.VITE_SUPABASE_AUDIO_PREFIX || "audio";
const IMAGE_PREFIX = import.meta.env.VITE_SUPABASE_IMAGE_PREFIX || "covers";
const MAX_LOG_ENTRIES = 320;
const MAX_QUEUE_PREVIEW = 140;
const UPLOAD_CONCURRENCY = 3;

const ACCEPTED_AUDIO_EXTENSIONS = new Set(["mp3"]);
const ACCEPTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ACCEPTED_SPREADSHEET_EXTENSIONS = new Set(["xlsx", "xls", "csv"]);
const FILTER_TYPES = ["all", "nasheed", "naat", "qawwali", "podcast"];

const STATUS_META = {
  ready:     { label: "Ready",     color: "var(--app-accent)",  background: "rgba(var(--app-accent-rgb),0.12)" },
  uploading: { label: "Uploading", color: "#93c5fd",             background: "rgba(147,197,253,0.12)" },
  success:   { label: "Uploaded",  color: "#4ade80",             background: "rgba(74,222,128,0.12)" },
  failed:    { label: "Failed",    color: "#f87171",             background: "rgba(248,113,113,0.12)" },
  skipped:   { label: "Skipped",   color: "#fbbf24",             background: "rgba(251,191,36,0.12)" },
};

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
  { icon: "⚙", label: "Settings",     id: "settings",  path: "/settings" },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── HELPERS ───────────────────────────────────────────────────────────────────

const formatBytes = (v) => {
  if (!Number.isFinite(v) || v <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  const p = Math.min(Math.floor(Math.log(v) / Math.log(1024)), u.length - 1);
  const s = v / 1024 ** p;
  return `${s.toFixed(s >= 10 || p === 0 ? 0 : 1)} ${u[p]}`;
};
const stripExtension = (n = "") => n.replace(/\.[^/.]+$/, "");
const getExtension = (n = "") => n.split(".").pop()?.toLowerCase() || "";
const slugify = (v = "") =>
  String(v).normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase()
    .replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
const normalizeStem = (v = "") => slugify(stripExtension(v));
const formatDateTime = (v) => {
  if (!v) return "Not available";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    }).format(new Date(v));
  } catch {
    return String(v);
  }
};
const formatDuration = (s) => {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const w = Math.round(s), h = Math.floor(w / 3600),
    m = Math.floor((w % 3600) / 60), sc = w % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sc).padStart(2, "0")}`;
  return `${m}:${String(sc).padStart(2, "0")}`;
};
const normalizeMusicType = (v = "") => {
  const n = slugify(v).replace(/-/g, "");
  if (n.includes("nasheed")) return "nasheed";
  if (n.includes("naat")) return "naat";
  if (n.includes("qawwali")) return "qawwali";
  if (n.includes("podcast")) return "podcast";
  if (n.includes("quran")) return "quran";
  if (n.includes("dua")) return "dua";
  if (n.includes("lecture") || n.includes("khutbah")) return "lecture";
  return slugify(v) || "other";
};
const excelSerialToDate = (s) => new Date(Date.UTC(1899, 11, 30) + s * 86400000);
const parseDurationToSeconds = (v) => {
  if (v == null || v === "") return 0;
  if (typeof v === "number") {
    if (v > 0 && v < 1) return Math.round(v * 24 * 60 * 60);
    return Math.round(v);
  }
  const r = String(v).trim();
  if (!r) return 0;
  if (/^\d+(\.\d+)?$/.test(r)) return Math.round(Number(r));
  const p = r.split(":").map(Number);
  if (p.every(Number.isFinite)) {
    if (p.length === 2) return p[0] * 60 + p[1];
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  }
  return 0;
};
const parseUploadDate = (v) => {
  if (!v && v !== 0) return new Date().toISOString().slice(0, 10);
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    if (v > 10000) {
      const d = excelSerialToDate(v);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    return new Date(v).toISOString().slice(0, 10);
  }
  const d = new Date(String(v));
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
};
const normalizeHeaderKey = (v = "") =>
  String(v).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const pickField = (r, keys) => {
  for (const k of keys) { if (r[k] != null && r[k] !== "") return r[k]; }
  return "";
};
const normalizeSpreadsheetRow = (row, index) => {
  const rec = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [normalizeHeaderKey(k), v])
  );
  return {
    rowIndex: index + 2,
    filename: String(pickField(rec, ["filename", "file", "basename", "songfile", "audiofile"])).trim(),
    stem: normalizeStem(String(pickField(rec, ["filename", "file", "basename", "songfile", "audiofile"])).trim()),
    title: String(pickField(rec, ["title", "name", "songtitle"])).trim(),
    artist: String(pickField(rec, ["artist", "reciter", "singer"])).trim(),
    music_type: normalizeMusicType(pickField(rec, ["type", "musictype", "category"])),
    description: String(pickField(rec, ["description", "desc", "about"])).trim(),
    location: String(pickField(rec, ["location", "country", "city"])).trim(),
    duration: parseDurationToSeconds(pickField(rec, ["duration", "length", "runtime"])),
    date: parseUploadDate(pickField(rec, ["date", "uploaddate", "publishdate"])),
  };
};
const buildFileMap = (files) => {
  const m = new Map();
  files.forEach((f) => m.set(normalizeStem(f.name), f));
  return m;
};
const getPublicUrl = (bucket, path) =>
  supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
const buildStoragePath = (prefix, type, stem, originalName) =>
  `${prefix}/${slugify(type || "other") || "other"}/${stem}.${getExtension(originalName)}`;
const extractStoragePath = (url, bucket) => {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
};
const extractStemFromUrl = (url) => {
  if (!url) return "";
  try {
    const p = new URL(url).pathname;
    return normalizeStem(p.split("/").pop() || "");
  } catch {
    return normalizeStem(url);
  }
};
const buildDuplicateIndex = (songs) => {
  const filenameStems = new Set(), signatures = new Set();
  songs.forEach((s) => {
    const stem = extractStemFromUrl(s.mp3_url);
    if (stem) filenameStems.add(stem);
    signatures.add(
      [slugify(s.name), slugify(s.artist), normalizeMusicType(s.music_type)]
        .filter(Boolean).join("|")
    );
  });
  return { filenameStems, signatures };
};
const createSignature = ({ title, artist, music_type }) =>
  [slugify(title), slugify(artist), normalizeMusicType(music_type)]
    .filter(Boolean).join("|");
const trimLogs = (logs) => logs.slice(0, MAX_LOG_ENTRIES);

// ── SHARED STYLES ─────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  *{box-sizing:border-box}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-18px) scale(1.03)}}
  @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(14px) scale(0.97)}}
  @keyframes wave{from{transform:scaleY(0.35)}to{transform:scaleY(1)}}
  .spin{animation:spin 1s linear infinite}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.2);border-radius:2px}
  .sidebar{width:216px;background:var(--app-shell-bg-alt);border-right:1px solid rgba(var(--app-accent-rgb),0.1);display:flex;flex-direction:column;flex-shrink:0;transition:transform 0.28s cubic-bezier(.4,0,.2,1)}
  @media(max-width:768px){.sidebar{position:fixed;left:0;top:0;bottom:0;z-index:200;width:250px;transform:translateX(-100%);box-shadow:4px 0 40px rgba(0,0,0,0.6)}.sidebar.open{transform:translateX(0)}}
  .nav-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:3px;font-size:13px;font-weight:500;color:var(--app-text-muted);border-left:3px solid transparent;transition:all 0.18s}
  .nav-item:hover{background:var(--app-surface);color:var(--app-text-main)}
  .nav-item.active{background:rgba(var(--app-accent-rgb),0.12);border-left-color:var(--app-accent);color:var(--app-accent);font-weight:700}
  .hamburger{display:none;background:none;border:none;color:var(--app-text-main);font-size:20px;cursor:pointer;padding:6px 8px;border-radius:8px;flex-shrink:0;line-height:1;transition:background 0.15s}
  .hamburger:hover{background:var(--app-surface)}
  @media(max-width:768px){.hamburger{display:flex;align-items:center;justify-content:center}}
  .mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:199;backdrop-filter:blur(3px)}
  @media(max-width:768px){.mob-overlay.visible{display:block}}
  .upload-topbar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--app-shell-bg-alt);border-bottom:1px solid rgba(var(--app-accent-rgb),0.08);flex-shrink:0}
  .upload-content{flex:1;overflow-y:auto;padding:20px 16px 60px}
  .upload-stats-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}
  @media(max-width:900px){.upload-stats-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:480px){.upload-stats-grid{grid-template-columns:1fr 1fr}}
  .upload-shell-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(320px,0.95fr);gap:16px}
  @media(max-width:1000px){.upload-shell-grid{grid-template-columns:1fr}}
  @media(max-width:1000px){.upload-right-col{position:static!important}}
  .upload-library-item{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:14px;align-items:center}
  @media(max-width:600px){.upload-library-item{grid-template-columns:50px minmax(0,1fr);gap:10px}.upload-library-actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}}
  .upload-hero-toolbar{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
  .upload-automation-card{min-width:240px;max-width:320px;background:rgba(255,255,255,0.03);border:1px solid var(--app-border);border-radius:12px;padding:14px}
  @media(max-width:700px){.upload-automation-card{max-width:100%;width:100%}}
  .upload-filter-pill:hover{border-color:rgba(var(--app-accent-rgb),0.34)!important;color:var(--app-accent)!important}
  .upload-hover-card:hover{transform:translateY(-2px);border-color:rgba(var(--app-accent-rgb),0.25)!important;box-shadow:0 12px 40px rgba(0,0,0,0.25)}
  .upload-hover-card{transition:all 0.22s}
  .upload-scrollable::-webkit-scrollbar{width:4px}
  .upload-scrollable::-webkit-scrollbar-thumb{background:rgba(var(--app-accent-rgb),0.2);border-radius:999px}
  .upload-search-wrap{position:relative;min-width:0;flex:1;max-width:280px}
  @media(max-width:600px){.upload-search-wrap{max-width:100%}}
  .gate-input{width:100%;background:var(--app-surface);border:1px solid var(--app-border);border-radius:10px;padding:12px 14px;color:var(--app-text-main);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color 0.2s}
  .gate-input:focus{border-color:var(--app-accent)}
  .gate-input::placeholder{color:var(--app-text-muted)}
  .gate-btn{width:100%;padding:13px 0;border-radius:12px;border:none;background:linear-gradient(135deg,var(--app-accent-strong),var(--app-accent));color:#000;font-family:'DM Sans',sans-serif;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 4px 22px rgba(var(--app-accent-rgb),0.35);transition:transform 0.15s,opacity 0.2s;display:flex;align-items:center;justify-content:center;gap:8px}
  .gate-btn:hover:not(:disabled){transform:translateY(-1px)}
  .gate-btn:disabled{opacity:0.65;cursor:not-allowed}
`;

// ── ADMIN GATE ────────────────────────────────────────────────────────────────

function AdminGate() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // FIX: loading state is actually used now
  const [loading, setLoading] = useState(false);

  // FIX: AdminGate should NOT navigate to /upload then reload — that just loops
  // back to AdminGate. Instead we store a session flag and let the parent re-check.
  const handleLogin = () => {
    const adminUser = import.meta.env.VITE_UPLOAD_ADMIN_USERNAME;
    const adminPass = import.meta.env.VITE_UPLOAD_ADMIN_PASSWORD;

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    setError("");

    // Simulate a tiny async check to show loading state
    setTimeout(() => {
      if (username.trim() === adminUser && password === adminPass) {
        // Store a short-lived session flag so UploadPage re-renders as granted
        sessionStorage.setItem("__upload_admin_granted__", "1");
        // Force a re-render of the parent by navigating to same route
        navigate(0); // React Router v6: navigate(0) refreshes the current route
      } else {
        setError("Invalid username or password.");
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "var(--app-shell-bg)", color: "var(--app-text-main)",
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{GLOBAL_CSS}</style>

      <DashboardNavbar />

      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(var(--app-accent-rgb),0.1) 0%,transparent 70%)", pointerEvents: "none", animation: "float1 7s ease-in-out infinite" }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(var(--app-accent-rgb),0.07) 0%,transparent 70%)", pointerEvents: "none", animation: "float2 9s ease-in-out infinite" }} />

      {/* Watermark */}
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(60px,14vw,180px)", fontWeight: 900, color: "rgba(var(--app-accent-rgb),0.03)", letterSpacing: "-4px", whiteSpace: "nowrap", userSelect: "none", transform: "rotate(-20deg)" }}>QalbAudio</span>
      </div>

      {/* Mini waveform */}
      <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "flex-end", gap: 3, opacity: 0.15, pointerEvents: "none" }}>
        {Array.from({ length: 18 }).map((_, i) => {
          const h = 8 + Math.sin(i * 0.9) * 10 + ((i * 5) % 8);
          return <div key={i} style={{ width: 3, height: h, background: "var(--app-accent)", borderRadius: 2, animation: `wave ${0.7 + (i % 4) * 0.1}s ease-in-out infinite alternate`, animationDelay: `${i * 0.06}s` }} />;
        })}
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{
            background: "var(--app-shell-bg-alt)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(var(--app-accent-rgb),0.18)",
            borderRadius: 20,
            boxShadow: "0 12px 60px rgba(0,0,0,0.5)",
            padding: "36px 32px",
            maxWidth: 420, width: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
            <img
              src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
              alt="QalbAudio"
              style={{ height: 52, width: "auto", objectFit: "contain", marginBottom: 14 }}
            />
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 24px rgba(var(--app-accent-rgb),0.4)" }}>
              <Lock size={22} color="#000" />
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--app-text-main)", textAlign: "center", margin: "0 0 6px" }}>Admin Access</h2>
          {/* FIX: accurate description — this is the credential gate, not a config instruction */}
          <p style={{ fontSize: 13, color: "var(--app-text-muted)", textAlign: "center", margin: "0 0 22px", lineHeight: 1.6 }}>
            Enter your admin credentials to access the upload center.
          </p>

          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(var(--app-accent-rgb),0.4),transparent)", marginBottom: 22 }} />

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#f87171", fontSize: 13, textAlign: "center" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--app-text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Username</label>
              <input
                className="gate-input"
                type="text"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--app-text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Password</label>
              <input
                className="gate-input"
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleLogin()}
              />
            </div>

            <button className="gate-btn" onClick={handleLogin} disabled={loading} style={{ marginTop: 4 }}>
              {/* FIX: uses actual loading state, and spin class instead of missing Tailwind animate-spin */}
              {loading ? <><Loader2 size={16} className="spin" /> Verifying…</> : "Enter Upload Center"}
            </button>

            <button
              onClick={() => navigate("/hero")}
              style={{ background: "none", border: "none", color: "var(--app-text-muted)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, margin: "0 auto", transition: "color 0.2s", padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--app-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--app-text-muted)")}
            >
              ← Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, hint, accent = false }) {
  return (
    <div style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 12, padding: "16px 16px 14px", boxShadow: "var(--app-shadow)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", background: accent ? "rgba(var(--app-accent-rgb),0.14)" : "rgba(148,163,184,0.12)", color: accent ? "var(--app-accent)" : "var(--app-text-muted)", marginBottom: 10 }}>
        <Icon size={17} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em" }}>{value}</div>
      <div style={{ color: "var(--app-text-muted)", fontSize: 12, fontWeight: 700, marginTop: 3 }}>{label}</div>
      {hint && <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

function FolderDropArea({ title, subtitle, count, totalSize, icon: Icon, buttonLabel, onPick, disabled, isDragActive, isDragReject, rootProps, inputProps }) {
  return (
    <div
      {...rootProps}
      style={{
        borderRadius: 12,
        border: isDragReject
          ? "1px solid rgba(248,113,113,0.4)"
          : isDragActive
            ? "1px solid rgba(var(--app-accent-rgb),0.36)"
            : "1px solid var(--app-border)",
        background: isDragActive ? "rgba(var(--app-accent-rgb),0.08)" : "var(--app-surface)",
        padding: 18,
        boxShadow: "var(--app-shadow)",
        transition: "all 0.22s",
      }}
    >
      <input {...inputProps} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", background: "rgba(var(--app-accent-rgb),0.12)", color: "var(--app-accent)", flexShrink: 0 }}>
            <Icon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{title}</div>
            <div style={{ color: "var(--app-text-muted)", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <span style={{ padding: "5px 10px", borderRadius: 999, background: "rgba(var(--app-accent-rgb),0.1)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700 }}>{count} item{count === 1 ? "" : "s"}</span>
              <span style={{ padding: "5px 10px", borderRadius: 999, background: "rgba(148,163,184,0.12)", color: "var(--app-text-muted)", fontSize: 11, fontWeight: 700 }}>{totalSize}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPick(); }}
          disabled={disabled}
          style={{ border: "1px solid rgba(var(--app-accent-rgb),0.24)", background: disabled ? "rgba(148,163,184,0.1)" : "rgba(var(--app-accent-rgb),0.1)", color: disabled ? "var(--app-text-muted)" : "var(--app-accent)", borderRadius: 999, padding: "9px 13px", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, whiteSpace: "nowrap", fontSize: 13 }}
        >
          {buttonLabel}
        </button>
      </div>
      <div style={{ marginTop: 14, borderRadius: 14, border: "1px dashed rgba(var(--app-accent-rgb),0.22)", padding: "14px 14px", color: "var(--app-text-muted)", fontSize: 12, background: isDragActive ? "rgba(var(--app-accent-rgb),0.06)" : "rgba(255,255,255,0.02)" }}>
        {isDragReject
          ? "This drop does not match the expected file type."
          : isDragActive
            ? "Drop the folder contents here."
            : "Drag a folder here or use the picker button."}
      </div>
    </div>
  );
}

// FIX: EditSongModal now accepts songId as a separate stable prop so the
// saving check doesn't depend on editingSong reference changing mid-save.
function EditSongModal({ song, songId, onClose, onSave, saving }) {
  const [draft, setDraft] = useState({
    name: "", artist: "", music_type: "", description: "",
    duration: 0, date: "", location: "",
  });

  useEffect(() => {
    if (song) {
      setDraft({
        name: song.name || "",
        artist: song.artist || "",
        music_type: song.music_type || "",
        description: song.description || "",
        duration: song.duration || 0,
        date: song.date || "",
        location: song.location || "",
      });
    }
  }, [song]);

  if (!song) return null;

  const fields = [
    { key: "name",     label: "Title",            type: "text"   },
    { key: "artist",   label: "Artist",           type: "text"   },
    { key: "music_type", label: "Type",           type: "text"   },
    { key: "location", label: "Location",         type: "text"   },
    { key: "duration", label: "Duration (seconds)", type: "number" },
    { key: "date",     label: "Upload date",      type: "date"   },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(3,7,4,0.76)", backdropFilter: "blur(14px)", zIndex: 300, display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 600, borderRadius: 16, background: "var(--app-surface-solid)", border: "1px solid var(--app-border)", boxShadow: "0 30px 80px rgba(0,0,0,0.36)", padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ color: "var(--app-accent)", fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>Edit Metadata</div>
            <h3 style={{ margin: "6px 0 0", fontSize: 20, letterSpacing: "-0.03em" }}>Update uploaded song</h3>
          </div>
          <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--app-border)", background: "transparent", color: "var(--app-text-muted)", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
          {fields.map((field) => (
            <label key={field.key} style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 11, color: "var(--app-text-muted)", fontWeight: 700 }}>{field.label}</span>
              <input
                type={field.type}
                value={draft[field.key]}
                onChange={(e) =>
                  setDraft((c) => ({
                    ...c,
                    [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                  }))
                }
                style={{ width: "100%", background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 12, padding: "10px 12px", color: "var(--app-text-main)", outline: "none", boxSizing: "border-box", fontSize: 13 }}
              />
            </label>
          ))}
        </div>

        <label style={{ display: "grid", gap: 6, marginTop: 12 }}>
          <span style={{ fontSize: 11, color: "var(--app-text-muted)", fontWeight: 700 }}>Description</span>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((c) => ({ ...c, description: e.target.value }))}
            rows={3}
            style={{ width: "100%", background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 14, padding: "10px 12px", color: "var(--app-text-main)", resize: "vertical", outline: "none", boxSizing: "border-box", fontSize: 13 }}
          />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{ padding: "10px 14px", borderRadius: 999, border: "1px solid var(--app-border)", background: "transparent", color: "var(--app-text-muted)", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            Cancel
          </button>
          {/* FIX: uses songId prop for save-in-progress check, not editingSong ref */}
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(draft)}
            style={{ padding: "10px 16px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", color: "#041307", cursor: saving ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 13, boxShadow: "0 8px 20px rgba(var(--app-accent-rgb),0.24)" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export default function UploadPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const displayName = user?.username || "Guest";

  // FIX: also check the session-storage flag set by AdminGate on successful login
  const hasSessionGrant = sessionStorage.getItem("__upload_admin_granted__") === "1";

  if (!canAccessUploadCenter(user) && !hasSessionGrant) return <AdminGate />;

  return <UploadCenter navigate={navigate} displayName={displayName} onLock={() => {
    sessionStorage.removeItem("__upload_admin_granted__");
    navigate(0);
  }} />;
}

// ── UPLOAD CENTER ─────────────────────────────────────────────────────────────

function UploadCenter({ navigate, displayName, onLock }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // FIX: file inputs are rendered as normal controlled inputs, NOT hidden with
  // webkitdirectory set via refs after mount (unreliable). We use separate
  // inputs for each type with correct accept attributes. The "folder" UX is
  // provided by the dropzone; the picker falls back to multi-file select.
  const songsInputRef = useRef(null);
  const imagesInputRef = useRef(null);
  const spreadsheetInputRef = useRef(null);

  // queueItemsRef mirrors queueItems state so async callbacks always read
  // latest values without stale closures.
  const queueItemsRef = useRef([]);

  const [songFiles, setSongFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [spreadsheetFiles, setSpreadsheetFiles] = useState([]);
  const [queueItems, setQueueItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedSongs, setUploadedSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingSong, setEditingSong] = useState(null);
  // FIX: track saving by song ID directly, stable across state updates
  const [savingSongId, setSavingSongId] = useState(null);
  const [deletingSongId, setDeletingSongId] = useState(null);
  const [autoRun, setAutoRun] = useState(true);

  // FIX: track whether we SHOULD auto-run as a ref, not state, to avoid
  // the effect firing multiple times due to batched state updates.
  const pendingAutoRunRef = useRef(false);

  const commitQueueItems = useCallback((nextOrUpdater) => {
    const next =
      typeof nextOrUpdater === "function"
        ? nextOrUpdater(queueItemsRef.current)
        : nextOrUpdater;
    queueItemsRef.current = next;
    setQueueItems(next);
    return next;
  }, []);

  const appendLog = useCallback((level, message) => {
    setLogs((cur) =>
      trimLogs([
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          level,
          message,
          createdAt: new Date().toISOString(),
        },
        ...cur,
      ])
    );
  }, []);

  const fetchUploadedSongs = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setSongsLoading(true);
    const { data, error } = await supabase
      .from(SONGS_TABLE)
      .select("id,name,artist,music_type,description,duration,date,location,mp3_url,cover_url,created_at")
      .order("created_at", { ascending: false })
      .range(0, 999);
    if (error) {
      if (!silent) setSongsLoading(false);
      throw error;
    }
    setUploadedSongs(data || []);
    if (!silent) setSongsLoading(false);
    return data || [];
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    fetchUploadedSongs()
      .then((rows) => { if (mounted) appendLog("info", `Loaded ${rows.length} existing song records.`); })
      .catch((e) => toast.error(e.message || "Unable to load songs."));
    return () => { mounted = false; };
  }, [appendLog, fetchUploadedSongs]);

  const totalSongSize = useMemo(() =>
    formatBytes(songFiles.reduce((s, f) => s + f.size, 0)), [songFiles]);
  const totalImageSize = useMemo(() =>
    formatBytes(imageFiles.reduce((s, f) => s + f.size, 0)), [imageFiles]);
  const totalSpreadsheetSize = useMemo(() =>
    formatBytes(spreadsheetFiles.reduce((s, f) => s + f.size, 0)), [spreadsheetFiles]);

  const queueStats = useMemo(() => {
    const s = { total: queueItems.length, ready: 0, uploading: 0, success: 0, failed: 0, skipped: 0 };
    queueItems.forEach((i) => { s[i.status] = (s[i.status] || 0) + 1; });
    return s;
  }, [queueItems]);

  const filteredSongs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return uploadedSongs.filter((s) => {
      if (typeFilter !== "all" && normalizeMusicType(s.music_type) !== typeFilter) return false;
      if (!term) return true;
      return [s.name, s.artist, s.location, s.music_type, s.description]
        .filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [searchTerm, typeFilter, uploadedSongs]);

  const queuePreview = useMemo(() => queueItems.slice(0, MAX_QUEUE_PREVIEW), [queueItems]);

  const updateQueueItem = useCallback((itemId, nextVal) => {
    commitQueueItems((cur) =>
      cur.map((item) => {
        if (item.id !== itemId) return item;
        const patch = typeof nextVal === "function" ? nextVal(item) : nextVal;
        return { ...item, ...patch };
      })
    );
  }, [commitQueueItems]);

  const assignFiles = useCallback((kind, files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    if (kind === "songs") {
      const f = arr.filter((x) => ACCEPTED_AUDIO_EXTENSIONS.has(getExtension(x.name)));
      setSongFiles(f);
      pendingAutoRunRef.current = true;
      appendLog("info", `Selected ${f.length} audio file(s).`);
      toast.success(`${f.length} song file(s) loaded.`);
    } else if (kind === "images") {
      const f = arr.filter((x) => ACCEPTED_IMAGE_EXTENSIONS.has(getExtension(x.name)));
      setImageFiles(f);
      pendingAutoRunRef.current = true;
      appendLog("info", `Selected ${f.length} image file(s).`);
      toast.success(`${f.length} cover image(s) loaded.`);
    } else if (kind === "spreadsheet") {
      const f = arr.filter((x) => ACCEPTED_SPREADSHEET_EXTENSIONS.has(getExtension(x.name)));
      setSpreadsheetFiles(f.slice(0, 1));
      pendingAutoRunRef.current = true;
      appendLog("info", f[0] ? `Selected spreadsheet: ${f[0].name}.` : "No spreadsheet found.");
      if (f[0]) toast.success(`Spreadsheet "${f[0].name}" loaded.`);
      else toast.error("No spreadsheet found.");
    }
  }, [appendLog]);

  const songsDropzone = useDropzone({
    noClick: true, noKeyboard: true, multiple: true,
    accept: { "audio/mpeg": [".mp3"] },
    onDropAccepted: (f) => assignFiles("songs", f),
    onDropRejected: () => toast.error("Only MP3 files are supported."),
  });
  const imagesDropzone = useDropzone({
    noClick: true, noKeyboard: true, multiple: true,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    onDropAccepted: (f) => assignFiles("images", f),
    onDropRejected: () => toast.error("Only JPG, PNG, or WEBP images."),
  });
  const spreadsheetDropzone = useDropzone({
    noClick: true, noKeyboard: true, multiple: true,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    onDropAccepted: (f) => assignFiles("spreadsheet", f),
    onDropRejected: () => toast.error("Only XLSX, XLS, or CSV."),
  });

  const uploadAsset = useCallback(async (bucket, path, file) => {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false, contentType: file.type || undefined, cacheControl: "3600" });
    if (error && !/exists/i.test(error.message || "")) throw error;
    return getPublicUrl(bucket, path);
  }, []);

  const removeUploadedAssets = useCallback(async (song) => {
    const tasks = [];
    const a = extractStoragePath(song.mp3_url, AUDIO_BUCKET);
    if (a) tasks.push(supabase.storage.from(AUDIO_BUCKET).remove([a]));
    const c = extractStoragePath(song.cover_url, IMAGE_BUCKET);
    if (c) tasks.push(supabase.storage.from(IMAGE_BUCKET).remove([c]));
    if (tasks.length) await Promise.all(tasks);
  }, []);

  const processSingleQueueItem = useCallback(async (itemId) => {
    const item = queueItemsRef.current.find((e) => e.id === itemId);
    if (!item) return;

    updateQueueItem(itemId, (c) => ({ status: "uploading", progress: 8, attempts: c.attempts + 1, error: "" }));
    appendLog("info", `Uploading "${item.metadata.title}" from row ${item.metadata.rowIndex}.`);

    const audioPath = buildStoragePath(AUDIO_PREFIX, item.metadata.music_type, item.storageStem, item.audioFile.name);
    const imagePath = buildStoragePath(IMAGE_PREFIX, item.metadata.music_type, item.storageStem, item.imageFile.name);

    try {
      updateQueueItem(itemId, { progress: 28 });
      const mp3Url = await uploadAsset(AUDIO_BUCKET, audioPath, item.audioFile);
      updateQueueItem(itemId, { progress: 58 });
      const coverUrl = await uploadAsset(IMAGE_BUCKET, imagePath, item.imageFile);
      updateQueueItem(itemId, { progress: 82 });

      const payload = {
        name: item.metadata.title,
        artist: item.metadata.artist,
        music_type: item.metadata.music_type,
        description: item.metadata.description || null,
        duration: item.metadata.duration || null,
        date: item.metadata.date,
        location: item.metadata.location || null,
        mp3_url: mp3Url,
        cover_url: coverUrl,
      };

      const { error } = await supabase.from(SONGS_TABLE).insert(payload);
      if (error) {
        if (/duplicate|unique/i.test(error.message || "")) {
          updateQueueItem(itemId, { status: "skipped", progress: 100, error: "Duplicate row skipped", mp3_url: mp3Url, cover_url: coverUrl });
          appendLog("warn", `Skipped duplicate: "${item.metadata.title}".`);
          return;
        }
        await Promise.allSettled([
          supabase.storage.from(AUDIO_BUCKET).remove([audioPath]),
          supabase.storage.from(IMAGE_BUCKET).remove([imagePath]),
        ]);
        throw error;
      }

      updateQueueItem(itemId, { status: "success", progress: 100, mp3_url: mp3Url, cover_url: coverUrl });
      appendLog("success", `Uploaded "${item.metadata.title}" successfully.`);
    } catch (err) {
      updateQueueItem(itemId, { status: "failed", progress: 100, error: err.message || "Upload failed." });
      appendLog("error", `Failed "${item.metadata.title}": ${err.message || "Unknown error"}.`);
    }
  }, [appendLog, updateQueueItem, uploadAsset]);

  // FIX: startQueueProcessing does NOT depend on prepareQueue, breaking the
  // circular dependency. It reads queue from ref.
  const startQueueProcessing = useCallback(async (specificIds = null) => {
    const ids =
      specificIds ||
      queueItemsRef.current
        .filter((i) => i.status === "ready" || i.status === "failed")
        .map((i) => i.id);

    if (!ids.length) { toast.error("No queue items ready for upload."); return; }

    setIsUploading(true);
    appendLog("info", `Starting batch upload for ${ids.length} song(s).`);

    let cursor = 0;
    const worker = async () => {
      while (cursor < ids.length) {
        const idx = cursor++;
        const id = ids[idx];
        if (!id) return;
        await processSingleQueueItem(id);
      }
    };

    try {
      await Promise.all(
        Array.from({ length: Math.min(UPLOAD_CONCURRENCY, ids.length) }, () => worker())
      );
      await fetchUploadedSongs({ silent: true });
      const fs = queueItemsRef.current.reduce(
        (s, i) => { s[i.status] = (s[i.status] || 0) + 1; return s; },
        { ready: 0, uploading: 0, success: 0, failed: 0, skipped: 0 }
      );
      toast.success(`Done: ${fs.success} uploaded, ${fs.skipped} skipped, ${fs.failed} failed.`);
      appendLog("success", "Bulk upload finished.");
    } finally {
      setIsUploading(false);
    }
  }, [appendLog, fetchUploadedSongs, processSingleQueueItem]);

  const prepareQueue = useCallback(async (startImmediately = false) => {
    // Read latest file state from closure — these are stable array references
    if (!songFiles.length || !imageFiles.length || !spreadsheetFiles.length) {
      toast.error("Please select all three folders first.");
      return;
    }

    setIsPreparing(true);
    appendLog("info", "Reading spreadsheet and matching files.");

    try {
      const buffer = await spreadsheetFiles[0].arrayBuffer();
      const XLSX = await import("xlsx");
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" })
        .map(normalizeSpreadsheetRow)
        .filter((r) => r.filename);

      if (!rows.length) throw new Error("No rows with a filename column found.");

      const latestSongs = await fetchUploadedSongs({ silent: true });
      const duplicates = buildDuplicateIndex(latestSongs);
      const audioMap = buildFileMap(songFiles);
      const imageMap = buildFileMap(imageFiles);
      const stems = new Set(rows.map((r) => r.stem));

      const nextQueue = rows.map((row) => {
        const audioFile = audioMap.get(row.stem);
        const imageFile = imageMap.get(row.stem);
        const sig = createSignature(row);
        const dup = duplicates.filenameStems.has(row.stem) || duplicates.signatures.has(sig);
        const errs = [];
        if (!row.title) errs.push("Missing title");
        if (!row.artist) errs.push("Missing artist");
        if (!row.music_type) errs.push("Missing type");
        if (!audioFile) errs.push("Missing MP3");
        if (!imageFile) errs.push("Missing image");

        const stem = row.stem || slugify(`${row.title}-${row.artist}`) || `row-${row.rowIndex}`;

        // FIX: suffix with rowIndex to guarantee unique IDs even for duplicate stems
        const id = `${stem}--r${row.rowIndex}`;
        const base = { id, storageStem: stem, attempts: 0, metadata: row, audioFile, imageFile };

        if (dup) return { ...base, status: "skipped", progress: 100, error: "Duplicate detected" };
        if (errs.length) return { ...base, status: "failed", progress: 100, error: errs.join(", ") };
        return { ...base, status: "ready", progress: 0, error: "" };
      });

      songFiles.forEach((f) => {
        if (!stems.has(normalizeStem(f.name)))
          appendLog("warn", `Audio "${f.name}" has no spreadsheet row.`);
      });
      imageFiles.forEach((f) => {
        if (!stems.has(normalizeStem(f.name)))
          appendLog("warn", `Image "${f.name}" has no spreadsheet row.`);
      });

      commitQueueItems(nextQueue);
      appendLog("info", `Prepared ${nextQueue.length} items: ${nextQueue.filter((i) => i.status === "ready").length} ready, ${nextQueue.filter((i) => i.status === "skipped").length} duplicate, ${nextQueue.filter((i) => i.status === "failed").length} failed.`);
      toast.success("Queue prepared successfully.");

      if (startImmediately) {
        const readyIds = nextQueue.filter((i) => i.status === "ready").map((i) => i.id);
        if (readyIds.length) await startQueueProcessing(readyIds);
        else toast.error("No valid rows ready to upload.");
      }
    } catch (e) {
      toast.error(e.message || "Unable to prepare queue.");
      appendLog("error", e.message || "Queue preparation failed.");
    } finally {
      setIsPreparing(false);
    }
  }, [appendLog, commitQueueItems, fetchUploadedSongs, imageFiles, songFiles, spreadsheetFiles, startQueueProcessing]);

  // FIX: auto-run effect uses a ref flag to avoid multiple triggers from batched
  // state updates. The effect fires when file counts change; it checks the ref
  // and resets it before calling prepareQueue to prevent double-runs.
  useEffect(() => {
    if (!autoRun) return;
    if (!pendingAutoRunRef.current) return;
    if (isPreparing || isUploading) return;
    if (!songFiles.length || !imageFiles.length || !spreadsheetFiles.length) return;

    pendingAutoRunRef.current = false;
    prepareQueue(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, songFiles.length, imageFiles.length, spreadsheetFiles.length, isPreparing, isUploading]);

  const retryFailedItems = useCallback(async () => {
    const ids = queueItemsRef.current
      .filter((i) => i.status === "failed" && i.audioFile && i.imageFile)
      .map((i) => i.id);
    if (!ids.length) { toast.error("No retryable failed items."); return; }
    commitQueueItems((cur) =>
      cur.map((i) => ids.includes(i.id) ? { ...i, status: "ready", progress: 0, error: "" } : i)
    );
    await startQueueProcessing(ids);
  }, [commitQueueItems, startQueueProcessing]);

  const handleDeleteSong = useCallback(async (song) => {
    if (!window.confirm(`Delete "${song.name}" and its uploaded files?`)) return;
    try {
      setDeletingSongId(song.id);
      await removeUploadedAssets(song);
      const { error } = await supabase.from(SONGS_TABLE).delete().eq("id", song.id);
      if (error) throw error;
      setUploadedSongs((cur) => cur.filter((s) => s.id !== song.id));
      appendLog("warn", `Deleted "${song.name}".`);
      toast.success(`Deleted "${song.name}".`);
    } catch (e) {
      toast.error(e.message || "Unable to delete song.");
    } finally {
      setDeletingSongId(null);
    }
  }, [appendLog, removeUploadedAssets]);

  const handleSaveSongEdit = useCallback(async (draft) => {
    if (!editingSong) return;
    const songId = editingSong.id; // capture before any state change
    try {
      setSavingSongId(songId);
      const payload = {
        name: draft.name.trim(),
        artist: draft.artist.trim(),
        music_type: normalizeMusicType(draft.music_type),
        description: draft.description.trim() || null,
        duration: Number(draft.duration) || null,
        date: draft.date || null,
        location: draft.location.trim() || null,
      };
      const { data, error } = await supabase
        .from(SONGS_TABLE)
        .update(payload)
        .eq("id", songId)
        .select("id,name,artist,music_type,description,duration,date,location,mp3_url,cover_url,created_at")
        .single();
      if (error) throw error;
      setUploadedSongs((cur) => cur.map((s) => s.id === songId ? data : s));
      setEditingSong(null);
      appendLog("success", `Updated "${payload.name}".`);
      toast.success("Song metadata updated.");
    } catch (e) {
      toast.error(e.message || "Unable to save changes.");
    } finally {
      setSavingSongId(null);
    }
  }, [appendLog, editingSong]);

  const clearSelections = useCallback(() => {
    setSongFiles([]);
    setImageFiles([]);
    setSpreadsheetFiles([]);
    commitQueueItems([]);
    pendingAutoRunRef.current = false;
    appendLog("info", "Cleared selections and queue.");
  }, [appendLog, commitQueueItems]);

  const isBusy = isPreparing || isUploading;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--app-shell-bg)", color: "var(--app-text-main)", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{GLOBAL_CSS}</style>

      <DashboardNavbar />
      <div className={`mob-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* FIX: hidden file inputs — NO webkitdirectory, just multi-file accept.
          Folders are handled by drag-and-drop (dropzone). The picker opens a
          normal file-select dialog for cross-browser compatibility. */}
      <input
        ref={songsInputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        multiple
        hidden
        onChange={(e) => { assignFiles("songs", e.target.files); e.target.value = ""; }}
      />
      <input
        ref={imagesInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/*"
        multiple
        hidden
        onChange={(e) => { assignFiles("images", e.target.files); e.target.value = ""; }}
      />
      <input
        ref={spreadsheetInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        hidden
        onChange={(e) => { assignFiles("spreadsheet", e.target.files); e.target.value = ""; }}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* SIDEBAR */}
        <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <img
              src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
              alt="QalbAudio"
              onClick={() => { navigate("/"); setSidebarOpen(false); }}
              style={{ height: 60, width: "auto", maxWidth: "88%", objectFit: "contain", cursor: "pointer", display: "block" }}
            />
            <div style={{ fontSize: 11, color: "var(--app-text-muted)", textAlign: "center" }}>
              <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
            </div>
          </div>
          <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
            {NAV_ITEMS.map((item) => (
              <div key={item.id} className="nav-item" onClick={() => { navigate(item.path); setSidebarOpen(false); }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>{item.label}
              </div>
            ))}
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />
            {NAV_BOTTOM.map((item) => (
              <div
                key={item.id}
                className={`nav-item${item.id === "upload" ? " active" : ""}`}
                style={{ color: item.id === "upload" ? "var(--app-accent)" : undefined }}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>{item.label}
              </div>
            ))}
            <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />
            <div className="nav-item" style={{ color: "#f87171" }} onClick={onLock}>
              <span style={{ fontSize: 16 }}>🔒</span> Lock Admin
            </div>
          </nav>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Top bar */}
          <div className="upload-topbar">
            <button className="hamburger" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>⬆</span>
              <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700 }}>Upload Audio</span>
              <span style={{ background: "rgba(var(--app-accent-rgb),0.15)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(var(--app-accent-rgb),0.3)" }}>Admin</span>
            </div>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={() => prepareQueue(true)}
              disabled={isBusy}
              style={{ padding: "8px 14px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", color: "#041307", cursor: isBusy ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 12, boxShadow: "0 4px 14px rgba(var(--app-accent-rgb),0.3)", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}
            >
              {isPreparing ? <><Loader2 size={13} className="spin" /> Preparing…</> : isUploading ? <><Loader2 size={13} className="spin" /> Uploading…</> : "Run Automation"}
            </button>
          </div>

          <div className="upload-content">

            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ background: "var(--app-surface)", border: "1px solid rgba(var(--app-accent-rgb),0.18)", borderRadius: 14, padding: "18px 20px", marginBottom: 16, position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg,rgba(var(--app-accent-rgb),0.12),transparent 40%,transparent 70%,rgba(var(--app-accent-rgb),0.06))", pointerEvents: "none" }} />
              <div className="upload-hero-toolbar" style={{ position: "relative" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(var(--app-accent-rgb),0.1)", color: "var(--app-accent)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                    <Sparkles size={12} /> Bulk Upload Automation
                  </div>
                  <h1 style={{ margin: "0 0 6px", fontSize: "clamp(18px,3.5vw,28px)", letterSpacing: "-0.04em", lineHeight: 1.1 }}>QalbAudio Admin Upload Center</h1>
                  <p style={{ margin: 0, color: "var(--app-text-muted)", lineHeight: 1.7, fontSize: 13, maxWidth: 600 }}>
                    Select songs, images, and spreadsheet. The system matches files by filename, uploads to Supabase Storage, writes metadata to SQL, and skips duplicates automatically.
                  </p>
                </div>
                <div className="upload-automation-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--app-text-muted)", fontWeight: 700 }}>Automation mode</div>
                      <div style={{ marginTop: 4, fontSize: 14, fontWeight: 800 }}>{autoRun ? "Auto run enabled" : "Manual review"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoRun((v) => !v)}
                      style={{ width: 52, height: 30, borderRadius: 999, border: "none", background: autoRun ? "var(--app-accent)" : "rgba(148,163,184,0.28)", padding: 3, display: "flex", justifyContent: autoRun ? "flex-end" : "flex-start", cursor: "pointer", flexShrink: 0 }}
                    >
                      <span style={{ width: 24, height: 24, borderRadius: "50%", background: autoRun ? "#041307" : "#fff", boxShadow: "0 4px 10px rgba(0,0,0,0.24)" }} />
                    </button>
                  </div>
                  <div style={{ marginTop: 8, color: "var(--app-text-muted)", fontSize: 11, lineHeight: 1.6 }}>
                    {autoRun ? "Uploads automatically once all files are selected." : "Inspect the queue before the batch starts."}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="upload-stats-grid">
              <StatCard icon={FolderOpen}    label="Queue Items"      value={queueStats.total}                       hint="Rows from spreadsheet." accent />
              <StatCard icon={CheckCircle2}  label="Uploaded"         value={queueStats.success}                     hint="Saved to Storage & SQL." />
              <StatCard icon={AlertTriangle} label="Failed / Skipped" value={queueStats.failed + queueStats.skipped} hint="Validation issues or duplicates." />
              <StatCard icon={Database}      label="Library Rows"     value={uploadedSongs.length}                   hint="Latest from Supabase." />
            </div>

            {/* Shell grid */}
            <div className="upload-shell-grid" style={{ marginBottom: 18 }}>
              <div style={{ display: "grid", gap: 16 }}>

                {/* Source folders */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
                  style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 14, padding: 18, boxShadow: "var(--app-shadow)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Source files</h2>
                      <p style={{ margin: "4px 0 0", color: "var(--app-text-muted)", fontSize: 12 }}>Choose your audio files, cover images, and the spreadsheet to power automation.</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" onClick={clearSelections} disabled={isBusy} style={{ padding: "9px 12px", borderRadius: 999, border: "1px solid var(--app-border)", background: "transparent", color: "var(--app-text-muted)", cursor: isBusy ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12 }}>Clear</button>
                      <button type="button" onClick={() => prepareQueue(true)} disabled={isBusy}
                        style={{ padding: "9px 14px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", color: "#041307", cursor: isBusy ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 12, boxShadow: "0 6px 18px rgba(var(--app-accent-rgb),0.24)", display: "flex", alignItems: "center", gap: 6 }}>
                        {isPreparing ? <><Loader2 size={12} className="spin" /> Preparing…</> : isUploading ? <><Loader2 size={12} className="spin" /> Uploading…</> : "Run automation"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    <FolderDropArea title="Songs" subtitle="song1.mp3, song2.mp3 …" count={songFiles.length} totalSize={totalSongSize} icon={Music4} buttonLabel="Pick songs" onPick={() => songsInputRef.current?.click()} disabled={isUploading} isDragActive={songsDropzone.isDragActive} isDragReject={songsDropzone.isDragReject} rootProps={songsDropzone.getRootProps()} inputProps={songsDropzone.getInputProps()} />
                    <FolderDropArea title="Cover images" subtitle="song1.jpg, song2.jpg …" count={imageFiles.length} totalSize={totalImageSize} icon={ImageIcon} buttonLabel="Pick images" onPick={() => imagesInputRef.current?.click()} disabled={isUploading} isDragActive={imagesDropzone.isDragActive} isDragReject={imagesDropzone.isDragReject} rootProps={imagesDropzone.getRootProps()} inputProps={imagesDropzone.getInputProps()} />
                    <FolderDropArea title="Spreadsheet" subtitle="Columns: filename, title, artist, type, duration, date, description, location" count={spreadsheetFiles.length} totalSize={totalSpreadsheetSize} icon={FileSpreadsheet} buttonLabel="Pick spreadsheet" onPick={() => spreadsheetInputRef.current?.click()} disabled={isUploading} isDragActive={spreadsheetDropzone.isDragActive} isDragReject={spreadsheetDropzone.isDragReject} rootProps={spreadsheetDropzone.getRootProps()} inputProps={spreadsheetDropzone.getInputProps()} />
                  </div>
                </motion.div>

                {/* Queue */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                  style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 14, padding: 18, boxShadow: "var(--app-shadow)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Upload queue</h2>
                      <p style={{ margin: "4px 0 0", color: "var(--app-text-muted)", fontSize: 12 }}>Each spreadsheet row becomes a queue item with validation and progress.</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => prepareQueue(false)} disabled={isBusy} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid var(--app-border)", background: "transparent", color: "var(--app-text-main)", cursor: isBusy ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12 }}>Rebuild</button>
                      <button type="button" onClick={retryFailedItems} disabled={isBusy} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(248,113,113,0.26)", background: "rgba(248,113,113,0.08)", color: "#f87171", cursor: isBusy ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12 }}>Retry failed</button>
                    </div>
                  </div>
                  <div className="upload-scrollable" style={{ maxHeight: 480, overflow: "auto", display: "grid", gap: 10 }}>
                    {!queueItems.length ? (
                      <div style={{ borderRadius: 12, border: "1px dashed var(--app-border)", padding: "24px 16px", textAlign: "center", color: "var(--app-text-muted)", fontSize: 13 }}>
                        Select the files above to generate the automation queue.
                      </div>
                    ) : (
                      <>
                        {queuePreview.map((item) => {
                          const sm = STATUS_META[item.status] || STATUS_META.ready;
                          return (
                            <div key={item.id} className="upload-hover-card" style={{ borderRadius: 12, border: "1px solid var(--app-border)", background: "rgba(255,255,255,0.02)", padding: 14 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>{item.metadata.title || item.metadata.filename}</div>
                                    <span style={{ padding: "4px 8px", borderRadius: 999, background: sm.background, color: sm.color, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>{sm.label}</span>
                                  </div>
                                  <div style={{ marginTop: 5, color: "var(--app-text-muted)", fontSize: 11, lineHeight: 1.6 }}>
                                    <strong>{item.metadata.filename}</strong> · {item.metadata.artist || "Missing"} · {item.metadata.music_type || "Missing"} · {formatDuration(item.metadata.duration)}
                                  </div>
                                  {item.error && (
                                    <div style={{ marginTop: 6, color: item.status === "skipped" ? "#fbbf24" : "#f87171", fontSize: 11 }}>{item.error}</div>
                                  )}
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <div style={{ color: "var(--app-text-muted)", fontSize: 11 }}>#{item.attempts}</div>
                                  <div style={{ color: "var(--app-text-main)", fontSize: 13, fontWeight: 700, marginTop: 4 }}>{item.progress}%</div>
                                </div>
                              </div>
                              <div style={{ height: 6, borderRadius: 999, background: "rgba(148,163,184,0.14)", overflow: "hidden", marginTop: 10 }}>
                                <div style={{
                                  width: `${Math.min(item.progress, 100)}%`, height: "100%", borderRadius: 999,
                                  background: item.status === "failed"
                                    ? "linear-gradient(90deg,#ef4444,#f87171)"
                                    : item.status === "skipped"
                                      ? "linear-gradient(90deg,#d97706,#fbbf24)"
                                      : "linear-gradient(90deg,var(--app-accent-strong),var(--app-accent))",
                                  transition: "width 0.25s",
                                }} />
                              </div>
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
                                <span style={{ color: item.audioFile ? "var(--app-text-main)" : "#f87171", fontSize: 11 }}>Audio: {item.audioFile ? item.audioFile.name : "Missing"}</span>
                                <span style={{ color: item.imageFile ? "var(--app-text-main)" : "#f87171", fontSize: 11 }}>Image: {item.imageFile ? item.imageFile.name : "Missing"}</span>
                                {item.status === "failed" && item.audioFile && item.imageFile && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      updateQueueItem(item.id, { status: "ready", progress: 0, error: "" });
                                      await startQueueProcessing([item.id]);
                                    }}
                                    disabled={isUploading}
                                    style={{ marginLeft: "auto", padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(var(--app-accent-rgb),0.24)", background: "rgba(var(--app-accent-rgb),0.1)", color: "var(--app-accent)", cursor: isUploading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 11 }}
                                  >
                                    Retry
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {queueItems.length > MAX_QUEUE_PREVIEW && (
                          <div style={{ borderRadius: 12, padding: "10px 12px", background: "rgba(var(--app-accent-rgb),0.08)", color: "var(--app-accent)", fontSize: 11, fontWeight: 700, textAlign: "center" }}>
                            Showing first {MAX_QUEUE_PREVIEW} of {queueItems.length} items.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Right column */}
              <aside className="upload-right-col" style={{ display: "grid", gap: 16, alignSelf: "start", position: "sticky", top: 80 }}>

                {/* Logs */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}
                  style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 14, padding: 18, boxShadow: "var(--app-shadow)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(var(--app-accent-rgb),0.12)", color: "var(--app-accent)", flexShrink: 0 }}>
                      <Database size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>Live upload logs</div>
                      <div style={{ color: "var(--app-text-muted)", fontSize: 12, marginTop: 2 }}>Validation, upload, and cleanup steps appear here.</div>
                    </div>
                  </div>
                  <div className="upload-scrollable" style={{ maxHeight: 340, overflow: "auto", display: "grid", gap: 8 }}>
                    {!logs.length ? (
                      <div style={{ borderRadius: 12, border: "1px dashed var(--app-border)", padding: "16px 14px", color: "var(--app-text-muted)", fontSize: 12 }}>
                        Logs will appear as soon as you prepare the queue.
                      </div>
                    ) : logs.map((log) => (
                      <div key={log.id} style={{ borderRadius: 12, border: "1px solid var(--app-border)", background: "rgba(255,255,255,0.02)", padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em",
                            color: log.level === "error" ? "#f87171" : log.level === "warn" ? "#fbbf24" : log.level === "success" ? "var(--app-accent)" : "var(--app-text-muted)",
                          }}>{log.level}</span>
                          <span style={{ color: "var(--app-text-muted)", fontSize: 10 }}>{formatDateTime(log.createdAt)}</span>
                        </div>
                        <div style={{ marginTop: 5, color: "var(--app-text-main)", fontSize: 12, lineHeight: 1.6 }}>{log.message}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Notes */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }}
                  style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 14, padding: 18, boxShadow: "var(--app-shadow)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <CloudUpload size={16} color="var(--app-accent)" />
                    <div style={{ fontSize: 16, fontWeight: 800 }}>Automation notes</div>
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {[
                      "Matches MP3 and cover files by the filename column in the spreadsheet.",
                      "Parses XLSX, XLS, and CSV automatically with batch-ready validation.",
                      "Uploads assets to Supabase Storage and inserts rows into the songs SQL table.",
                      "Skips duplicates using existing filenames and title/artist/type signatures.",
                      "Supports retrying failed items without re-selecting your files.",
                    ].map((note) => (
                      <div key={note} style={{ borderRadius: 12, background: "rgba(var(--app-accent-rgb),0.07)", padding: "10px 12px", color: "var(--app-text-main)", fontSize: 12, lineHeight: 1.6 }}>{note}</div>
                    ))}
                  </div>
                </motion.div>
              </aside>
            </div>

            {/* Library */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
              style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 14, padding: 18, boxShadow: "var(--app-shadow)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Uploaded library</h2>
                  <p style={{ margin: "4px 0 0", color: "var(--app-text-muted)", fontSize: 12 }}>Search, filter, edit metadata, and delete rows directly from Supabase.</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div className="upload-search-wrap">
                    <Search size={14} color="var(--app-text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search uploaded songs…"
                      style={{ width: "100%", background: "var(--app-surface)", border: "1px solid var(--app-border)", borderRadius: 999, padding: "9px 12px 9px 36px", color: "var(--app-text-main)", outline: "none", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {FILTER_TYPES.map((f) => (
                      <button
                        key={f}
                        type="button"
                        className="upload-filter-pill"
                        onClick={() => setTypeFilter(f)}
                        style={{ padding: "8px 12px", borderRadius: 999, border: `1px solid ${f === typeFilter ? "rgba(var(--app-accent-rgb),0.36)" : "var(--app-border)"}`, background: f === typeFilter ? "rgba(var(--app-accent-rgb),0.12)" : "transparent", color: f === typeFilter ? "var(--app-accent)" : "var(--app-text-muted)", cursor: "pointer", fontWeight: 700, textTransform: "capitalize", fontSize: 12, transition: "all 0.18s" }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {songsLoading ? (
                  <div style={{ borderRadius: 12, padding: "14px", background: "rgba(var(--app-accent-rgb),0.08)", border: "1px solid rgba(var(--app-accent-rgb),0.18)", color: "var(--app-accent)", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <Loader2 size={15} className="spin" /> Loading songs from Supabase…
                  </div>
                ) : !filteredSongs.length ? (
                  <div style={{ borderRadius: 12, border: "1px dashed var(--app-border)", padding: "20px", color: "var(--app-text-muted)", textAlign: "center", fontSize: 13 }}>
                    No songs match your search or filter.
                  </div>
                ) : filteredSongs.map((song) => (
                  <div key={song.id} className="upload-hover-card" style={{ borderRadius: 12, border: "1px solid var(--app-border)", background: "rgba(255,255,255,0.02)", padding: 14 }}>
                    <div className="upload-library-item">
                      <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", background: "rgba(var(--app-accent-rgb),0.08)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                        {song.cover_url
                          ? <img src={song.cover_url} alt={song.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          : <ImageIcon size={18} color="var(--app-accent)" />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>{song.name}</div>
                          <span style={{ padding: "3px 8px", borderRadius: 999, background: "rgba(var(--app-accent-rgb),0.12)", color: "var(--app-accent)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>{song.music_type}</span>
                        </div>
                        <div style={{ color: "var(--app-text-muted)", fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
                          {song.artist} · {song.location || "Unknown"} · {formatDuration(song.duration)} · {song.date || "No date"}
                        </div>
                        {song.description && (
                          <div style={{ color: "var(--app-text-muted)", fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>{song.description}</div>
                        )}
                      </div>
                      <div className="upload-library-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => window.open(song.mp3_url, "_blank", "noopener,noreferrer")}
                          style={{ padding: "8px 10px", borderRadius: 999, border: "1px solid var(--app-border)", background: "transparent", color: "var(--app-text-main)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 11 }}
                        >
                          <PlayCircle size={13} /> Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSong(song)}
                          style={{ padding: "8px 10px", borderRadius: 999, border: "1px solid rgba(var(--app-accent-rgb),0.22)", background: "rgba(var(--app-accent-rgb),0.1)", color: "var(--app-accent)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 11 }}
                        >
                          <PencilLine size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSong(song)}
                          disabled={deletingSongId === song.id}
                          style={{ padding: "8px 10px", borderRadius: 999, border: "1px solid rgba(248,113,113,0.26)", background: "rgba(248,113,113,0.08)", color: "#f87171", cursor: deletingSongId === song.id ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 11 }}
                        >
                          {deletingSongId === song.id ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />} Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FIX: pass songId as a stable separate prop so save-in-progress check works */}
      <EditSongModal
        song={editingSong}
        songId={editingSong?.id}
        onClose={() => setEditingSong(null)}
        onSave={handleSaveSongEdit}
        saving={savingSongId === editingSong?.id}
      />
    </div>
  );
}