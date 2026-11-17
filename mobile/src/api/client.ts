import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean
    _retry?: boolean
  }
}

// No hay Vite en React Native: EXPO_PUBLIC_ se incorpora al bundle de Expo.
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
        SecureStore.getItemAsync(ACCESS_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
      ])
      cache = { access, refresh }
    } catch {
      cache = { access: null, refresh: null }
    }
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
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
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
  if (axios.isCancel(error)) return 'Solicitud cancelada.'
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message
    if (error.status === 401) return 'Credenciales incorrectas o sesión vencida.'
    if (error.status === 403) return 'No tienes permisos para esta operación.'
    return error.message
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

function parse(data: unknown): unknown {
  if (data === '' || data === undefined) return null
  if (typeof data !== 'string') return data
  try { return JSON.parse(data) } catch { return data }
}

function messageFor(data: unknown, status: number): string {
  const parsed = parse(data)
  if (parsed && typeof parsed === 'object') {
    const item = parsed as Record<string, unknown>
    if (item.errors && typeof item.errors === 'object') {
      const messages = Object.values(item.errors).filter(v => typeof v === 'string')
      if (messages.length) return messages.join(' | ')
    }
    for (const key of ['detail', 'message', 'title', 'error']) {
      if (typeof item[key] === 'string' && item[key]) return String(item[key])
    }
  }
  return `El servidor respondió con HTTP ${status}`
}

const client = axios.create({
  baseURL: BASE,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})
const refreshClient = axios.create({ baseURL: BASE, timeout: 20000 })

let refreshPromise: Promise<boolean> | null = null
async function renewSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  const refreshToken = session.refresh()
  if (!refreshToken) return false
  refreshPromise = (async () => {
    try {
      const response = await refreshClient.post<Tokens>('/auth/refresh', { refreshToken })
      const tokens = response.data
      if (!tokens?.token || !tokens?.refreshToken) return false
      await session.save(tokens)
      return true
    } catch {
      return false
    }
  })()
  try { return await refreshPromise } finally { refreshPromise = null }
}

client.interceptors.request.use(config => {
  if (config.skipAuth) {
    config.headers.delete('Authorization')
  } else {
    const access = session.access()
    if (access) config.headers.set('Authorization', `Bearer ${access}`)
  }
  return config
})

client.interceptors.response.use(
  response => {
    response.data = parse(response.data) // HTTP 204 => null
    return response
  },
  async (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error)
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const original = error.config
    if (
      error.response?.status === 401 && original &&
      !original.skipAuth && !original._retry && session.refresh()
    ) {
      original._retry = true
      if (await renewSession()) return client.request(original)
      await session.clear()
      onExpired?.()
    }

    const status = error.response?.status ?? 0
    const message = status
      ? messageFor(error.response?.data, status)
      : error.code === 'ECONNABORTED'
        ? 'La solicitud tardó demasiado. Intenta nuevamente.'
        : 'No se pudo conectar con la API de Railway. Comprueba tu internet.'
    return Promise.reject(new ApiError(status, message))
  },
)

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
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }
  const url = `${path}${params.size ? `?${params.toString()}` : ''}`
  const response = await client.request<T>({
    url,
    method: options.method ?? 'GET',
    data: options.body,
    signal: options.signal,
    skipAuth: options.auth === false,
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
  })
  return response.data
}
