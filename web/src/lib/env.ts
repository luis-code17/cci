/** Lee variables de entorno tanto en `astro dev` (import.meta.env) como en producción (process.env). */
export function env(name: string): string | undefined {
  const value = process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name]
  return value?.trim() ? value.trim() : undefined
}
