import { sendOtpMail } from "../emailVerify/sendOtpMail.js";
import { verifyMail } from "../emailVerify/verifyMail.js";
import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { Session } from "../models/sessionModel.js";
// NOTE: uploadAvatar/removeAvatar use local disk (path/fs).
// Render has an ephemeral filesystem — files are lost on restart.
// Use Supabase Storage or Cloudinary for persistent avatar uploads in production.

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

const sanitizeUser = (user) => {
    if (!user) return null

    const plainUser = typeof user.toObject === "function" ? user.toObject() : { ...user }

    delete plainUser.password
    delete plainUser.token
    delete plainUser.otp
    delete plainUser.otpExpiry

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


// ─────────────────────────────────────────────
//  REGISTER
// ─────────────────────────────────────────────
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "All Fields are required" })
        }
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User Already Exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await User.create({ username, email, password: hashedPassword })
        const token = jwt.sign({ id: newUser._id }, process.env.ACCESS_TOKEN_SECRET || process.env.SECRET_KEY, { expiresIn: "10m" })
        verifyMail(token, email)
        newUser.token = token
        await newUser.save()
        return res.status(201).json({
            success: true,
            message: "User Registered Successfully",
            data: sanitizeUser(newUser)
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}


// ─────────────────────────────────────────────
//  VERIFICATION
// ─────────────────────────────────────────────
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
                return res.status(400).json({ success: false, message: "The registration token has expired" })
            }
            return res.status(400).json({ success: false, message: "Token verification failed" })
        }

        const user = await User.findById(decoded.id)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        user.token = null
        user.isVerified = true
        await user.save()

        return res.status(200).json({ success: true, message: "Email Verified Successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}


// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All Fields are required" })
        }
        const user = await User.findOne({ email })
        if (!user) return res.status(401).json({ success: false, message: "Unauthorized access" })

        const passwordCheck = await bcrypt.compare(password, user.password)
        if (!passwordCheck) return res.status(402).json({ success: false, message: "Incorrect Password" })

        if (user.isVerified !== true) {
            return res.status(403).json({ success: false, message: "Verify your account then login" })
        }

        const existingSession = await Session.findOne({ userId: user._id })
        if (existingSession) await Session.deleteOne({ userId: user._id })

        await Session.create({ userId: user._id })

        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET || process.env.SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" })
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" })

        user.isLoggedIn = true
        await user.save()

        return res.status(200).json({
            success: true,
            message: `Welcome Back ${user.username}`,
            accessToken,
            refreshToken,
            user: sanitizeUser(user)   // ← avatar_url is included here automatically
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message })
    }
}


// ─────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────
export const logoutUser = async (req, res) => {
    try {
        const userId = req.userId
        await Session.deleteMany({ userId })
        await User.findByIdAndUpdate(userId, { isLoggedIn: false })
        return res.status(200).json({ status: true, message: "Logged out Successfully" })
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message })
    }
}


// ─────────────────────────────────────────────
//  FORGOT PASSWORD
// ─────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiry = new Date(Date.now() + 10 * 60 * 1000)

        user.otp = otp
        user.otpExpiry = expiry
        await user.save()
        await sendOtpMail(email, otp)

        return res.status(200).json({ success: true, message: "OTP Send Successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}


// ─────────────────────────────────────────────
//  VERIFY OTP
// ─────────────────────────────────────────────
export const verifyOTP = async (req, res) => {
    const { otp } = req.body
    const email = req.params.email

    if (!otp) return res.status(400).json({ success: false, message: "OTP is required" })

    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ success: false, message: "OTP not generated or already verified" })
        }
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ success: false, message: "OTP has been expired. Please request new one" })
        }
        if (otp !== user.otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP" })
        }

        user.otp = null
        user.otpExpiry = null
        await user.save()

        return res.status(200).json({ success: true, message: "OTP verified successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server error" })
    }
}


// ─────────────────────────────────────────────
//  CHANGE PASSWORD
// ─────────────────────────────────────────────
export const changePassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body
    const email = req.params.email

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: "All Fields are required" })
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords are not matched" })
    }
    try {
        const user = await User.findOne({ email })
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()
        return res.status(200).json({ success: true, message: "Password changed Successfully" })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error" })
    }
}


// ─────────────────────────────────────────────
//  GET PROFILE
// ─────────────────────────────────────────────
export const getCurrentUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        return res.status(200).json({ success: true, user: sanitizeUser(user) })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}


// ─────────────────────────────────────────────
//  GET PREFERENCES
// ─────────────────────────────────────────────
export const getUserPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) return res.status(404).json({ success: false, message: "User not found" })

        return res.status(200).json({ success: true, preferences: normalizePreferences(user.preferences) })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}


// ─────────────────────────────────────────────
//  UPDATE PREFERENCES
// ─────────────────────────────────────────────
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
            user: sanitizeUser(user)
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
