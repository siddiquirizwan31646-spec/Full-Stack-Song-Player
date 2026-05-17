import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sendOtpMail } from "../emailVerify/sendOtpMail.js"
import { verifyMail } from "../emailVerify/verifyMail.js"
import { User } from "../models/userModel.js"
import { Session } from "../models/sessionModel.js"

const DEFAULT_PREFERENCES = {
    themeMode: "system",
    accentColor: "#4ade80",
    interfaceDensity: "comfortable",
    playerLayout: "spotlight",
    cardStyle: "glass",
    animationsEnabled: true,
    showGreeting: true,
    roundedCorners: 24,
}

const RESET_WINDOW_MS = 15 * 60 * 1000

const normalizeEmail = (email = "") => String(email).trim().toLowerCase()

const createAccessToken = (userId) =>
    jwt.sign(
        { id: userId },
        process.env.ACCESS_TOKEN_SECRET || process.env.SECRET_KEY,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
    )

const sanitizeUser = (user) => {
    if (!user) return null

    const plainUser = typeof user.toObject === "function" ? user.toObject() : { ...user }

    delete plainUser.password
    delete plainUser.token
    delete plainUser.otp
    delete plainUser.otpExpiry
    delete plainUser.passwordResetVerifiedAt

    plainUser.preferences = normalizePreferences(plainUser.preferences)
    return plainUser
}

const normalizePreferences = (preferences = {}) => {
    const safePreferences = { ...DEFAULT_PREFERENCES }
    const validThemeModes = ["system", "dark", "light"]
    const validDensities = ["comfortable", "compact"]
    const validPlayerLayouts = ["spotlight", "stacked"]
    const validCardStyles = ["glass", "solid"]
    const accentPattern = /^#([0-9a-f]{6})$/i

    if (validThemeModes.includes(preferences.themeMode))
        safePreferences.themeMode = preferences.themeMode

    if (accentPattern.test(preferences.accentColor || ""))
        safePreferences.accentColor = preferences.accentColor

    if (validDensities.includes(preferences.interfaceDensity))
        safePreferences.interfaceDensity = preferences.interfaceDensity

    if (validPlayerLayouts.includes(preferences.playerLayout))
        safePreferences.playerLayout = preferences.playerLayout

    if (validCardStyles.includes(preferences.cardStyle))
        safePreferences.cardStyle = preferences.cardStyle

    if (typeof preferences.animationsEnabled === "boolean")
        safePreferences.animationsEnabled = preferences.animationsEnabled

    if (typeof preferences.showGreeting === "boolean")
        safePreferences.showGreeting = preferences.showGreeting

    if (Number.isFinite(preferences.roundedCorners))
        safePreferences.roundedCorners = Math.min(32, Math.max(12, preferences.roundedCorners))

    return safePreferences
}

