import type { GlobalConfig } from 'payload'
import { linkFields } from '../fields/link'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Portada',
  admin: { group: 'Sitio' },
  access: { read: () => true },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Cabecera',
          fields: [
            {
              name: 'hero',
              type: 'group',
              label: false,
              fields: [
                { name: 'eyebrow', label: 'Antetítulo', type: 'text' },
                { name: 'title', label: 'Título', type: 'text' },
                { name: 'subtitle', label: 'Subtítulo', type: 'textarea' },
                { name: 'image', label: 'Imagen de fondo', type: 'upload', relationTo: 'media' },
                { name: 'primary', label: 'Botón principal', type: 'group', fields: linkFields() },
                { name: 'secondary', label: 'Botón secundario', type: 'group', fields: linkFields() },
              ],
            },
          ],
        },
        {
          label: 'Bienvenida',
          fields: [
            { name: 'statement', label: 'Declaración', type: 'textarea', admin: { description: 'Texto grande que presenta a la iglesia.' } },
            {
              name: 'culture',
              label: 'Nuestra cultura',
              type: 'group',
              fields: [
                { name: 'title', label: 'Título', type: 'text' },
                { name: 'body', label: 'Texto', type: 'textarea' },
                { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        {
          label: 'Para ti',
          fields: [
            {
              name: 'nextSteps',
              label: 'Próximos pasos',
              type: 'array',
              maxRows: 4,
              fields: [
                { name: 'title', label: 'Título', type: 'text', required: true },
                { name: 'description', label: 'Descripción', type: 'textarea' },
                ...linkFields(),
              ],
            },
          ],
        },
        {
          label: 'Online',
          fields: [
            {
              name: 'online',
              type: 'group',
              label: 'CCI Online',
              fields: [
                { name: 'title', label: 'Título', type: 'text' },
                { name: 'body', label: 'Texto', type: 'textarea' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
