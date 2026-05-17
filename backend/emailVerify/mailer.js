import nodemailer from "nodemailer"
import "dotenv/config"

const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASS
const SMTP_HOST = process.env.SMTP_HOST || "smtp-relay.brevo.com"
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const MAIL_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS || 30000)

let transporterPromise

const withTimeout = async (promise, label) => {
    let timeoutId
    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`${label} timed out after ${MAIL_TIMEOUT_MS}ms`))
                }, MAIL_TIMEOUT_MS)
            }),
        ])
    } finally {
        clearTimeout(timeoutId)
    }
}

const createTransporter = async () => {
    if (!SMTP_USER || !SMTP_PASS) {
        throw new Error("Mail not configured. Set SMTP_USER and SMTP_PASS in Render environment.")
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false, // TLS on port 587
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
        connectionTimeout: MAIL_TIMEOUT_MS,
        greetingTimeout: MAIL_TIMEOUT_MS,
        socketTimeout: MAIL_TIMEOUT_MS,
    })

    await withTimeout(transporter.verify(), "Mail transport verification")
    console.log("Mail transporter verified successfully")
    return transporter
}

export const getTransporter = async () => {
    if (!transporterPromise) {
        transporterPromise = createTransporter().catch((error) => {
            transporterPromise = null
            throw error
        })
    }
    return transporterPromise
}

export const getFromAddress = () =>
    process.env.MAIL_FROM || `"QalbAudio - Islamic Audio Platform" <${SMTP_USER}>`

export const sendMail = async (options) => {
    const transporter = await getTransporter()
    try {
        return await withTimeout(
            transporter.sendMail({
                from: getFromAddress(),
                ...options,
            }),
            `Mail send to ${options?.to || "recipient"}`
        )
    } catch (error) {
        console.error("Mail send failed:", error.message)
        throw error
    }
}
