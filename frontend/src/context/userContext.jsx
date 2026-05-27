import axios from "axios";
import { createContext, useContext, useState, useEffect } from "react";
import {
    getFavoritesStorageKey,
    normalizeFavoriteSong,
    readFavoriteSongs,
} from "@/lib/favorites";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";

// Auto-logout when access token expires or is invalid
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status
        const message = error?.response?.data?.message || ""
        const isTokenExpired = status === 400 && message.toLowerCase().includes("expired")
        const isUnauthorized = status === 401

        if (isTokenExpired || isUnauthorized) {
            localStorage.removeItem("accessToken")
            localStorage.removeItem("user")
            if (!window.location.pathname.startsWith("/login")) {
                window.location.href = "/login"
            }
        }
        return Promise.reject(error)
    }
)

export const UserContext = createContext(null)

export const DEFAULT_PREFERENCES = {
    themeMode: "system",
    accentColor: "#4ade80",
    interfaceDensity: "comfortable",
    playerLayout: "spotlight",
    cardStyle: "glass",
    animationsEnabled: true,
    showGreeting: true,
    roundedCorners: 24,
    language: "en",
}

const normalizePreferences = (preferences = {}) => {
    const safePreferences = { ...DEFAULT_PREFERENCES }
    const validThemeModes = ["system", "dark", "light"]
    const validDensities = ["comfortable", "compact"]
    const validPlayerLayouts = ["spotlight", "stacked"]
    const validCardStyles = ["glass", "solid"]

    if (validThemeModes.includes(preferences.themeMode)) {
        safePreferences.themeMode = preferences.themeMode
    }

    if (/^#([0-9a-f]{6})$/i.test(preferences.accentColor || "")) {
        safePreferences.accentColor = preferences.accentColor
    }

    if (validDensities.includes(preferences.interfaceDensity)) {
        safePreferences.interfaceDensity = preferences.interfaceDensity
    }

    if (validPlayerLayouts.includes(preferences.playerLayout)) {
        safePreferences.playerLayout = preferences.playerLayout
    }

    if (validCardStyles.includes(preferences.cardStyle)) {
        safePreferences.cardStyle = preferences.cardStyle
    }

    if (typeof preferences.animationsEnabled === "boolean") {
        safePreferences.animationsEnabled = preferences.animationsEnabled
    }

    if (typeof preferences.showGreeting === "boolean") {
        safePreferences.showGreeting = preferences.showGreeting
    }

    if (Number.isFinite(preferences.roundedCorners)) {
        safePreferences.roundedCorners = Math.min(32, Math.max(12, preferences.roundedCorners))
    }
    const validLanguages = ["en", "hi", "ur", "ar", "zh", "bn", "ta", "te", "kn", "ru"]
    if (validLanguages.includes(preferences.language))
        safePreferences.language = preferences.language

    return safePreferences
}

const hexToRgb = (hex) => {
    const normalizedHex = hex.replace("#", "")
    const value = Number.parseInt(normalizedHex, 16)

    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    }
}

