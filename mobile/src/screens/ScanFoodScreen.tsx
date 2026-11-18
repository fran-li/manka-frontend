import React, { useCallback, useRef, useState } from 'react'
import { Image, Linking, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import type { BarcodeScanningResult } from 'expo-camera'
import { IngredientPicker } from '../components/IngredientPicker'
import { Banner, Busy, Button, Field, Intro, Panel, Screen, s } from '../components/UI'
import type { Ingredient } from '../api/types'
import { personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import { findFoodByBarcode } from '../services/openFoodFacts'
import type { FoodProduct } from '../services/openFoodFacts'
import { palette } from '../theme/palette'

export default function ScanFoodScreen() {
  const router = useRouter()
  const pathname = usePathname()
  const focused = pathname === '/escanear'
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraOn, setCameraOn] = useState(false)
  const [noCamera, setNoCamera] = useState(false)
  const scannedRef = useRef(false)
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<FoodProduct | null>(null)
  const [selected, setSelected] = useState<Ingredient[]>([])
  const [lookingUp, setLookingUp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const lookup = useCallback(async (value: string) => {
    scannedRef.current = true
    setCameraOn(false)
    setError('')
    setMessage('')
    setProduct(null)
    setSelected([])
    setLookingUp(true)
    try {
      const found = await findFoodByBarcode(value)
      setProduct(found)
      setBarcode(found.barcode)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible consultar el producto.')
    } finally {
      setLookingUp(false)
    }
  }, [])


  const openCamera = useCallback(async () => {
    setError('')
    setMessage('')

    try {
      const currentPermission = permission?.granted
        ? permission
        : await requestPermission()

      if (!currentPermission.granted) {
        setError(
          'Sin permiso de cámara. Puedes introducir el código manualmente o habilitar el permiso desde Ajustes.'
        )
        return
      }

      setNoCamera(false)
      scannedRef.current = false
      setProduct(null)
      setSelected([])
      setCameraOn(true)

    } catch {
      setNoCamera(true)
      setCameraOn(false)
      setError(
        'No se pudo abrir la cámara. Puedes introducir el código manualmente.'
      )
    }
  }, [permission, requestPermission])


  const onScanned = useCallback((result: BarcodeScanningResult) => {
    if (scannedRef.current || lookingUp) return
    scannedRef.current = true
    setBarcode(result.data)
    void lookup(result.data)
  }, [lookingUp, lookup])

  const saveToPantry = useCallback(async () => {
    if (!selected.length) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      // Consultamos la despensa más reciente ANTES de guardar para no sobrescribir
      // ingredientes que el usuario ya había agregado en otra pantalla.
      const current = await personalApi.pantry()
      const ids = [...new Set([...current.map(i => i.id), ...selected.map(i => i.id)])]
      await personalApi.savePantry(ids)
      setMessage('¡Ingrediente añadido! La despensa se guardó en Manka.')
    } catch (e) {
      setError(describeError(e))
    } finally {
      setSaving(false)
    }
  }, [selected])

  return <Screen>
    <Intro eyebrow="COMPLETA TU DESPENSA" title="Escanear alimentos" subtitle="Lee un código de barras y consulta Open Food Facts. Después relaciona el producto con un ingrediente de Manka." />

    <Panel>
      <Text style={s.heading}>📷 Cámara del dispositivo</Text>
      <Text style={s.sub}>Apunta al código de barras EAN o UPC de un alimento envasado.</Text>
      {cameraOn && focused && permission?.granted && !lookingUp ? (
        <View style={{ height: 300, borderRadius: 16, overflow: 'hidden', backgroundColor: '#17211c' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
            onBarcodeScanned={onScanned}
            onMountError={() => {
              scannedRef.current = true
              setCameraOn(false)
              setNoCamera(true)
              setError('La cámara no pudo iniciarse. Utiliza el código manual o revisa los permisos.')
            }}
          />
          <View style={{ backgroundColor: '#17211c', padding: 10 }}>
            <Text style={{ color: 'white', textAlign: 'center' }}>Centra el código dentro de la imagen</Text>
          </View>
        </View>
      ) : null}
      <Button
        title={cameraOn ? 'Cerrar cámara' : 'Escanear código de barras'}
        onPress={() => cameraOn ? setCameraOn(false) : void openCamera()}
        disabled={lookingUp || saving}
      />
      {!permission?.granted && (
        <Text style={s.sub}>
          {permission && !permission.canAskAgain
            ? 'Android ya no permite volver a mostrar el permiso automáticamente. Actívalo en Ajustes o utiliza el código manual.'
            : 'El permiso de cámara se solicita al pulsar «Escanear código de barras».'}
        </Text>
      )}
      {permission && !permission.granted && !permission.canAskAgain && (
        <Button title="Abrir ajustes de la aplicación" outline onPress={() => void Linking.openSettings()} />
      )}
      {noCamera && <Banner text="Escaneo no disponible en este dispositivo. La búsqueda manual sigue funcionando." kind="info" />}
    </Panel>

    <Panel>
      <Text style={s.heading}>⌨️ Código manual</Text>
      <Text style={s.sub}>Úsalo si no tienes cámara, denegaste el permiso o el escáner no reconoce el código.</Text>
      <Field label="Código de barras (8–14 dígitos)" value={barcode} onChangeText={setBarcode} placeholder="Ej. 3017620422003" keyboardType="number-pad" />
      <Button title="Consultar Open Food Facts" outline disabled={lookingUp || saving} onPress={() => void lookup(barcode)} />
    </Panel>

    {lookingUp && <Busy label="Consultando Open Food Facts…" />}
    <Banner text={error} />
    <Banner text={message} kind="success" />

    {product && <Panel>
      <Text style={s.heading}>✅ Producto identificado</Text>
      {product.imageUrl && <Image source={{ uri: product.imageUrl }} resizeMode="contain" style={{ height: 155, width: '100%' }} />}
      <Text style={{ fontSize: 19, fontWeight: '800', color: palette.green }}>{product.name}</Text>
      {!!product.brand && <Text style={s.body}>Marca: {product.brand}</Text>}
      {!!product.quantity && <Text style={s.body}>Presentación: {product.quantity}</Text>}
      <Text style={s.sub}>Código: {product.barcode} · Fuente: Open Food Facts</Text>
      <Text style={s.body}>Selecciona un ingrediente equivalente de la base de datos de Manka. Un producto procesado puede tener varios ingredientes; no añadiremos ninguno sin tu confirmación.</Text>
      <IngredientPicker
        selected={selected}
        onChange={setSelected}
        initialQuery={product.genericName || product.name.split(/[,–-]/)[0].trim()}
        label="Ingrediente(s) equivalente(s) en Manka"
        placeholder="Ej. leche, arroz, aceite…"
      />
      <Button title={saving ? 'Guardando…' : 'Agregar a mi despensa'} disabled={!selected.length || saving} onPress={() => void saveToPantry()} />
      <Button title="Ver mi despensa →" outline onPress={() => router.push('/(drawer)/despensa')} />
    </Panel>}
    <Panel>
      <Text style={s.heading}>ℹ️ ¿Para qué sirve?</Text>
      <Text style={s.sub}>Open Food Facts identifica el producto envasado. Manka usa sus propios ingredientes y endpoints para guardar la despensa y recomendar recetas. También puedes agregar productos no envasados desde «Mi despensa».</Text>
      <Button title="Añadir ingredientes sin escanear" outline onPress={() => router.push('/(drawer)/despensa')} />
    </Panel>
  </Screen>
}
