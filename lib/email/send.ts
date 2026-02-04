import nodemailer from "nodemailer"
import { Resend } from "resend"

interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]
  return value || undefined
}

function getResendConfig() {
  const apiKey = getOptionalEnv("RESEND_API_KEY")
  const from = getOptionalEnv("RESEND_FROM")
  if (!apiKey || !from) return null
  return { apiKey, from }
}

function getSmtpConfig() {
  return {
    host: getRequiredEnv("SMTP_HOST"),
    port: Number(getOptionalEnv("SMTP_PORT") || 587),
    secure: (getOptionalEnv("SMTP_SECURE") || "false") === "true",
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_PASS"),
    },
    from: getRequiredEnv("SMTP_FROM"),
  }
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const resendConfig = getResendConfig()
  if (resendConfig) {
    const resend = new Resend(resendConfig.apiKey)
    await resend.emails.send({
      from: resendConfig.from,
      to,
      subject,
      text,
      html,
    })
    return
  }

  const smtp = getSmtpConfig()
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  })

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject,
    text,
    html,
  })
}
