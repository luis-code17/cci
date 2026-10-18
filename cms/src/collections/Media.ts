import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  admin: { group: 'Contenido' },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      label: 'Texto alternativo',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    imageSizes: [
      { name: 'card', width: 900 },
      { name: 'hero', width: 2000 },
    ],
    mimeTypes: ['image/*'],
  },
}
