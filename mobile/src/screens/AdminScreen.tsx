import React, { useCallback, useMemo, useState } from 'react'
import { Alert as NativeAlert, Pressable, Text, TextInput, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { adminApi } from '../api/admin'
import { describeError } from '../api/client'
import type { User } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Banner, Busy, Button, Chip, Empty, Intro, Panel, Screen, s } from '../components/UI'
import { palette } from '../theme/palette'
const isAdmin = (u: User) => u.roles?.includes('ADMIN') ?? false
export default function AdminScreen() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const allowed = currentUser?.roles?.includes('ADMIN') ?? false
  const loadUsers = useCallback(async () => {
    if (!allowed) return
    setLoading(true); setError('')
    try { setUsers(await adminApi.users()) }
    catch(e) { setError(describeError(e)) }
    finally { setLoading(false) }
  }, [allowed])
  useFocusEffect(useCallback(() => { if (allowed) void loadUsers() }, [allowed, loadUsers]))
  const shown = useMemo(() => users.filter(u => {
    if (filter === 'ADMIN' && !isAdmin(u)) return false
    if (filter === 'USER' && isAdmin(u)) return false
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return [u.firstName, u.lastName, u.email, String(u.id)].some(v => (v || '').toLowerCase().includes(needle))
  }).sort((a,b) => isAdmin(a) === isAdmin(b) ? a.email.localeCompare(b.email) : isAdmin(a) ? -1 : 1), [users, filter, query])
  const numberAdmins = users.filter(isAdmin).length
  async function toggleAdmin(target: User) {
    if (busyId !== null || target.id === currentUser?.id) return
    setBusyId(target.id); setError(''); setMessage('')
    try {
      const has = isAdmin(target)
      const updated = await adminApi.updateRoles(target.id, has ? ['USER'] : ['USER','ADMIN'])
      setUsers(old => old.map(v => v.id === updated.id ? updated : v))
      setMessage(has ? 'Se revocó ADMIN.' : 'Se concedió ADMIN.')
    } catch(e) { setError(describeError(e)) }
    finally { setBusyId(null) }
  }
  function confirmRole(target: User) {
    const verb = isAdmin(target) ? 'revocar' : 'conceder'
    NativeAlert.alert('Confirmar permisos', `¿Deseas ${verb} el rol ADMIN a ${target.email}?`, [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: () => { void toggleAdmin(target) } },
    ])
  }
  async function deleteUser(target: User) {
    if (busyId !== null || target.id === currentUser?.id || isAdmin(target)) return
    setBusyId(target.id); setError(''); setMessage('')
    try {
      await adminApi.deleteUser(target.id)
      setUsers(old => old.filter(v => v.id !== target.id))
      setMessage(`La cuenta ${target.email} fue eliminada.`)
    } catch(e) { setError(describeError(e)) }
    finally { setBusyId(null) }
  }
  function confirmDelete(target: User) {
    if (target.id === currentUser?.id || isAdmin(target)) return
    NativeAlert.alert('Eliminar cuenta', `Se eliminará definitivamente ${target.email} y sus datos asociados. Deberá registrarse otra vez. ¿Continuar?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { void deleteUser(target) } },
    ])
  }
  if (!allowed) return <Screen><Banner text="Solo los administradores pueden acceder a esta pantalla." /><Button title="Volver al inicio" onPress={() => router.replace('/(drawer)')} /></Screen>
  return <Screen>
    <Intro eyebrow="GESTIÓN DE MANKA" title="Administración" subtitle="Consulta las cuentas y gestiona sus permisos desde PostgreSQL." />
    <View style={{ flexDirection: 'row', gap: 7 }}>
      {[{n:users.length,t:'Usuarios'}, {n:numberAdmins,t:'ADMIN'}, {n:users.length-numberAdmins,t:'USER'}].map(v =>
        <View key={v.t} style={{ flex: 1, backgroundColor: palette.white, padding: 12, borderRadius: 12, alignItems: 'center', borderColor: palette.border, borderWidth: 1 }}>
          <Text style={{ color: palette.green, fontSize: 22, fontWeight: '900' }}>{loading ? '—' : v.n}</Text><Text style={{ fontSize: 11, color: palette.muted }}>{v.t}</Text>
        </View>
      )}
    </View>
    <Button title="↻ Actualizar" outline disabled={loading || busyId !== null} onPress={() => void loadUsers()} />
    <Banner text={error}/><Banner text={message} kind="success" />
    <TextInput style={s.input} value={query} onChangeText={setQuery} placeholder="Buscar nombre, correo o ID…" placeholderTextColor="#9aa99d" />
    <View style={s.row}>{(['ALL', 'ADMIN', 'USER'] as const).map(v => <Chip key={v} title={v === 'ALL' ? 'Todos' : v} selected={filter===v} onPress={() => setFilter(v)} />)}</View>
    {loading ? <Busy label="Consultando usuarios…" /> : shown.length ? shown.map(person => {
      const own = person.id === currentUser?.id
      const admin = isAdmin(person)
      return <Panel key={person.id}>
        <Text style={[s.heading, { fontSize: 17 }]}>{person.firstName} {person.lastName}{own ? ' · Tu cuenta' : ''}</Text>
        <Text style={s.sub}>{person.email} · ID #{person.id}</Text>
        <Text style={{ color: admin ? palette.green : palette.muted, fontWeight: '800' }}>{admin ? 'ADMIN' : 'USER'}</Text>
        {own ? <Text style={s.sub}>No puedes modificar tu cuenta aquí</Text> : <>
          <Button title={admin ? 'Revocar ADMIN' : 'Conceder ADMIN'} outline disabled={busyId !== null} onPress={() => confirmRole(person)} />
          {!admin && <Button title={busyId === person.id ? 'Eliminando…' : 'Eliminar usuario'} danger disabled={busyId !== null} onPress={() => confirmDelete(person)} />}
        </>}
      </Panel>
    }) : <Empty title="Sin usuarios coincidentes" text="Prueba otros filtros o actualiza." />}
    <Text style={s.sub}>La eliminación requiere que Railway tenga publicado DELETE /admin/users/{`{id}`} y que el backend valide el rol en cada petición.</Text>
  </Screen>
}
