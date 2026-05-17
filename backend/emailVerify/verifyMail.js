import "dotenv/config"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import handlebars from "handlebars"
import { sendMail } from "./mailer.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const verifyMail = async (token, email) => {
    const appUrl = (process.env.FRONTEND_URL || process.env.APP_URL || "https://qalbaudio.vercel.app").replace(/\/+$/, "")

    const emailTemplateSource = fs.readFileSync(
        path.join(__dirname, "template.hbs"),
        "utf-8"
    )

    const template = handlebars.compile(emailTemplateSource)
    const verificationUrl = `${appUrl}/verify/${encodeURIComponent(token)}`
    const htmlToSend = template({ verificationUrl })

    return sendMail({
        to: email,
        subject: "Email Verification - QalbAudio",
        html: htmlToSend,
        text: `Verify your QalbAudio account: ${verificationUrl}`,
    })
}
