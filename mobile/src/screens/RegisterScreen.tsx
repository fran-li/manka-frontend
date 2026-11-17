
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Link } from 'expo-router'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { useAuth } from '../auth/AuthContext'
import { describeError } from '../api/client'
import { Banner, Button, Field, Screen, s } from '../components/UI'
import { palette } from '../theme/palette'

export default function RegisterScreen() {
  const { register } = useAuth()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update =
    (key: keyof typeof form) =>
    (text: string) =>
      setForm(old => ({ ...old, [key]: text }))

  async function submit() {
    const firstName = form.firstName.trim()
    const lastName = form.lastName.trim()
    const email = form.email.trim().toLowerCase()

    if (!firstName || !lastName || !email) {
      setError('Completa tu nombre, apellido y correo.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Escribe un correo válido.')
      return
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
      setError(
        'La contraseña requiere al menos 8 caracteres, una letra y un número.'
      )
      return
    }

    setBusy(true)
    setError('')

    try {
      await register({
        firstName,
        lastName,
        email,
        password: form.password,
      })
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <View
        style={{
          backgroundColor: palette.green,
          borderRadius: 20,
          padding: 24,
          gap: 7,
        }}
      >
        <Text
          style={{
            color: palette.white,
            fontSize: 24,
            fontWeight: '900',
          }}
        >
          ◒ manka.
        </Text>

        <Text
          style={{
            color: palette.white,
            fontSize: 21,
            fontWeight: '800',
          }}
        >
          Tu próxima receta favorita te espera. 🥑
        </Text>
      </View>

      <Text style={s.eyebrow}>EMPIEZA AQUÍ</Text>
      <Text style={s.title}>Crea tu cuenta</Text>

      <Field
        label="Nombre"
        value={form.firstName}
        onChangeText={update('firstName')}
        placeholder="Tu nombre"
      />

      <Field
        label="Apellido"
        value={form.lastName}
        onChangeText={update('lastName')}
        placeholder="Tu apellido"
      />

      <Field
        label="Correo electrónico"
        value={form.email}
        onChangeText={update('email')}
        keyboardType="email-address"
        placeholder="tu@correo.com"
      />

      <Field
        label="Contraseña"
        value={form.password}
        onChangeText={update('password')}
        secureTextEntry
        placeholder="Mínimo 8 caracteres"
      />

      <Text style={s.sub}>
        Mínimo 8 caracteres, una letra y un número.
      </Text>

      <Banner text={error} />

      <Button
        title={busy ? 'Creando cuenta…' : 'Crear cuenta →'}
        disabled={busy}
        onPress={() => void submit()}
      />

      <Text
        style={{
          textAlign: 'center',
          color: palette.muted,
          marginVertical: 8,
        }}
      >
        ────── o regístrate con ──────
      </Text>

      <GoogleSignInButton />

      <Text
        style={{
          textAlign: 'center',
          color: palette.muted,
        }}
      >
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/(auth)/login"
          style={{
            color: palette.green,
            fontWeight: '900',
          }}
        >
          Inicia sesión
        </Link>
      </Text>
    </Screen>
  )
}
