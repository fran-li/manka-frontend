import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { describeError } from '../api/client'
import { Alert } from '../components/Feedback'
import { GoogleSignInButton } from '../components/GoogleSignInButton'

export function LoginPage() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (status === 'authenticated') return <Navigate to="/" replace />
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    try { await login(email.trim(), password); navigate('/', { replace: true }) }
    catch (e) { setError(describeError(e)) }
    finally { setBusy(false) }
  }
  return <main className="auth-page"><section className="auth-aside"><div className="auth-aside-inner">
    <span className="auth-brand">◒ manka.</span><span className="auth-art">🍲</span>
    <span className="eyebrow light">TU COCINA, TUS POSIBILIDADES</span><h1>Algo rico empieza con lo que ya tienes.</h1>
    <p>Descubre recetas, aprovecha tus ingredientes y guarda tus favoritas.</p>
    <div className="auth-testimonial">✦ Más cocina, menos desperdicio.</div></div></section>
    <section className="auth-form-side"><div className="auth-form-container">
      <div className="mobile-brand">◒ manka.</div><span className="eyebrow">QUÉ GUSTO VERTE</span>
      <h2>Bienvenido de nuevo</h2><p className="auth-subtitle">Inicia sesión para entrar a tu cocina.</p>
      <form onSubmit={e => { void submit(e) }} className="form-stack">
        <label className="field-label">Correo electrónico<input className="input" type="email" required autoComplete="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="field-label">Contraseña<input className="input" type="password" required autoComplete="current-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error && <Alert>{error}</Alert>}
        <button className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Ingresando…' : 'Entrar a Manka →'}</button>
      </form><GoogleSignInButton mode="login" /><p className="auth-switch">¿Todavía no tienes cuenta? <Link to="/registro">Regístrate gratis</Link></p>
      <p className="auth-foot">Manka ahora esta conectado a la API</p>
    </div></section></main>
}
