import type { CollectionConfig } from 'payload'
import { lexicalHTMLField } from '@payloadcms/richtext-lexical'
import { slugField } from '../fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Artículo', plural: 'Blog' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', '_status'],
    group: 'Contenido',
  },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  versions: { drafts: true },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true },
    slugField(),
    { name: 'excerpt', label: 'Resumen', type: 'textarea' },
    { name: 'cover', label: 'Imagen de portada', type: 'upload', relationTo: 'media' },
    { name: 'content', label: 'Contenido', type: 'richText' },
    lexicalHTMLField({ htmlFieldName: 'contentHtml', lexicalFieldName: 'content' }),
    { name: 'author', label: 'Autor', type: 'text', defaultValue: 'CCI Sabadell', admin: { position: 'sidebar' } },
    {
      name: 'publishedAt',
      label: 'Fecha de publicación',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar' },
    },
  ],
}
