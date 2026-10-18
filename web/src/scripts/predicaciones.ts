type LibraryVideo = {
  id: string
  title: string
  thumbnail: string
  publishedAt: string
  durationLabel?: string | null
  playlistIds?: string[]
  isShort?: boolean
  search: string
}

type LibraryData = { videos: LibraryVideo[]; playlists: { id: string; title: string }[] }

const PAGE_SIZE = 12
const dateFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

// Misma estructura que components/VideoCard.astro (tono oscuro sobre fondo claro).
function cardHtml(video: LibraryVideo) {
  const title = escapeHtml(video.title)
  return `<button type="button" data-play-video="${video.id}" data-video-title="${title}" class="group block w-full text-left" aria-label="Reproducir: ${title}">
    <div class="card-img relative aspect-video rounded-2xl">
      <img src="${escapeHtml(video.thumbnail)}" alt="" loading="lazy" />
      <div class="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent"></div>
      <span class="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink transition duration-500 group-hover:scale-110">
        <svg viewBox="0 0 24 24" class="ml-0.5 h-4 w-4" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor"/></svg>
      </span>
      ${video.durationLabel ? `<span class="absolute bottom-4 right-4 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">${video.durationLabel}</span>` : ''}
    </div>
    <p class="eyebrow mt-5 text-stone">${formatDate(video.publishedAt)}</p>
    <h3 class="mt-2 text-xl font-bold leading-tight tracking-tight text-ink">${title}</h3>
  </button>`
}

function pageItems(current: number, total: number): (number | '…')[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
  return pages.flatMap((page, index) => (index > 0 && page - pages[index - 1] > 1 ? (['…', page] as const) : ([page] as const)))
}

