import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { catalogApi, personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Dish } from '../api/types'
import { Alert, Loading } from '../components/Feedback'
import { difficultyLabel, minutesLabel } from '../components/RecipeCard'
import { preparationSteps } from '../utils/steps'

export function RecipePage() {
  const { id } = useParams()
  const dishId = Number(id)
  const [dish, setDish] = useState<Dish | null>(null)
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    if (!Number.isSafeInteger(dishId) || dishId < 1) { setError('ID de receta inválido.'); setLoading(false); return }
    Promise.all([catalogApi.dish(dishId), personalApi.favorites()]).then(([detail, favorites]) => {
      if (active) { setDish(detail); setFavorite(favorites.some(item => item.id === dishId)) }
    }).catch(e => { if (active) setError(describeError(e)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [dishId])
  async function changeFavorite() {
    if (!dish) return
    setActionBusy(true); setMessage(''); setError('')
    try {
      if (favorite) await personalApi.removeFavorite(dish.id)
      else await personalApi.addFavorite(dish.id)
      setFavorite(!favorite); setMessage(favorite ? 'Receta eliminada de favoritos.' : 'Receta guardada en favoritos.')
    } catch(e) { setError(describeError(e)) } finally { setActionBusy(false) }
  }
  async function cooked() {
    if (!dish) return
    setActionBusy(true); setMessage(''); setError('')
    try { await personalApi.cooked(dish.id); setMessage('¡Excelente! Guardamos esta receta en tu historial.') }
    catch(e) { setError(describeError(e)) } finally { setActionBusy(false) }
  }
  if (loading) return <Loading label="Preparando la receta…" />
  if (!dish) return <div className="narrow-container"><Alert>{error || 'No se encontró esta receta.'}</Alert><Link className="text-link" to="/explorar">← Volver a explorar</Link></div>
  const steps = preparationSteps(dish.preparacion)
  return <div className="recipe-detail">
    <div className="breadcrumb"><Link to="/explorar">Explorar recetas</Link><span> / </span><span>Detalle</span></div>
    <section className="detail-hero"><div className="detail-copy"><span className="eyebrow light">RECETA MANKA #{dish.id}</span><h1>{dish.nombre}</h1><div className="detail-meta"><span>◷ {minutesLabel(dish.tiempoPreparacion)}</span><span>✧ {difficultyLabel(dish.dificultad)}</span>{dish.servings && <span>♧ {dish.servings} porciones</span>}{dish.country && <span>⌁ {dish.country}</span>}</div><div className="detail-buttons"><button type="button" className="btn btn-cream" disabled={actionBusy} onClick={() => { void changeFavorite() }}>{favorite ? '♥ Guardada' : '♡ Guardar receta'}</button><button type="button" className="btn btn-outline-light" disabled={actionBusy} onClick={() => { void cooked() }}>✓ Ya la cociné</button></div></div><div className="detail-art">🍲</div></section>
    <div className="detail-grid"><aside className="panel ingredients-panel"><div className="panel-heading"><span className="step-mark">✳</span><div><h2>Ingredientes</h2><p>{dish.ingredientesCsv?.length ?? dish.ingredientes?.length ?? 0} ingredientes según el CSV original</p></div></div>
      {dish.ingredientesCsv && dish.ingredientesCsv.length > 0 ?
        <ul className="ingredient-list">{dish.ingredientesCsv.map((raw, index) =>
          <li key={index}><span className="ingredient-bullet">✓</span><div><strong>{raw}</strong></div></li>)}</ul> :
        <ul className="ingredient-list">{dish.ingredientes?.map((item, index) =>
          <li key={`${item.ingredienteId}-${index}`}><span className="ingredient-bullet">✓</span>
          <div><strong>{item.detalle || item.nombre}</strong>
          {item.cantidad && <span className="amount">{item.cantidad}</span>}</div></li>)}</ul>}
      {!dish.ingredientesCsv?.length && !dish.ingredientes?.length && <p>Sin ingredientes registrados.</p>}
      </aside>
      <section className="panel steps-panel"><div className="panel-heading"><span className="step-mark">↗</span><div><h2>Manos a la obra</h2><p>Sigue estos pasos para preparar tu plato.</p></div></div>
        <ol className="steps-list">{steps.map((step, index) => <li key={index}><span className="step-count">{String(index+1).padStart(2,'0')}</span><p>{step.replace(/^\s*\d+\s*/, '')}</p></li>)}</ol>
        {!steps.length && <p>El origen de esta receta no incluía instrucciones.</p>}
        {dish.sourceUrl?.startsWith('http') && <a className="source-link" href={dish.sourceUrl} target="_blank" rel="noopener noreferrer">Consultar receta original ↗</a>}
      </section></div>
    {(error || message) && <div className="detail-feedback">{error && <Alert>{error}</Alert>}{message && <Alert kind="success">{message}</Alert>}</div>}
  </div>
}
