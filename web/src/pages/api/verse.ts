import type { APIRoute } from 'astro'
import { getRandomVerse, getVerseOfTheDay } from '@/lib/verse'

/** GET /api/verse → versículo del día · GET /api/verse?random=1 → versículo aleatorio */
export const GET: APIRoute = async ({ url }) => {
  const random = url.searchParams.has('random')
  const verse = random ? await getRandomVerse() : await getVerseOfTheDay()
  return Response.json(verse, { headers: { 'Cache-Control': random ? 'no-store' : 'public, max-age=3600' } })
}
