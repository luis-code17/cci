import type { APIRoute } from 'astro'
import { z } from 'zod'
import { getPaymentConfig } from '@/lib/payments/config'
import { createRedsysPayment } from '@/lib/payments/redsys'

const CreateDonationSchema = z.object({
  amount: z.number().int().min(100).max(1_000_000), // céntimos: 1 € – 10.000 €
  returnUrl: z.url(),
  description: z.string().max(125).optional(),
})

export const POST: APIRoute = async ({ request }) => {
  const config = getPaymentConfig()
  if (!config) return Response.json({ ok: false, error: 'El pago con tarjeta no está disponible ahora mismo.' }, { status: 503 })

  const parsed = CreateDonationSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ ok: false, error: 'Importe inválido. El mínimo es 1 €.' }, { status: 400 })
  }

  // Solo se aceptan URLs de retorno de este mismo sitio.
  const requested = new URL(parsed.data.returnUrl)
  const returnUrl = requested.origin === new URL(config.siteUrl).origin ? requested.toString() : new URL('/ofrendas', config.siteUrl).toString()

  const form = createRedsysPayment(config, { amountCents: parsed.data.amount, description: parsed.data.description, returnUrl })
  return Response.json({ ok: true, data: { form } })
}
