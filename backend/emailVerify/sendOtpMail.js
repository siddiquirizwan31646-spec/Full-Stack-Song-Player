import "dotenv/config"
import { sendMail } from "./mailer.js"

export const sendOtpMail = async (email, otp) => {
    return sendMail({
        to: email,
        subject: "Password Reset OTP - QalbAudio",
        text: `Your QalbAudio password reset OTP is ${otp}. It is valid for 10 minutes.`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#0a0f0a;font-family:'DM Sans',Arial,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0f0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="540" cellpadding="0" cellspacing="0" style="background:#0d1a0d;border-radius:20px;overflow:hidden;border:1px solid rgba(74,222,128,0.18);box-shadow:0 8px 48px rgba(0,0,0,0.6);">
          <tr>
            <td style="background:linear-gradient(135deg,#0a1a0a,#0d2010);padding:40px 30px 32px;text-align:center;border-bottom:1px solid rgba(74,222,128,0.1);">
              <div style="margin-bottom:6px;">
                <img src="https://i.postimg.cc/wMj8BDkS/Chat-GPT-Image-May-11-2026-02-56-29-PM.png" alt="QalbAudio" style="height:90px;width:auto;object-fit:contain;display:inline-block;" />
              </div>
              <h2 style="margin:0;font-weight:800;font-size:22px;color:#e5e7eb;letter-spacing:-0.3px;">Password Reset OTP</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 8px;color:rgba(229,231,235,0.6);font-size:15px;line-height:1.8;">
              <p style="margin-top:0;color:#e5e7eb;font-weight:600;font-size:16px;">Assalamu Alaikum</p>
              <p style="margin:0 0 16px;">
                We received a request to reset your <strong style="color:#4ade80;">QalbAudio</strong> account password.
                Use the OTP below to proceed. It is valid for <strong style="color:#e5e7eb;">10 minutes</strong>.
              </p>
              <div style="text-align:center;margin:36px 0;">
                <div style="display:inline-block;background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.3);border-radius:14px;padding:20px 40px;">
                  <span style="font-size:38px;font-weight:900;letter-spacing:10px;color:#4ade80;font-family:monospace;">${otp}</span>
                </div>
              </div>
              <p style="color:rgba(229,231,235,0.25);font-size:12px;text-align:center;margin-bottom:0;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    })
}
