import axios from 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean
    _retry?: boolean
  }
}

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
const ACCESS_KEY = 'manka_access_token'
const REFRESH_KEY = 'manka_refresh_token'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export const session = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  save: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export function describeError(err: unknown): string {
  if (axios.isCancel(err)) return 'Solicitud cancelada.'
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message
    if (err.status === 401) return 'Tu sesión ha vencido o las credenciales son incorrectas.'
    return err.message
  }
  return err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
}

function parse(data: unknown): unknown {
  if (data === '' || data === undefined) return null
  if (typeof data !== 'string') return data
  try { return JSON.parse(data) } catch { return data }
}

function errorText(data: unknown, status: number): string {
  const parsed = parse(data)
  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>
    if (o.errors && typeof o.errors === 'object') {
      const errors = o.errors as Record<string, unknown>
      const names: Record<string, string> = {
        firstName: 'Nombre', lastName: 'Apellido',
        email: 'Correo electrónico', password: 'Contraseña',
      }
      const messages = Object.entries(errors)
        .filter(([, message]) => typeof message === 'string')
        .map(([field, message]) => `${names[field] ?? field}: ${message}`)
      if (messages.length) return messages.join(' | ')
    }
    for (const key of ['detail', 'message', 'title', 'error']) {
      if (typeof o[key] === 'string' && o[key]) return String(o[key])
    }
  }
  return `El servidor respondió con HTTP ${status}`
}

type Tokens = { token: string; refreshToken: string }
const client = axios.create({
  baseURL: BASE,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})
// Instancia separada: el refresh no debe entrar en los interceptores de autenticación.
const refreshClient = axios.create({ baseURL: BASE, timeout: 20000 })

let refreshing: Promise<boolean> | null = null
async function renewSession(): Promise<boolean> {
  if (refreshing) return refreshing
  const refreshToken = session.refresh()
  if (!refreshToken) return false
  refreshing = (async () => {
    try {
      const response = await refreshClient.post<Tokens>('/auth/refresh', { refreshToken })
      const tokens = response.data
      if (!tokens?.token || !tokens?.refreshToken) return false
      session.save(tokens.token, tokens.refreshToken)
      return true
    } catch {
      return false
    }
  })()
  try { return await refreshing } finally { refreshing = null }
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
    // Respetar AbortController: una cancelación no es un error de red.
    if (axios.isCancel(error)) return Promise.reject(error)
    if (!axios.isAxiosError(error)) return Promise.reject(error)

    const original = error.config
    if (
      error.response?.status === 401 && original &&
      !original.skipAuth && !original._retry && session.refresh()
    ) {
      original._retry = true
      if (await renewSession()) return client.request(original)
      session.clear()
      window.dispatchEvent(new Event('manka:session-expired'))
    }

    const status = error.response?.status ?? 0
    const message = status
      ? errorText(error.response?.data, status)
      : error.code === 'ECONNABORTED'
        ? 'La solicitud tardó demasiado. Intenta nuevamente.'
        : 'No se puede conectar con la API. Comprueba tu conexión.'
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