const withOpacity = (hex, opacity) => {
    const { r, g, b } = hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const adjustColor = (hex, amount) => {
    const { r, g, b } = hexToRgb(hex)
    const clamp = (value) => Math.min(255, Math.max(0, value))
    const toHex = (value) => clamp(value).toString(16).padStart(2, "0")

    return `#${toHex(r + amount)}${toHex(g + amount)}${toHex(b + amount)}`
}

const applyPreferencesToDocument = (preferences) => {
    if (typeof document === "undefined") {
        return
    }

    const root = document.documentElement
    const body = document.body
    const safePreferences = normalizePreferences(preferences)
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
    const resolvedTheme =
        safePreferences.themeMode === "system"
            ? (prefersDarkMode ? "dark" : "light")
            : safePreferences.themeMode
    const isDarkMode = resolvedTheme === "dark"

    root.classList.toggle("dark", isDarkMode)
    root.dataset.uiDensity = safePreferences.interfaceDensity
    root.dataset.playerLayout = safePreferences.playerLayout
    root.dataset.cardStyle = safePreferences.cardStyle

    body.classList.toggle("reduce-motion", !safePreferences.animationsEnabled)

    root.style.setProperty("--app-accent", safePreferences.accentColor)
    root.style.setProperty("--app-accent-rgb", `${hexToRgb(safePreferences.accentColor).r}, ${hexToRgb(safePreferences.accentColor).g}, ${hexToRgb(safePreferences.accentColor).b}`)
    root.style.setProperty("--app-accent-strong", adjustColor(safePreferences.accentColor, -28))
    root.style.setProperty("--app-accent-soft", withOpacity(safePreferences.accentColor, 0.16))
    root.style.setProperty("--app-accent-faint", withOpacity(safePreferences.accentColor, 0.08))
    root.style.setProperty("--app-radius-user", `${safePreferences.roundedCorners}px`)
    root.style.setProperty("--app-shell-bg", isDarkMode ? "#050b05" : "#f6fbf7")
    root.style.setProperty("--app-shell-bg-alt", isDarkMode ? "#0a120b" : "#ffffff")
    root.style.setProperty("--app-surface", isDarkMode ? "rgba(10, 18, 11, 0.84)" : "rgba(255, 255, 255, 0.88)")
    root.style.setProperty("--app-surface-solid", isDarkMode ? "#0d160f" : "#ffffff")
    root.style.setProperty("--app-border", isDarkMode ? withOpacity(safePreferences.accentColor, 0.18) : "rgba(15, 23, 42, 0.08)")
    root.style.setProperty("--app-text-main", isDarkMode ? "#e5e7eb" : "#162113")
    root.style.setProperty("--app-text-muted", isDarkMode ? "rgba(229, 231, 235, 0.64)" : "rgba(22, 33, 19, 0.64)")
    root.style.setProperty("--app-shadow", isDarkMode ? "0 24px 70px rgba(0, 0, 0, 0.38)" : "0 24px 70px rgba(15, 23, 42, 0.12)")
}

export const UserProvider = ({ children }) => {
    // ── Single source of truth: AuthContext ───────────────────────────────────
    // UserContext no longer reads localStorage itself. It mirrors AuthContext.user
    // so all components using useUser() always see the same logged-in state.
    const { user: authUser, loading: authLoading } = useAuth()

    const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
    const [favoriteSongs, setFavoriteSongs] = useState([])
    const [favoritesReady, setFavoritesReady] = useState(false)

    // Derive user & loading directly from AuthContext
    const user = authUser
    const loading = authLoading

    // Dummy setUser for legacy compatibility (Home.jsx etc. might still call it)
    // It's a no-op now — auth state is owned by AuthContext
    const setUser = () => { }

    const favoriteStorageKey = getFavoritesStorageKey(user?._id)

    // Sync preferences when authUser changes (login / logout)
    useEffect(() => {
        if (authUser) {
            setPreferences(normalizePreferences(authUser.preferences))
        } else {
            setPreferences(DEFAULT_PREFERENCES)
        }
    }, [authUser])

    useEffect(() => {
        applyPreferencesToDocument(preferences)
    }, [preferences])

    useEffect(() => {
        setFavoritesReady(false)
        setFavoriteSongs(readFavoriteSongs(favoriteStorageKey))
        setFavoritesReady(true)
    }, [favoriteStorageKey])

    useEffect(() => {
        if (!favoritesReady) {
            return
        }
        localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteSongs))
    }, [favoriteSongs, favoriteStorageKey, favoritesReady])

    const isFavorite = (songId) =>
        favoriteSongs.some((song) => String(song.id) === String(songId))

    const toggleFavorite = (song) => {
        const normalizedSong = normalizeFavoriteSong(song)
        if (!normalizedSong) {
            return false
        }

        let added = false

        setFavoriteSongs((currentSongs) => {
            const exists = currentSongs.some((item) => String(item.id) === String(normalizedSong.id))
            added = !exists

            if (exists) {
                return currentSongs.filter((item) => String(item.id) !== String(normalizedSong.id))
            }

            return [
                normalizedSong,
                ...currentSongs.filter((item) => String(item.id) !== String(normalizedSong.id)),
            ]
        })

        return added
    }

    const removeFavorite = (songId) => {
        setFavoriteSongs((currentSongs) =>
            currentSongs.filter((song) => String(song.id) !== String(songId))
        )
    }

    const updateStoredUser = (nextUser) => {
        if (!nextUser) {
            localStorage.removeItem("user")
            return
        }
        localStorage.setItem("user", JSON.stringify(nextUser))
    }

    const syncUserPreferences = (nextPreferences) => {
        setPreferences(nextPreferences)
    }

    const refreshCurrentUser = async () => {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
            return null
        }
        const response = await axios.get(`${API_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
        const nextUser = response.data.user
        updateStoredUser(nextUser)
        setPreferences(normalizePreferences(nextUser?.preferences))
        return nextUser
    }

    const refreshPreferences = async () => {
    const accessToken = localStorage.getItem("accessToken")
    if (!accessToken) {
        return DEFAULT_PREFERENCES
    }
    const response = await axios.get(`${API_URL}/user/preferences`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    const nextPreferences = normalizePreferences(response.data.preferences)
    syncUserPreferences(nextPreferences)

    // ← ADD HERE
    const RTL_LANGUAGES = ["ar", "ur"]
    document.documentElement.setAttribute("lang", nextPreferences.language || "en")
    document.documentElement.setAttribute("dir", RTL_LANGUAGES.includes(nextPreferences.language) ? "rtl" : "ltr")

    return nextPreferences
}

    const savePreferences = async (updates) => {
        const accessToken = localStorage.getItem("accessToken")
        if (!accessToken) {
            throw new Error("Please log in to save settings.")
        }
        const response = await axios.put(`${API_URL}/user/preferences`, updates, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        })
        const nextPreferences = normalizePreferences(response.data.preferences)
        syncUserPreferences(nextPreferences)
        return nextPreferences
    }
    

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                loading,
                preferences,
                setPreferences: (nextPreferences) =>
                    setPreferences(normalizePreferences(nextPreferences)),
                savePreferences,
                refreshPreferences,
                refreshCurrentUser,
                favoriteSongs,
                favoritesReady,
                isFavorite,
                toggleFavorite,
                removeFavorite,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => useContext(UserContext)