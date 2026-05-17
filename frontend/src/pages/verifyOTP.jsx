import axios from "axios"
import { CheckCircle, Loader2, RotateCcw } from "lucide-react"
import React, { useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { API_URL } from "@/lib/config"

export default function VerifyOTP() {
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const refs = useRef([])
  const { email = "" } = useParams()
  const navigate = useNavigate()

  const normalizedEmail = decodeURIComponent(email).trim().toLowerCase()

  const handleChange = (index, value) => {
    const nextValue = value.replace(/\D/g, "").slice(-1)
    const nextOtp = [...otp]
    nextOtp[index] = nextValue
    setOtp(nextOtp)

    if (nextValue && index < 5) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join("")
    if (code.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    try {
      setLoading(true)
      setError("")
      const res = await axios.post(`${API_URL}/user/verify-otp/${encodeURIComponent(normalizedEmail)}`, { otp: code })
      setSuccessMsg(res.data.message)
      setVerified(true)
      setTimeout(() => navigate(`/change-password/${encodeURIComponent(normalizedEmail)}`), 1500)
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const clearOtp = () => {
    setOtp(["", "", "", "", "", ""])
    setError("")
    refs.current[0]?.focus()
  }

  const incomplete = otp.some((digit) => digit === "")
  const btnDisabled = loading || incomplete

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", position: "relative", overflow: "hidden", fontFamily: "'DM Sans',sans-serif",
      background: "radial-gradient(ellipse at 60% 30%,rgba(var(--app-accent-rgb),.1) 0%,transparent 55%),radial-gradient(ellipse at 20% 80%,rgba(217,119,6,.07) 0%,transparent 50%),var(--app-shell-bg)",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');`}</style>
      <div style={{ position: "fixed", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(var(--app-accent-rgb),.08) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -60, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(217,119,6,.06) 0%,transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(60px,14vw,180px)", fontWeight: 900, color: "rgba(var(--app-accent-rgb),.03)", letterSpacing: "-2px", whiteSpace: "nowrap", userSelect: "none", transform: "rotate(-20deg)" }}>QalbAudio</span>
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="https://i.postimg.cc/DZLCn6Sb/Chat-GPT-Image-May-11-2026-02-56-29-PM.png" alt="QalbAudio" style={{ height: 160, width: "auto", objectFit: "contain" }} />
        </div>

        <div style={{ background: "var(--app-surface)", backdropFilter: "blur(20px)", border: "1px solid rgba(var(--app-accent-rgb),.15)", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,.5)", overflow: "hidden" }}>
          <div style={{ height: 2, background: "linear-gradient(90deg,transparent,var(--app-accent),var(--app-accent-strong),transparent)" }} />

          <div style={{ padding: "28px 24px 0", textAlign: "center" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--app-text-main)", marginBottom: 6 }}>Enter verification code</h2>
            <p style={{ fontSize: 13, color: "var(--app-text-muted)" }}>
              {verified ? "Code verified. Redirecting..." : `Enter the 6-digit OTP sent to ${normalizedEmail}`}
            </p>
          </div>

          <div style={{ padding: "24px" }}>
            {error && (
              <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, color: "#f87171", fontSize: 13 }}>{error}</div>
            )}
            {successMsg && (
              <p style={{ color: "var(--app-accent)", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{successMsg}</p>
            )}

            {verified ? (
              <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(var(--app-accent-rgb),.3)" }}>
                  <CheckCircle style={{ width: 28, height: 28, color: "#000" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: "var(--app-text-main)", margin: "0 0 6px" }}>Verification successful</h3>
                  <p style={{ fontSize: 13, color: "var(--app-text-muted)", margin: 0 }}>Redirecting you to reset your password.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--app-accent)" }}>
                  <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                  <span style={{ fontSize: 13 }}>Redirecting...</span>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 20 }}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      maxLength={1}
                      ref={(el) => (refs.current[index] = el)}
                      style={{
                        flex: 1, minWidth: 0, height: 52, textAlign: "center",
                        fontSize: 22, fontWeight: 700, borderRadius: 10,
                        background: "var(--app-surface)", color: "var(--app-text-main)",
                        border: `1px solid ${digit ? "rgba(var(--app-accent-rgb),.5)" : "rgba(var(--app-accent-rgb),.15)"}`,
                        outline: "none", fontFamily: "'DM Sans',sans-serif", transition: "border-color .2s",
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={handleVerify} disabled={btnDisabled} style={{
                    width: "100%", padding: "12px 0", borderRadius: 12, border: "none", fontFamily: "'DM Sans',sans-serif",
                    background: btnDisabled ? "rgba(var(--app-accent-rgb),.15)" : "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
                    color: btnDisabled ? "var(--app-accent)" : "#000",
                    fontWeight: 700, fontSize: 15, cursor: btnDisabled ? "not-allowed" : "pointer",
                    boxShadow: !btnDisabled ? "0 4px 20px rgba(var(--app-accent-rgb),.3)" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s",
                  }}>
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying...</> : "Verify code"}
                  </button>

                  <button onClick={clearOtp} disabled={loading} style={{
                    width: "100%", padding: "11px 0", borderRadius: 12, fontFamily: "'DM Sans',sans-serif",
                    border: "1px solid rgba(var(--app-accent-rgb),.15)", background: "transparent",
                    color: "var(--app-text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all .2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <RotateCcw style={{ width: 14, height: 14 }} /> Clear
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ padding: "0 24px" }}>
            <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(var(--app-accent-rgb),.2),transparent)" }} />
          </div>
          <div style={{ padding: "16px 24px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(229,231,235,.35)", margin: 0 }}>
              Wrong email?{" "}
              <Link to="/forgot-password" style={{ color: "var(--app-accent)", fontWeight: 700, textDecoration: "none" }}>Go back</Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, color: "rgba(217,119,6,.5)", fontSize: 18, fontFamily: "serif" }}>Bismillah</p>
      </div>
    </div>
  )
}
