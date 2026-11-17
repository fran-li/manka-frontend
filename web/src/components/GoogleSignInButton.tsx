import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { describeError } from '../api/client'
import { Alert } from './Feedback'

type GoogleCredentialResponse = { credential?: string; select_by?: string }
type GoogleButtonOptions = {
  theme: 'outline'
  size: 'large'
  text: 'signin_with' | 'signup_with'
  shape: 'rectangular'
  width: number
}
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (r: GoogleCredentialResponse) => void; auto_select?: boolean; ux_mode?: 'popup' }) => void
          renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void
        }
      }
    }
  }
}

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client'
let loadPromise: Promise<void> | undefined
function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!loadPromise) {
    loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GOOGLE_SCRIPT
      script.async = true
      script.onload = () => window.google?.accounts?.id ? resolve() : reject(new Error('Google Identity Services no se cargó.'))
      script.onerror = () => reject(new Error('No se pudo cargar Google. Revisa tu conexión o los bloqueadores de contenido.'))
      document.head.appendChild(script)
    }).catch(error => { loadPromise = undefined; throw error })
  }
  return loadPromise
}

export function GoogleSignInButton({ mode }: { mode: 'login' | 'register' }) {
  const container = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const clientId = '64903487148-qcq28db55aekra5dutjscssiu406u6t0.apps.googleusercontent.com'

  useEffect(() => {
    if (!clientId) return
    let mounted = true
    loadGoogleIdentity().then(() => {
      if (!mounted || !container.current || !window.google) return
      const node = container.current
      node.innerHTML = ''
      window.google.accounts.id.initialize({
        client_id: clientId,
        ux_mode: 'popup',
        auto_select: false,
        callback: (response) => {
          if (!mounted) return
          if (!response.credential) {
            setError('Google no devolvió una credencial de acceso.')
            return
          }
          setBusy(true)
          setError('')
          void loginWithGoogle(response.credential).then(() => {
            if (mounted) navigate('/', { replace: true })
          }).catch((err: unknown) => {
            if (mounted) setError(describeError(err))
          }).finally(() => { if (mounted) setBusy(false) })
        },
      })
      window.google.accounts.id.renderButton(node, {
        theme: 'outline',
        size: 'large',
        text: mode === 'register' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        width: Math.min(320, node.clientWidth || 320),
      })
    }).catch((err: unknown) => {
      if (mounted) setError(describeError(err))
    })
    return () => { mounted = false }
  }, [clientId, mode, loginWithGoogle, navigate])

  if (!clientId) return <p className="form-hint">Google no está configurado: añade VITE_GOOGLE_CLIENT_ID a .env.local.</p>
  return <div className="auth-google-wrap" aria-busy={busy}>
    <div className="auth-separator"><span>o continúa con</span></div>
    <div ref={container} className="auth-google-button" />
    {busy && <p className="form-hint">Verificando tu cuenta con Google…</p>}
    {error && <Alert>{error}</Alert>}
  </div>
}
