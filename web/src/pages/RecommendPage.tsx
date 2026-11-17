import { useEffect, useRef, useState } from 'react'
import { catalogApi, personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Ingredient, Page, Recommendation } from '../api/types'
import { IngredientPicker } from '../components/IngredientPicker'
import { Alert, Empty, PageIntro } from '../components/Feedback'
import { RecommendationCard } from '../components/RecipeCard'

export function RecommendPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [minutes, setMinutes] = useState(60)
  const [results, setResults] = useState<Page<Recommendation> | null>(null)
  const requestSequence = useRef(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { let active = true; personalApi.pantry().then(value => { if (active) setIngredients(value) }).catch(() => {}); return () => { active = false } }, [])
  function invalidateResults() {
    requestSequence.current += 1
    setResults(null)
    setLoading(false)
  }

  async function findRecipes(page = 0) {
    if (!ingredients.length) {
      setError('Agrega al menos un ingrediente para recibir recomendaciones.')
      return
    }
    const requestId = ++requestSequence.current
    setLoading(true)
    setError('')
    if (page === 0) setResults(null)
    try {
      const response = await catalogApi.recommend(ingredients.map(i => i.id), minutes, page, 10)
      if (requestId === requestSequence.current) setResults(response)
    } catch (e) {
      if (requestId === requestSequence.current) setError(describeError(e))
    } finally {
      if (requestId === requestSequence.current) setLoading(false)
    }
  }
  async function savePantry() {
    setSaving(true); setError(''); setMessage('')
    try { await personalApi.savePantry(ingredients.map(i => i.id)); setMessage('Tus ingredientes se guardaron en la despensa.') }
    catch (e) { setError(describeError(e)) }
    finally { setSaving(false) }
  }
  return <>
    <PageIntro eyebrow="TU ASISTENTE DE COCINA" title="¿Qué cocinamos hoy?" subtitle="Dinos qué ingredientes tienes y cuánto tiempo te queda. Nosotros encontramos las mejores opciones." />
    <div className="recommend-layout"><section className="recommend-setup panel">
      <div className="panel-heading"><span className="step-mark">01</span><div><h2>Lo que tienes a mano</h2><p>Agrega los alimentos uno por uno. Manka utiliza IDs genéricos, no cantidades.</p></div></div>
      <IngredientPicker selected={ingredients} onChange={value => { setIngredients(value); invalidateResults() }} />
      <div className="divider" />
      <div className="panel-heading"><span className="step-mark">02</span><div><h2>¿Cuánto tiempo tienes?</h2><p>Elige el tiempo máximo de preparación.</p></div></div>
      <div className="time-options">{[15,30,45,60,90,120].map(value => <button key={value} type="button" className={minutes === value ? 'time-option selected' : 'time-option'} onClick={() => { setMinutes(value); invalidateResults() }}>{value >= 60 ? `${value / 60} h${value > 60 ? '' : ''}` : `${value} min`}</button>)}</div>
      <div className="button-stack"><button type="button" disabled={loading || !ingredients.length} onClick={() => { void findRecipes() }} className="btn btn-primary btn-full">{loading ? 'Buscando tus recetas…' : '✦ Recomendar recetas'}</button>
        <button type="button" onClick={() => { void savePantry() }} disabled={saving} className="btn btn-ghost btn-full">{saving ? 'Guardando…' : '◫ Guardar estos ingredientes en mi despensa'}</button></div>
      {message && <Alert kind="success">{message}</Alert>}{error && <Alert>{error}</Alert>}
    </section>
    <section className="recommend-results">
      <div className="result-heading">
        <span className="eyebrow">HECHO PARA TI</span>
        <h2>Tus recomendaciones</h2>
        {results && <p>{results.totalElements} recetas coinciden con tus ingredientes y tiempo disponible.</p>}
      </div>
      {results === null ? (
        <div className="recommend-placeholder">
          <span>🍳</span><h3>La magia empieza aquí</h3>
          <p>Selecciona tus ingredientes y descubre qué puedes preparar hoy.</p>
        </div>
      ) : results.content.length > 0 ? (
        <>
          <div className="recommend-list">
            {results.content.map((item, index) => (
              <RecommendationCard
                item={item}
                index={results.number * results.size + index}
                key={item.platoId}
              />
            ))}
          </div>
          {results.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button" className="btn btn-outline"
                disabled={results.first || loading}
                onClick={() => { void findRecipes(results.number - 1) }}
              >← Anterior</button>
              <span>Página {results.number + 1} de {results.totalPages}</span>
              <button
                type="button" className="btn btn-outline"
                disabled={results.last || loading}
                onClick={() => { void findRecipes(results.number + 1) }}
              >Siguiente →</button>
            </div>
          )}
        </>
      ) : (
        <Empty icon="🥕" title="Aún no hay coincidencias" text="Prueba agregar más ingredientes o aumentar el tiempo disponible." />
      )}
    </section></div>
  </>
}
