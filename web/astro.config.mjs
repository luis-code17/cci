// @ts-check
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import vercel from '@astrojs/vercel'
import tailwindcss from '@tailwindcss/vite'

// En Vercel se compila con su adaptador; en local y en servidores propios, con Node.
const onVercel = Boolean(process.env.VERCEL)
const vercelHost = process.env.VERCEL_ENV === 'production' ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : 'http://localhost:4321'),
  output: 'server',
  adapter: onVercel ? vercel() : node({ mode: 'standalone' }),
  devToolbar: { enabled: false },
  // URLs de la web anterior
  redirects: { '/about': '/iglesia', '/donaciones': '/ofrendas' },
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
  },
})
