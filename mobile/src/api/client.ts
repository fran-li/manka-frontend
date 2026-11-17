import * as SecureStore from 'expo-secure-store'

// No hay Vite en React Native. EXPO_PUBLIC_ se reemplaza en el bundle de Expo.
const BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://manka-backend-production.up.railway.app').replace(/\/+$/, '')
const ACCESS_KEY = 'manka_access_token'
const REFRESH_KEY = 'manka_refresh_token'

type Tokens = { token: string; refreshToken: string }
let cache: { access: string | null; refresh: string | null } = { access: null, refresh: null }
let onExpired: (() => void) | null = null

export const session = {
  async hydrate() {
    try {
      const [access, refresh] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_KEY), SecureStore.getItemAsync(REFRESH_KEY),
      ])
      cache = { access, refresh }
    } catch { cache = { access: null, refresh: null } }
  },
  access: () => cache.access,
  refresh: () => cache.refresh,
  async save(tokens: Tokens) {
    cache = { access: tokens.token, refresh: tokens.refreshToken }
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, tokens.token),
      SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
    ])
  },
  async clear() {
    cache = { access: null, refresh: null }
    await Promise.allSettled([
      SecureStore.deleteItemAsync(ACCESS_KEY), SecureStore.deleteItemAsync(REFRESH_KEY),
    ])
  },
  onExpired(callback: (() => void) | null) { onExpired = callback },
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'No se pudo conectar con la API de Railway. Comprueba tu internet.'
    if (error.status === 401) return 'Credenciales incorrectas o sesión vencida.'
    if (error.status === 403) return 'No tienes permisos para esta operación.'
    return error.message
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

function parse(data: string): unknown {
  try { return data ? JSON.parse(data) : null } catch { return data }
}
function messageFor(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const item = data as Record<string, unknown>
    if (item.errors && typeof item.errors === 'object') {
      const errors = Object.values(item.errors).filter(v => typeof v === 'string')
      if (errors.length) return errors.join(' | ')
    }
    for (const key of ['detail', 'message', 'title', 'error']) {
      if (typeof item[key] === 'string' && item[key]) return String(item[key])
    }
  }
  return `El servidor respondió con HTTP ${status}`
}

let refreshPromise: Promise<boolean> | null = null
async function renewSession(): Promise<boolean> {
  if (!cache.refresh) return false
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: cache.refresh }),
        })
        if (!response.ok) return false
        const tokens = await response.json() as Tokens
        if (!tokens.token || !tokens.refreshToken) return false
        await session.save(tokens)
        return true
      } catch { return false }
    })()
  }
  try { return await refreshPromise } finally { refreshPromise = null }
}

type Query = Record<string, string | number | boolean | null | undefined>
type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Query
  body?: unknown
  signal?: AbortSignal
  auth?: boolean
}
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value))
  }
  const url = `${BASE}${path}${params.size ? '?' + params.toString() : ''}`
  async function request(retry: boolean): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'
    if (options.auth !== false && cache.access) headers.Authorization = `Bearer ${cache.access}`
    let response: Response
    try {
      response = await fetch(url, {
        method: options.method || 'GET', headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error
      throw new ApiError(0, 'Error de conexión')
    }
    if (response.status === 401 && retry && options.auth !== false && cache.refresh) {
      if (await renewSession()) return request(false)
      await session.clear()
      onExpired?.()
    }
    const data = parse(await response.text()) // 204 No Content => null
    if (!response.ok) throw new ApiError(response.status, messageFor(data, response.status))
    return data as T
  }
  return request(true)
}
