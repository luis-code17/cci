import type { APIRoute } from 'astro'
import { getPaymentConfig } from '@/lib/payments/config'
import { verifyRedsysNotification } from '@/lib/payments/redsys'

export const POST: APIRoute = async ({ request }) => {
  const config = getPaymentConfig()
  if (!config) return Response.json({ ok: false }, { status: 503 })

  const params = Object.fromEntries(new URLSearchParams(await request.text()).entries())
  const result = verifyRedsysNotification(config, params)
  if (!result) return Response.json({ ok: false }, { status: 400 })

  // Ds_Response 0000–0099 = pago autorizado.
  const code = Number(result.Ds_Response ?? result.DS_RESPONSE)
  console.info('[redsys] notificación', { order: result.Ds_Order, amount: result.Ds_Amount, authorized: code >= 0 && code <= 99 })
  // TODO: guardar el resultado (p. ej. en una colección "donations" del CMS).
  return Response.json({ ok: true })
}
