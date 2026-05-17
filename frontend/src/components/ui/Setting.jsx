import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
    Check,
    LoaderCircle,
    Monitor,
    MoonStar,
    Palette,
    RefreshCcw,
    Save,
    Sparkles,
    SunMedium,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import DashboardNavbar from "@/components/DashboardNavbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DEFAULT_PREFERENCES, useUser } from "@/context/userContext"

const API_SAFE_DEFAULTS = { ...DEFAULT_PREFERENCES }

const NAV_ITEMS = [
  { icon: "🏠", label: "Home", id: "home", path: "/hero" },
  { icon: "🔍", label: "Explore", id: "explore", path: "/explore" },
  { icon: "📖", label: "Quran", id: "quran", path: "/quran" },
  { icon: "🎵", label: "Nasheed", id: "nasheed", path: "/nasheed" },
  { icon: "🎤", label: "Naat", id: "naat", path: "/naat" },
  { icon: "🎼", label: "Qawwali", id: "qawwali", path: "/qawwali" },
  { icon: "🎙", label: "Podcasts", id: "podcasts", path: "/podcasts" },
  { icon: "📋", label: "Playlists", id: "playlists", path: "/playlists" },
]
const NAV_BOTTOM = [
  { icon: "⬆", label: "Upload Audio", id: "upload", path: "/upload" },
  { icon: "♡", label: "Favorites", id: "favorites", path: "/favorites" },
  { icon: "⚙", label: "Settings", id: "settings", path: "/settings" },
]

const themeOptions = [
    { value: "system", label: "System", icon: Monitor },
    { value: "dark", label: "Dark", icon: MoonStar },
    { value: "light", label: "Light", icon: SunMedium },
]

const densityOptions = [
    { value: "comfortable", label: "Comfortable", description: "More spacing for a calm layout." },
    { value: "compact", label: "Compact", description: "Tighter spacing for faster scanning." },
]

const layoutOptions = [
    { value: "spotlight", label: "Spotlight player", description: "Large hero-style sections and prominent cards." },
    { value: "stacked", label: "Stacked player", description: "More list-oriented spacing for dense browsing." },
]

const cardStyleOptions = [
    { value: "glass", label: "Glass", description: "Soft transparent panels with more depth." },
    { value: "solid", label: "Solid", description: "Cleaner opaque panels with crisp borders." },
]

const hexToRgb = (hex) => {
    const normalizedHex = hex.replace("#", "")
    const parsed = Number.parseInt(normalizedHex, 16)
    return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255 }
}

const withOpacity = (hex, opacity) => {
    const { r, g, b } = hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const ToggleRow = ({ checked, description, label, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            textAlign: "left",
            padding: "16px 18px",
            borderRadius: 14,
            border: "1px solid var(--app-border)",
            background: "var(--app-surface)",
            color: "var(--app-text-main)",
            cursor: "pointer",
            transition: "all 0.18s ease",
            fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.4)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--app-border)"}
    >
        <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 12, color: "var(--app-text-muted)", marginTop: 4 }}>{description}</div>
        </div>
        <div style={{
            width: 52, height: 28, borderRadius: 999,
            background: checked ? "var(--app-accent)" : "rgba(148,163,184,0.24)",
            padding: 3, display: "flex", alignItems: "center",
            justifyContent: checked ? "flex-end" : "flex-start",
            transition: "all 0.2s ease", flexShrink: 0,
        }}>
            <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: checked ? "#041307" : "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                transition: "all 0.2s",
            }} />
        </div>
    </button>
)

const ChoiceGroup = ({ options, selectedValue, onSelect }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {options.map((option) => {
            const isSelected = option.value === selectedValue
            const Icon = option.icon
            return (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value)}
                    style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: isSelected ? "1px solid var(--app-accent)" : "1px solid var(--app-border)",
                        background: isSelected ? "rgba(var(--app-accent-rgb),0.12)" : "var(--app-surface)",
                        boxShadow: isSelected ? "0 4px 20px rgba(var(--app-accent-rgb),0.15)" : "none",
                        color: "var(--app-text-main)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "rgba(var(--app-accent-rgb),0.4)" }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = "var(--app-border)" }}
                >
                    {Icon && (
                        <Icon size={16} style={{
                            color: isSelected ? "var(--app-accent)" : "var(--app-text-muted)",
                            marginBottom: 10,
                        }} />
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{option.label}</span>
                        {isSelected && <Check size={14} style={{ color: "var(--app-accent)", flexShrink: 0 }} />}
                    </div>
                    {option.description && (
                        <p style={{ fontSize: 11, lineHeight: 1.5, marginTop: 6, color: "var(--app-text-muted)" }}>
                            {option.description}
                        </p>
                    )}
                </button>
            )
        })}
    </div>
)

