import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, Loader2, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
const API = import.meta.env.VITE_API_URL
// ── REGEX RULES ──────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const PASSWORD_RULES = {
    minLength: { regex: /.{8,}/,                                        label: "At least 8 characters" },
    uppercase: { regex: /[A-Z]/,                                        label: "One uppercase letter (A-Z)" },
    lowercase: { regex: /[a-z]/,                                        label: "One lowercase letter (a-z)" },
    number:    { regex: /[0-9]/,                                        label: "One number (0–9)" },
    special:   { regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,      label: "One special character (!@#...)" },
}

const Logo = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
    <img src="https://i.postimg.cc/DZLCn6Sb/Chat-GPT-Image-May-11-2026-02-56-29-PM.png" alt="QalbAudio"
      style={{ height: 100, width: "auto", maxWidth: "80%", objectFit: "contain", display: "block" }} />
  </div>
)

const Signup = () => {

    const navigate = useNavigate()
    const [showPassword, setShowpassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({ username: "", email: "", password: "" })

    // ── NEW: validation state ────────────────────────────────
    const [touched, setTouched] = useState({ username: false, email: false, password: false })
    const [errors, setErrors]   = useState({ username: "", email: "", password: "" })

    // ── VALIDATE single field ────────────────────────────────
    const validate = (name, value) => {
        if (name === "username") {
            if (!value.trim())            return "Full name is required."
            if (value.trim().length < 2)  return "Name must be at least 2 characters."
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

    // ── HANDLE CHANGE — same as before + live validation ────
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (touched[name]) {
            setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
        }
    }

    // ── NEW: mark field touched on blur ──────────────────────
    const handleBlur = (e) => {
        const { name, value } = e.target
        setTouched(prev => ({ ...prev, [name]: true }))
        setErrors(prev => ({ ...prev, [name]: validate(name, value) }))
    }

    // ── HANDLE SUBMIT — same axios logic + validation guard ──
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
            const res = await axios.post(`${API}/user/register`, formData, {
                headers: { "Content-Type": "application/json" }
            })
            if (res.data.success) {
                navigate('/verify')
                toast.success(res.data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Something went wrong.")
        } finally {
            setIsLoading(false)
        }
    }

    // ── PASSWORD STRENGTH ────────────────────────────────────
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
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');`}</style>

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
                                    {showPassword ? <EyeOff className="w-4 h-4" style={{ color: "var(--app-accent)" }} /> : <Eye className="w-4 h-4" style={{ color: "var(--app-accent)" }} />}
                                </Button>
                            </div>

                            {/* Strength Bar */}
                            {formData.password && (
                                <div style={{ marginTop: 2 }}>
                                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                                        {[1, 2, 3, 4, 5].map(i => (
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
                                <div style={{
                                    background: "rgba(var(--app-accent-rgb),.05)", borderRadius: 10,
                                    padding: "10px 12px", border: "1px solid rgba(var(--app-accent-rgb),.12)", marginTop: 2,
                                }}>
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
                            type="submit" disabled={isLoading}
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
                            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating Account...</> : "Sign Up"}
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