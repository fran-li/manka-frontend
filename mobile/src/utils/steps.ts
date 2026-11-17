/** El origen CSV puede guardar la preparación como texto o como lista serializada. */
export function preparationSteps(raw: string | null): string[] {
  if (!raw?.trim()) return []
  const text = raw.trim()
  try {
    const parsed: unknown = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string')
  } catch { /* no es JSON */ }
  if (text.startsWith("['") && text.endsWith("']")) {
    const matches = [...text.matchAll(/(?:\[|,\s*)'((?:\\'|[^'])*)'(?=\s*(?:,|\]))/g)]
    if (matches.length > 1) return matches.map(match => match[1].replaceAll("\\'", "'"))
  }
  return [text]
}
