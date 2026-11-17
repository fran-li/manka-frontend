import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { Dish, Recommendation } from '../api/types'
import { palette } from '../theme/palette'
import { Panel, s } from './UI'

export const minutesLabel = (n: number | null | undefined) => n == null ? 'Sin tiempo indicado' : `${n} min`
export const difficultyLabel = (n: string | null | undefined) => n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : 'No indicada'
const icons = ['🍲','🥗','🍝','🍛','🥘','🍜','🥙','🥣']
export function RecipeCard({ dish }: { dish: Dish }) {
  const router = useRouter()
  return <Pressable onPress={() => router.push(`/recetas/${dish.id}`)}>
    <Panel>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <Text style={{ fontSize: 39 }}>{icons[Math.abs(dish.id) % icons.length]}</Text>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[s.heading, { fontSize: 17 }]}>{dish.nombre}</Text>
          <Text style={s.sub}>◷ {minutesLabel(dish.tiempoPreparacion)} · {difficultyLabel(dish.dificultad)}</Text>
          <Text style={{ fontSize: 12, color: palette.green, fontWeight: '700' }}>{dish.categoriaProteina || dish.mealType || 'Receta'}  ↗</Text>
        </View>
      </View>
    </Panel>
  </Pressable>
}
export function RecommendationCard({ item, index }: { item: Recommendation; index: number }) {
  const router = useRouter()
  const coverage = Math.max(0, Math.min(100, item.ingredientCoveragePercent || 0))
  return <Panel>
    <Text style={s.eyebrow}>SUGERENCIA {String(index + 1).padStart(2, '0')}</Text>
    <Text style={s.heading}>{item.nombre}</Text>
    <Text style={s.sub}>◷ {minutesLabel(item.tiempoPreparacion)} · {difficultyLabel(item.dificultad)}</Text>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={s.body}>Ingredientes disponibles</Text><Text style={{ fontWeight: '800', color: palette.green }}>{Math.round(coverage)}%</Text></View>
    <View style={{ height: 8, borderRadius: 8, backgroundColor: palette.border, overflow: 'hidden' }}><View style={{ width: `${coverage}%`, backgroundColor: palette.green, height: 8 }} /></View>
    <Text style={s.sub}>{item.matchedIngredients} de {item.totalIngredients} familias de ingredientes</Text>
    {!!item.presentacionesCoincidentes?.length && <Text style={s.sub}>La receta pide: {item.presentacionesCoincidentes.slice(0, 4).join(', ')}</Text>}
    {!!item.missingIngredients?.length && <Text style={{ color: '#b45b30', fontSize: 12 }}>Te faltan: {item.missingIngredients.slice(0, 4).join(', ')}{item.missingIngredients.length > 4 ? '…' : ''}</Text>}
    <Pressable onPress={() => router.push(`/recetas/${item.platoId}`)}><Text style={{ color: palette.green, fontWeight: '800', fontSize: 14 }}>Ver receta completa ↗</Text></Pressable>
  </Panel>
}