export function initLibrary(data: LibraryData) {
  const maybeGrid = document.querySelector<HTMLElement>('[data-library-grid]')
  if (!maybeGrid) return
  const grid = maybeGrid
  const search = document.querySelector<HTMLInputElement>('[data-library-search]')!
  const sort = document.querySelector<HTMLSelectElement>('[data-library-sort]')!
  const count = document.querySelector<HTMLElement>('[data-library-count]')!
  const empty = document.querySelector<HTMLElement>('[data-library-empty]')!
  const pagination = document.querySelector<HTMLElement>('[data-library-pagination]')!
  const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-playlist]')]
  const library = document.getElementById('biblioteca')!

  const sermons = data.videos.filter((video) => !video.isShort)
  const state = { query: '', playlist: '', sort: 'recent', page: 1 }

  // Estado inicial desde la URL (?q=fe&serie=...)
  const params = new URLSearchParams(location.search)
  state.query = params.get('q') ?? ''
  state.playlist = params.get('serie') ?? ''
  search.value = state.query

  function filtered() {
    const query = state.query.trim().toLocaleLowerCase('es')
    const source = state.playlist ? data.videos.filter((video) => video.playlistIds?.includes(state.playlist)) : sermons
    return source
      .filter((video) => !query || video.search.includes(query))
      .sort((a, b) => {
        if (state.sort === 'title') return a.title.localeCompare(b.title, 'es')
        const diff = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        return state.sort === 'oldest' ? diff : -diff
      })
  }

  function syncUrl() {
    const next = new URLSearchParams()
    if (state.query.trim()) next.set('q', state.query.trim())
    if (state.playlist) next.set('serie', state.playlist)
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`)
  }

  function render() {
    const results = filtered()
    const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
    state.page = Math.min(state.page, totalPages)
    const visible = results.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE)

    grid.innerHTML = visible.map(cardHtml).join('')
    empty.hidden = results.length > 0
    const playlistTitle = data.playlists.find((item) => item.id === state.playlist)?.title
    count.textContent = `${results.length} ${results.length === 1 ? 'mensaje' : 'mensajes'}${playlistTitle ? ` en «${playlistTitle}»` : ''}${state.query.trim() ? ` para «${state.query.trim()}»` : ''}`
    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.playlist === state.playlist)))

    pagination.innerHTML =
      totalPages > 1
        ? [
            `<button type="button" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} class="flex h-11 w-11 items-center justify-center rounded-full border border-line disabled:opacity-30" aria-label="Página anterior">←</button>`,
            ...pageItems(state.page, totalPages).map((item) =>
              item === '…'
                ? '<span class="px-1 text-stone">…</span>'
                : `<button type="button" data-page="${item}" ${item === state.page ? 'aria-current="page"' : ''} class="h-11 min-w-11 rounded-full px-3 text-sm font-semibold ${item === state.page ? 'bg-ink text-white' : 'hover:bg-paper-2'}">${item}</button>`,
            ),
            `<button type="button" data-page="${state.page + 1}" ${state.page === totalPages ? 'disabled' : ''} class="flex h-11 w-11 items-center justify-center rounded-full border border-line disabled:opacity-30" aria-label="Página siguiente">→</button>`,
          ].join('')
        : ''
    syncUrl()
  }

  let debounce: ReturnType<typeof setTimeout>
  search.addEventListener('input', () => {
    clearTimeout(debounce)
    debounce = setTimeout(() => {
      state.query = search.value
      state.page = 1
      render()
    }, 150)
  })
  sort.addEventListener('change', () => {
    state.sort = sort.value
    state.page = 1
    render()
  })
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      state.playlist = chip.dataset.playlist ?? ''
      state.page = 1
      render()
    }),
  )
  pagination.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-page]')
    if (!button || button.disabled) return
    state.page = Number(button.dataset.page)
    render()
    library.scrollIntoView({ behavior: 'smooth' })
  })
  document.querySelector('[data-library-reset]')?.addEventListener('click', () => {
    state.query = ''
    state.playlist = ''
    search.value = ''
    render()
  })

  render()
}

/** Visor vertical de Shorts: un vídeo por pantalla, solo el visible carga su iframe. */
export function initShorts(shorts: LibraryVideo[]) {
  const maybeViewer = document.querySelector<HTMLElement>('[data-shorts]')
  const openButtons = document.querySelectorAll<HTMLButtonElement>('[data-shorts-open]')
  if (!maybeViewer || !shorts.length) return
  const viewer = maybeViewer
  const scroller = viewer.querySelector<HTMLElement>('[data-shorts-scroller]')!
  const progress = viewer.querySelector<HTMLElement>('[data-shorts-progress]')!
  let observer: IntersectionObserver | undefined

  function activate(slide: HTMLElement) {
    scroller.querySelectorAll<HTMLElement>('[data-short]').forEach((item) => {
      const frame = item.querySelector('iframe')
      if (item !== slide) {
        frame?.remove()
        return
      }
      if (!frame) {
        const id = item.dataset.short!
        item.querySelector('[data-short-media]')!.insertAdjacentHTML(
          'beforeend',
          `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&loop=1&playlist=${id}" title="Short" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen class="absolute inset-0 h-full w-full border-0"></iframe>`,
        )
      }
    })
    progress.textContent = `${Number(slide.dataset.index) + 1} de ${shorts.length}`
  }

  function open() {
    scroller.innerHTML = shorts
      .map(
        (video, index) => `<article data-short="${video.id}" data-index="${index}" class="relative flex h-[100dvh] snap-start snap-always items-center justify-center">
          <div data-short-media class="relative h-full w-full overflow-hidden sm:aspect-[9/16] sm:h-[min(92dvh,820px)] sm:w-auto sm:rounded-3xl">
            <img src="${escapeHtml(video.thumbnail)}" alt="" class="absolute inset-0 h-full w-full object-cover opacity-60" />
            <div class="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pt-24">
              <p class="line-clamp-2 text-lg font-semibold">${escapeHtml(video.title)}</p>
            </div>
          </div>
        </article>`,
      )
      .join('')
    viewer.hidden = false
    document.documentElement.style.overflow = 'hidden'
    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) activate(visible.target as HTMLElement)
      },
      { root: scroller, threshold: 0.7 },
    )
    scroller.querySelectorAll('[data-short]').forEach((slide) => observer!.observe(slide))
    viewer.querySelector<HTMLElement>('[data-shorts-close]')!.focus()
  }

  function close() {
    observer?.disconnect()
    scroller.innerHTML = ''
    viewer.hidden = true
    document.documentElement.style.overflow = ''
  }

  openButtons.forEach((button) => button.addEventListener('click', open))
  viewer.querySelector('[data-shorts-close]')!.addEventListener('click', close)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !viewer.hidden) close()
  })
}
