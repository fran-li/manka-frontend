import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from './auth/AuthContext'
import { AppLayout } from './layout/AppLayout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ExplorePage } from './pages/ExplorePage'
import { RecipePage } from './pages/RecipePage'
import { RecommendPage } from './pages/RecommendPage'
import { PantryPage } from './pages/PantryPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { HistoryPage } from './pages/HistoryPage'
import { AdminPage } from './pages/AdminPage'

function PrivateLayout() {
  const { status } = useAuth()
  if (status === 'loading') return <div className="center-screen">Preparando tu cocina…</div>
  return status === 'authenticated' ? <AppLayout /> : <Navigate to="/login" replace />
}

function AdminOnly() {
  const { user } = useAuth()
  return user?.roles?.includes('ADMIN')
    ? <AdminPage />
    : <Navigate to="/" replace />
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/registro" element={<RegisterPage />} />
    <Route element={<PrivateLayout />}>
      <Route index element={<HomePage />} />
      <Route path="explorar" element={<ExplorePage />} />
      <Route path="recetas/:id" element={<RecipePage />} />
      <Route path="cocinar" element={<RecommendPage />} />
      <Route path="despensa" element={<PantryPage />} />
      <Route path="favoritos" element={<FavoritesPage />} />
      <Route path="historial" element={<HistoryPage />} />
      <Route path="admin" element={<AdminOnly />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
