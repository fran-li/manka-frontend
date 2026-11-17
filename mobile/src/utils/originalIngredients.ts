/** Preserva cantidades, fracciones y unidades tal como aparecen en el CSV.
 * No inferimos cantidades ni dividimos texto libre por comas que podrían ser parte del ingrediente. */
export function originalIngredientLines(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  const source = raw.trim()
  if (!source.startsWith('[') || !source.endsWith(']')) return [source]
  const list: string[] = []
  let quoted = false
  let quote = ''
  let escaped = false
  let current = ''
  for (let i = 1; i < source.length - 1; i++) {
    const ch = source[i]
    if (!quoted) {
      if (ch === "'" || ch === '"') { quoted = true; quote = ch; current = '' }
      else if (ch !== ',' && !/\s/.test(ch)) return [source]
    } else if (escaped) { current += ch; escaped = false }
    else if (ch === '\\') { escaped = true }
    else if (ch === quote) { quoted = false; list.push(current) }
    else current += ch
  }
  return quoted || escaped || !list.length ? [source] : list
}
