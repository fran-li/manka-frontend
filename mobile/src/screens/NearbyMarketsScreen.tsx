import React, { useState } from 'react'
import { Linking, Text } from 'react-native'
import * as Location from 'expo-location'
import { Banner, Busy, Button, Chip, Field, Intro, Panel, Screen, s } from '../components/UI'

type PlaceKind = 'mercados' | 'supermercados' | 'tiendas de abarrotes'

export default function NearbyMarketsScreen() {
  const [kind, setKind] = useState<PlaceKind>('mercados')
  const [manualArea, setManualArea] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [permissionBlocked, setPermissionBlocked] = useState(false)

  async function openMaps(query: string) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    await Linking.openURL(url) // Android abre Google Maps o un navegador compatible
  }

  async function searchNearby() {
    if (busy) return
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const enabled = await Location.hasServicesEnabledAsync()
      if (!enabled) {
        setError('La ubicación del teléfono está desactivada. Enciéndela o escribe tu distrito más abajo.')
        return
      }
      const permission = await Location.getForegroundPermissionsAsync()
      const granted = permission.granted ? permission : await Location.requestForegroundPermissionsAsync()
      if (!granted.granted) {
        setPermissionBlocked(!granted.canAskAgain)
        setError('Manka necesita acceso a la ubicación para buscar cerca de ti. También puedes escribir una zona manualmente.')
        return
      }
      setPermissionBlocked(false)
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = position.coords
      // Google Maps resuelve la lista de negocios; Manka NO consulta Places API.
      await openMaps(`${kind} cerca de ${latitude.toFixed(5)},${longitude.toFixed(5)}`)
      setInfo('Se abrió Google Maps para mostrar establecimientos cercanos a tu ubicación.')
    } catch {
      setError('No se pudo obtener la ubicación o abrir Maps. Comprueba GPS e internet o utiliza el buscador por distrito.')
    } finally {
      setBusy(false)
    }
  }

  async function searchByArea() {
    const area = manualArea.trim()
    setError('')
    setInfo('')
    if (area.length < 3) {
      setError('Escribe un distrito o ciudad (mínimo 3 caracteres).')
      return
    }
    setBusy(true)
    try {
      await openMaps(`${kind} en ${area}`)
      setInfo('Se abrió Google Maps con la zona que indicaste.')
    } catch {
      setError('No fue posible abrir Google Maps. Comprueba tu conexión o instala una aplicación de mapas.')
    } finally {
      setBusy(false)
    }
  }

  return <Screen>
    <Intro eyebrow="INGREDIENTES CERCA DE TI" title="Buscar mercados" subtitle="Usa el GPS para encontrar lugares donde conseguir lo que te falta para cocinar con Manka." />
    <Panel>
      <Text style={s.heading}>📍 ¿Qué tipo de local buscas?</Text>
      <Text style={s.sub}>Selecciona una categoría para buscarla en Google Maps.</Text>
      <Chip title="Mercados" selected={kind === 'mercados'} onPress={() => setKind('mercados')} />
      <Chip title="Supermercados" selected={kind === 'supermercados'} onPress={() => setKind('supermercados')} />
      <Chip title="Abarrotes" selected={kind === 'tiendas de abarrotes'} onPress={() => setKind('tiendas de abarrotes')} />
    </Panel>
    <Panel>
      <Text style={s.heading}>🧭 Buscar con mi ubicación</Text>
      <Text style={s.sub}>Solo pedimos ubicación cuando pulses el botón. No guardamos tus coordenadas en nuestra base de datos.</Text>
      <Button title={busy ? 'Obteniendo ubicación…' : 'Buscar cerca de mí con GPS'} disabled={busy} onPress={() => void searchNearby()} />
      {busy && <Busy label="Preparando la búsqueda…" />}
      {permissionBlocked && <Button title="Abrir ajustes de permisos" outline onPress={() => void Linking.openSettings()} />}
    </Panel>
    <Panel>
      <Text style={s.heading}>✍️ Alternativa sin GPS</Text>
      <Text style={s.sub}>Si no tienes sensor, no deseas compartir tu ubicación o el GPS falla, puedes buscar por distrito o ciudad.</Text>
      <Field label="Distrito o ciudad" value={manualArea} onChangeText={setManualArea} placeholder="Ej. Surco, Lima, Perú" autoCapitalize="words" />
      <Button title="Buscar por zona en Google Maps" outline disabled={busy} onPress={() => void searchByArea()} />
    </Panel>
    <Banner text={error} />
    <Banner text={info} kind="success" />
    <Panel>
      <Text style={s.heading}>ℹ️ Cómo funciona</Text>
      <Text style={s.sub}>El sensor GPS obtiene tu posición y Manka abre una búsqueda de mercados en Google Maps. Las tiendas y rutas se muestran en Maps; no necesitas una API key de Google Places.</Text>
    </Panel>
  </Screen>
}
