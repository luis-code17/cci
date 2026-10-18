import type { APIRoute } from 'astro'
import { z } from 'zod'
import { createMessage } from '@/lib/cms'
import { sendContactEmail } from '@/lib/mail'

const KINDS = { contacto: 'Contacto', oracion: 'Petición de oración', visita: 'Primera visita' } as const

const ContactSchema = z.object({
  kind: z.enum(['contacto', 'oracion', 'visita']).default('contacto'),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().pipe(z.email()),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
  // Campo trampa para bots: debe llegar vacío.
  website: z.string().max(0).optional(),
})

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null)
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ ok: false, error: 'Revisa los campos del formulario.' }, { status: 400 })
  }
  const { website: _honeypot, ...data } = parsed.data
  const [stored, mailed] = await Promise.all([
    createMessage(data),
    sendContactEmail({ ...data, kindLabel: KINDS[data.kind] }).catch(() => false),
  ])
  if (!stored && !mailed) {
    return Response.json({ ok: false, error: 'No pudimos enviar tu mensaje. Escríbenos a sabadellcci@gmail.com.' }, { status: 502 })
  }
  return Response.json({ ok: true })
}
