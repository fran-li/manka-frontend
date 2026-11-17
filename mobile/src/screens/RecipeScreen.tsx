import React, { useEffect, useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { catalogApi, personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Dish } from '../api/types'
import { Banner, Busy, Button, Panel, Screen, s } from '../components/UI'
import { difficultyLabel, minutesLabel } from '../components/Recipes'
import { preparationSteps } from '../utils/steps'
import { palette } from '../theme/palette'
export default function RecipeScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = Number(params.id)
  const [dish, setDish] = useState<Dish | null>(null)
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    if (!Number.isSafeInteger(id) || id < 1) { setError('ID de receta inválido.'); setLoading(false); return }
    Promise.all([catalogApi.dish(id), personalApi.favorites()])
      .then(([detail, favorites]) => { if (active) { setDish(detail); setFavorite(favorites.some(v => v.id === id)) } })
      .catch(e => { if (active) setError(describeError(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])
  async function changeFavorite() {
    if (!dish) return
    setBusy(true); setError(''); setMessage('')
    try {
      if (favorite) await personalApi.removeFavorite(dish.id)
      else await personalApi.addFavorite(dish.id)
      setFavorite(!favorite)
      setMessage(favorite ? 'Receta eliminada de favoritos.' : 'Receta guardada en favoritos.')
    } catch(e) { setError(describeError(e)) } finally { setBusy(false) }
  }
  async function cooked() {
    if (!dish) return
    setBusy(true); setError(''); setMessage('')
    try { await personalApi.cooked(dish.id); setMessage('¡Excelente! Guardamos esta receta en tu historial.') }
    catch(e) { setError(describeError(e)) } finally { setBusy(false) }
  }
  if (loading) return <Screen><Busy label="Preparando la receta…" /></Screen>
  if (!dish) return <Screen><Banner text={error || 'No se encontró esta receta.'} /></Screen>
  const steps = preparationSteps(dish.preparacion)
  const ingredients = dish.ingredientesCsv?.length ? dish.ingredientesCsv : dish.ingredientes?.map(v => [v.detalle || v.nombre, v.cantidad].filter(Boolean).join(' — ')) || []
  return <Screen>
    <View style={{ backgroundColor: palette.green, padding: 22, borderRadius: 22, gap: 11 }}>
      <Text style={{ color: '#c2e3c0', fontSize: 11, letterSpacing: 2 }}>RECETA MANKA #{dish.id}</Text>
      <Text style={{ color: palette.white, fontSize: 27, fontWeight: '900', lineHeight: 34 }}>{dish.nombre}</Text>
      <Text style={{ color: '#e0ecdf' }}>◷ {minutesLabel(dish.tiempoPreparacion)} · {difficultyLabel(dish.dificultad)}{dish.servings ? ` · ${dish.servings} porciones` : ''}</Text>
      {!!dish.country && <Text style={{ color: '#e0ecdf' }}>{dish.country}</Text>}
    </View>
    <View style={{ gap: 8 }}>
      <Button title={favorite ? '♥ Guardada en favoritos' : '♡ Guardar receta'} onPress={() => void changeFavorite()} disabled={busy} />
      <Button title="✓ Ya la cociné" outline onPress={() => void cooked()} disabled={busy} />
    </View>
    <Banner text={error}/><Banner text={message} kind="success" />
    <Panel><Text style={s.heading}>✳ Ingredientes</Text><Text style={s.sub}>{ingredients.length} elementos según el catálogo</Text>
      {ingredients.length ? ingredients.map((v,i) => <Text key={i} style={s.body}>✓  {v}</Text>) : <Text style={s.sub}>Sin ingredientes registrados.</Text>}
    </Panel>
    <Panel><Text style={s.heading}>Manos a la obra</Text>
      {steps.length ? steps.map((step,i) => <View key={i} style={{ flexDirection: 'row', gap: 12 }}><Text style={{ color: palette.green, fontWeight: '800' }}>{String(i+1).padStart(2,'0')}</Text><Text style={[s.body, { flex: 1 }]}>{step.replace(/^\s*\d+\s*/, '')}</Text></View>) : <Text style={s.sub}>No hay instrucciones disponibles.</Text>}
      {!!dish.sourceUrl?.startsWith('http') && <Pressable onPress={() => void Linking.openURL(dish.sourceUrl!)}><Text style={{ color: palette.green, fontWeight: '800' }}>Consultar receta original ↗</Text></Pressable>}
    </Panel>
  </Screen>
}
