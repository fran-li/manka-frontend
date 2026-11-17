import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { personalApi } from '../api/endpoints'
import { describeError } from '../api/client'
import type { HistoryItem } from '../api/types'
import { Alert, Empty, Loading, PageIntro } from '../components/Feedback'
export function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { let active = true; personalApi.history().then(value => { if (active) setHistory(value) }).catch(e => { if (active) setError(describeError(e)) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  return <><PageIntro eyebrow="MOMENTOS EN TU COCINA" title="Lo que ya cocinaste" subtitle="Tu historial de recetas preparadas, listo para volver a inspirarte." />{error && <Alert>{error}</Alert>}{loading ? <Loading /> : history.length ? <div className="history-list">{history.map(item => <Link className="history-item" to={`/recetas/${item.dishId}`} key={item.id}><span>🍽️</span><div><strong>{item.dishName}</strong><small>{new Date(item.cookedAt).toLocaleString('es-PE')}</small></div><span className="history-arrow">↗</span></Link>)}</div> : <Empty icon="◷" title="Tu historia empieza con un plato" text="Marca como cocinada una receta para que aparezca aquí." action={<Link to="/explorar" className="btn btn-primary">Elegir una receta</Link>} />}</>
}
