import 'react-native-gesture-handler'
import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ActivityIndicator, View } from 'react-native'
import { AuthProvider, useAuth } from '../src/auth/AuthContext'
import { palette } from '../src/theme/palette'

function Navigation() {
  const { status } = useAuth()
  if (status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: palette.cream, justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={palette.green} />
    </View>
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'authenticated'} redirectTo="/(auth)/login">
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="recetas/[id]" options={{ headerShown: true, title: 'Receta', headerTintColor: palette.green }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'anonymous'} redirectTo="/(drawer)">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}
export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Navigation />
      </AuthProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
}
