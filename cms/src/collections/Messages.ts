import type { CollectionConfig } from 'payload'

/**
 * Mensajes del formulario de contacto / peticiones de oración.
 * El frontend los crea enviando la cabecera `x-form-secret` (FORM_SECRET).
 */
export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: { singular: 'Mensaje', plural: 'Mensajes' },
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'name', 'kind', 'createdAt'],
    group: 'Comunidad',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
    create: ({ req }) => {
      if (req.user) return true
      const secret = process.env.FORM_SECRET
      return Boolean(secret) && req.headers.get('x-form-secret') === secret
    },
  },
  fields: [
    {
      name: 'kind',
      label: 'Tipo',
      type: 'select',
      defaultValue: 'contacto',
      options: [
        { label: 'Contacto', value: 'contacto' },
        { label: 'Petición de oración', value: 'oracion' },
        { label: 'Primera visita', value: 'visita' },
      ],
    },
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'subject', label: 'Asunto', type: 'text', required: true },
    { name: 'message', label: 'Mensaje', type: 'textarea', required: true },
    { name: 'handled', label: 'Atendido', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
