import "dotenv/config"
import express from "express"
import cors from "cors"
import admin from "firebase-admin"
import connectDB from "./database/db.js"
import userRoute from "./routes/userRoute.js"
import playlistRoute from "./routes/playlistRoutes.js"
import artistRoutes from "./routes/artistRoutes.js"

const app = express()
const PORT = process.env.PORT || 3000

// ── Firebase Admin Init ───────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

// ── CORS ──────────────────────────────────────────────────────────────────────
const normalizeOrigin = (value = "") => value.trim().replace(/\/+$/, "")
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.APP_URL,
  ...(process.env.FRONTEND_URLS || "").split(","),
  "https://qalbaudio.vercel.app",
  "http://localhost:5173",
].map(normalizeOrigin).filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = normalizeOrigin(origin)
    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true)
      return
    }
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}))

app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ success: true, message: "QalbAudio API is running" }))
app.get("/health", (req, res) => res.json({ status: "ok" }))
app.use("/user", userRoute)
app.use("/playlists", playlistRoute)
app.use("/artists", artistRoutes)

// ── Start ─────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening at PORT ${PORT}`)
  })
})