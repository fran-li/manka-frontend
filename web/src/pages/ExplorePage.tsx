import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { catalogApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Dish, Page } from '../api/types'
import { Alert, Empty, Loading, PageIntro } from '../components/Feedback'
import { Pagination } from '../components/Pagination'
import { RecipeCard } from '../components/RecipeCard'

const PAGE_SIZES = [10, 25, 50, 100] as const

function readPage(value: string | null): number {
  const parsed = Number(value)
  return value && Number.isSafeInteger(parsed) && parsed >= 1 ? parsed - 1 : 0
}

function readSize(value: string | null): number {
  const parsed = Number(value)
  return PAGE_SIZES.find(size => size === parsed) ?? 10
}

export function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const minutes = params.get('minutes') ?? ''
  const page = readPage(params.get('page'))
  const size = readSize(params.get('size'))

  const [input, setInput] = useState(search)
  const [result, setResult] = useState<Page<Dish> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Restore the search box when navigating back/forward or opening a shared URL.
  useEffect(() => { setInput(search) }, [search])

  // Debounce the text box. Only parameters change; the data is always fetched from the API.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (input.trim() === search) return
      setParams(current => {
        const next = new URLSearchParams(current)
        if (input.trim()) next.set('search', input.trim())
        else next.delete('search')
        next.set('page', '1')
        return next
      }, { replace: true })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [input, search, setParams])

  function updateParams(changes: Record<string, string>) {
    setParams(current => {
      const next = new URLSearchParams(current)
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      return next
    })
  }

  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setError('')
    catalogApi.dishes(search, page, size, minutes ? Number(minutes) : undefined, abort.signal)
      .then(response => {
        if (abort.signal.aborted) return
        // If a link points past the last page, move to the last available page.
        if (response.totalPages > 0 && page >= response.totalPages) {
          setParams(current => {
            const next = new URLSearchParams(current)
            next.set('page', String(response.totalPages))
            return next
          }, { replace: true })
          return
        }
        setResult(response)
      })
      .catch(e => { if (!abort.signal.aborted) { setResult(null); setError(describeError(e)) } })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [search, minutes, page, size, setParams])

  return <>
    <PageIntro eyebrow="EL RECETARIO MANKA" title="Explora y descubre" subtitle="Miles de ideas para cocinar algo diferente. Busca por nombre o filtra por tiempo." />
    <div className="filter-bar">
      <label className="filter-search">
        <span>⌕</span>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Buscar recetas, ej. arroz con pollo…" aria-label="Buscar recetas" />
      </label>
      <label className="filter-select">Tiempo máximo
        <select value={minutes} onChange={e => updateParams({ minutes: e.target.value, page: '1' })}>
          <option value="">Cualquier tiempo</option>
          <option value="15">15 minutos</option>
          <option value="30">30 minutos</option>
          <option value="60">1 hora</option>
          <option value="120">2 horas</option>
        </select>
      </label>
    </div>

    <div className="results-caption">
      {result && <span><strong>{result.totalElements.toLocaleString('es-PE')}</strong> recetas encontradas</span>}
      <span>Página {page + 1}{result?.totalPages ? ` de ${result.totalPages}` : ''}</span>
    </div>

    {error && <Alert>{error}</Alert>}
    {loading
      ? <Loading label="Buscando en el recetario…" />
      : result?.content.length
        ? <div className="recipe-grid">{result.content.map(dish => <RecipeCard key={dish.id} dish={dish} />)}</div>
        : <Empty title="Sin resultados" text="Prueba otro nombre o quita el filtro de tiempo." />}

    {result && !error && (
      <Pagination
        data={result}
        sizes={PAGE_SIZES}
        onPageChange={nextPage => updateParams({ page: String(nextPage + 1) })}
        onSizeChange={nextSize => updateParams({ size: String(nextSize), page: '1' })}
        loading={loading}
        label="recetas"
      />
    )}
  </>
}
