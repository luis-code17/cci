type Entry<T> = { value: T; expires: number }

const store = new Map<string, Entry<unknown>>()
const pending = new Map<string, Promise<unknown>>()

/**
 * Memoiza `load()` durante `ttlSeconds`. Si `load()` falla y hay un valor
 * caducado, lo sigue sirviendo. Las peticiones simultáneas comparten promesa.
 */
export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined
  if (hit && hit.expires > Date.now()) return hit.value
  const inflight = pending.get(key) as Promise<T> | undefined
  if (inflight) return inflight

  const promise = load()
    .then((value) => {
      store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })
      return value
    })
    .catch((error) => {
      if (hit) return hit.value
      throw error
    })
    .finally(() => pending.delete(key))
  pending.set(key, promise)
  return promise
}
