import { useEffect, useState } from 'react'
import { catalogApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Dish, Page } from '../api/types'
import { Alert, Empty, Loading, PageIntro } from '../components/Feedback'
import { RecipeCard } from '../components/RecipeCard'

export function ExplorePage() {
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [minutes, setMinutes] = useState('')
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<Page<Dish> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { const timer = window.setTimeout(() => { setPage(0); setSearch(input.trim()) }, 300); return () => window.clearTimeout(timer) }, [input])
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setError('')
    catalogApi.dishes(search, page, 12, minutes ? Number(minutes) : undefined, abort.signal)
      .then(setResult).catch(e => { if (!abort.signal.aborted) setError(describeError(e)) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [search, minutes, page])
  return <>
    <PageIntro eyebrow="EL RECETARIO MANKA" title="Explora y descubre" subtitle="Miles de ideas para cocinar algo diferente. Busca por nombre o filtra por tiempo." />
    <div className="filter-bar"><label className="filter-search"><span>⌕</span><input value={input} onChange={e => setInput(e.target.value)} placeholder="Buscar recetas, ej. arroz con pollo…" aria-label="Buscar recetas" /></label>
      <label className="filter-select">Tiempo máximo <select value={minutes} onChange={e => { setMinutes(e.target.value); setPage(0) }}><option value="">Cualquier tiempo</option><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="60">1 hora</option><option value="120">2 horas</option></select></label></div>
    <div className="results-caption">{result && <span><strong>{result.totalElements.toLocaleString('es-PE')}</strong> recetas encontradas</span>}<span>Página {page + 1}{result?.totalPages ? ` de ${result.totalPages}` : ''}</span></div>
    {error && <Alert>{error}</Alert>}{loading ? <Loading label="Buscando en el recetario…" /> : result?.content.length ? <div className="recipe-grid">{result.content.map(dish => <RecipeCard key={dish.id} dish={dish} />)}</div> : <Empty title="Sin resultados" text="Prueba otro nombre o quita el filtro de tiempo." />}
    {result && result.totalPages > 1 && <div className="pagination"><button className="btn btn-outline" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>← Anterior</button><span>{page + 1} / {result.totalPages}</span><button className="btn btn-outline" disabled={result.last || loading} onClick={() => setPage(p => p + 1)}>Siguiente →</button></div>}
  </>
}
