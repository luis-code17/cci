import type { CollectionConfig } from 'payload'
import { slugField } from '../fields/slug'

export const Ministries: CollectionConfig = {
  slug: 'ministries',
  labels: { singular: 'Ministerio', plural: 'Ministerios' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'audience', 'order'],
    group: 'Contenido',
  },
  access: { read: () => true },
  defaultSort: 'order',
  fields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    slugField('name'),
    { name: 'audience', label: 'Para quién', type: 'text', admin: { description: 'Ej. "Niños de 3 a 11 años".' } },
    { name: 'tagline', label: 'Frase', type: 'text' },
    { name: 'description', label: 'Descripción', type: 'textarea' },
    { name: 'meetingTime', label: 'Cuándo se reúne', type: 'text' },
    { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media' },
    { name: 'order', label: 'Orden', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
