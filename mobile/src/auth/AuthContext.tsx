import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/endpoints'
import { session } from '../api/client'
import type { RegisterRequest, User } from '../api/types'
import { GoogleSignin } from '@react-native-google-signin/google-signin'

type Status = 'loading' | 'anonymous' | 'authenticated'
type AuthValue = {
  status: Status
  user: User | null
  login(email: string, password: string): Promise<void>
  register(request: RegisterRequest): Promise<void>
  logout(): Promise<void>
  loginWithGoogle(credential: string): Promise<void>
}
const Context = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)
  const clear = useCallback(async () => {
    await session.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    let active = true
    session.onExpired(() => { if (active) void clear() })
    void session.hydrate().then(async () => {
      if (!active) return
      if (!session.access()) { setStatus('anonymous'); return }
      try {
        const profile = await authApi.me()
        if (active) { setUser(profile); setStatus('authenticated') }
      } catch { if (active) await clear() }
    })
    return () => { active = false; session.onExpired(null) }
  }, [clear])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password)
    await session.save(tokens)
    try {
      const profile = await authApi.me()
      setUser(profile)
      setStatus('authenticated')
    } catch (error) { await clear(); throw error }
  }, [clear])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const tokens = await authApi.google(credential)
    await session.save(tokens)

    try {
      const profile = await authApi.me()
      setUser(profile)
      setStatus('authenticated')
    } catch (error) {
      await clear()
      throw error
    }
  }, [clear])

  const register = useCallback(async (request: RegisterRequest) => {
    await authApi.register(request)
    await login(request.email, request.password)
  }, [login])


  const logout = useCallback(async () => {
    const refreshToken = session.refresh()

    // Cerrar la sesión que Google recuerda en Android
    try {
      await GoogleSignin.signOut()
    } catch (error) {
      console.warn('Error al cerrar sesión de Google:', error)
    }

    // Cerrar la sesión local de Manka
    await clear()

    // Revocar el refresh token en Spring Boot
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // La sesión local ya fue cerrada
      }
    }
  }, [clear])


  const value = useMemo(
    () => ({
      status,
      user,
      login,
      loginWithGoogle,
      register,
      logout
    }),
    [status, user, login, loginWithGoogle, register, logout]
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(Context)
  if (!value) throw new Error('useAuth requiere AuthProvider')
  return value
}
