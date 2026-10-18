/**
 * Cliente de la API REST de Payload CMS.
 * Si el CMS no responde, cada función devuelve el contenido base de
 * `content/site.json` para que la web nunca se quede vacía.
 */
import site from '@content/site.json'
import { cached } from './cache'
import { env } from './env'

const CMS_TTL_SECONDS = 60

export type Media = {
  url: string
  alt: string
  width?: number
  height?: number
  sizes?: Record<string, { url?: string | null; width?: number | null } | undefined>
}

export type Link = { label?: string | null; href?: string | null }

export type Service = { day: string; time?: string | null; name: string; description?: string | null }

export type Settings = {
  churchName: string
  fullName: string
  tagline: string
  description: string
  address: string
  city: string
  mapsUrl: string
  mapLat?: number | null
  mapLng?: number | null
  email: string
  phone?: string | null
  instagram?: string | null
  facebook?: string | null
  youtube?: string | null
  services: Service[]
  announcement?: { enabled?: boolean | null; text?: string | null; href?: string | null }
}

export type Home = {
  hero: { eyebrow?: string; title: string; subtitle?: string; image?: Media | null; primary?: Link; secondary?: Link }
  statement: string
  culture: { title: string; body: string; image?: Media | null }
  nextSteps: { title: string; description?: string; label?: string; href?: string }[]
  online: { title: string; body: string }
}

export type About = {
  title: string
  intro: string
  image?: Media | null
  mission: string
  values: { title: string; description?: string }[]
  beliefs: { title: string; description?: string; reference?: string }[]
  leaders: { name: string; role?: string; bio?: string; photo?: Media | null }[]
}

export type Ministry = {
  id: string | number
  name: string
  slug: string
  audience?: string
  tagline?: string
  description?: string
  meetingTime?: string
  image?: Media | null
}

export type Event = {
  id: string | number
  title: string
  slug: string
  startsAt: string
  endsAt?: string | null
  location?: string | null
  summary?: string | null
  image?: Media | null
  descriptionHtml?: string | null
  registrationUrl?: string | null
  featured?: boolean | null
}

export type Post = {
  id: string | number
  title: string
  slug: string
  excerpt?: string | null
  cover?: Media | null
  contentHtml?: string | null
  author?: string | null
  publishedAt?: string | null
}

type Paginated<T> = { docs: T[]; totalDocs: number }

function cmsUrl() {
  return (env('CMS_URL') ?? 'http://localhost:3001').replace(/\/$/, '')
}

async function cmsFetch<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${cmsUrl()}/api/${path}`)
  Object.entries({ depth: '1', ...params }).forEach(([key, value]) => url.searchParams.set(key, value))
  return cached(`cms:${url}`, CMS_TTL_SECONDS, async () => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(4000) })
      if (!response.ok) return null
      return (await response.json()) as T
    } catch {
      return null
    }
  })
}

/** URL absoluta de un archivo del CMS, eligiendo un tamaño generado si existe. */
export function mediaSrc(media?: Media | null, size?: 'card' | 'hero') {
  if (!media?.url) return undefined
  const url = (size && media.sizes?.[size]?.url) || media.url
  return url.startsWith('http') || url.startsWith('/img/') ? url : `${cmsUrl()}${url}`
}

function localImage(file: string | undefined, alt: string): Media | null {
  return file ? { url: `/img/${file}`, alt } : null
}

const isMedia = (value: unknown): value is Media => Boolean(value && typeof value === 'object' && 'url' in value)
const pickMedia = (value: unknown, fallback: Media | null) => (isMedia(value) ? value : fallback)
const filled = <T>(value: T[] | null | undefined, fallback: T[]) => (value && value.length ? value : fallback)

export async function getSettings(): Promise<Settings> {
  const data = await cmsFetch<Partial<Settings>>('globals/settings')
  const base = site.settings as Settings
  if (!data?.address) return base
  return { ...base, ...stripEmpty(data), services: filled(data.services, base.services) }
}

export async function getHome(): Promise<Home> {
  const base = site.home
  const fallback: Home = {
    ...base,
    hero: { ...base.hero, image: localImage('adoracion.jpeg', 'Adoración en CCI Sabadell') },
    culture: { ...base.culture, image: localImage('conocenos.jpeg', 'Comunidad de CCI Sabadell') },
  }
  const data = await cmsFetch<Partial<Home>>('globals/home')
  if (!data?.statement) return fallback
  return {
    ...fallback,
    ...stripEmpty(data),
    hero: { ...fallback.hero, ...stripEmpty(data.hero ?? {}), image: pickMedia(data.hero?.image, fallback.hero.image ?? null) },
    culture: { ...fallback.culture, ...stripEmpty(data.culture ?? {}), image: pickMedia(data.culture?.image, fallback.culture.image ?? null) },
    nextSteps: filled(data.nextSteps, fallback.nextSteps),
    online: { ...fallback.online, ...stripEmpty(data.online ?? {}) },
  }
}

export async function getAbout(): Promise<About> {
  const base = site.about
  const fallback: About = {
    ...base,
    image: localImage('conocenos.jpeg', 'Comunidad de CCI Sabadell'),
    leaders: base.leaders.map((leader) => ({ ...leader, photo: localImage(leader.photo, leader.name) })),
  }
  const data = await cmsFetch<Partial<About>>('globals/about')
  if (!data?.intro) return fallback
  return {
    ...fallback,
    ...stripEmpty(data),
    image: pickMedia(data.image, fallback.image ?? null),
    values: filled(data.values, fallback.values),
    beliefs: filled(data.beliefs, fallback.beliefs),
    leaders: filled(data.leaders, fallback.leaders),
  }
}

export async function getMinistries(): Promise<Ministry[]> {
  const data = await cmsFetch<Paginated<Ministry>>('ministries', { sort: 'order', limit: '50' })
  if (data?.docs?.length) return data.docs
  return site.ministries.map((ministry, index) => ({
    ...ministry,
    id: index,
    slug: String(index),
    image: localImage(ministry.image, ministry.name),
  }))
}

export async function getUpcomingEvents(limit = 12): Promise<Event[]> {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const data = await cmsFetch<Paginated<Event>>('events', {
    sort: 'startsAt',
    limit: String(limit),
    'where[or][0][startsAt][greater_than_equal]': now.toISOString(),
    'where[or][1][endsAt][greater_than_equal]': now.toISOString(),
  })
  return data?.docs ?? []
}

export async function getEvent(slug: string): Promise<Event | null> {
  const data = await cmsFetch<Paginated<Event>>('events', { 'where[slug][equals]': slug, limit: '1' })
  return data?.docs?.[0] ?? null
}

export async function getPosts(limit = 24): Promise<Post[]> {
  const data = await cmsFetch<Paginated<Post>>('posts', { sort: '-publishedAt', limit: String(limit) })
  return data?.docs ?? []
}

export async function getPost(slug: string): Promise<Post | null> {
  const data = await cmsFetch<Paginated<Post>>('posts', { 'where[slug][equals]': slug, limit: '1' })
  return data?.docs?.[0] ?? null
}

export const giving = site.giving

/** Envía un mensaje del formulario al CMS. Devuelve `false` si no se pudo guardar. */
export async function createMessage(message: { kind: string; name: string; email: string; subject: string; message: string }) {
  const secret = env('FORM_SECRET')
  if (!secret) return false
  try {
    const response = await fetch(`${cmsUrl()}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-form-secret': secret },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

/** Quita null y cadenas vacías para que no pisen el contenido base. */
function stripEmpty<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== ''),
  ) as Partial<T>
}
