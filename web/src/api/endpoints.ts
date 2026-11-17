import { api } from './client'
import type { Dish, HistoryItem, Ingredient, LoginResponse, Page, Recommendation, RegisterRequest, User } from './types'

export const authApi = {
  login: (email: string, password: string) => api<LoginResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  google: (credential: string) => api<LoginResponse>('/auth/google', { method: 'POST', body: { credential }, auth: false }),
  register: (body: RegisterRequest) => api<{ id: number }>('/users/register', { method: 'POST', body, auth: false }),
  me: () => api<User>('/users/me'),
  logout: (refreshToken: string) => api<void>('/auth/logout', { method: 'POST', body: { refreshToken }, auth: false }),
}

export const catalogApi = {
  ingredients: (search = '', page = 0, size = 10, signal?: AbortSignal) =>
    api<Page<Ingredient>>('/ingredients/page', { query: { search, page, size }, signal }),
  allIngredients: () => api<Ingredient[]>('/ingredients'),
  dishes: (search = '', page = 0, size = 12, maxMinutes?: number, signal?: AbortSignal) =>
    api<Page<Dish>>('/dishes/page', { query: { search, page, size, maxMinutes }, signal }),
  dish: (id: number) => api<Dish>(`/dishes/${id}`),
  recommend: (ingredientIds: number[], availableMinutes: number, page = 0, limit = 10) =>
    api<Page<Recommendation>>('/recommendations', {
      method: 'POST',
      body: { ingredientIds, availableMinutes, page, limit },
    }),
}

export const personalApi = {
  pantry: () => api<Ingredient[]>('/pantry'),
  savePantry: (ingredientIds: number[]) => api<Ingredient[]>('/pantry', { method: 'PUT', body: { ingredientIds } }),
  favorites: () => api<Dish[]>('/favorites'),
  addFavorite: (id: number) => api<void>(`/favorites/${id}`, { method: 'POST' }),
  removeFavorite: (id: number) => api<void>(`/favorites/${id}`, { method: 'DELETE' }),
  history: () => api<HistoryItem[]>('/history'),
  cooked: (dishId: number) => api<HistoryItem>('/history', { method: 'POST', body: { dishId } }),
}
