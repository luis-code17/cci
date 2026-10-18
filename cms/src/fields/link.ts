import type { Field } from 'payload'

export function linkFields(prefix = ''): Field[] {
  return [
    { name: `${prefix}label`, label: 'Texto', type: 'text' },
    { name: `${prefix}href`, label: 'Enlace', type: 'text', admin: { description: 'Ruta interna (/visitanos) o URL completa.' } },
  ]
}
