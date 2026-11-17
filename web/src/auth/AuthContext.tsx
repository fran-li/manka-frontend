import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/endpoints'
import { session } from '../api/client'
import type { RegisterRequest, User } from '../api/types'

type Status = 'loading' | 'anonymous' | 'authenticated'
interface AuthValue {
  status: Status
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  register: (body: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(() => session.access() ? 'loading' : 'anonymous')
  const [user, setUser] = useState<User | null>(null)

  const clear = useCallback(() => {
    session.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    let active = true
    if (session.access()) {
      authApi.me().then((profile) => {
        if (active) { setUser(profile); setStatus('authenticated') }
      }).catch(() => { if (active) clear() })
    }
    const expired = () => clear()
    window.addEventListener('manka:session-expired', expired)
    return () => { active = false; window.removeEventListener('manka:session-expired', expired) }
  }, [clear])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password)
    session.save(tokens.token, tokens.refreshToken)
    try {
      const profile = await authApi.me()
      setUser(profile)
      setStatus('authenticated')
    } catch (error) { clear(); throw error }
  }, [clear])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const tokens = await authApi.google(credential)
    session.save(tokens.token, tokens.refreshToken)
    try {
      const profile = await authApi.me()
      setUser(profile)
      setStatus('authenticated')
    } catch (error) { clear(); throw error }
  }, [clear])

  const register = useCallback(async (body: RegisterRequest) => {
    await authApi.register(body)
    await login(body.email, body.password)
  }, [login])

  const logout = useCallback(async () => {
    const refresh = session.refresh()
    clear()
    if (refresh) { try { await authApi.logout(refresh) } catch { /* logout local garantizado */ } }
  }, [clear])

  const value = useMemo(() => ({ status, user, login, loginWithGoogle, register, logout }), [status, user, login, loginWithGoogle, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
