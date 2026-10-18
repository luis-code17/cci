const dateFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })
const timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })

export function formatDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

export function formatTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : timeFormatter.format(date)
}

export function dateParts(value: string) {
  const date = new Date(value)
  const parts = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', weekday: 'long', timeZone: 'Europe/Madrid' }).formatToParts(date)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return { day: get('day'), month: get('month').replace('.', ''), weekday: get('weekday') }
}

export function isExternal(href?: string | null) {
  return Boolean(href && /^https?:\/\//.test(href))
}
