import type { Field } from 'payload'

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Slug que se rellena a partir de `sourceField` si el editor lo deja vacío. */
export function slugField(sourceField = 'title'): Field {
  return {
    name: 'slug',
    type: 'text',
    index: true,
    unique: true,
    admin: {
      position: 'sidebar',
      description: 'Se genera automáticamente a partir del título si lo dejas vacío.',
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          if (typeof value === 'string' && value.trim()) return slugify(value)
          const source = data?.[sourceField]
          return typeof source === 'string' ? slugify(source) : value
        },
      ],
    },
  }
}
