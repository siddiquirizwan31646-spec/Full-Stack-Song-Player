import { Input } from '@/components/ui/input'
import axios from 'axios'
import { CheckCircle, Loader2 } from 'lucide-react'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
const API = import.meta.env.VITE_API_URL
const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const navigate = useNavigate()

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const res = await axios.post(`${API}/user/forgot-Password`, { email })
      if (res.data.success) {
        navigate(`/verify-OTP/${email}`)
        toast.success(res.data.message)
        setEmail("")
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, position: "relative", overflow: "hidden", fontFamily: "'DM Sans', sans-serif",
      background: "radial-gradient(ellipse at 60% 30%, rgba(var(--app-accent-rgb), 0.1) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(217,119,6,0.07) 0%, transparent 50%), var(--app-shell-bg)",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* BG blobs */}
      <div style={{ position: "fixed", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(var(--app-accent-rgb), 0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,119,6,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Watermark */}
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(60px, 14vw, 180px)", fontWeight: 900, color: "rgba(var(--app-accent-rgb), 0.03)", letterSpacing: "-2px", whiteSpace: "nowrap", userSelect: "none", transform: "rotate(-20deg)" }}>QalbAudio</span>
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}><img
                                src="https://i.postimg.cc/DZLCn6Sb/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
                                alt="QalbAudio"
                                style={{
                                    height: 180,
                                    width: "auto",
                                    objectFit: "contain",
                                    display: "block",
                                }}
                            />
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--app-surface)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(var(--app-accent-rgb), 0.15)", borderRadius: 20,
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)", overflow: "hidden",
        }}>
          <div style={{ height: 2, background: "linear-gradient(90deg, transparent, var(--app-accent), var(--app-accent-strong), transparent)" }} />

          <div style={{ padding: "28px 28px 0", textAlign: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--app-text-main)", marginBottom: 6 }}>Forgot Password</h2>
            <p style={{ fontSize: 13, color: "var(--app-text-muted)" }}>
              {isSubmitted ? "Check your email for the OTP" : "Enter your email to receive a reset OTP"}
            </p>
          </div>

          <div style={{ padding: "24px 28px" }}>
            {isSubmitted ? (
              <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--app-accent-strong), var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(var(--app-accent-rgb), 0.3)" }}>
                  <CheckCircle style={{ width: 28, height: 28, color: "#000" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--app-text-main)", margin: 0 }}>Check your inbox</h3>
                  <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: 0 }}>
                    We've sent an OTP to{" "}
                    <span style={{ color: "var(--app-accent)", fontWeight: 600 }}>{email}</span>
                  </p>
                  <p style={{ fontSize: 13, color: "rgba(229,231,235,0.35)", margin: 0 }}>
                    Didn't see it? Check spam or{" "}
                    <button onClick={() => setIsSubmitted(false)} style={{ background: "none", border: "none", color: "var(--app-accent)", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: 0 }}>
                      try again
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(229,231,235,0.7)" }}>Email</label>
                  <Input
                    type="email" placeholder="Enter your email address"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required disabled={isLoading}
                    style={{
                      background: "var(--app-surface)",
                      border: "1px solid rgba(var(--app-accent-rgb), 0.2)",
                      color: "var(--app-text-main)", fontFamily: "'DM Sans', sans-serif",
                      borderRadius: 10, transition: "border-color 0.2s",
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--app-accent)"}
                    onBlur={e => e.target.style.borderColor = "rgba(var(--app-accent-rgb), 0.2)"}
                  />
                </div>

                <button type="submit" disabled={isLoading} style={{
                  width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
                  background: isLoading ? "rgba(var(--app-accent-rgb), 0.15)" : "linear-gradient(135deg, var(--app-accent-strong), var(--app-accent))",
                  color: isLoading ? "var(--app-accent)" : "#000",
                  fontWeight: 700, fontSize: 15, cursor: isLoading ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: isLoading ? "none" : "0 4px 20px rgba(var(--app-accent-rgb), 0.3)",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending OTP...</> : "📨 Send OTP"}
                </button>
              </form>
            )}
          </div>

          <div style={{ padding: "0 28px" }}>
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(var(--app-accent-rgb), 0.2), transparent)" }} />
          </div>

          <div style={{ padding: "16px 28px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(229,231,235,0.35)", margin: 0 }}>
              Remember your password?{" "}
              <Link to="/Login" style={{ color: "var(--app-accent)", fontWeight: 700, textDecoration: "none" }}>Login</Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, color: "rgba(217,119,6,0.5)", fontSize: 18, fontFamily: "serif" }}>بِسْمِ اللَّهِ</p>
      </div>
    </div>
  )
}

export default ForgotPassword
