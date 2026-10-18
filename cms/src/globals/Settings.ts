import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Ajustes del sitio',
  admin: { group: 'Sitio' },
  access: { read: () => true },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'churchName', label: 'Nombre', type: 'text', defaultValue: 'CCI Sabadell' },
            { name: 'fullName', label: 'Nombre completo', type: 'text', defaultValue: 'Centro Cristiano Internacional' },
            { name: 'tagline', label: 'Lema', type: 'text', defaultValue: 'Tu casa, somos uno' },
            { name: 'description', label: 'Descripción (SEO)', type: 'textarea' },
          ],
        },
        {
          label: 'Contacto',
          fields: [
            { name: 'address', label: 'Dirección', type: 'text' },
            { name: 'city', label: 'Ciudad', type: 'text' },
            { name: 'mapsUrl', label: 'Enlace a Google Maps', type: 'text' },
            {
              type: 'row',
              fields: [
                { name: 'mapLat', label: 'Latitud (mapa)', type: 'number' },
                { name: 'mapLng', label: 'Longitud (mapa)', type: 'number' },
              ],
            },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'phone', label: 'Teléfono', type: 'text' },
          ],
        },
        {
          label: 'Horarios',
          fields: [
            {
              name: 'services',
              label: 'Reuniones semanales',
              type: 'array',
              labels: { singular: 'Reunión', plural: 'Reuniones' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'day', label: 'Día', type: 'text', required: true },
                    { name: 'time', label: 'Hora', type: 'text', admin: { description: 'Déjalo vacío si aún no está confirmada.' } },
                  ],
                },
                { name: 'name', label: 'Nombre', type: 'text', required: true },
                { name: 'description', label: 'Descripción', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Redes',
          fields: [
            { name: 'instagram', type: 'text' },
            { name: 'facebook', type: 'text' },
            { name: 'youtube', type: 'text' },
          ],
        },
        {
          label: 'Aviso',
          fields: [
            {
              name: 'announcement',
              label: 'Barra de aviso superior',
              type: 'group',
              fields: [
                { name: 'enabled', label: 'Mostrar', type: 'checkbox', defaultValue: false },
                { name: 'text', label: 'Texto', type: 'text' },
                { name: 'href', label: 'Enlace', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
