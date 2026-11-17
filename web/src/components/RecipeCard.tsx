import { Link } from 'react-router'
import type { Dish, Recommendation } from '../api/types'

export function minutesLabel(minutes: number | null | undefined) { return minutes != null ? `${minutes} min` : 'Tiempo no indicado' }
export function difficultyLabel(value: string | null | undefined) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'Sin dificultad indicada'
}
const motifs = ['🍲', '🥗', '🍝', '🍛', '🥘', '🍜', '🥙', '🥣']
function motifFor(id: number) { return motifs[Math.abs(id) % motifs.length] }

export function RecipeCard({ dish }: { dish: Dish }) {
  return <article className="recipe-card">
    <Link className="recipe-visual" to={`/recetas/${dish.id}`} aria-label={`Ver ${dish.nombre}`}>
      <span className="recipe-motif">{motifFor(dish.id)}</span><span className="recipe-visual-label">HECHO EN CASA</span>
    </Link>
    <div className="recipe-body">
      <div className="recipe-meta"><span>◷ {minutesLabel(dish.tiempoPreparacion)}</span><span>•</span><span>{difficultyLabel(dish.dificultad)}</span></div>
      <Link to={`/recetas/${dish.id}`} className="recipe-title">{dish.nombre}</Link>
      <div className="recipe-bottom"><span>{dish.categoriaProteina || dish.mealType || 'Receta'}</span><Link to={`/recetas/${dish.id}`} className="recipe-arrow" aria-label={`Abrir ${dish.nombre}`}>↗</Link></div>
    </div>
  </article>
}

export function RecommendationCard({ item, index }: { item: Recommendation; index: number }) {
  const coverage = Math.max(0, Math.min(100, item.ingredientCoveragePercent || 0))
  return <article className="recommend-card">
    <div className="recommend-num">{String(index + 1).padStart(2, '0')}</div>
    <div className="recommend-content">
      <div className="recipe-meta"><span>◷ {minutesLabel(item.tiempoPreparacion)}</span><span>•</span><span>{difficultyLabel(item.dificultad)}</span></div>
      <h3>{item.nombre}</h3>
      <div className="coverage-line"><span>Ingredientes que tienes</span><strong>{Math.round(coverage)}%</strong></div>
      <div className="progress"><span style={{ width: `${coverage}%` }} /></div>
      <p className="recommend-detail">{item.matchedIngredients} de {item.totalIngredients} familias de ingredientes disponibles</p>
      {!!item.presentacionesCoincidentes?.length &&
        <div className="recommend-detail"><strong>La receta pide:</strong>
          <ul>{item.presentacionesCoincidentes.slice(0,4).map((raw,index) => <li key={index}>{raw}</li>)}</ul>
        </div>}
      {item.missingIngredients?.length > 0 && <p className="missing">Te faltan: {item.missingIngredients.slice(0, 4).join(', ')}{item.missingIngredients.length > 4 ? '…' : ''}</p>}
      <Link className="text-link" to={`/recetas/${item.platoId}`}>Ver receta completa <span>↗</span></Link>
    </div>
  </article>
}
