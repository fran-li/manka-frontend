
import { api } from './client'
import type { User } from './types'

export const adminApi = {
  users: () => api<User[]>('/admin/users'),

  updateRoles: (id: number, roles: Array<'USER' | 'ADMIN'>) =>
    api<User>(`/admin/users/${id}/roles`, {
      method: 'PATCH',
      body: { roles },
    }),

  deleteUser: (id: number) =>
    api<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    }),
}
