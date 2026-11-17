import type { ReactNode } from 'react'
export function Alert({ children, kind = 'error' }: { children: ReactNode; kind?: 'error' | 'info' | 'success' }) {
  return <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
}
export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return <div className="loading"><span className="spinner" aria-hidden="true" /> {label}</div>
}
export function Empty({ icon = '✦', title, text, action }: { icon?: string; title: string; text: string; action?: ReactNode }) {
  return <div className="empty"><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{text}</p>{action}</div>
}
export function PageIntro({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return <div className="page-intro"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>
}
