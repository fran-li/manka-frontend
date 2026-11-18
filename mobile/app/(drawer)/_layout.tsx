
import React from 'react'
import { Drawer } from 'expo-router/drawer'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../src/auth/AuthContext'
import { palette } from '../../src/theme/palette'

export default function MankaDrawer() {
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('ADMIN') ?? false

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: palette.cream },
        headerTintColor: palette.green,
        headerTitleStyle: { fontWeight: '800' },
        sceneStyle: { backgroundColor: palette.cream },
        drawerActiveTintColor: palette.green,
        drawerActiveBackgroundColor: palette.greenSoft,
        drawerInactiveTintColor: palette.muted,
        drawerLabelStyle: { fontWeight: '700' },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Inicio',
          title: 'manka.',
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={typeof color === 'string' ? color : palette.green}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="explorar"
        options={{
          drawerLabel: 'Explorar recetas',
          title: 'Explorar',
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="book-outline"
              size={size}
              color={typeof color === 'string' ? color : palette.green}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="cocinar"
        options={{
          drawerLabel: '¿Qué cocino?',
          title: 'Recomendaciones',
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="restaurant-outline"
              size={size}
              color={typeof color === 'string' ? color : palette.green}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="despensa"
        options={{
          drawerLabel: 'Mi despensa',
          title: 'Despensa',
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="basket-outline"
              size={size}
              color={typeof color === 'string' ? color : palette.green}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="escanear"
        options={{
          drawerLabel: 'Escanear alimentos',
          title: 'Escanear alimentos',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="barcode-outline" size={size}
              color={typeof color === 'string' ? color : palette.green} />
          ),
        }}
      />

      <Drawer.Screen
        name="mercados"
        options={{
          drawerLabel: 'Mercados cercanos',
          title: 'Mercados cercanos',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size}
              color={typeof color === 'string' ? color : palette.green} />
          ),
        }}
      />

      <Drawer.Screen
        name="favoritos"
        options={{
          drawerLabel: 'Favoritos',
          title: 'Mis favoritos',
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="heart-outline"
              size={size}
              color={typeof color === 'string' ? color : palette.green}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="historial"
        options={{
          drawerLabel: 'Historial',
          title: 'Lo que cociné',
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="time-outline"
              size={size}
              color={typeof color === 'string' ? color : palette.green}
            />
          ),
        }}
      />

      <Drawer.Screen
        name="admin"
        options={{
          drawerLabel: 'Administración',
          title: 'Administración',
          drawerIcon: ({ color, size }) => (
            <Ionicons
              name="shield-checkmark-outline"
              size={size}
              color={typeof color === 'string' ? color : palette.green}
            />
          ),
          drawerItemStyle: isAdmin ? {} : { display: 'none' },
        }}
      />
    </Drawer>
  )
}
