import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Loader2, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '@/lib/config'
import { useAuth } from '@/context/AuthContext'

// ── REGEX RULES ───────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const PASSWORD_RULES = {
    minLength: { regex: /.{8,}/,                                        label: "At least 8 characters" },
    uppercase: { regex: /[A-Z]/,                                        label: "One uppercase letter (A-Z)" },
    lowercase: { regex: /[a-z]/,                                        label: "One lowercase letter (a-z)" },
    number:    { regex: /[0-9]/,                                        label: "One number (0–9)" },
    special:   { regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,      label: "One special character (!@#...)" },
}

const GOOGLE_ICON = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const Logo = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
    <img
      src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
      alt="QalbAudio"
      style={{ height: 100, width: "auto", maxWidth: "80%", objectFit: "contain", display: "block" }}
    />
  </div>
)

const Signup = () => {
    const navigate = useNavigate()
    const { loginWithGoogle } = useAuth()

    const [showPassword, setShowpassword] = useState(false)
    const [isLoading, setIsLoading]       = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [formData, setFormData] = useState({ username: "", email: "", password: "" })
    const [touched, setTouched]   = useState({ username: false, email: false, password: false })
    const [errors, setErrors]     = useState({ username: "", email: "", password: "" })

    const validate = (name, value) => {
        if (name === "username") {
            if (!value.trim())           return "Full name is required."
            if (value.trim().length < 2) return "Name must be at least 2 characters."
        }
        if (name === "email") {
            if (!value.trim())            return "Email is required."
            if (!EMAIL_REGEX.test(value)) return "Enter a valid email (e.g. user@example.com)."
        }
        if (name === "password") {
            const failed = Object.values(PASSWORD_RULES).filter(r => !r.regex.test(value))
            if (failed.length > 0)        return "Password does not meet all requirements."
        }
        return ""
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
        }
    }

    const handleBlur = (e) => {
        const { name, value } = e.target
        setTouched(prev => ({ ...prev, [name]: true }))
        setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const allErrors = {
            username: validate("username", formData.username),
            email:    validate("email",    formData.email),
            password: validate("password", formData.password),
        }
        setTouched({ username: true, email: true, password: true })
        setErrors(allErrors)
        if (Object.values(allErrors).some(err => err)) {
            toast.error("Please fix the errors before submitting.")
            return
        }
        try {
            setIsLoading(true)
            const res = await axios.post(`${API_URL}/user/register`, formData, {
                headers: { "Content-Type": "application/json" }
            })
            if (res.data.success) {
                navigate('/verify-email')
                toast.success(res.data.message)
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong.")
        } finally {
            setIsLoading(false)
        }
    }

    // ── Google Sign Up ────────────────────────────────────────────────────────
    const handleGoogleSignup = async () => {
        if (googleLoading) return
        setGoogleLoading(true)
        try {
            await loginWithGoogle()
            toast.success("Welcome to QalbAudio!")
            navigate("/hero")
        } catch (err) {
            if (err.code !== "auth/popup-closed-by-user") {
                toast.error(err.message || "Google sign-up failed.")
            }
        } finally {
            setGoogleLoading(false)
        }
    }

    const passwordScore = Object.values(PASSWORD_RULES).filter(r => r.regex.test(formData.password)).length
    const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"][passwordScore]
    const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][passwordScore]

    const baseInp = (fieldName) => ({
        background: "var(--app-surface)",
        border: `1px solid ${touched[fieldName] ? errors[fieldName] ? "#ef4444" : "#22c55e" : "rgba(var(--app-accent-rgb),.2)"}`,
        color: "var(--app-text-main)",
        fontFamily: "'DM Sans', sans-serif",
        borderRadius: 10,
        transition: "border-color .2s",
    })

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px", position: "relative", overflow: "hidden", fontFamily: "'DM Sans', sans-serif",
            background: "radial-gradient(ellipse at 60% 30%,rgba(var(--app-accent-rgb),.1) 0%,transparent 55%),radial-gradient(ellipse at 20% 80%,rgba(217,119,6,.07) 0%,transparent 50%),var(--app-shell-bg)",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                .google-signup-btn {
                    width: 100%; display: flex; align-items: center; justify-content: center;
                    gap: 10px; padding: 11px 0; border-radius: 12px;
                    border: 1px solid rgba(var(--app-accent-rgb),.25);
                    background: rgba(255,255,255,0.03);
                    color: var(--app-text-main); font-family: 'DM Sans', sans-serif;
                    font-size: 14px; font-weight: 700; cursor: pointer;
                    transition: all 0.25s; backdrop-filter: blur(8px);
                }
                .google-signup-btn:hover:not(:disabled) {
                    border-color: rgba(var(--app-accent-rgb),.5);
                    background: rgba(var(--app-accent-rgb),.06);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(var(--app-accent-rgb),.15);
                }
                .google-signup-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .google-icon-wrap {
                    width: 30px; height: 30px; border-radius: 8px;
                    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.08);
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                }
                .g-spinner {
                    width: 16px; height: 16px;
                    border: 2px solid rgba(var(--app-accent-rgb),.2);
                    border-top-color: var(--app-accent);
                    border-radius: 50%; animation: spin 0.7s linear infinite;
                }
                .or-divider {
                    display: flex; align-items: center; gap: 10px; margin: 2px 0;
                }
                .or-line {
                    flex: 1; height: 1px;
                    background: linear-gradient(90deg, transparent, rgba(var(--app-accent-rgb),.2), transparent);
                }
                .or-text {
                    font-size: 11px; font-weight: 700; color: rgba(148,163,184,0.5);
                    letter-spacing: 0.1em; text-transform: uppercase;
                }
            `}</style>

            {/* Background blobs */}
            <div style={{ position: "fixed", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(var(--app-accent-rgb),.08) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "fixed", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(217,119,6,.06) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
                <span style={{ fontSize: "clamp(60px,14vw,180px)", fontWeight: 900, color: "rgba(var(--app-accent-rgb),.03)", letterSpacing: "-2px", whiteSpace: "nowrap", userSelect: "none", transform: "rotate(-20deg)" }}>QalbAudio</span>
            </div>

            <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}><Logo /></div>

                <div style={{ background: "var(--app-surface)", backdropFilter: "blur(20px)", border: "1px solid rgba(var(--app-accent-rgb),.15)", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,.5)", overflow: "hidden" }}>
                    <div style={{ height: 2, background: "linear-gradient(90deg,transparent,var(--app-accent),var(--app-accent-strong),transparent)" }} />

                    <div style={{ padding: "28px 24px 0", textAlign: "center" }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--app-text-main)", marginBottom: 6 }}>Create your account</h2>
                        <p style={{ fontSize: 13, color: "var(--app-text-muted)" }}>Enter your details below to get started</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Google Button */}
                        <button
                            type="button"
                            className="google-signup-btn"
                            onClick={handleGoogleSignup}
                            disabled={googleLoading || isLoading}
                        >
                            <div className="google-icon-wrap">
                                {googleLoading ? <div className="g-spinner" /> : GOOGLE_ICON}
                            </div>
                            {googleLoading ? "Signing up…" : "Continue with Google"}
                        </button>

                        {/* Divider */}
                        <div className="or-divider">
                            <div className="or-line" />
                            <span className="or-text">or</span>
                            <div className="or-line" />
                        </div>

                        {/* Full Name */}
                        <div style={{ display: "grid", gap: 5 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(229,231,235,.7)" }}>Full Name</label>
                            <Input
                                id="username" name="username"
                                value={formData.username} onChange={handleChange} onBlur={handleBlur}
                                type="text" placeholder="Enter Your Full Name" required
                                style={baseInp("username")}
                            />
                            {touched.username && errors.username && <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>⚠ {errors.username}</p>}
                            {touched.username && !errors.username && formData.username && <p style={{ color: "#22c55e", fontSize: 12, margin: 0 }}>✓ Looks good!</p>}
                        </div>

                        {/* Email */}
                        <div style={{ display: "grid", gap: 5 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(229,231,235,.7)" }}>Email</label>
                            <Input
                                id="email" type="email" name="email"
                                value={formData.email} onChange={handleChange} onBlur={handleBlur}
                                placeholder="example@example.com" required
                                style={baseInp("email")}
                            />
                            {touched.email && errors.email && <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>⚠ {errors.email}</p>}
                            {touched.email && !errors.email && formData.email && <p style={{ color: "#22c55e", fontSize: 12, margin: 0 }}>✓ Valid email address</p>}
                        </div>

                        {/* Password */}
                        <div style={{ display: "grid", gap: 5 }}>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(229,231,235,.7)" }}>Password</label>
                            <div className="relative">
                                <Input
                                    id="password" name="password"
                                    value={formData.password} onChange={handleChange} onBlur={handleBlur}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password" required
                                    style={{ ...baseInp("password"), paddingRight: 44 }}
                                />
                                <Button
                                    variant="ghost" size="sm" type="button"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowpassword(!showPassword)} disabled={isLoading}
                                >
                                    {showPassword
                                        ? <EyeOff className="w-4 h-4" style={{ color: "var(--app-accent)" }} />
                                        : <Eye className="w-4 h-4" style={{ color: "var(--app-accent)" }} />}
                                </Button>
                            </div>

                            {/* Strength Bar */}
                            {formData.password && (
                                <div style={{ marginTop: 2 }}>
                                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                                        {[1,2,3,4,5].map(i => (
                                            <div key={i} style={{
                                                flex: 1, height: 4, borderRadius: 4,
                                                background: i <= passwordScore ? strengthColor : "rgba(var(--app-accent-rgb),.15)",
                                                transition: "background 0.3s",
                                            }} />
                                        ))}
                                    </div>
                                    <span style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</span>
                                </div>
                            )}

                            {/* Password Rules */}
                            {(touched.password || formData.password) && (
                                <div style={{ background: "rgba(var(--app-accent-rgb),.05)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(var(--app-accent-rgb),.12)", marginTop: 2 }}>
                                    {Object.entries(PASSWORD_RULES).map(([key, rule]) => {
                                        const passed = rule.regex.test(formData.password)
                                        return (
                                            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                                                <span style={{ fontSize: 12, color: passed ? "#22c55e" : "rgba(229,231,235,.3)" }}>{passed ? "✓" : "○"}</span>
                                                <span style={{ fontSize: 12, color: passed ? "#22c55e" : "rgba(229,231,235,.5)" }}>{rule.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit" disabled={isLoading || googleLoading}
                            style={{
                                marginTop: 4, width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
                                fontFamily: "'DM Sans', sans-serif",
                                background: isLoading ? "rgba(var(--app-accent-rgb),.2)" : "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                                color: isLoading ? "var(--app-accent)" : "#000",
                                fontWeight: 700, fontSize: 15, cursor: isLoading ? "not-allowed" : "pointer",
                                boxShadow: isLoading ? "none" : "0 4px 20px rgba(var(--app-accent-rgb),.3)",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s",
                            }}
                        >
                            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating Account…</> : "Sign Up"}
                        </button>

                        <p style={{ textAlign: "center", fontSize: 13, color: "var(--app-text-muted)", margin: 0 }}>
                            Already have an account?{" "}
                            <a href="/login" style={{ color: "var(--app-accent)", fontWeight: 700, textDecoration: "none" }}>Login</a>
                        </p>

                    </form>
                </div>

                <p style={{ textAlign: "center", marginTop: 20, color: "rgba(217,119,6,.5)", fontSize: 18, fontFamily: "serif" }}>بِسْمِ اللَّهِ</p>
            </div>
        </div>
    )
}

export default Signup