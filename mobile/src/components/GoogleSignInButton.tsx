
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import {
    GoogleSignin,
    isSuccessResponse,
} from '@react-native-google-signin/google-signin'
import { useAuth } from '../auth/AuthContext'
import { describeError } from '../api/client'

const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID

if (webClientId) {
    GoogleSignin.configure({ webClientId })
}

export function GoogleSignInButton() {
    const { loginWithGoogle } = useAuth()
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    async function handleGoogleLogin() {
        if (busy) return

        setBusy(true)
        setError('')

        try {
            if (!webClientId) {
                throw new Error('Falta configurar Google Web Client ID')
            }

            await GoogleSignin.hasPlayServices({
                showPlayServicesUpdateDialog: true,
            })

            await GoogleSignin.signOut()

            console.log('[Google] Abriendo selector de cuentas...')

            const response = await GoogleSignin.signIn()

            console.log('[Google] Resultado:', response.type)

            if (!isSuccessResponse(response)) return

            const idToken = response.data.idToken

            if (!idToken) {
                throw new Error('Google no devolvió un ID token.')
            }

            await loginWithGoogle(idToken)
        } catch (e) {
            setError(describeError(e))
        } finally {
            setBusy(false)
        }
    }

    return (
        <View style={{ gap: 10 }}>
            <Pressable
                onPress={() => void handleGoogleLogin()}
                disabled={busy}
                style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#D9E0DA',
                    borderRadius: 12,
                    padding: 15,
                    alignItems: 'center',
                }}
            >
                <Text style={{ color: '#244934', fontWeight: '700' }}>
                    {busy ? 'Conectando con Google…' : 'Continuar con Google'}
                </Text>
            </Pressable>

            {error ? (
                <Text style={{ color: '#B42318' }}>{error}</Text>
            ) : null}
        </View>
    )
}
