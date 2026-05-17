import { Resend } from "resend"
import "dotenv/config"

const resend = new Resend(process.env.RESEND_API_KEY)

export const getFromAddress = () =>
    process.env.MAIL_FROM || "QalbAudio <onboarding@resend.dev>"

export const sendMail = async ({ to, subject, html, text }) => {
    try {
        const { data, error } = await resend.emails.send({
            from: getFromAddress(),
            to,
            subject,
            html,
            text,
        })

        if (error) {
            console.error("Resend error:", error)
            throw new Error(error.message)
        }

        console.log(`Mail sent successfully to ${to}`, data)
        return data
    } catch (error) {
        console.error("Mail send failed:", error.message)
        throw error
    }
}
