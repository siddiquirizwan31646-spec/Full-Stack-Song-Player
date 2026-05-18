// src/components/GoogleLoginButton.jsx
// Place at: frontend/src/components/GoogleLoginButton.jsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const GOOGLE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function GoogleLoginButton({ onSuccess, className = "" }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hover, setHover]     = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (onSuccess) onSuccess(user);
      else navigate("/hero");
    } catch {
      // error is already set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes google-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes google-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes google-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .google-btn {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 14px;
          border: 1px solid rgba(16, 185, 129, 0.25);
          background: rgba(255, 255, 255, 0.03);
          color: #e2e8f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          letter-spacing: 0.01em;
          box-shadow:
            0 0 0 0 rgba(16, 185, 129, 0),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .google-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 35%,
            rgba(16, 185, 129, 0.08) 50%,
            transparent 65%
          );
          background-size: 200% auto;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .google-btn:hover:not(:disabled) {
          border-color: rgba(16, 185, 129, 0.55);
          background: rgba(16, 185, 129, 0.07);
          color: #fff;
          transform: translateY(-2px);
          box-shadow:
            0 0 24px rgba(16, 185, 129, 0.18),
            0 8px 32px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .google-btn:hover::before {
          opacity: 1;
          animation: google-shimmer 1.8s linear infinite;
        }
        .google-btn:active:not(:disabled) {
          transform: translateY(0px);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.12);
        }
        .google-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .google-btn-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.08);
          transition: background 0.3s;
        }
        .google-btn:hover .google-btn-icon-wrap {
          background: rgba(255,255,255,0.1);
        }
        .google-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(16,185,129,0.3);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: google-spin 0.75s linear infinite;
          flex-shrink: 0;
        }
        .google-btn-text {
          flex: 1;
          text-align: center;
        }
        .google-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .google-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent);
        }
        .google-divider-text {
          font-size: 11px;
          font-weight: 700;
          color: rgba(148,163,184,0.7);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }
      `}</style>

      <button
        className={`google-btn ${className}`}
        onClick={handleClick}
        disabled={loading}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        type="button"
        aria-label="Continue with Google"
      >
        <div className="google-btn-icon-wrap">
          {loading ? <div className="google-spinner" /> : GOOGLE_ICON}
        </div>
        <span className="google-btn-text">
          {loading ? "Signing in…" : "Continue with Google"}
        </span>
      </button>
    </>
  );
}

// Divider component to use between Google button and email form
export function OrDivider() {
  return (
    <div className="google-divider">
      <div className="google-divider-line" />
      <span className="google-divider-text">or</span>
      <div className="google-divider-line" />
    </div>
  );
}
