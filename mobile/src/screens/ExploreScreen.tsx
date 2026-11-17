import React, { useEffect, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { catalogApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Dish, Page } from '../api/types'
import { Banner, Busy, Button, Chip, Empty, Intro, Screen, s } from '../components/UI'
import { RecipeCard } from '../components/Recipes'
import { palette } from '../theme/palette'
const timeOptions = [0, 15, 30, 60, 120]
export default function ExploreScreen() {
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [minutes, setMinutes] = useState(0)
  const [page, setPage] = useState(0)
  const [result, setResult] = useState<Page<Dish> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { const timer = setTimeout(() => { setPage(0); setSearch(input.trim()) }, 300); return () => clearTimeout(timer) }, [input])
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setError('')
    catalogApi.dishes(search, page, 12, minutes || undefined, abort.signal)
      .then(res => { if (!abort.signal.aborted) setResult(res) })
      .catch(e => { if (!abort.signal.aborted) setError(describeError(e)) })
      .finally(() => { if (!abort.signal.aborted) setLoading(false) })
    return () => abort.abort()
  }, [search, minutes, page])
  return <Screen>
    <Intro eyebrow="EL RECETARIO MANKA" title="Explora y descubre" subtitle="Miles de ideas. Busca por nombre o filtra por tiempo de preparación." />
    <TextInput style={s.input} placeholder="Buscar recetas, ej. arroz con pollo…" placeholderTextColor="#9aa99d"
      value={input} onChangeText={setInput} autoCorrect={false} />
    <Text style={s.label}>Tiempo máximo</Text>
    <View style={s.row}>{timeOptions.map(n => <Chip key={n} title={n ? `${n} min` : 'Todos'} selected={minutes === n} onPress={() => { setMinutes(n); setPage(0) }} />)}</View>
    {!!result && <Text style={s.sub}>{result.totalElements.toLocaleString('es-PE')} recetas · Página {page + 1} de {Math.max(result.totalPages,1)}</Text>}
    <Banner text={error} />
    {loading ? <Busy label="Buscando en el recetario…" /> : result?.content.length ? result.content.map(dish => <RecipeCard key={dish.id} dish={dish} />) : <Empty title="Sin resultados" text="Prueba otro término o quita el filtro de tiempo." />}
    {!!result && result.content.length > 0 && !loading && <View style={{ gap: 10 }}>
      {result.totalPages > 1 && <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Button title="← Anterior" outline disabled={result.first || loading} onPress={() => setPage(v => v - 1)} /></View>
        <View style={{ flex: 1 }}><Button title="Siguiente →" outline disabled={result.last || loading} onPress={() => setPage(v => v + 1)} /></View>
      </View>}
      <Text style={[s.sub, { textAlign: 'center', fontWeight: '700' }]}>Página {result.number + 1} de {Math.max(result.totalPages, 1)}</Text>
    </View>}
  </Screen>
}
