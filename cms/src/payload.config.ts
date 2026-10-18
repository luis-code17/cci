import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001'
const webURL = process.env.WEB_URL || 'http://localhost:4321'

export default buildConfig({
  serverURL,
  cors: [webURL],
  csrf: [webURL],
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
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || 'file:./cci.db',
    },
    // En desarrollo el esquema se sincroniza solo; en producción se aplican las migraciones al arrancar.
    prodMigrations: migrations,
  }),
  sharp,
  plugins: [],
})
