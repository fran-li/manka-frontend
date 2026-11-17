import { api } from './client'
import type { User } from './types'

/** Endpoints ya implementados en AdminUserController.java. */
export const adminApi = {
  users: () => api<User[]>('/admin/users'),
  updateRoles: (id: number, roles: Array<'USER' | 'ADMIN'>) =>
    api<User>(`/admin/users/${id}/roles`, {
      method: 'PATCH',
      body: { roles },
    }),
}
