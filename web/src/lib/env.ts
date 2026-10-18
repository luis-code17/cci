/** Lee variables de entorno tanto en `astro dev` (import.meta.env) como en producción (process.env). */
export function env(name: string): string | undefined {
  const value = process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name]
  return value?.trim() ? value.trim() : undefined
}

/** URL pública de la web: PUBLIC_SITE_URL o, en Vercel, el dominio del despliegue. */
export function siteUrl() {
  const explicit = env('PUBLIC_SITE_URL')
  if (explicit) return explicit
  const host = env('VERCEL_ENV') === 'production' ? env('VERCEL_PROJECT_PRODUCTION_URL') : env('VERCEL_URL')
  return host ? `https://${host}` : 'http://localhost:4321'
}
