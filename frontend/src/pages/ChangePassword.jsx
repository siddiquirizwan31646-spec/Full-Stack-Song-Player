import { Input } from '@/components/ui/input'
import axios from 'axios'
import { Loader2 } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const ChangePassword = () => {
  const { email } = useParams()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const navigate = useNavigate()
  const API = import.meta.env.VITE_API_URL
  const handleChangePassword = async () => {
    setError(""); setSuccess("")
    if (!newPassword || !confirmPassword) { setError("Please fill in all fields"); return }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return }
    try {
      setIsLoading(true)
      const res = await axios.post(`${API}/user/change-Password/${email}`, { newPassword, confirmPassword })
      setSuccess(res.data.message)
      setTimeout(() => navigate('/login'), 2000)
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong")
    } finally { setIsLoading(false) }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
      background: "var(--app-shell-bg, #0a0f0a)",
      position: "relative", overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes wave { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
        @keyframes float1 { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-20px) scale(1.04); } }
        @keyframes float2 { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(16px) scale(0.97); } }
        .cp-input {
          background: var(--app-surface, rgba(255,255,255,0.04)) !important;
          border: 1px solid var(--app-border, rgba(var(--app-accent-rgb,34,197,94),0.2)) !important;
          color: var(--app-text-main, #f0f0f0) !important;
          border-radius: 10px !important;
          font-family: 'DM Sans', sans-serif !important;
          transition: border-color 0.2s !important;
          padding: 12px 14px !important;
          font-size: 14px !important;
          width: 100%;
        }
        .cp-input:focus { border-color: var(--app-accent, #22c55e) !important; outline: none !important; }
        .cp-input::placeholder { color: var(--app-text-muted, #6b7280) !important; }
        .cp-btn {
          width: 100%; padding: 13px 0; border-radius: 12px; border: none;
          background: linear-gradient(135deg, var(--app-accent-strong, #16a34a), var(--app-accent, #22c55e));
          color: #000; font-family: 'DM Sans', sans-serif;
          font-weight: 800; font-size: 15px; cursor: pointer;
          box-shadow: 0 4px 22px rgba(var(--app-accent-rgb,34,197,94),0.35);
          transition: transform 0.15s, opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .cp-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .cp-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .cp-back {
          background: none; border: none; color: var(--app-text-muted, #6b7280);
          font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer;
          display: flex; align-items: center; gap: 5px; transition: color 0.2s;
          padding: 0; margin: 0 auto;
        }
        .cp-back:hover { color: var(--app-accent, #22c55e); }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(var(--app-accent-rgb,34,197,94),0.1) 0%,transparent 70%)", pointerEvents: "none", animation: "float1 7s ease-in-out infinite" }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(var(--app-accent-rgb,34,197,94),0.07) 0%,transparent 70%)", pointerEvents: "none", animation: "float2 9s ease-in-out infinite" }} />

      {/* Watermark */}
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <span style={{ fontSize: "clamp(60px,14vw,180px)", fontWeight: 900, color: "rgba(var(--app-accent-rgb,34,197,94),0.03)", letterSpacing: "-4px", whiteSpace: "nowrap", userSelect: "none", transform: "rotate(-20deg)" }}>
          QalbAudio
        </span>
      </div>

      {/* Mini waveform decoration */}
      <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "flex-end", gap: 3, opacity: 0.18, pointerEvents: "none" }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const h = 8 + Math.sin(i * 0.9) * 10 + ((i * 5) % 8);
          return <div key={i} style={{ width: 3, height: h, background: "var(--app-accent,#22c55e)", borderRadius: 2, animation: `wave ${0.7 + (i % 4) * 0.1}s ease-in-out infinite alternate`, animationDelay: `${i * 0.06}s` }} />;
        })}
      </div>

      {/* Card */}
      <div style={{
        background: "var(--app-shell-bg-alt, rgba(255,255,255,0.03))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(var(--app-accent-rgb,34,197,94),0.18)",
        borderRadius: 20,
        boxShadow: "0 12px 60px rgba(0,0,0,0.5)",
        padding: "36px 32px",
        maxWidth: 420, width: "100%",
        position: "relative", zIndex: 1,
      }}>

        {/* Logo + icon */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <img
            src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
            alt="QalbAudio"
            style={{ height: 52, width: "auto", objectFit: "contain", marginBottom: 14 }}
          />
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg,var(--app-accent-strong,#16a34a),var(--app-accent,#22c55e))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 6px 24px rgba(var(--app-accent-rgb,34,197,94),0.4)",
          }}>
            🔒
          </div>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--app-text-main,#f0f0f0)", textAlign: "center", marginBottom: 6, margin: "0 0 6px" }}>
          Change Password
        </h2>
        <p style={{ fontSize: 13, color: "var(--app-text-muted,#6b7280)", textAlign: "center", margin: "0 0 22px", lineHeight: 1.6 }}>
          Set a new password for{" "}
          <span style={{ color: "var(--app-accent,#22c55e)", fontWeight: 600 }}>{email}</span>
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(var(--app-accent-rgb,34,197,94),0.4),transparent)", marginBottom: 22 }} />

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            color: "#f87171", fontSize: 13, textAlign: "center",
          }}>{error}</div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            background: "rgba(var(--app-accent-rgb,34,197,94),0.08)", border: "1px solid rgba(var(--app-accent-rgb,34,197,94),0.25)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            color: "var(--app-accent,#22c55e)", fontSize: 13, textAlign: "center",
          }}>{success}</div>
        )}

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--app-text-muted,#6b7280)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>New Password</label>
            <Input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="cp-input"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--app-text-muted,#6b7280)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>Confirm Password</label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="cp-input"
            />
          </div>

          <button className="cp-btn" onClick={handleChangePassword} disabled={isLoading} style={{ marginTop: 4 }}>
            {isLoading
              ? <><Loader2 size={16} className="animate-spin" /> Changing Password…</>
              : "Change Password"
            }
          </button>

          {/* Back link */}
          <button className="cp-back" onClick={() => navigate('/login')}>
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChangePassword