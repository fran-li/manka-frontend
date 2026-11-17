import React from 'react'
import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { palette } from '../theme/palette'

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.cream },
  content: { padding: 20, paddingBottom: 50, gap: 15 },
  title: { fontSize: 30, color: palette.greenDark, fontWeight: '900', lineHeight: 36 },
  sub: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  eyebrow: { fontWeight: '800', fontSize: 11, letterSpacing: 2, color: '#63906f' },
  panel: { padding: 17, borderRadius: 18, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.white, gap: 13 },
  heading: { fontSize: 20, fontWeight: '800', color: palette.text },
  body: { color: palette.text, fontSize: 14, lineHeight: 21 },
  button: { backgroundColor: palette.green, borderRadius: 12, minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  buttonText: { color: palette.white, fontWeight: '800', fontSize: 14, textAlign: 'center' },
  buttonOutline: { backgroundColor: palette.white, borderWidth: 1, borderColor: '#aecdb5' },
  buttonOutlineText: { color: palette.green },
  input: { minHeight: 47, paddingHorizontal: 13, backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 11, color: palette.text, fontSize: 15 },
  label: { color: palette.text, fontSize: 13, fontWeight: '700', marginBottom: 5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: palette.greenSoft },
  badgeText: { color: palette.green, fontWeight: '700', fontSize: 12 },
  separator: { height: 1, backgroundColor: palette.border },
})

export function Screen({ children, refreshControl }: { children: ReactNode; refreshControl?: React.ReactElement }) {
  return <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
    {children}
  </ScrollView>
}
export function Intro({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <View style={{ gap: 6, marginBottom: 6 }}>
    <Text style={s.eyebrow}>{eyebrow}</Text><Text style={s.title}>{title}</Text><Text style={s.sub}>{subtitle}</Text>
  </View>
}
export function Panel({ children }: { children: ReactNode }) { return <View style={s.panel}>{children}</View> }
export function Button({ title, onPress, outline = false, disabled = false, danger = false }: {
  title: string; onPress(): void; outline?: boolean; disabled?: boolean; danger?: boolean
}) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [s.button, outline && s.buttonOutline, danger && { backgroundColor: palette.redSoft, borderColor: '#e9b9ad', borderWidth: 1 }, disabled && { opacity: 0.5 }, pressed && { opacity: 0.8 }] }>
    <Text style={[s.buttonText, outline && s.buttonOutlineText, danger && { color: palette.red }]}>{title}</Text>
  </Pressable>
}
export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }: {
  label: string; value: string; onChangeText(text: string): void; placeholder?: string; secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'number-pad'; autoCapitalize?: 'none' | 'sentences' | 'words'
}) {
  return <View style={{ gap: 4 }}><Text style={s.label}>{label}</Text>
    <TextInput style={s.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9aa99d"
      secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize || 'none'} autoCorrect={false} />
  </View>
}
export function Banner({ text, kind = 'error' }: { text: string; kind?: 'error' | 'success' | 'info' }) {
  if (!text) return null
  const error = kind === 'error'
  return <View style={{ padding: 13, borderRadius: 12, backgroundColor: error ? palette.redSoft : palette.greenSoft }}>
    <Text style={{ color: error ? palette.red : palette.green, lineHeight: 19 }}>{text}</Text>
  </View>
}
export function Busy({ label = 'Cargando…' }: { label?: string }) { return <View style={{ padding: 30, alignItems: 'center', gap: 12 }}><ActivityIndicator color={palette.green} /><Text style={s.sub}>{label}</Text></View> }
export function Empty({ title, text, icon = '🥬' }: { title: string; text: string; icon?: string }) {
  return <Panel><View style={{ alignItems: 'center', padding: 18, gap: 8 }}><Text style={{ fontSize: 34 }}>{icon}</Text><Text style={s.heading}>{title}</Text><Text style={[s.sub, { textAlign: 'center' }]}>{text}</Text></View></Panel>
}
export function Chip({ title, selected, onPress }: { title: string; selected?: boolean; onPress(): void }) {
  return <Pressable onPress={onPress} style={[s.badge, selected && { backgroundColor: palette.green }]}>
    <Text style={[s.badgeText, selected && { color: palette.white }]}>{title}</Text>
  </Pressable>
}
