import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { catalogApi, personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Ingredient, Page, Recommendation } from '../api/types'
import { IngredientPicker } from '../components/IngredientPicker'
import { Alert, Empty, Loading, PageIntro } from '../components/Feedback'
import { Pagination } from '../components/Pagination'
import { RecommendationCard } from '../components/RecipeCard'

// The backend validates RecommendationRequestDto.limit with @Max(20).
const RECOMMENDATION_SIZES = [10, 20] as const
const TIME_OPTIONS = [15, 30, 45, 60, 90, 120] as const

function readPage(value: string | null): number {
  const parsed = Number(value)
  return value && Number.isSafeInteger(parsed) && parsed >= 1 ? parsed - 1 : 0
}

function readSize(value: string | null): number {
  return value === '20' ? 20 : 10
}

function readMinutes(value: string | null): number {
  const parsed = Number(value)
  return TIME_OPTIONS.find(time => time === parsed) ?? 60
}

function parseIngredientIds(value: string): number[] {
  return [...new Set(value.split(',').map(Number).filter(id => Number.isSafeInteger(id) && id > 0))]
}

export function RecommendPage() {
  const [params, setParams] = useSearchParams()
  const urlIngredients = params.get('ingredients') ?? ''
  const urlMinutes = readMinutes(params.get('minutes'))
  const page = readPage(params.get('page'))
  const size = readSize(params.get('size'))

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [minutes, setMinutes] = useState(urlMinutes)
  const [results, setResults] = useState<Page<Recommendation> | null>(null)
  const requestSequence = useRef(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // The normal page starts with the user's pantry, just as before.
  // A shared recommendation URL instead restores its own ingredient selection.
  useEffect(() => {
    if (urlIngredients) return
    let active = true
    personalApi.pantry()
      .then(value => { if (active) setIngredients(value) })
      .catch(() => {})
    return () => { active = false }
    // Only load the pantry when the page mounts (not after editing the selection).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // A link such as /cocinar?ingredients=1,2&minutes=60&page=2&size=10
  // restores the labels shown in the ingredient picker after a reload.
  useEffect(() => {
    if (!urlIngredients) return
    const requestedIds = parseIngredientIds(urlIngredients)
    if (!requestedIds.length) return
    setMinutes(urlMinutes)
    if (requestedIds.length === ingredients.length && requestedIds.every(id => ingredients.some(item => item.id === id))) return
    let active = true
    catalogApi.allIngredients()
      .then(all => {
        if (!active) return
        const byId = new Map(all.map(item => [item.id, item]))
        setIngredients(requestedIds.map(id => byId.get(id)).filter((item): item is Ingredient => Boolean(item)))
      })
      .catch(err => { if (active) setError(describeError(err)) })
    return () => { active = false }
    // React only needs to rehydrate when the shared URL changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlIngredients, urlMinutes])

  // The URL drives every recommendations request, including Back/Forward navigation.
  useEffect(() => {
    const ids = parseIngredientIds(urlIngredients)
    const requestId = ++requestSequence.current
    if (!ids.length) {
      setResults(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    setResults(null)
    catalogApi.recommend(ids, urlMinutes, page, size)
      .then(response => {
        if (requestId !== requestSequence.current) return
        if (page > 0 && page >= response.totalPages) {
          setParams(current => {
            const next = new URLSearchParams(current)
            next.set('page', String(Math.max(1, response.totalPages)))
            return next
          }, { replace: true })
          return
        }
        setResults(response)
      })
      .catch(e => {
        if (requestId === requestSequence.current) setError(describeError(e))
      })
      .finally(() => {
        if (requestId === requestSequence.current) setLoading(false)
      })
    return () => { requestSequence.current += 1 }
  }, [urlIngredients, urlMinutes, page, size, refreshKey, setParams])

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

  function invalidateResults() {
    requestSequence.current += 1
    setResults(null)
    setLoading(false)
    setError('')
    if (urlIngredients) {
      updateParams({ ingredients: '', minutes: '', page: '' })
    }
  }

  function findRecipes() {
    if (!ingredients.length) {
      setError('Agrega al menos un ingrediente para recibir recomendaciones.')
      return
    }
    setMessage('')
    setError('')
    updateParams({
      ingredients: ingredients.map(item => item.id).join(','),
      minutes: String(minutes),
      page: '1',
      size: String(size),
    })
    // Allows pressing "Recomendar recetas" again even if the URL has not changed.
    setRefreshKey(value => value + 1)
  }

  async function savePantry() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await personalApi.savePantry(ingredients.map(item => item.id))
      setMessage('Tus ingredientes se guardaron en la despensa.')
    } catch (e) {
      setError(describeError(e))
    } finally {
      setSaving(false)
    }
  }

  return <>
    <PageIntro eyebrow="TU ASISTENTE DE COCINA" title="¿Qué cocinamos hoy?" subtitle="Dinos qué ingredientes tienes y cuánto tiempo te queda. Nosotros encontramos las mejores opciones." />
    <div className="recommend-layout">
      <section className="recommend-setup panel">
        <div className="panel-heading"><span className="step-mark">01</span><div><h2>Lo que tienes a mano</h2><p>Agrega los alimentos uno por uno. Manka utiliza IDs genéricos, no cantidades.</p></div></div>
        <IngredientPicker selected={ingredients} onChange={value => { setIngredients(value); invalidateResults() }} />
        <div className="divider" />
        <div className="panel-heading"><span className="step-mark">02</span><div><h2>¿Cuánto tiempo tienes?</h2><p>Elige el tiempo máximo de preparación.</p></div></div>
        <div className="time-options">
          {TIME_OPTIONS.map(value => (
            <button key={value} type="button" className={minutes === value ? 'time-option selected' : 'time-option'} onClick={() => { setMinutes(value); invalidateResults() }}>
              {value >= 60 ? `${value / 60} h` : `${value} min`}
            </button>
          ))}
        </div>
        <div className="button-stack">
          <button type="button" disabled={loading || !ingredients.length} onClick={findRecipes} className="btn btn-primary btn-full">{loading ? 'Buscando tus recetas…' : '✦ Recomendar recetas'}</button>
          <button type="button" onClick={() => { void savePantry() }} disabled={saving} className="btn btn-ghost btn-full">{saving ? 'Guardando…' : '◫ Guardar estos ingredientes en mi despensa'}</button>
        </div>
        {message && <Alert kind="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </section>

      <section className="recommend-results">
        <div className="result-heading">
          <span className="eyebrow">HECHO PARA TI</span>
          <h2>Tus recomendaciones</h2>
          {results && <p>{results.totalElements} recetas coinciden con tus ingredientes y tiempo disponible.</p>}
        </div>

        {loading && !results ? <Loading label="Buscando tus recomendaciones…" />
          : results === null ? (
            <div className="recommend-placeholder">
              <span>🍳</span><h3>La magia empieza aquí</h3>
              <p>Selecciona tus ingredientes y descubre qué puedes preparar hoy.</p>
            </div>
          ) : results.content.length > 0 ? (
            <div className="recommend-list">
              {results.content.map((item, index) => (
                <RecommendationCard item={item} index={results.number * results.size + index} key={item.platoId} />
              ))}
            </div>
          ) : (
            <Empty icon="🥕" title="Aún no hay coincidencias" text="Prueba agregar más ingredientes o aumentar el tiempo disponible." />
          )}

        {results && (
          <Pagination
            data={results}
            sizes={RECOMMENDATION_SIZES}
            onPageChange={nextPage => updateParams({ page: String(nextPage + 1) })}
            onSizeChange={nextSize => updateParams({ size: String(nextSize), page: '1' })}
            loading={loading}
            label="recomendaciones"
          />
        )}
      </section>
    </div>
  </>
}