const SectionLabel = ({ children }) => (
    <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: "var(--app-text-main)", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{children}</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right,rgba(var(--app-accent-rgb),0.2),transparent)" }} />
    </div>
)

const Setting = () => {
    const { user, preferences, savePreferences, refreshPreferences } = useUser()
    const navigate = useNavigate()
    const displayName = user?.username || "Guest"

    const [draft, setDraft] = useState(preferences || API_SAFE_DEFAULTS)
    const [isDirty, setIsDirty] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        if (!isDirty) setDraft(preferences || API_SAFE_DEFAULTS)
    }, [preferences, isDirty])

    useEffect(() => {
        let isMounted = true
        const load = async () => {
            try {
                const latest = await refreshPreferences()
                if (isMounted) setDraft(latest)
            } catch (error) {
                const status = error?.response?.status
                // 400 expired / 401 unauthorized — interceptor will redirect to login
                if (status !== 400 && status !== 401) {
                    toast.error("Unable to load your saved settings.")
                }
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }
        load()
        return () => { isMounted = false }
    }, [])

    const updateDraft = (key, value) => {
        setDraft(cur => ({ ...cur, [key]: value }))
        setIsDirty(true)
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            await savePreferences(draft)
            setIsDirty(false)
            toast.success("Your settings were saved to your account.")
        } catch (error) {
            toast.error(error.response?.data?.message || "Unable to save settings right now.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        setDraft(API_SAFE_DEFAULTS)
        setIsDirty(true)
    }

    // Preview values
    const previewIsDark = draft.themeMode !== "light"
    const previewSurface = draft.cardStyle === "glass"
        ? (previewIsDark ? "rgba(10,18,11,0.72)" : "rgba(255,255,255,0.82)")
        : (previewIsDark ? "#0d160f" : "#ffffff")
    const previewText = previewIsDark ? "#e5e7eb" : "#162113"
    const previewMuted = previewIsDark ? "rgba(229,231,235,0.66)" : "rgba(22,33,19,0.66)"
    const previewBackdrop = previewIsDark
        ? `radial-gradient(circle at top left, ${withOpacity(draft.accentColor, 0.2)} 0%, transparent 40%), #071009`
        : `radial-gradient(circle at top left, ${withOpacity(draft.accentColor, 0.18)} 0%, transparent 38%), #f3faf4`
    const previewGap = draft.interfaceDensity === "compact" ? 10 : 16

    return (
        <div style={{
            display: "flex", flexDirection: "column", height: "100vh",
            background: "var(--app-shell-bg)", color: "var(--app-text-main)",
            fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            <style>{`
                *{box-sizing:border-box}
                ::-webkit-scrollbar{width:4px;height:4px}
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

                .settings-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,0.85fr);gap:20px;align-items:start}
                @media(max-width:1024px){.settings-grid{grid-template-columns:1fr}}
                .settings-sticky{position:sticky;top:16px}
                @media(max-width:1024px){.settings-sticky{position:static}}

                .settings-card{background:var(--app-shell-bg-alt);border:1px solid rgba(var(--app-accent-rgb),0.12);border-radius:16px;overflow:hidden}

                input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
                input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--app-accent);cursor:pointer;box-shadow:0 0 6px rgba(var(--app-accent-rgb),0.5)}

                @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
            `}</style>

            <DashboardNavbar />

            {/* Mobile overlay */}
            <div className={`mob-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* ── SIDEBAR ── */}
                <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
                    <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <img
                            src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
                            alt="QalbAudio"
                            onClick={() => { navigate("/"); setSidebarOpen(false) }}
                            style={{ height: 60, width: "auto", maxWidth: "88%", objectFit: "contain", cursor: "pointer", display: "block" }}
                        />
                        <div style={{ fontSize: 11, color: "var(--app-text-muted)", textAlign: "center" }}>
                            <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{displayName}</span>
                        </div>
                    </div>

                    <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
                        {NAV_ITEMS.map(item => (
                            <div key={item.id} className="nav-item"
                                onClick={() => { navigate(item.path); setSidebarOpen(false) }}>
                                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                                {item.label}
                            </div>
                        ))}
                        <div style={{ margin: "10px 0", borderTop: "1px solid var(--app-border)" }} />
                        {NAV_BOTTOM.map(item => (
                            <div key={item.id}
                                className={`nav-item${item.id === "settings" ? " active" : ""}`}
                                style={{ color: item.id === "upload" ? "var(--app-accent)" : undefined }}
                                onClick={() => { navigate(item.path); setSidebarOpen(false) }}>
                                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                                {item.label}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* ── MAIN CONTENT ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

                    {/* Toolbar */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                        background: "var(--app-shell-bg-alt)", borderBottom: "1px solid rgba(var(--app-accent-rgb),0.08)", flexShrink: 0,
                    }}>
                        <button className="hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
                        <span style={{ color: "var(--app-text-main)", fontSize: 16, fontWeight: 700 }}>Settings</span>
                        <div style={{ flex: 1 }} />
                        {isDirty && (
                            <span style={{ fontSize: 11, color: "var(--app-accent)", background: "rgba(var(--app-accent-rgb),0.1)", padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>
                                Unsaved changes
                            </span>
                        )}
                    </div>

                    {/* Scroll area */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

                        {/* Page heading */}
                        <div style={{ marginBottom: 18 }}>
                            <h1 style={{ fontSize: "clamp(15px,3.5vw,20px)", fontWeight: 700, margin: "0 0 4px" }}>
                                Make the player feel like <span style={{ color: "var(--app-accent)" }}>yours</span> ✨
                            </h1>
                            <p style={{ fontSize: 12, color: "var(--app-text-muted)", margin: 0 }}>
                                Settings saved for <strong style={{ color: "var(--app-text-main)" }}>{user?.email || displayName}</strong> — other users keep their own preferences.
                            </p>
                        </div>

                        <div className="settings-grid">

                            {/* ── LEFT: Controls ── */}
                            <div style={{ display: "grid", gap: 16 }}>

                                {/* Theme */}
                                <div className="settings-card" style={{ padding: "16px" }}>
                                    <SectionLabel>Theme Mode</SectionLabel>
                                    <ChoiceGroup
                                        options={themeOptions}
                                        selectedValue={draft.themeMode}
                                        onSelect={v => updateDraft("themeMode", v)}
                                    />
                                </div>

                                {/* Accent + Corners */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
                                    <div className="settings-card" style={{ padding: "16px" }}>
                                        <SectionLabel>Accent Color</SectionLabel>
                                        <p style={{ fontSize: 12, color: "var(--app-text-muted)", lineHeight: 1.5, marginBottom: 14, marginTop: 0 }}>
                                            Powers buttons, highlights, and selected states.
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{
                                                width: 46, height: 46, borderRadius: 12,
                                                background: draft.accentColor,
                                                boxShadow: `0 6px 20px ${withOpacity(draft.accentColor, 0.4)}`,
                                                border: "1px solid rgba(255,255,255,0.18)",
                                                overflow: "hidden", flexShrink: 0,
                                            }}>
                                                <Input type="color" value={draft.accentColor}
                                                    onChange={e => updateDraft("accentColor", e.target.value)}
                                                    style={{ width: "100%", height: "100%", padding: 0, border: "none", background: "transparent", cursor: "pointer" }} />
                                            </div>
                                            <Input type="text" value={draft.accentColor} readOnly
                                                style={{ height: 40, background: "rgba(255,255,255,0.04)", border: "1px solid var(--app-border)", color: "var(--app-text-main)", borderRadius: 10, fontFamily: "monospace", fontSize: 13 }} />
                                        </div>
                                    </div>

                                    <div className="settings-card" style={{ padding: "16px" }}>
                                        <SectionLabel>Rounded Corners</SectionLabel>
                                        <p style={{ fontSize: 12, color: "var(--app-text-muted)", lineHeight: 1.5, marginBottom: 14, marginTop: 0 }}>
                                            Control how soft and curved your cards feel.
                                        </p>
                                        <input type="range" min="12" max="32" value={draft.roundedCorners}
                                            onChange={e => updateDraft("roundedCorners", Number(e.target.value))}
                                            style={{ width: "100%", accentColor: draft.accentColor }} />
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--app-text-muted)" }}>
                                            <span>12px</span>
                                            <strong style={{ color: "var(--app-accent)" }}>{draft.roundedCorners}px</strong>
                                            <span>32px</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Density + Layout */}
                                <div className="settings-card" style={{ padding: "16px" }}>
                                    <SectionLabel>Spacing & Density</SectionLabel>
                                    <ChoiceGroup
                                        options={densityOptions}
                                        selectedValue={draft.interfaceDensity}
                                        onSelect={v => updateDraft("interfaceDensity", v)}
                                    />
                                    <div style={{ marginTop: 12 }}>
                                        <SectionLabel>Player Layout</SectionLabel>
                                        <ChoiceGroup
                                            options={layoutOptions}
                                            selectedValue={draft.playerLayout}
                                            onSelect={v => updateDraft("playerLayout", v)}
                                        />
                                    </div>
                                </div>

                                {/* Card style */}
                                <div className="settings-card" style={{ padding: "16px" }}>
                                    <SectionLabel>Card Appearance</SectionLabel>
                                    <ChoiceGroup
                                        options={cardStyleOptions}
                                        selectedValue={draft.cardStyle}
                                        onSelect={v => updateDraft("cardStyle", v)}
                                    />
                                </div>

                                {/* Toggles */}
                                <div className="settings-card" style={{ padding: "16px", display: "grid", gap: 10 }}>
                                    <SectionLabel>Preferences</SectionLabel>
                                    <ToggleRow
                                        label="Interface animations"
                                        description="Keep transitions and subtle motion active while browsing."
                                        checked={draft.animationsEnabled}
                                        onChange={v => updateDraft("animationsEnabled", v)}
                                    />
                                    <ToggleRow
                                        label="Greeting in navbar"
                                        description="Show the personalized salam greeting beside your profile."
                                        checked={draft.showGreeting}
                                        onChange={v => updateDraft("showGreeting", v)}
                                    />
                                </div>

                                {/* Save / Reset */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: 12, color: "var(--app-text-muted)" }}>
                                        {isDirty ? "⚠ You have unsaved changes." : "✓ Your settings are up to date."}
                                    </div>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                        <button type="button" onClick={handleReset}
                                            style={{
                                                height: 38, paddingInline: 16, borderRadius: 10,
                                                border: "1px solid var(--app-border)", background: "transparent",
                                                color: "var(--app-text-main)", cursor: "pointer", fontSize: 13, fontWeight: 600,
                                                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
                                                transition: "all 0.18s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--app-accent)"}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--app-border)"}
                                        >
                                            <RefreshCcw size={14} /> Reset defaults
                                        </button>
                                        <button type="button" onClick={handleSave} disabled={isSaving || isLoading}
                                            style={{
                                                height: 38, paddingInline: 20, borderRadius: 10,
                                                background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                                                border: "none", color: "#041307", fontWeight: 700, fontSize: 13,
                                                cursor: isSaving || isLoading ? "wait" : "pointer",
                                                fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
                                                opacity: isSaving || isLoading ? 0.7 : 1,
                                                boxShadow: `0 6px 20px ${withOpacity(draft.accentColor, 0.35)}`,
                                                transition: "transform 0.15s",
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                                            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                        >
                                            {isSaving
                                                ? <><LoaderCircle size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
                                                : <><Save size={14} /> Save settings</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── RIGHT: Preview + Summary ── */}
                            <div className="settings-sticky" style={{ display: "grid", gap: 16 }}>

                                {/* Live Preview */}
                                <div className="settings-card" style={{ padding: "16px" }}>
                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Live Preview</div>
                                        <div style={{ fontSize: 12, color: "var(--app-text-muted)" }}>See how your choices look in real time.</div>
                                    </div>

                                    <div style={{
                                        borderRadius: draft.roundedCorners,
                                        background: previewBackdrop,
                                        border: `1px solid ${withOpacity(draft.accentColor, 0.2)}`,
                                        padding: draft.interfaceDensity === "compact" ? 14 : 18,
                                        color: previewText,
                                        boxShadow: `0 12px 40px ${withOpacity(draft.accentColor, 0.12)}`,
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: previewGap }}>
                                            <div>
                                                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: previewMuted }}>Your player</div>
                                                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>QalbAudio</div>
                                            </div>
                                            <div style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center", background: withOpacity(draft.accentColor, 0.18), color: draft.accentColor, flexShrink: 0 }}>
                                                <Palette size={16} />
                                            </div>
                                        </div>

                                        {draft.showGreeting && (
                                            <div style={{
                                                borderRadius: Math.max(10, draft.roundedCorners - 8),
                                                background: previewSurface,
                                                border: `1px solid ${withOpacity(draft.accentColor, 0.16)}`,
                                                padding: draft.interfaceDensity === "compact" ? "10px 12px" : "14px 16px",
                                                marginBottom: previewGap,
                                                backdropFilter: draft.cardStyle === "glass" ? "blur(14px)" : "none",
                                            }}>
                                                <div style={{ fontSize: 11, color: previewMuted }}>Assalamu Alaikum, {displayName}</div>
                                                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>Welcome back</div>
                                            </div>
                                        )}

                                        <div style={{ display: "grid", gridTemplateColumns: draft.playerLayout === "stacked" ? "1fr" : "1.1fr 0.9fr", gap: previewGap }}>
                                            <div style={{
                                                borderRadius: Math.max(10, draft.roundedCorners - 8),
                                                background: previewSurface,
                                                border: `1px solid ${withOpacity(draft.accentColor, 0.16)}`,
                                                padding: draft.interfaceDensity === "compact" ? 12 : 14,
                                                backdropFilter: draft.cardStyle === "glass" ? "blur(14px)" : "none",
                                            }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Now playing</div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${withOpacity(draft.accentColor, 0.24)},${withOpacity(draft.accentColor, 0.48)})`, flexShrink: 0 }} />
                                                    <div>
                                                        <div style={{ fontSize: 12, fontWeight: 700 }}>Morning Adhkar</div>
                                                        <div style={{ fontSize: 11, color: previewMuted, marginTop: 3 }}>Personalized UI</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                borderRadius: Math.max(10, draft.roundedCorners - 8),
                                                background: previewSurface,
                                                border: `1px solid ${withOpacity(draft.accentColor, 0.16)}`,
                                                padding: draft.interfaceDensity === "compact" ? 12 : 14,
                                                backdropFilter: draft.cardStyle === "glass" ? "blur(14px)" : "none",
                                            }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Quick actions</div>
                                                <div style={{ display: "grid", gap: draft.interfaceDensity === "compact" ? 6 : 8 }}>
                                                    {["Favorites", "Playlists", "Upload"].map(item => (
                                                        <div key={item} style={{ borderRadius: 10, background: withOpacity(draft.accentColor, 0.1), padding: draft.interfaceDensity === "compact" ? "8px 10px" : "10px 12px", fontSize: 11, fontWeight: 600 }}>{item}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Saved Per Account */}
                                <div className="settings-card" style={{ padding: "16px" }}>
                                    <div style={{ marginBottom: 14 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Saved Per Account</div>
                                        <div style={{ fontSize: 12, color: "var(--app-text-muted)", lineHeight: 1.5 }}>Stored on MongoDB — every user gets their own separate choices.</div>
                                    </div>
                                    <div style={{ display: "grid", gap: 8 }}>
                                        {[
                                            { label: "Account", value: user?.email || "Signed in user" },
                                            { label: "Accent", value: draft.accentColor },
                                            { label: "Density", value: draft.interfaceDensity },
                                            { label: "Card style", value: draft.cardStyle },
                                        ].map(row => (
                                            <div key={row.label} style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                                                borderRadius: 10, padding: "10px 12px",
                                                background: "rgba(var(--app-accent-rgb),0.06)",
                                                border: "1px solid rgba(var(--app-accent-rgb),0.08)",
                                            }}>
                                                <span style={{ fontSize: 12, color: "var(--app-text-muted)" }}>{row.label}</span>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--app-text-main)", fontFamily: row.label === "Accent" ? "monospace" : "inherit" }}>{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* bottom spacing */}
                        <div style={{ height: 32 }} />
                    </div>
                </div>
            </div>

            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

export default Setting