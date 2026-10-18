import { z } from 'zod'
import { env } from '../env'

const schema = z.object({
  REDSYS_MERCHANT_CODE: z.string().min(1),
  REDSYS_SECRET_KEY: z.string().min(1),
  REDSYS_TERMINAL: z.string().optional(),
  REDSYS_MODE: z.enum(['production', 'test']).default('production'),
  REDSYS_CURRENCY: z.string().default('978'),
  REDSYS_NOTIFY_URL: z.url().optional(),
  PUBLIC_SITE_URL: z.url().optional(),
})

export type PaymentConfig = {
  merchantCode: string
  secretKey: string
  terminal: string
  mode: 'production' | 'test'
  currency: string
  notifyUrl?: string
  siteUrl: string
}

/** Devuelve la configuración de Redsys, o `null` si no está completa. */
export function getPaymentConfig(): PaymentConfig | null {
  const parsed = schema.safeParse(Object.fromEntries(Object.keys(schema.shape).map((key) => [key, env(key)])))
  if (!parsed.success) return null
  const data = parsed.data
  const siteUrl = data.PUBLIC_SITE_URL ?? 'http://localhost:4321'
  return {
    merchantCode: data.REDSYS_MERCHANT_CODE,
    secretKey: data.REDSYS_SECRET_KEY,
    // Terminal: valor configurado o '001' en pruebas y '1' en producción.
    terminal: data.REDSYS_TERMINAL ?? (data.REDSYS_MODE === 'test' ? '001' : '1'),
    mode: data.REDSYS_MODE,
    currency: data.REDSYS_CURRENCY,
    notifyUrl: data.REDSYS_NOTIFY_URL ?? new URL('/api/payments/webhook/redsys', siteUrl).toString(),
    siteUrl,
  }
}
