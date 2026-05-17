import nodemailer from "nodemailer"
import "dotenv/config"

const SMTP_USER = process.env.SMTP_USER || process.env.MAIL_USER
const SMTP_PASS = process.env.SMTP_PASS || process.env.MAIL_PASS
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_SECURE = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || SMTP_PORT === 465
const MAIL_SERVICE = process.env.MAIL_SERVICE || "gmail"
const MAIL_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS || 15000)

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
        throw new Error("Mail server is not configured. Set SMTP_USER/SMTP_PASS or MAIL_USER/MAIL_PASS on Render.")
    }

    const transporter = SMTP_HOST
        ? nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_SECURE,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
            connectionTimeout: MAIL_TIMEOUT_MS,
            greetingTimeout: MAIL_TIMEOUT_MS,
            socketTimeout: MAIL_TIMEOUT_MS,
        })
        : nodemailer.createTransport({
            service: MAIL_SERVICE,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
            connectionTimeout: MAIL_TIMEOUT_MS,
            greetingTimeout: MAIL_TIMEOUT_MS,
            socketTimeout: MAIL_TIMEOUT_MS,
        })

    await withTimeout(transporter.verify(), "Mail transport verification")
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
