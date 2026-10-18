/**
 * Versículo del día / aleatorio: OurManna da la referencia y esbiblia.net
 * devuelve el texto en español (Reina-Valera Antigua).
 */
import { cached } from './cache'

const OURMANNA_URL = 'https://beta.ourmanna.com/api/v1/get/?format=json'
const ESBIBLIA_BASE_URL = 'https://esbiblia.net/api/view'
const ESBIBLIA_VERSION = 'rva'

export type Verse = { verse: string; reference: string }

export const FALLBACK_VERSE: Verse = {
  verse: 'Lámpara es a mis pies tu palabra, y lumbrera a mi camino.',
  reference: 'Salmos 119:105',
}

type OurMannaResponse = { verse?: { details?: { reference?: string } } }
type EsBibliaResponse = { verses?: { book_name?: string; chapter?: number; verse?: number; text?: string }[] }

// Nombre en inglés (OurManna) → código de libro de esbiblia.net.
const BOOK_CODES: Record<string, string> = {
  GENESIS: 'GEN', EXODUS: 'EXO', LEVITICUS: 'LEV', NUMBERS: 'NUM', DEUTERONOMY: 'DEU',
  JOSHUA: 'JOS', JUDGES: 'JUE', RUTH: 'RUT', '1SAMUEL': '1SA', '2SAMUEL': '2SA',
  '1KINGS': '1RE', '2KINGS': '2RE', '1CHRONICLES': '1CR', '2CHRONICLES': '2CR',
  EZRA: 'ESD', NEHEMIAH: 'NEH', ESTHER: 'EST', JOB: 'JOB', PSALM: 'SAL', PSALMS: 'SAL',
  PROVERBS: 'PRO', ECCLESIASTES: 'ECL', SONGOFSOLOMON: 'CAN', SONGOFSONGS: 'CAN', SONG: 'CAN',
  ISAIAH: 'ISA', JEREMIAH: 'JER', LAMENTATIONS: 'LAM', EZEKIEL: 'EZE', DANIEL: 'DAN',
  HOSEA: 'OSE', JOEL: 'JOE', AMOS: 'AMO', OBADIAH: 'ABD', JONAH: 'JON', MICAH: 'MIQ',
  NAHUM: 'NAH', HABAKKUK: 'HAB', ZEPHANIAH: 'SOF', HAGGAI: 'HAG', ZECHARIAH: 'ZAC', MALACHI: 'MAL',
  MATTHEW: 'MAT', MARK: 'MR', LUKE: 'LUC', JOHN: 'JHN', ACTS: 'HCH', ROMANS: 'ROM',
  '1CORINTHIANS': '1CO', '2CORINTHIANS': '2CO', GALATIANS: 'GAL', EPHESIANS: 'EFE',
  PHILIPPIANS: 'FIL', COLOSSIANS: 'COL', '1THESSALONIANS': '1TE', '2THESSALONIANS': '2TE',
  '1TIMOTHY': '1TI', '2TIMOTHY': '2TI', TITUS: 'TIT', PHILEMON: 'FLM', HEBREWS: 'HEB',
  JAMES: 'SAN', '1PETER': '1PE', '2PETER': '2PE', '1JOHN': '1JN', '2JOHN': '2JN', '3JOHN': '3JN',
  JUDE: 'JUD', REVELATION: 'APO',
}

function parseReference(reference: string) {
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/)
  if (!match) return null
  const code = BOOK_CODES[match[1].toUpperCase().replace(/[^A-Z0-9]/g, '')]
  if (!code) return null
  return { code, chapter: Number(match[2]), from: Number(match[3]), to: match[4] ? Number(match[4]) : undefined }
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return response.ok ? ((await response.json()) as T) : null
  } catch {
    return null
  }
}

async function toSpanish(reference: string): Promise<Verse | null> {
  const parsed = parseReference(reference)
  if (!parsed) return null
  const path = [parsed.code, parsed.chapter, parsed.from, parsed.to].filter(Boolean).join('/')
  const payload = await fetchJson<EsBibliaResponse>(`${ESBIBLIA_BASE_URL}/${path}/?v=${ESBIBLIA_VERSION}`)
  const verses = payload?.verses?.filter((item) => item.text) ?? []
  if (!verses.length) return null
  const range = parsed.to ? `-${parsed.to}` : ''
  return {
    verse: verses.map((item) => item.text!.trim()).join(' '),
    reference: `${verses[0].book_name} ${parsed.chapter}:${parsed.from}${range}`,
  }
}

async function fetchVerse(order: 'daily' | 'random'): Promise<Verse | null> {
  const payload = await fetchJson<OurMannaResponse>(`${OURMANNA_URL}&order=${order}`)
  const reference = payload?.verse?.details?.reference
  return reference ? toSpanish(reference) : null
}

/** Versículo del día (cacheado 12 h). */
export async function getVerseOfTheDay(): Promise<Verse> {
  // Un fallo no se cachea: se reintenta en la siguiente visita.
  return cached('verse:daily', 60 * 60 * 12, async () => {
    const verse = await fetchVerse('daily')
    if (!verse) throw new Error('Versículo no disponible')
    return verse
  }).catch(() => FALLBACK_VERSE)
}

/** Versículo aleatorio; reintenta si la referencia no se puede traducir. */
export async function getRandomVerse(attempts = 3): Promise<Verse> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const verse = await fetchVerse('random')
    if (verse) return verse
  }
  return FALLBACK_VERSE
}
