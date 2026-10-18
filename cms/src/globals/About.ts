import type { GlobalConfig } from 'payload'

export const About: GlobalConfig = {
  slug: 'about',
  label: 'Iglesia (Sobre nosotros)',
  admin: { group: 'Sitio' },
  access: { read: () => true },
  fields: [
    { name: 'title', label: 'Título', type: 'text' },
    { name: 'intro', label: 'Introducción', type: 'textarea' },
    { name: 'image', label: 'Imagen principal', type: 'upload', relationTo: 'media' },
    { name: 'mission', label: 'Misión', type: 'textarea' },
    {
      name: 'values',
      label: 'Valores',
      type: 'array',
      fields: [
        { name: 'title', label: 'Título', type: 'text', required: true },
        { name: 'description', label: 'Descripción', type: 'textarea' },
      ],
    },
    {
      name: 'beliefs',
      label: 'Lo que creemos',
      type: 'array',
      fields: [
        { name: 'title', label: 'Título', type: 'text', required: true },
        { name: 'description', label: 'Descripción', type: 'textarea' },
        { name: 'reference', label: 'Cita bíblica', type: 'text' },
      ],
    },
    {
      name: 'leaders',
      label: 'Pastores y liderazgo',
      type: 'array',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'role', label: 'Cargo', type: 'text' },
        { name: 'photo', label: 'Foto', type: 'upload', relationTo: 'media' },
        { name: 'bio', label: 'Biografía', type: 'textarea' },
      ],
    },
  ],
}
