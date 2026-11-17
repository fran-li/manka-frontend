import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../api/admin'
import { describeError } from '../api/client'
import type { User } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Alert, Empty, Loading, PageIntro } from '../components/Feedback'
import './AdminPage.css'

const isAdmin = (user: User) => user.roles?.includes('ADMIN') ?? false

export function AdminPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      setUsers(await adminApi.users())
    } catch (e) {
      setError(describeError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    adminApi.users()
      .then(data => { if (active) setUsers(data) })
      .catch(e => { if (active) setError(describeError(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const shown = useMemo(() => {
    const text = query.trim().toLocaleLowerCase('es')
    return users.filter(u => {
      if (filter === 'ADMIN' && !isAdmin(u)) return false
      if (filter === 'USER' && isAdmin(u)) return false
      if (!text) return true
      return [u.firstName, u.lastName, u.email, String(u.id)]
        .some(value => (value ?? '').toLocaleLowerCase('es').includes(text))
    }).sort((a, b) => {
      if (isAdmin(a) !== isAdmin(b)) return isAdmin(a) ? -1 : 1
      return a.email.localeCompare(b.email, 'es')
    })
  }, [users, query, filter])

  const numberAdmins = users.filter(isAdmin).length

  async function toggleAdmin(target: User) {
    if (busyId !== null || target.id === currentUser?.id) return
    const hasAdmin = isAdmin(target)
    const fullName = `${target.firstName} ${target.lastName}`.trim() || target.email
    const verb = hasAdmin ? 'REVOCAR' : 'CONCEDER'
    const question = hasAdmin
      ? `¿Revocar el rol ADMIN a ${fullName} (${target.email})? Dejará de acceder al panel de administración.`
      : `¿Conceder el rol ADMIN a ${fullName} (${target.email})? Podrá consultar usuarios y cambiar sus roles.`
    if (!window.confirm(`${verb} permisos de administrador

${question}`)) return

    setBusyId(target.id)
    setError('')
    setMessage('')
    try {
      const updated = await adminApi.updateRoles(target.id, hasAdmin ? ['USER'] : ['USER', 'ADMIN'])
      setUsers(prev => prev.map(item => item.id === updated.id ? updated : item))
      setMessage(hasAdmin
        ? `Se revocó el rol ADMIN a ${fullName}.`
        : `Se concedió el rol ADMIN a ${fullName}.`)
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusyId(null)
    }
  }

  return <>
    <PageIntro eyebrow="GESTIÓN DE MANKA" title="Panel de administración" subtitle="Consulta las cuentas registradas y gestiona quién tiene permisos de administrador." />
    <section className="admin-overview" aria-label="Resumen de usuarios">
      <div className="admin-stat"><span>Usuarios registrados</span><strong>{loading ? '—' : users.length}</strong></div>
      <div className="admin-stat"><span>Administradores</span><strong>{loading ? '—' : numberAdmins}</strong></div>
      <div className="admin-stat"><span>Usuarios sin rol ADMIN</span><strong>{loading ? '—' : users.length - numberAdmins}</strong></div>
    </section>

    <section className="admin-panel" aria-label="Gestión de usuarios">
      <div className="admin-panel-head">
        <div>
          <h2>Gestión de usuarios</h2>
          <p>Los cambios de permisos se guardan en PostgreSQL mediante la API de Manka.</p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => { void loadUsers() }} disabled={loading || busyId !== null}>
          {loading ? 'Actualizando…' : '↻ Actualizar'}
        </button>
      </div>

      {error && <Alert>{error}</Alert>}
      {message && <Alert kind="success">{message}</Alert>}

      <div className="admin-toolbar">
        <label className="admin-search">
          <span className="admin-visually-hidden">Buscar usuarios por nombre, correo o ID</span>
          <span aria-hidden="true">⌕</span>
          <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre, correo o ID…" />
        </label>
        <label className="admin-filter">
          <span>Mostrar</span>
          <select value={filter} onChange={e => setFilter(e.target.value as 'ALL' | 'ADMIN' | 'USER')}>
            <option value="ALL">Todos</option>
            <option value="ADMIN">Solo administradores</option>
            <option value="USER">Solo usuarios normales</option>
          </select>
        </label>
      </div>

      {loading ? <Loading label="Consultando usuarios…" /> : users.length === 0 && !error
        ? <Empty icon="♙" title="Todavía no hay usuarios" text="No hay cuentas registradas para mostrar." />
        : shown.length === 0
          ? <Empty icon="⌕" title="Sin coincidencias" text="Prueba otro nombre, correo o filtro." />
          : <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead>
                <tbody>{shown.map(person => {
                  const hasAdmin = isAdmin(person)
                  const own = person.id === currentUser?.id
                  const name = `${person.firstName} ${person.lastName}`.trim() || 'Sin nombre'
                  return <tr key={person.id}>
                    <td><div className="admin-user"><span className="admin-user-avatar" aria-hidden="true">{(person.firstName || person.email).slice(0, 1).toUpperCase()}</span><span><strong>{name}</strong><small>ID #{person.id}{own ? ' · Tu cuenta' : ''}</small></span></div></td>
                    <td className="admin-email">{person.email}</td>
                    <td><span className={`admin-role ${hasAdmin ? 'admin-role-manager' : ''}`}>{hasAdmin ? 'ADMIN' : 'USER'}</span></td>
                    <td>{own
                      ? <span className="admin-muted">No puedes editar tu propio rol aquí</span>
                      : <button type="button" className={`admin-role-button ${hasAdmin ? 'admin-revoke' : 'admin-grant'}`} disabled={busyId !== null} onClick={() => { void toggleAdmin(person) }}>
                        {busyId === person.id ? 'Guardando…' : hasAdmin ? 'Revocar ADMIN' : 'Conceder ADMIN'}
                      </button>}
                    </td>
                  </tr>
                })}</tbody>
              </table>
            </div>
            <p className="admin-count">Mostrando {shown.length} de {users.length} cuentas.</p>
          </>}
    </section>
    <p className="admin-footnote">La sección solo se muestra a cuentas con rol ADMIN. El backend comprueba nuevamente los permisos en cada petición.</p>
  </>
}
