import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import { buildConfig } from 'payload'
import { es } from '@payloadcms/translations/languages/es'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Events } from './collections/Events'
import { Ministries } from './collections/Ministries'
import { Messages } from './collections/Messages'
import { Settings } from './globals/Settings'
import { Home } from './globals/Home'
import { About } from './globals/About'
import { migrations as sqliteMigrations } from './migrations'
import { migrations as postgresMigrations } from './migrations-postgres'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// En Vercel, CMS y web comparten dominio: el panel y la API de Payload se publican
// bajo /admin y /api en el mismo host que la web (ver vercel.json).
function vercelURL() {
  const host = process.env.VERCEL_ENV === 'production' ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL
  return host ? `https://${host}` : undefined
}

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || vercelURL() || 'http://localhost:3001'
const webURL = process.env.WEB_URL || vercelURL() || 'http://localhost:4321'
const allowedOrigins = [...new Set([serverURL, webURL])]

/**
 * Local: archivo SQLite (sin instalar nada). Vercel: Postgres (Neon) cuando DATABASE_URL es postgres://…
 * En desarrollo el esquema se sincroniza solo; en producción se aplican las migraciones al arrancar.
 */
function database() {
  const url = process.env.DATABASE_URL || 'file:./cci.db'
  if (process.env.VERCEL && !/^postgres(ql)?:\/\//.test(url)) {
    // En Vercel no se puede escribir en disco: sin Postgres el CMS no puede arrancar.
    throw new Error(
      `[cms] DATABASE_URL no es una URL de Postgres (valor actual: ${process.env.DATABASE_URL ? 'otro motor' : 'vacía'}). ` +
        'Conecta Neon en Vercel → Storage y vuelve a desplegar.',
    )
  }
  if (/^postgres(ql)?:\/\//.test(url)) {
    return postgresAdapter({
      pool: { connectionString: url },
      migrationDir: path.resolve(dirname, 'migrations-postgres'),
      prodMigrations: postgresMigrations,
    })
  }
  return sqliteAdapter({
    client: { url },
    migrationDir: path.resolve(dirname, 'migrations'),
    prodMigrations: sqliteMigrations,
  })
}

if (process.env.VERCEL && !process.env.PAYLOAD_SECRET) {
  throw new Error('[cms] Falta PAYLOAD_SECRET en las variables de entorno de Vercel.')
}

export default buildConfig({
  serverURL,
  cors: allowedOrigins,
  csrf: allowedOrigins,
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · CCI Sabadell' },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  collections: [Posts, Events, Ministries, Media, Messages, Users],
  globals: [Settings, Home, About],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: database(),
  sharp,
  plugins: [
    // Con BLOB_READ_WRITE_TOKEN (Vercel Blob) las imágenes se guardan en Blob en lugar del disco local,
    // que en Vercel no persiste. Las subidas van directas desde el navegador (límite 4,5 MB de las funciones).
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
      clientUploads: true,
    }),
  ],
})
