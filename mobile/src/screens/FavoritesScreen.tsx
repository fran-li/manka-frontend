import React, { useCallback, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import { personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Dish } from '../api/types'
import { RecipeCard } from '../components/Recipes'
import { Banner, Busy, Button, Empty, Intro, Screen } from '../components/UI'
export default function FavoritesScreen() {
  const router = useRouter()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useFocusEffect(useCallback(() => {
    let active = true
    setLoading(true)
    personalApi.favorites().then(v => { if (active) setDishes(v) })
      .catch(e => { if (active) setError(describeError(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, []))
  return <Screen><Intro eyebrow="TU COLECCIÓN PERSONAL" title="Recetas favoritas" subtitle="Todas las recetas que guardaste para volver a cocinar." />
    <Banner text={error} />
    {loading ? <Busy/> : dishes.length ? dishes.map(dish => <RecipeCard key={dish.id} dish={dish}/>) :
      <Empty icon="♡" title="Todavía no guardaste favoritos" text="Explora y guarda las recetas que más te gusten." />}
    <Button title="Explorar recetas" outline onPress={() => router.push('/(drawer)/explorar')} />
  </Screen>
}
