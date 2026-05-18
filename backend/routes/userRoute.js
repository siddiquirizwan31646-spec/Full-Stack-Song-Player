import express from "express"
import {
    changePassword,
    getCurrentUserProfile,
    forgotPassword,
    getUserPreferences,
    loginUser,
    logoutUser,
    registerUser,
    updateUserPreferences,
    verification,
    verifyOTP,
    googleLogin,        // ← ADD THIS
} from "../controllers/userController.js"
import { isAuthenticated } from "../middleware/isAuthenticated.js"
import { userSchema, validateUser } from "../validators/userValidate.js"

const router = express.Router()

router.post('/register', validateUser(userSchema), registerUser)
router.post('/verify', verification)
router.post('/login', loginUser)
router.post('/google-login', googleLogin)        // ← ADD THIS
router.post('/logout', isAuthenticated, logoutUser)
router.post('/forgot-password', forgotPassword)
router.post('/forgot-Password', forgotPassword)
router.post('/verify-otp/:email', verifyOTP)
router.post('/verify-OTP/:email', verifyOTP)
router.post('/change-password/:email', changePassword)
router.post('/change-Password/:email', changePassword)
router.get('/profile', isAuthenticated, getCurrentUserProfile)
router.get('/preferences', isAuthenticated, getUserPreferences)
router.put('/preferences', isAuthenticated, updateUserPreferences)

export default router