export const registerUser = async (req, res) => {
    try {
        const username = String(req.body?.username || "").trim()
        const email = normalizeEmail(req.body?.email)
        const password = String(req.body?.password || "")

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        const existingUser = await User.findOne({ email })
        const hashedPassword = await bcrypt.hash(password, 10)

        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({ success: false, message: "User already exists" })
            }

            const nextToken = createAccessToken(existingUser._id)
            existingUser.username = username
            existingUser.password = hashedPassword
            existingUser.token = nextToken
            await verifyMail(nextToken, email)
            await existingUser.save()

            return res.status(200).json({
                success: true,
                message: "Verification email sent again. Please verify your account.",
                data: sanitizeUser(existingUser),
            })
        }

        const newUser = await User.create({ username, email, password: hashedPassword })
        const token = createAccessToken(newUser._id)
        try {
            await verifyMail(token, email)
            newUser.token = token
            await newUser.save()
        } catch (mailError) {
            await User.findByIdAndDelete(newUser._id)
            throw new Error(`Unable to send verification email: ${mailError.message}`)
        }

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: sanitizeUser(newUser),
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const verification = async (req, res) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Authorization token is missing or invalid" })
        }

        const token = authHeader.split(" ")[1]

        let decoded
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.SECRET_KEY)
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(400).json({ success: false, message: "The verification link has expired. Please sign up again to receive a new one." })
            }

            return res.status(400).json({ success: false, message: "Token verification failed" })
        }

        const user = await User.findById(decoded.id)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        if (user.isVerified) {
            return res.status(200).json({ success: true, message: "Email already verified" })
        }

        user.token = null
        user.isVerified = true
        await user.save()

        return res.status(200).json({ success: true, message: "Email verified successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const loginUser = async (req, res) => {
    try {
        const email = normalizeEmail(req.body?.email)
        const password = String(req.body?.password || "")

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password" })
        }

        const passwordCheck = await bcrypt.compare(password, user.password)
        if (!passwordCheck) {
            return res.status(401).json({ success: false, message: "Invalid email or password" })
        }

        if (user.isVerified !== true) {
            return res.status(403).json({ success: false, message: "Verify your account before logging in" })
        }

        await Session.deleteMany({ userId: user._id })
        await Session.create({ userId: user._id })

        const accessToken = createAccessToken(user._id)
        const refreshToken = jwt.sign(
            { id: user._id },
            process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
        )

        user.isLoggedIn = true
        await user.save()

        return res.status(200).json({
            success: true,
            message: `Welcome back ${user.username}`,
            accessToken,
            refreshToken,
            user: sanitizeUser(user),
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const logoutUser = async (req, res) => {
    try {
        const userId = req.userId
        await Session.deleteMany({ userId })
        await User.findByIdAndUpdate(userId, { isLoggedIn: false })
        return res.status(200).json({ status: true, message: "Logged out successfully" })
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message })
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body?.email)
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiry = new Date(Date.now() + 10 * 60 * 1000)

        user.otp = otp
        user.otpExpiry = expiry
        user.passwordResetVerifiedAt = null
        await user.save()
        try {
            await sendOtpMail(email, otp)
        } catch (mailError) {
            user.otp = null
            user.otpExpiry = null
            user.passwordResetVerifiedAt = null
            await user.save()
            throw new Error(`Unable to send OTP email: ${mailError.message}`)
        }

        return res.status(200).json({ success: true, message: "OTP sent successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const verifyOTP = async (req, res) => {
    const { otp } = req.body
    const email = normalizeEmail(req.params.email)

    if (!otp) return res.status(400).json({ success: false, message: "OTP is required" })

    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ success: false, message: "OTP not generated or already verified" })
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." })
        }

        if (String(otp).trim() !== user.otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" })
        }

        user.otp = null
        user.otpExpiry = null
        user.passwordResetVerifiedAt = new Date()
        await user.save()

        return res.status(200).json({ success: true, message: "OTP verified successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "Internal server error" })
    }
}

export const changePassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body
    const email = normalizeEmail(req.params.email)

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: "All fields are required" })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match" })
    }

    if (String(newPassword).length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters" })
    }

    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        if (!user.passwordResetVerifiedAt || Date.now() - new Date(user.passwordResetVerifiedAt).getTime() > RESET_WINDOW_MS) {
            return res.status(403).json({ success: false, message: "Reset session expired. Please verify OTP again." })
        }

        user.password = await bcrypt.hash(newPassword, 10)
        user.passwordResetVerifiedAt = null
        await user.save()

        return res.status(200).json({ success: true, message: "Password changed successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}

export const getCurrentUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        return res.status(200).json({ success: true, user: sanitizeUser(user) })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const getUserPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        return res.status(200).json({ success: true, preferences: normalizePreferences(user.preferences) })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

export const updateUserPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        const incomingPreferences = req.body?.preferences ?? req.body ?? {}
        const mergedPreferences = normalizePreferences({
            ...normalizePreferences(user.preferences),
            ...incomingPreferences,
        })

        user.preferences = mergedPreferences
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Settings saved successfully",
            preferences: mergedPreferences,
            user: sanitizeUser(user),
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
