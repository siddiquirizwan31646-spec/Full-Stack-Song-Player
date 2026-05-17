import mongoose, { Schema } from "mongoose";

const preferencesSchema = new Schema(
    {
        themeMode: {
            type: String,
            enum: ["system", "dark", "light"],
            default: "system",
        },
        accentColor: {
            type: String,
            default: "#4ade80",
        },
        interfaceDensity: {
            type: String,
            enum: ["comfortable", "compact"],
            default: "comfortable",
        },
        playerLayout: {
            type: String,
            enum: ["spotlight", "stacked"],
            default: "spotlight",
        },
        cardStyle: {
            type: String,
            enum: ["glass", "solid"],
            default: "glass",
        },
        animationsEnabled: {
            type: Boolean,
            default: true,
        },
        showGreeting: {
            type: Boolean,
            default: true,
        },
        roundedCorners: {
            type: Number,
            min: 12,
            max: 32,
            default: 24,
        },
    },
    { _id: false }
)

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isLoggedIn: { type: Boolean, default: false },
    token: { type: String, default: null },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    passwordResetVerifiedAt: { type: Date, default: null },
    activePlan: { type: String, enum: ["Basic", "Standard", "Premium"], default: null },
    planActivatedAt: { type: Date, default: null },
    preferences: {
        type: preferencesSchema,
        default: () => ({}),
    },
}, { timestamps: true })

export const User = mongoose.model("User", userSchema)
