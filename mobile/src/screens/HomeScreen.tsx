import React, { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { catalogApi, personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Dish, Ingredient } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Banner, Busy, Button, Intro, Panel, Screen, s } from '../components/UI'
import { RecipeCard } from '../components/Recipes'
import { palette } from '../theme/palette'
export default function HomeScreen() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [stats, setStats] = useState({ dishes: 0, ingredients: 0, pantry: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useFocusEffect(useCallback(() => {
    let active = true
    setLoading(true); setError('')
    Promise.all([catalogApi.dishes('', 0, 6), catalogApi.ingredients('', 0, 1), personalApi.pantry()])
      .then(([recipes, ingredients, pantry]) => {
        if (!active) return
        setDishes(recipes.content)
        setStats({ dishes: recipes.totalElements, ingredients: ingredients.totalElements, pantry: pantry.length })
      }).catch(e => { if (active) setError(describeError(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, []))
  return <Screen>
    <View style={{ backgroundColor: palette.green, padding: 22, borderRadius: 22, gap: 13 }}>
      <Text style={{ color: '#c9dfc3', letterSpacing: 2, fontWeight: '800', fontSize: 11 }}>BIENVENIDO A TU COCINA</Text>
      <Text style={{ color: palette.white, fontSize: 31, fontWeight: '900', lineHeight: 38 }}>Hoy se cocina algo bueno. 🥗</Text>
      <Text style={{ color: '#dfede3', lineHeight: 22 }}>Hola, {user?.firstName || 'chef'}. Dinos qué ingredientes tienes y encontraremos recetas que puedes preparar.</Text>
      <Button title="✦ Encontrar mi receta" onPress={() => router.push('/(drawer)/cocinar')} outline />
    </View>
    <View style={[s.row, { justifyContent: 'space-between' }]}>
      {[{n: stats.dishes, t:'Recetas'}, {n:stats.ingredients,t:'Ingredientes'}, {n:stats.pantry,t:'En tu despensa'}].map(x =>
        <View key={x.t} style={{ flex: 1, minWidth: 95, backgroundColor: palette.white, borderRadius: 14, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: palette.border }}>
          <Text style={{ color: palette.green, fontSize: 20, fontWeight: '900' }}>{loading ? '—' : x.n.toLocaleString('es-PE')}</Text>
          <Text style={{ color: palette.muted, fontSize: 11, textAlign: 'center' }}>{x.t}</Text>
        </View>
      )}
    </View>
    <Panel><Text style={s.heading}>¿Qué tienes en casa?</Text><Text style={s.sub}>Elige tus ingredientes y Manka te recomendará recetas.</Text><Button title="Buscar recetas →" onPress={() => router.push('/(drawer)/cocinar')} /></Panel>
    <Panel><Text style={s.heading}>Tu despensa, organizada</Text><Text style={s.sub}>Guarda tus ingredientes para usarlos más adelante.</Text><Button title="Organizar despensa" onPress={() => router.push('/(drawer)/despensa')} outline /></Panel>
    <Text style={s.eyebrow}>PARA INSPIRARTE</Text><Text style={s.heading}>Ideas para empezar</Text>
    <Banner text={error} />
    {loading ? <Busy label="Buscando recetas…" /> : dishes.map(dish => <RecipeCard key={dish.id} dish={dish} />)}
    <Button title="Explorar todas las recetas" onPress={() => router.push('/(drawer)/explorar')} outline />
    <Button title="Cerrar sesión" onPress={() => void logout()} outline />
  </Screen>
}
