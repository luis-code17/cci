// @ts-check
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  output: 'server',
  devToolbar: { enabled: false },
  // URLs de la web anterior
  redirects: { '/about': '/iglesia', '/donaciones': '/ofrendas' },
  adapter: node({ mode: 'standalone' }),
  server: { port: 4321 },
  image: {
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }, { protocol: 'https', hostname: 'img.youtube.com' }],
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
