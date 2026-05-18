// src/components/ui/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()

    // Show a themed loader — never return null (null = white flash)
    if (loading) {
        return (
            <div style={{
                minHeight: "100dvh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--app-shell-bg, #030a06)",
                flexDirection: "column",
                gap: 16,
            }}>
                <style>{`
                    @keyframes pr-spin { to { transform: rotate(360deg); } }
                    @keyframes pr-pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
                `}</style>
                <div style={{
                    width: 44, height: 44,
                    border: "3px solid rgba(var(--app-accent-rgb, 74,222,128), 0.15)",
                    borderTopColor: "var(--app-accent, #4ade80)",
                    borderRadius: "50%",
                    animation: "pr-spin 0.8s linear infinite",
                }} />
                <div style={{
                    color: "var(--app-accent, #4ade80)",
                    fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    opacity: 0.7,
                    animation: "pr-pulse 1.8s ease-in-out infinite",
                }}>
                    Loading QalbAudio…
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}

export default ProtectedRoute
