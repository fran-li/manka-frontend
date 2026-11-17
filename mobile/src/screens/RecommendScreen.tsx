import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { catalogApi, personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Ingredient, Page, Recommendation } from '../api/types'
import { IngredientPicker } from '../components/IngredientPicker'
import { RecommendationCard } from '../components/Recipes'
import { Banner, Button, Chip, Empty, Intro, Panel, Screen, s } from '../components/UI'
export default function RecommendScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [minutes, setMinutes] = useState(60)
  const [results, setResults] = useState<Page<Recommendation> | null>(null)
  const sequence = useRef(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  useFocusEffect(useCallback(() => {
    let active = true
    personalApi.pantry().then(value => { if (active) setIngredients(value) }).catch(() => {})
    return () => { active = false }
  }, []))
  function invalidate() { sequence.current += 1; setResults(null); setLoading(false) }
  async function findRecipes(page = 0) {
    if (!ingredients.length) { setError('Agrega al menos un ingrediente.'); return }
    const reqId = ++sequence.current
    setError(''); setLoading(true)
    if (page === 0) setResults(null)
    try {
      const response = await catalogApi.recommend(ingredients.map(v => v.id), minutes, page, 10)
      if (reqId === sequence.current) setResults(response)
    } catch(e) { if (reqId === sequence.current) setError(describeError(e)) }
    finally { if (reqId === sequence.current) setLoading(false) }
  }
  async function savePantry() {
    setSaving(true); setError(''); setMessage('')
    try { await personalApi.savePantry(ingredients.map(v => v.id)); setMessage('Ingredientes guardados en tu despensa.') }
    catch(e) { setError(describeError(e)) } finally { setSaving(false) }
  }
  return <Screen>
    <Intro eyebrow="TU ASISTENTE DE COCINA" title="¿Qué cocinamos hoy?" subtitle="Dinos qué ingredientes tienes y cuánto tiempo te queda." />
    <Panel>
      <Text style={s.heading}>01 · Lo que tienes a mano</Text>
      <Text style={s.sub}>Agrega alimentos uno a uno. Manka utiliza los IDs de ingrediente del backend.</Text>
      <IngredientPicker selected={ingredients} onChange={value => { setIngredients(value); invalidate() }} />
      <View style={s.separator} />
      <Text style={s.heading}>02 · ¿Cuánto tiempo tienes?</Text>
      <View style={s.row}>{[15,30,45,60,90,120].map(n => <Chip key={n} title={n < 60 ? `${n} min` : `${n/60} h`} selected={minutes === n} onPress={() => { setMinutes(n); invalidate() }} />)}</View>
      <Button title={loading ? 'Buscando recetas…' : '✦ Recomendar recetas'} disabled={loading || ingredients.length === 0} onPress={() => void findRecipes()} />
      <Button title={saving ? 'Guardando…' : 'Guardar ingredientes en mi despensa'} outline disabled={saving} onPress={() => void savePantry()} />
      <Banner text={error} /><Banner text={message} kind="success" />
    </Panel>
    <Text style={s.eyebrow}>HECHO PARA TI</Text><Text style={s.heading}>Tus recomendaciones</Text>
    {results === null ? <Empty icon="🍳" title="La magia empieza aquí" text="Selecciona ingredientes y busca recetas." /> : results.content.length ? <>
      <Text style={s.sub}>{results.totalElements} recetas coinciden con tus ingredientes y tiempo.</Text>
      {results.content.map((item,index) => <RecommendationCard key={item.platoId} item={item} index={results.number * results.size + index} />)}
      <View style={{ gap: 10 }}>
        {results.totalPages > 1 && <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Button title="← Anterior" outline disabled={results.first || loading} onPress={() => void findRecipes(results.number - 1)} /></View>
          <View style={{ flex: 1 }}><Button title="Siguiente →" outline disabled={results.last || loading} onPress={() => void findRecipes(results.number + 1)} /></View>
        </View>}
        <Text style={[s.sub, { textAlign: 'center', fontWeight: '700' }]}>Página {results.number + 1} de {Math.max(results.totalPages, 1)}</Text>
      </View>
    </> : <Empty title="Aún no hay coincidencias" text="Agrega más ingredientes o aumenta el tiempo." />}
  </Screen>
}
