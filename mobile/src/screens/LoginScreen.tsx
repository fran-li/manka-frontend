
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Link } from 'expo-router'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { useAuth } from '../auth/AuthContext'
import { describeError } from '../api/client'
import { Banner, Button, Field, Screen, s } from '../components/UI'
import { palette } from '../theme/palette'

export default function LoginScreen() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!email.trim() || !password) {
      setError('Ingresa el correo y contraseña.')
      return
    }

    setBusy(true)
    setError('')

    try {
      await login(email.trim().toLowerCase(), password)
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
          padding: 25,
          borderRadius: 22,
          gap: 10,
          marginTop: 10,
        }}
      >
        <Text
          style={{
            color: palette.white,
            fontSize: 25,
            fontWeight: '900',
          }}
        >
          ◒ manka.
        </Text>

        <Text
          style={{
            color: palette.gold,
            fontSize: 11,
            letterSpacing: 2,
            fontWeight: '800',
          }}
        >
          TU COCINA, TUS POSIBILIDADES
        </Text>

        <Text
          style={{
            color: palette.white,
            fontSize: 27,
            lineHeight: 34,
            fontWeight: '800',
          }}
        >
          Algo rico empieza con lo que ya tienes.
        </Text>

        <Text style={{ color: '#e3eee4' }}>
          Descubre recetas, aprovecha tus ingredientes y guarda tus favoritas. 🥗
        </Text>
      </View>

      <Text style={s.eyebrow}>QUÉ GUSTO VERTE</Text>
      <Text style={s.title}>Bienvenido de nuevo</Text>
      <Text style={s.sub}>
        Inicia sesión para entrar a tu cocina.
      </Text>

      <Field
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholder="tu@correo.com"
      />

      <Field
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      <Banner text={error} />

      <Button
        title={busy ? 'Ingresando…' : 'Entra a Manka →'}
        onPress={() => void submit()}
        disabled={busy}
      />

      <Text
        style={{
          textAlign: 'center',
          color: palette.muted,
          marginVertical: 8,
        }}
      >
        ────── o continúa con ──────
      </Text>

      <GoogleSignInButton />

      <Text
        style={{
          textAlign: 'center',
          color: palette.muted,
        }}
      >
        ¿Todavía no tienes una cuenta?{' '}
        <Link
          href="/(auth)/register"
          style={{
            color: palette.green,
            fontWeight: '900',
          }}
        >
          Regístrate gratis
        </Link>
      </Text>
    </Screen>
  )
}
