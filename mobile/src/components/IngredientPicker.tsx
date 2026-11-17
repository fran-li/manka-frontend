import React, { useEffect, useState } from 'react'
import { Text, TextInput, Pressable, View, ActivityIndicator } from 'react-native'
import Fuse from 'fuse.js'
import { catalogApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Ingredient } from '../api/types'
import { palette } from '../theme/palette'
import { Chip, s } from './UI'

let catalogCache: Promise<Ingredient[]> | null = null
function getCatalog() {
  if (!catalogCache) catalogCache = catalogApi.allIngredients().catch(error => { catalogCache = null; throw error })
  return catalogCache
}
export function IngredientPicker({ selected, onChange, placeholder = 'Ej. pollo, papa, tomate…' }: {
  selected: Ingredient[]; onChange(items: Ingredient[]): void; placeholder?: string
}) {
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState<Ingredient[]>([])
  const [hint, setHint] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const term = text.trim()
    if (term.length < 2) { setSuggestions([]); setHint(''); setBusy(false); return }
    let active = true
    const timer = setTimeout(async () => {
      setBusy(true); setHint('')
      try {
        const result = await catalogApi.ingredients(term, 0, 8)
        if (!active) return
        if (result.content.length) setSuggestions(result.content)
        else {
          const all = await getCatalog()
          if (!active) return
          const matcher = new Fuse(all, { keys: ['nombre'], threshold: 0.35, ignoreLocation: true, minMatchCharLength: 2 })
          const exact = all.find(v => v.nombre.toLowerCase() === term.toLowerCase())
          setSuggestions(exact ? [exact] : matcher.search(term, { limit: 8 }).map(v => v.item))
          setHint('Sugerencias por similitud ortográfica')
        }
      } catch(e) { if (active) { setHint(describeError(e)); setSuggestions([]) } }
      finally { if (active) setBusy(false) }
    }, 280)
    return () => { active = false; clearTimeout(timer) }
  }, [text])
  const pick = (item: Ingredient) => {
    if (!selected.some(v => v.id === item.id)) onChange([...selected, item])
    setText(''); setSuggestions([]); setHint('')
  }
  return <View style={{ gap: 9 }}>
    <Text style={s.label}>¿Qué ingredientes tienes?</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TextInput style={[s.input, { flex: 1 }]} value={text} onChangeText={setText} placeholder={placeholder}
        placeholderTextColor="#9aa99d" autoCapitalize="none" autoCorrect={false} returnKeyType="search" onSubmitEditing={() => { if (suggestions[0]) pick(suggestions[0]) }} />
      {busy && <ActivityIndicator color={palette.green} />}
    </View>
    {text.trim().length > 1 && <View style={{ backgroundColor: palette.white, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 7, gap: 4 }}>
      {!!hint && <Text style={s.sub}>{hint}</Text>}
      {suggestions.filter(v => !selected.some(u => u.id === v.id)).map(item => <Pressable key={item.id} onPress={() => pick(item)}
        style={{ padding: 10, borderBottomWidth: 1, borderColor: palette.border }}>
        <Text style={{ color: palette.text }}>＋ {item.nombre} <Text style={s.sub}>#{item.id}</Text></Text>
      </Pressable>)}
      {!busy && !suggestions.length && !hint && <Text style={s.sub}>Sin coincidencias. Prueba otro término.</Text>}
    </View>}
    {!!selected.length && <View style={[s.row, { marginTop: 4 }]}>
      {selected.map(v => <Chip key={v.id} title={`${v.nombre}  ×`} onPress={() => onChange(selected.filter(i => i.id !== v.id))} />)}
      <Pressable onPress={() => onChange([])}><Text style={{ color: palette.red, fontWeight: '800' }}>Limpiar</Text></Pressable>
    </View>}
  </View>
}
