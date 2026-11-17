import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Dish } from '../api/types'
import { Alert, Empty, Loading, PageIntro } from '../components/Feedback'
import { RecipeCard } from '../components/RecipeCard'
export function FavoritesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { let active = true; personalApi.favorites().then(value => { if (active) setDishes(value) }).catch(e => { if (active) setError(describeError(e)) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  return <><PageIntro eyebrow="TU COLECCIÓN PERSONAL" title="Recetas favoritas" subtitle="Todas las recetas que guardaste para volver a cocinar." />{error && <Alert>{error}</Alert>}{loading ? <Loading /> : dishes.length ? <div className="recipe-grid">{dishes.map(item => <RecipeCard dish={item} key={item.id} />)}</div> : <Empty icon="♡" title="Todavía no guardaste favoritos" text="Explora las recetas y pulsa el corazón en las que más te gusten." action={<Link className="btn btn-primary" to="/explorar">Explorar recetas</Link>} />}</>
}
