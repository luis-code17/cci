/**
 * Rellena el CMS con el contenido base de `content/site.json`.
 * Uso: `pnpm seed` (desde la raíz o desde cms/). Es idempotente: solo crea
 * lo que falta y no sobrescribe cambios hechos desde el panel.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Payload } from 'payload'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const contentPath = path.resolve(dirname, '../../../content/site.json')
const assetsDir = path.resolve(dirname, '../../seed-assets')

const site = JSON.parse(fs.readFileSync(contentPath, 'utf8'))

function paragraphs(text: string) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: text.split(/\n{2,}/).map((block) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        textFormat: 0,
        children: [{ type: 'text', text: block, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
      })),
    },
  }
}

const mediaCache = new Map<string, number>()

async function media(payload: Payload, file: string | undefined, alt: string) {
  if (!file) return undefined
  if (mediaCache.has(file)) return mediaCache.get(file)
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: file } }, limit: 1 })
  if (existing.docs[0]) {
    mediaCache.set(file, existing.docs[0].id)
    return existing.docs[0].id
  }
  const filePath = path.join(assetsDir, file)
  if (!fs.existsSync(filePath)) return undefined
  const doc = await payload.create({ collection: 'media', data: { alt }, filePath })
  mediaCache.set(file, doc.id)
  return doc.id
}

async function globalIsEmpty(payload: Payload, slug: 'settings' | 'home' | 'about', key: string) {
  const current = (await payload.findGlobal({ slug })) as unknown as Record<string, unknown>
  const value = current[key]
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}

async function seed() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

  if (await globalIsEmpty(payload, 'settings', 'address')) {
    await payload.updateGlobal({ slug: 'settings', data: site.settings })
    log('Ajustes del sitio')
  }

  if (await globalIsEmpty(payload, 'home', 'statement')) {
    const { home } = site
    await payload.updateGlobal({
      slug: 'home',
      data: {
        ...home,
        hero: { ...home.hero, image: await media(payload, 'adoracion.jpeg', 'Adoración en CCI Sabadell') },
        culture: { ...home.culture, image: await media(payload, 'conocenos.jpeg', 'Comunidad de CCI Sabadell') },
      },
    })
    log('Portada')
  }

  if (await globalIsEmpty(payload, 'about', 'intro')) {
    const { about } = site
    await payload.updateGlobal({
      slug: 'about',
      data: {
        ...about,
        image: await media(payload, 'conocenos.jpeg', 'Comunidad de CCI Sabadell'),
        leaders: await Promise.all(
          about.leaders.map(async (leader: { name: string; photo?: string }) => ({
            ...leader,
            photo: await media(payload, leader.photo, leader.name),
          })),
        ),
      },
    })
    log('Iglesia')
  }

  for (const [index, ministry] of site.ministries.entries()) {
    const found = await payload.find({ collection: 'ministries', where: { name: { equals: ministry.name } }, limit: 1 })
    if (found.docs.length) continue
    await payload.create({
      collection: 'ministries',
      data: { ...ministry, order: index, image: await media(payload, ministry.image, ministry.name) },
    })
    log(`Ministerio: ${ministry.name}`)
  }

  for (const post of site.posts) {
    const found = await payload.find({ collection: 'posts', where: { title: { equals: post.title } }, limit: 1, draft: true })
    if (found.docs.length) continue
    await payload.create({
      collection: 'posts',
      data: {
        title: post.title,
        excerpt: post.excerpt,
        content: paragraphs(post.body),
        cover: await media(payload, 'conocenos.jpeg', 'Comunidad de CCI Sabadell'),
        _status: 'published',
      },
    })
    log(`Artículo: ${post.title}`)
  }

  log('Listo ✔')
  process.exit(0)
}

try {
  await seed()
} catch (error) {
  console.error(error)
  process.exit(1)
}
