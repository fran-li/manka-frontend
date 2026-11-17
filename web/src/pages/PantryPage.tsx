import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { Ingredient } from '../api/types'
import { IngredientPicker } from '../components/IngredientPicker'
import { Alert, Loading, PageIntro } from '../components/Feedback'

export function PantryPage() {
  const [original, setOriginal] = useState<Ingredient[]>([])
  const [selected, setSelected] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => { let active = true; personalApi.pantry().then(value => { if (active) { setOriginal(value); setSelected(value) } }).catch(e => { if (active) setError(describeError(e)) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  async function save() {
    setSaving(true); setError(''); setMessage('')
    try { const response = await personalApi.savePantry(selected.map(i => i.id)); setSelected(response); setOriginal(response); setMessage('Tu despensa se guardó correctamente.') }
    catch (e) { setError(describeError(e)) }
    finally { setSaving(false) }
  }
  const changed = original.map(i => i.id).sort().join() !== selected.map(i => i.id).sort().join()
  return <><PageIntro eyebrow="ORGANIZA TU COCINA" title="Mi despensa" subtitle="Guarda tus ingredientes para usarlos cuando quieras recibir recomendaciones." />
    <div className="narrow-container"><div className="panel pantry-panel"><div className="pantry-summary"><span className="pantry-emblem">◫</span><div><strong>{selected.length} ingredientes</strong><p>Disponibles actualmente en tu cocina</p></div></div>
    {loading ? <Loading /> : <><IngredientPicker selected={selected} onChange={value => { setSelected(value); setMessage('') }} placeholder="Añadir un ingrediente…" /><div className="pantry-actions"><button className="btn btn-primary" onClick={() => { void save() }} disabled={saving || !changed}>{saving ? 'Guardando…' : 'Guardar despensa'}</button><Link to="/cocinar" className="btn btn-outline">Buscar recetas →</Link></div></>}
    {error && <Alert>{error}</Alert>}{message && <Alert kind="success">{message}</Alert>}</div>
    <div className="tip-card">💡 <div><strong>¿Por qué guardar tu despensa?</strong><p>La próxima vez que abras “¿Qué cocino?”, Manka cargará automáticamente estos ingredientes.</p></div></div></div></>
}
