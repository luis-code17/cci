import nodemailer from 'nodemailer'
import { env } from './env'

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

/** Envía el mensaje por SMTP si está configurado. Devuelve `false` si no hay SMTP. */
export async function sendContactEmail(message: { kindLabel: string; name: string; email: string; subject: string; message: string }) {
  const host = env('SMTP_HOST')
  const user = env('SMTP_USER')
  const pass = env('SMTP_PASS')
  const to = env('CONTACT_TO_EMAIL')
  if (!host || !user || !pass || !to) return false

  const port = Number(env('SMTP_PORT') ?? 587)
  const brand = env('CONTACT_FROM_NAME') ?? 'CCI Sabadell'
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  const rows = [
    ['Tipo', message.kindLabel],
    ['Nombre', message.name],
    ['Email', message.email],
    ['Asunto', message.subject],
  ]
  await transporter.sendMail({
    from: env('SMTP_FROM') ?? 'CCI Sabadell <no-reply@example.com>',
    to,
    replyTo: message.email,
    subject: `[${message.kindLabel}] ${message.subject}`,
    text: [...rows.map(([label, value]) => `${label}: ${value}`), '', message.message].join('\n'),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin:0 0 12px">${escapeHtml(brand)} · ${escapeHtml(message.kindLabel)}</h2>
      ${rows.map(([label, value]) => `<p style="margin:0 0 6px"><strong>${label}:</strong> ${escapeHtml(value)}</p>`).join('')}
      <div style="margin-top:16px;padding:16px;border:1px solid #e5e5e5;border-radius:12px;white-space:pre-wrap">${escapeHtml(message.message)}</div>
    </div>`,
  })
  return true
}
