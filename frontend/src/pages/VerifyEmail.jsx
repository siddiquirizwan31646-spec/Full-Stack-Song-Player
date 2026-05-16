import React from 'react'

const Logo = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
    <img src="https://i.postimg.cc/DZLCn6Sb/Chat-GPT-Image-May-11-2026-02-56-29-PM.png" alt="QalbAudio"
      style={{ height: 100, width: "auto", maxWidth: "80%", objectFit: "contain", display: "block" }} />
  </div>
)

const VerifyEmail = () => {
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
        <div style={{ marginBottom: 24 }}><Logo /></div>

        <div style={{ background: "var(--app-surface)", backdropFilter: "blur(20px)", border: "1px solid rgba(var(--app-accent-rgb),.15)", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,.5)", overflow: "hidden", textAlign: "center" }}>
          <div style={{ height: 2, background: "linear-gradient(90deg,transparent,var(--app-accent),var(--app-accent-strong),transparent)" }} />

          <div style={{ padding: "40px 32px" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 28,
              boxShadow: "0 4px 24px rgba(var(--app-accent-rgb),.3)",
            }}>
              ✉️
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--app-text-main)", marginBottom: 12 }}>
              Check Your Email
            </h2>

            <p style={{ fontSize: 14, color: "var(--app-text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
              We've sent a verification link to your inbox. Please check your email and click the link to activate your account.
            </p>

            <div style={{ width: "60%", height: 1, background: "linear-gradient(90deg,transparent,rgba(var(--app-accent-rgb),.25),transparent)", margin: "0 auto 20px" }} />

            <p style={{ fontSize: 12, color: "var(--app-text-muted)" }}>
              Didn't receive it? Check your spam folder or{" "}
              <a href="/signup" style={{ color: "var(--app-accent)", fontWeight: 600, textDecoration: "none" }}>try again</a>
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, color: "rgba(217,119,6,.5)", fontSize: 18, fontFamily: "serif" }}>بِسْمِ اللَّهِ</p>
      </div>
    </div>
  )
}

export default VerifyEmail