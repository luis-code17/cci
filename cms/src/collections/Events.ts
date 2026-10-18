import type { CollectionConfig } from 'payload'
import { lexicalHTMLField } from '@payloadcms/richtext-lexical'
import { slugField } from '../fields/slug'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Evento', plural: 'Eventos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startsAt', 'location'],
    group: 'Contenido',
  },
  access: { read: () => true },
  defaultSort: 'startsAt',
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    slugField(),
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Empieza', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'endsAt', label: 'Termina', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    { name: 'location', label: 'Lugar', type: 'text', defaultValue: 'CCI Sabadell · Carrer de Brutau, 100' },
    { name: 'summary', label: 'Descripción corta', type: 'textarea' },
    { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media' },
    { name: 'description', label: 'Descripción', type: 'richText' },
    lexicalHTMLField({ htmlFieldName: 'descriptionHtml', lexicalFieldName: 'description' }),
    { name: 'registrationUrl', label: 'Enlace de inscripción', type: 'text' },
    { name: 'featured', label: 'Destacar en portada', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
