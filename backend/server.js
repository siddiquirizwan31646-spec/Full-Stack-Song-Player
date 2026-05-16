import express from "express"
import 'dotenv/config'
import connectDB from "./database/db.js"
import userRoute from "./routes/userRoute.js"
import playlistRoute from "./routes/playlistRoutes.js"
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3000

// ✅ Middleware FIRST
const allowedOrigins = [
    process.env.FRONTEND_URL,       // e.g. https://your-app.vercel.app
    'http://localhost:5173',         // local dev
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (mobile apps, curl, Render health checks)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`))
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}))
app.use(express.json())

// ✅ Routes AFTER
app.get('/', (req, res) => res.json({ success: true, message: 'QalbAudio API is running 🎵' }))
app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/user', userRoute)
app.use('/playlists', playlistRoute)

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is listening at PORT ${PORT}`)
    })
})
