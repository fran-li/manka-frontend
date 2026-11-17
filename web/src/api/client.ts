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
  if (err instanceof ApiError) {
    if (err.status === 0) return 'No se puede conectar al backend. Verifica que Spring Boot esté ejecutándose en el puerto 8083.'
    if (err.status === 401) return 'Tu sesión ha vencido o las credenciales son incorrectas.'
    return err.message
  }
  return err instanceof Error ? err.message : 'Ocurrió un error inesperado.'
}


function errorText(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;

    // Mostrar errores de validación de Spring Boot
    if (o.errors && typeof o.errors === 'object') {
      const errors = o.errors as Record<string, unknown>;

      const names: Record<string, string> = {
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Correo electrónico',
        password: 'Contraseña',
      };

      const messages = Object.entries(errors)
        .filter(([, message]) => typeof message === 'string')
        .map(([field, message]) =>
          `${names[field] ?? field}: ${message}`
        );

      if (messages.length > 0) {
        return messages.join(' | ');
      }
    }

    // Otros errores HTTP
    for (const key of ['detail', 'message', 'title', 'error']) {
      if (typeof o[key] === 'string' && o[key]) {
        return String(o[key]);
      }
    }
  }

  return `El servidor respondió con HTTP ${status}`;
}


function parse(text: string): unknown {
  try { return text ? JSON.parse(text) : null } catch { return text }
}

let refreshing: Promise<boolean> | null = null
async function renewSession(): Promise<boolean> {
  if (refreshing) return refreshing
  const refreshToken = session.refresh()
  if (!refreshToken) return false
  refreshing = (async () => {
    try {
      const response = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!response.ok) return false
      const tokens = await response.json() as { token?: string; refreshToken?: string }
      if (!tokens.token || !tokens.refreshToken) return false
      session.save(tokens.token, tokens.refreshToken)
      return true
    } catch { return false }
  })()
  try { return await refreshing } finally { refreshing = null }
}

type Query = Record<string, string | number | boolean | null | undefined>
interface Options { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; query?: Query; body?: unknown; signal?: AbortSignal; auth?: boolean }

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value))
  }
  const url = `${BASE}${path}${params.size ? `?${params.toString()}` : ''}`
  const request = async (retry: boolean): Promise<T> => {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'
    if (options.auth !== false && session.access()) headers.Authorization = `Bearer ${session.access()}`
    let response: Response
    try {
      response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new ApiError(0, 'Sin conexión con Spring Boot')
    }
    if (response.status === 401 && retry && options.auth !== false && session.refresh()) {
      if (await renewSession()) return request(false)
      session.clear()
      window.dispatchEvent(new Event('manka:session-expired'))
    }
    const data = parse(await response.text())
    if (!response.ok) throw new ApiError(response.status, errorText(data, response.status))
    return data as T
  }
  return request(true)
}
