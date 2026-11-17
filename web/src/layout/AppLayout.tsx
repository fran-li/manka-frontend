import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'

const links = [
  { to: '/', icon: '⌂', label: 'Inicio', end: true },
  { to: '/explorar', icon: '▦', label: 'Explorar', end: false },
  { to: '/cocinar', icon: '✦', label: '¿Qué cocino?', end: false },
  { to: '/despensa', icon: '◫', label: 'Mi despensa', end: false },
  { to: '/favoritos', icon: '♡', label: 'Favoritos', end: false },
  { to: '/historial', icon: '◷', label: 'Historial', end: false },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = Boolean(user?.roles?.includes('ADMIN'))
  const visibleLinks = isAdmin
    ? [...links, { to: '/admin', icon: '♜', label: 'Administración', end: false }]
    : links

  return <div className="app-shell">
    <header className="site-header">
      <div className="nav-inner">
        <NavLink to="/" className="brand" aria-label="Manka, ir al inicio"><span className="brand-icon">◒</span><span>manka<span className="brand-dot">.</span></span></NavLink>
        <nav aria-label="Navegación principal" className="main-nav">
          {visibleLinks.map(link => <NavLink key={link.to} to={link.to} end={link.end} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{link.icon}</span> {link.label}
          </NavLink>)}
        </nav>
        <div className="user-menu">
          <span className="avatar">{user?.firstName?.slice(0,1)?.toUpperCase() || 'M'}</span>
          <span className="user-name">{user?.firstName || 'Mi cuenta'}</span>
          <button type="button" className="logout" onClick={() => { void logout().then(() => navigate('/login')) }}>Salir</button>
        </div>
      </div>
    </header>
    <main className="main-container"><Outlet /></main>
    <footer className="site-footer"><strong>manka.</strong><span>Cocinar mejor empieza con lo que ya tienes.</span><small>Frontend React · API Spring Boot</small></footer>
  </div>
}
