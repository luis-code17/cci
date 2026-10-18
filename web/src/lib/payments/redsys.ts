import crypto from 'node:crypto'
import type { PaymentConfig } from './config'

export type RedsysForm = { action: string; params: Record<string, string> }

function encodeMerchantParameters(params: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(params)).toString('base64')
}

/** Clave de operación: 3DES-CBC del número de pedido con la clave del comercio (Base64). */
function deriveTransactionKey(secretKey: string, order: string) {
  const cipher = crypto.createCipheriv('des-ede3-cbc', Buffer.from(secretKey, 'base64'), Buffer.alloc(8, 0))
  cipher.setAutoPadding(false)
  const orderBuffer = Buffer.from(order, 'utf8')
  const padded = Buffer.alloc(Math.ceil(orderBuffer.length / 8) * 8)
  orderBuffer.copy(padded)
  return Buffer.concat([cipher.update(padded), cipher.final()])
}

function sign(config: PaymentConfig, merchantParameters: string, order: string) {
  return crypto.createHmac('sha256', deriveTransactionKey(config.secretKey, order)).update(merchantParameters).digest('base64')
}

function endpoint(config: PaymentConfig) {
  return config.mode === 'test' ? 'https://sis-t.redsys.es:25443/sis/realizarPago' : 'https://sis.redsys.es/sis/realizarPago'
}

/** Número de pedido de 12 caracteres; los 4 primeros deben ser numéricos (AAMM). */
function generateOrderNumber() {
  const now = new Date()
  const prefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const bytes = crypto.randomBytes(8)
  return prefix + Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

export function createRedsysPayment(config: PaymentConfig, intent: { amountCents: number; description?: string; returnUrl: string }): RedsysForm {
  const order = generateOrderNumber()
  const merchantParameters = encodeMerchantParameters({
    Ds_Merchant_Amount: String(intent.amountCents),
    Ds_Merchant_Order: order,
    Ds_Merchant_MerchantCode: config.merchantCode,
    Ds_Merchant_Currency: config.currency,
    Ds_Merchant_TransactionType: '0',
    Ds_Merchant_Terminal: config.terminal,
    Ds_Merchant_MerchantURL: config.notifyUrl,
    Ds_Merchant_ConsumerLanguage: '001',
    Ds_Merchant_ProductDescription: intent.description ?? 'Ofrenda',
    Ds_Merchant_MerchantName: config.merchantCode,
    Ds_Merchant_UrlOK: config.mode === 'test' ? 'ns' : intent.returnUrl,
    Ds_Merchant_UrlKO: config.mode === 'test' ? 'ns' : intent.returnUrl,
  })
  return {
    action: endpoint(config),
    params: {
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: merchantParameters,
      Ds_Signature: sign(config, merchantParameters, order),
    },
  }
}

/** Valida la firma de una notificación de Redsys y devuelve los parámetros decodificados. */
export function verifyRedsysNotification(config: PaymentConfig, body: Record<string, string>) {
  const merchantParameters = body.Ds_MerchantParameters
  const signature = body.Ds_Signature
  if (!merchantParameters || !signature) return null
  try {
    const parsed = JSON.parse(Buffer.from(merchantParameters, 'base64').toString('utf8')) as Record<string, string>
    const order = parsed.Ds_Order ?? parsed.DS_ORDER ?? parsed.DS_MERCHANT_ORDER ?? ''
    if (!order) return null
    // Redsys firma la notificación en Base64 URL-safe.
    const expected = Buffer.from(sign(config, merchantParameters, order).replace(/\+/g, '-').replace(/\//g, '_'))
    const received = Buffer.from(signature.replace(/\+/g, '-').replace(/\//g, '_'))
    return expected.length === received.length && crypto.timingSafeEqual(expected, received) ? parsed : null
  } catch {
    return null
  }
}
