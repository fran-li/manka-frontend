import { useEffect, useState } from 'react'
import Fuse from 'fuse.js'
import { catalogApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Ingredient } from '../api/types'

let catalogPromise: Promise<Ingredient[]> | null = null
function getCatalog(): Promise<Ingredient[]> {
  if (!catalogPromise) catalogPromise = catalogApi.allIngredients().catch(error => { catalogPromise = null; throw error })
  return catalogPromise
}

/** Sugerencias primero desde API (incluye alias), y Fuse.js si no hay coincidencias. */
export function IngredientPicker({ selected, onChange, placeholder = 'Ej. pollo, papa, tomate…' }: {
  selected: Ingredient[]
  onChange: (next: Ingredient[]) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Ingredient[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) { setSuggestions([]); setHint(''); setBusy(false); return }
    let active = true
    const timer = window.setTimeout(async () => {
      setBusy(true)
      setHint('')
      try {
        const results = await catalogApi.ingredients(term, 0, 8)
        if (!active) return
        if (results.content.length) {
          setSuggestions(results.content)
        } else {
          // La consulta antigua devuelve ~7k nombres: se descarga una sola vez,
          // únicamente si una búsqueda no tiene coincidencias. No se carga al iniciar.
          const all = await getCatalog()
          if (!active) return
          const matcher = new Fuse(all, { keys: ['nombre'], threshold: 0.35, ignoreLocation: true, minMatchCharLength: 2 })
          const exact = all.find(item => item.nombre.toLocaleLowerCase('es') === term.toLocaleLowerCase('es'))
          setSuggestions(exact ? [exact] : matcher.search(term, { limit: 8 }).map(item => item.item))
          setHint('Sugerencias por similitud ortográfica')
        }
      } catch (error) {
        if (active) { setSuggestions([]); setHint(describeError(error)) }
      } finally { if (active) setBusy(false) }
    }, 260)
    return () => { active = false; window.clearTimeout(timer) }
  }, [query])

  function pick(item: Ingredient) {
    if (!selected.some(value => value.id === item.id)) onChange([...selected, item])
    setQuery(''); setSuggestions([]); setIsOpen(false); setHint('')
  }
  return <div className="picker">
    <label htmlFor="ingredient-search" className="field-label">¿Qué ingredientes tienes?</label>
    <div className="picker-input-row"><span className="search-icon">⌕</span>
      <input id="ingredient-search" value={query} onChange={event => { setQuery(event.target.value); setIsOpen(true) }}
        onFocus={() => setIsOpen(true)} onKeyDown={event => { if (event.key === 'Enter' && suggestions[0]) { event.preventDefault(); pick(suggestions[0]) } if (event.key === 'Escape') setIsOpen(false) }}
        placeholder={placeholder} autoComplete="off" role="combobox" aria-expanded={isOpen && suggestions.length > 0} aria-controls="ingredient-results" />
      {busy && <span className="spinner small" aria-label="Buscando" />}
    </div>
    {isOpen && query.trim().length >= 2 && <div className="suggestions" id="ingredient-results" role="listbox">
      {hint && <p className="suggestion-caption">{hint}</p>}
      {suggestions.filter(item => !selected.some(v => v.id === item.id)).map(item =>
        <button key={item.id} type="button" role="option" aria-selected={false} onMouseDown={e => e.preventDefault()} onClick={() => pick(item)}>
          <span className="suggestion-plus">＋</span> <span>{item.nombre}</span> <small>#{item.id}</small>
        </button>)}
      {!busy && !suggestions.length && !hint && <p className="suggestion-caption">No hay coincidencias. Prueba otra palabra.</p>}
    </div>}
    {!!selected.length && <div className="selected-list" aria-label="Ingredientes seleccionados">
      {selected.map(item => <span className="ingredient-chip" key={item.id}>{item.nombre}<button type="button" onClick={() => onChange(selected.filter(value => value.id !== item.id))} aria-label={`Quitar ${item.nombre}`}>×</button></span>)}
      <button className="clear-chips" type="button" onClick={() => onChange([])}>Limpiar</button>
    </div>}
  </div>
}
