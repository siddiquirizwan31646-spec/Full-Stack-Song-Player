import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { useUser } from '@/context/userContext'
import { API_URL } from '@/lib/config'

const Logo = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
    <img
      src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png"
      alt="QalbAudio"
      style={{ height: 100, width: "auto", maxWidth: "80%", objectFit: "contain", display: "block" }}
    />
  </div>
)

const AuthShell = ({ children }) => (
  <div style={{
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px", position: "relative", overflow: "hidden", fontFamily: "'DM Sans',sans-serif",
    background: "radial-gradient(ellipse at 60% 30%,rgba(var(--app-accent-rgb),.1) 0%,transparent 55%),radial-gradient(ellipse at 20% 80%,rgba(217,119,6,.07) 0%,transparent 50%),var(--app-shell-bg)",
  }}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&display=swap');`}</style>
    <div style={{ position:"fixed", top:-80, right:-80, width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(var(--app-accent-rgb),.08) 0%,transparent 70%)", pointerEvents:"none" }} />
    <div style={{ position:"fixed", bottom:-60, left:-60, width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(217,119,6,.06) 0%,transparent 70%)", pointerEvents:"none" }} />
    <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <span style={{ fontSize:"clamp(60px,14vw,180px)", fontWeight:900, color:"rgba(var(--app-accent-rgb),.03)", letterSpacing:"-2px", whiteSpace:"nowrap", userSelect:"none", transform:"rotate(-20deg)" }}>QalbAudio</span>
    </div>
    <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
      <div style={{ textAlign:"center", marginBottom:24 }}><Logo /></div>
      {children}
      <p style={{ textAlign:"center", marginTop:20, color:"rgba(217,119,6,.5)", fontSize:18, fontFamily:"serif" }}>بِسْمِ اللَّهِ</p>
    </div>
  </div>
)

const baseInp = { background:"var(--app-surface)", border:"1px solid rgba(var(--app-accent-rgb),.2)", color:"var(--app-text-main)", fontFamily:"'DM Sans',sans-serif", borderRadius:10, transition:"border-color .2s" }

export default function Login() {
  const { setUser } = useUser()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email:"", password:"" })

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

 const handleSubmit = async e => {
  e.preventDefault()
  try {
    setLoading(true)
    const res = await axios.post(`${API_URL}/user/login`, form, { headers:{ "Content-Type":"application/json" } })
    if (res.data.success) {
      localStorage.setItem("accessToken", res.data.accessToken)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      setUser(res.data.user)
      toast.success(res.data.message)
      navigate("/hero")
    } else {
      toast.error(res.data.message || "Login failed")
    }
  } catch (err) {
    toast.error(err?.response?.data?.message || "Invalid email or password")
  } finally {
    setLoading(false)
  }
}

  return (
    <AuthShell>
      <div style={{ background:"var(--app-surface)", backdropFilter:"blur(20px)", border:"1px solid rgba(var(--app-accent-rgb),.15)", borderRadius:20, boxShadow:"0 8px 40px rgba(0,0,0,.5)", overflow:"hidden" }}>
        <div style={{ height:2, background:"linear-gradient(90deg,transparent,var(--app-accent),var(--app-accent-strong),transparent)" }} />

        <div style={{ padding:"28px 24px 0", textAlign:"center" }}>
          <h2 style={{ fontSize:20, fontWeight:800, color:"var(--app-text-main)", marginBottom:6 }}>Welcome back</h2>
          <p style={{ fontSize:13, color:"var(--app-text-muted)" }}>Login to continue your spiritual journey</p>
        </div>

        {/* ✅ Form now wraps ALL fields AND the submit button */}
        <form onSubmit={handleSubmit} style={{ padding:"24px 24px 28px", display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"grid", gap:5 }}>
            <label style={{ fontSize:13, fontWeight:600, color:"rgba(229,231,235,.7)" }}>Email</label>
            <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@example.com"
              style={baseInp}
              onFocus={e => e.target.style.borderColor="var(--app-accent)"}
              onBlur={e => e.target.style.borderColor="rgba(var(--app-accent-rgb),.2)"} />
          </div>

          <div style={{ display:"grid", gap:5 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <label style={{ fontSize:13, fontWeight:600, color:"rgba(229,231,235,.7)" }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize:12, color:"var(--app-accent)", fontWeight:600, textDecoration:"none" }}>Forgot Password?</Link>
            </div>
            <div className="relative">
              <Input name="password" value={form.password} onChange={handleChange} placeholder="Enter your password"
                type={show ? "text" : "password"}
                style={{ ...baseInp, paddingRight:44 }}
                onFocus={e => e.target.style.borderColor="var(--app-accent)"}
                onBlur={e => e.target.style.borderColor="rgba(var(--app-accent-rgb),.2)"} />
              <Button variant="ghost" size="sm" type="button" onClick={() => setShow(!show)} disabled={loading}
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent">
                {show ? <EyeOff className="w-4 h-4" style={{ color:"var(--app-accent)" }} /> : <Eye className="w-4 h-4" style={{ color:"var(--app-accent)" }} />}
              </Button>
            </div>
          </div>

          {/* ✅ Button is now INSIDE the form */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:"100%", padding:"12px 0", borderRadius:12, border:"none", fontFamily:"'DM Sans',sans-serif",
              background: loading ? "rgba(var(--app-accent-rgb),.2)" : "linear-gradient(135deg,var(--app-accent-strong),var(--app-accent))",
              color: loading ? "var(--app-accent)" : "#000",
              fontWeight:700, fontSize:15, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(var(--app-accent-rgb),.3)",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all .2s",
            }}
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Logging in...</> : "Login"}
          </button>

          <p style={{ textAlign:"center", fontSize:13, color:"var(--app-text-muted)", margin:0 }}>
            Don't have an account?{" "}
            <a href="/signup" style={{ color:"var(--app-accent)", fontWeight:700, textDecoration:"none" }}>Sign Up</a>
          </p>
        </form>
      </div>
    </AuthShell>
  )
}
