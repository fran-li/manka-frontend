import React, { useCallback, useState } from 'react'
import { Text, Pressable, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { HistoryItem } from '../api/types'
import { Banner, Busy, Button, Empty, Intro, Panel, Screen, s } from '../components/UI'
export default function HistoryScreen() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useFocusEffect(useCallback(() => {
    let active = true
    setLoading(true)
    personalApi.history().then(v => { if (active) setHistory(v) })
      .catch(e => { if (active) setError(describeError(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, []))
  return <Screen><Intro eyebrow="MOMENTOS EN TU COCINA" title="Lo que ya cocinaste" subtitle="Tu historial de recetas preparadas." />
    <Banner text={error}/>
    {loading ? <Busy/> : history.length ? history.map(item => <Pressable key={item.id} onPress={() => router.push(`/recetas/${item.dishId}`)}>
      <Panel><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 29 }}>🍽️</Text><View style={{ flex: 1 }}><Text style={s.heading}>{item.dishName}</Text><Text style={s.sub}>{new Date(item.cookedAt).toLocaleString('es-PE')}</Text></View><Text>↗</Text>
      </View></Panel>
    </Pressable>) : <Empty icon="◷" title="Tu historia empieza con un plato" text="Marca una receta como cocinada para que aparezca aquí." />}
    <Button title="Elegir una receta" outline onPress={() => router.push('/(drawer)/explorar')} />
  </Screen>
}
