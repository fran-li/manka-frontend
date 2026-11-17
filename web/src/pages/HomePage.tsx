import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { catalogApi, personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Dish, Ingredient } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Alert, Empty, Loading } from '../components/Feedback'
import { RecipeCard } from '../components/RecipeCard'

export function HomePage() {
  const { user } = useAuth()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [stats, setStats] = useState({ dishes: 0, ingredients: 0, pantry: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    // Como en las prácticas del curso: Promise.all para solicitudes independientes.
    Promise.all([catalogApi.dishes('', 0, 6), catalogApi.ingredients('', 0, 1), personalApi.pantry()])
      .then(([recipes, ingredients, pantry]: [{content:Dish[];totalElements:number},{totalElements:number},Ingredient[]]) => {
        if (!active) return
        setDishes(recipes.content)
        setStats({ dishes: recipes.totalElements, ingredients: ingredients.totalElements, pantry: pantry.length })
      }).catch(e => { if (active) setError(describeError(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  return <div className="home-page">
    <section className="hero"><div className="hero-copy">
      <span className="eyebrow light">BIENVENIDO A TU COCINA</span>
      <h1>Hoy se cocina <em>algo bueno.</em></h1>
      <p>Hola, {user?.firstName || 'chef'}. Cuéntanos qué ingredientes tienes y Manka encontrará recetas que sí puedes preparar.</p>
      <div className="hero-actions"><Link to="/cocinar" className="btn btn-cream">✦ Encontrar mi receta <span>↗</span></Link><Link to="/explorar" className="hero-text-link">Explorar todas las recetas →</Link></div>
      <div className="hero-micro"><span>✳ Ingredientes reales</span><span>◷ Tu tiempo</span><span>♡ A tu gusto</span></div>
    </div><div className="hero-illustration" aria-hidden="true"><div className="plate-shadow" /><div className="plate"><span>🥗</span></div><span className="hero-float float-one">🥕</span><span className="hero-float float-two">🍅</span><span className="hero-float float-three">🌿</span></div></section>

    <section className="stats-strip" aria-label="Datos de Manka">
      <div><span className="stat-icon">▦</span><strong>{loading ? '—' : stats.dishes.toLocaleString('es-PE')}</strong><span>Recetas por descubrir</span></div>
      <div><span className="stat-icon">✳</span><strong>{loading ? '—' : stats.ingredients.toLocaleString('es-PE')}</strong><span>Ingredientes en el catálogo</span></div>
      <div><span className="stat-icon">◫</span><strong>{loading ? '—' : stats.pantry}</strong><span>Ingredientes en tu despensa</span></div>
    </section>
    <section className="feature-row"><article className="feature-card sage"><span className="feature-symbol">✳</span><div><h3>¿Qué tienes en casa?</h3><p>Elige tus ingredientes y recibe sugerencias basadas en lo que realmente tienes.</p><Link to="/cocinar" className="text-link">Buscar recetas <span>↗</span></Link></div></article>
      <article className="feature-card peach"><span className="feature-symbol">◫</span><div><h3>Tu despensa, organizada</h3><p>Guarda tus ingredientes para no tener que escribirlos cada vez que cocines.</p><Link to="/despensa" className="text-link">Organizar despensa <span>↗</span></Link></div></article></section>
    <section className="section-block"><div className="section-header"><div><span className="eyebrow">PARA INSPIRARTE</span><h2>Ideas para empezar</h2></div><Link className="subtle-link" to="/explorar">Ver todas las recetas ↗</Link></div>
      {error && <Alert>{error}</Alert>}{loading ? <Loading label="Buscando recetas…" /> : dishes.length ? <div className="recipe-grid">{dishes.map(dish => <RecipeCard key={dish.id} dish={dish} />)}</div> : <Empty title="No hay recetas cargadas" text="Comprueba que PostgreSQL tenga tu data.sql importado." />}</section>
  </div>
}
