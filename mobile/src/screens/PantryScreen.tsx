import React, { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Ingredient } from '../api/types'
import { IngredientPicker } from '../components/IngredientPicker'
import { Banner, Busy, Button, Intro, Panel, Screen, s } from '../components/UI'
export default function PantryScreen() {
  const router = useRouter()
  const [original, setOriginal] = useState<Ingredient[]>([])
  const [selected, setSelected] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useFocusEffect(useCallback(() => {
    let active = true
    setLoading(true)
    personalApi.pantry()
      .then(value => { if (active) { setOriginal(value); setSelected(value) } })
      .catch(e => { if (active) setError(describeError(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, []))
  async function save() {
    setSaving(true); setError(''); setMessage('')
    try {
      const response = await personalApi.savePantry(selected.map(v => v.id))
      setSelected(response); setOriginal(response); setMessage('Tu despensa se guardó correctamente.')
    } catch(e) { setError(describeError(e)) } finally { setSaving(false) }
  }
  const changed = original.map(v => v.id).sort().join() !== selected.map(v => v.id).sort().join()
  return <Screen>
    <Intro eyebrow="ORGANIZA TU COCINA" title="Mi despensa" subtitle="Guarda tus ingredientes para usarlos en futuras recomendaciones." />
    <Panel>
      <Text style={s.heading}>◫ {selected.length} ingredientes</Text>
      <Text style={s.sub}>Disponibles actualmente en tu cocina.</Text>
      {loading ? <Busy/> : <>
        <IngredientPicker selected={selected} onChange={v => { setSelected(v); setMessage('') }} placeholder="Añadir ingrediente…" />
        <Button title={saving ? 'Guardando…' : 'Guardar despensa'} disabled={saving || !changed} onPress={() => void save()} />
        <Button title="📷 Escanear alimento" outline onPress={() => router.push('/(drawer)/escanear')} />
        <Button title="📍 Encontrar mercados cercanos" outline onPress={() => router.push('/(drawer)/mercados')} />
        <Button title="Buscar recetas →" outline onPress={() => router.push('/(drawer)/cocinar')} />
      </>}
      <Banner text={error} /><Banner text={message} kind="success"/>
    </Panel>
    <Panel><Text style={s.heading}>💡 ¿Por qué guardar tu despensa?</Text><Text style={s.sub}>Al entrar a «¿Qué cocino?» cargaremos tus ingredientes guardados automáticamente.</Text></Panel>
  </Screen>
}
