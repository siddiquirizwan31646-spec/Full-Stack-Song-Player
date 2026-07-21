// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { API_URL } from "@/lib/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // ── Rehydrate from localStorage on mount ──────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    const storedUser  = localStorage.getItem("user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // ── Persist helpers ────────────────────────────────────────────────────────
  const persist = useCallback((userData, accessToken, refreshToken) => {
    localStorage.setItem("accessToken",  accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user",         JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const result       = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken      = await firebaseUser.getIdToken();

      const res = await fetch(`${API_URL}/user/google-login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          name:  firebaseUser.displayName,
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
          uid:   firebaseUser.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Backend authentication failed");

      persist(data.user, data.accessToken, data.refreshToken);
      await firebaseSignOut(auth);
      return data.user;
    } catch (err) {
      const msg =
        err.code === "auth/popup-closed-by-user"
          ? "Sign-in cancelled."
          : err.code === "auth/network-request-failed"
            ? "Network error. Check your connection."
            : err.code === "auth/popup-blocked"
              ? "Popup blocked. Please allow popups for this site."
              : err.message || "Google sign-in failed.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persist]);
// ── Google Sign-In (from native Android app) ───────────────────────────────
  const loginWithGoogleNative = useCallback(async (googleIdToken) => {
    setError("");
    setLoading(true);
    try {
      const credential    = GoogleAuthProvider.credential(googleIdToken);
      const result        = await signInWithCredential(auth, credential);
      const firebaseUser  = result.user;
      const idToken       = await firebaseUser.getIdToken();

      const res = await fetch(`${API_URL}/user/google-login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          name:  firebaseUser.displayName,
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
          uid:   firebaseUser.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Backend authentication failed");

      persist(data.user, data.accessToken, data.refreshToken);
      await firebaseSignOut(auth);
      return data.user;
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persist]);
  // ── Email/Password Login ───────────────────────────────────────────────────
  const loginWithEmail = useCallback(async (email, password) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      persist(data.user, data.accessToken, data.refreshToken);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  // ── Logout — clears EVERYTHING, then redirects ─────────────────────────────
  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/user/logout`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      try { await firebaseSignOut(auth); } catch { /* already signed out */ }
      clear();
      // Hard navigate — ensures all context state resets cleanly
      window.location.replace("/");
    }
  }, [clear, token]);

  const value = {
    user,
    token,
    loading,
    error,
    setError,
    loginWithGoogle,
    loginWithEmail,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
