import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { describeError } from '../api/client'
import { Alert } from '../components/Feedback'
import { GoogleSignInButton } from '../components/GoogleSignInButton'

export function RegisterPage() {
  const { register, status } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (status === 'authenticated') return <Navigate to="/" replace />

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    const password = form.password;

    // Validación del nombre
    if (!firstName) {
      setError('El nombre es obligatorio.');
      return;
    }

    // Validación del apellido
    if (!lastName) {
      setError('El apellido es obligatorio.');
      return;
    }

    // Validación del correo
    if (!email) {
      setError('El correo electrónico es obligatorio.');
      return;
    }

    // Validación de contraseña
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      setError(
        'La contraseña debe tener al menos 8 caracteres, una letra y un número.'
      );
      return;
    }

    setBusy(true);

    try {
      await register({
        firstName,
        lastName,
        email,
        password
      });

      navigate('/', { replace: true });
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page"><section className="auth-aside"><div className="auth-aside-inner">
    <span className="auth-brand">◒ manka.</span><span className="auth-art">🥑</span>
    <span className="eyebrow light">CADA INGREDIENTE CUENTA</span><h1>Tu próxima receta favorita te espera.</h1><p>Una despensa ordenada, ideas deliciosas y recomendaciones pensadas para ti.</p>
  </div></section><section className="auth-form-side"><div className="auth-form-container">
    <div className="mobile-brand">◒ manka.</div><span className="eyebrow">EMPIEZA AQUÍ</span><h2>Crea tu cuenta</h2><p className="auth-subtitle">Todo lo que necesitas para cocinar más fácil.</p>
    <form onSubmit={e => { void submit(e) }} className="form-stack"><div className="two-fields">
      <label className="field-label">Nombre<input className="input" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></label>
      <label className="field-label">Apellido<input className="input" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></label></div>
      <label className="field-label">Correo electrónico<input className="input" type="email" autoComplete="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
      <label className="field-label">Contraseña<input className="input" type="password" minLength={8} autoComplete="new-password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
      <p className="form-hint">Mínimo 8 caracteres, incluyendo una letra y un número.</p>
      {error && <Alert>{error}</Alert>}<button className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta →'}</button>
    </form><GoogleSignInButton mode="register" /><p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
  </div></section></main>
}
