import { api } from './client'
import type { User, Role } from '@/types'

export type CreateUserInput = {
  name: string
  email: string
  password: string
  role?: Role
}

export type UpdateUserInput = {
  name?: string
  email?: string
  password?: string
  role?: Role
  active?: boolean
}

export const usersApi = {
  getAll: () => api.get<User[]>('/users').then((response) => response.data),
  getOne: (id: string) =>
    api.get<User>(`/users/${id}`).then((response) => response.data),
  create: (data: CreateUserInput) =>
    api.post<User>('/users', data).then((response) => response.data),
  update: (id: string, data: UpdateUserInput) =>
    api.patch<User>(`/users/${id}`, data).then((response) => response.data),
  remove: (id: string) =>
    api.delete(`/users/${id}`).then((response) => response.data),
}
