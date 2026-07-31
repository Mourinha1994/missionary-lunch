import { api } from './client'
import type { Family } from '@/types'

type CreateFamilyInput = Omit<Family, 'id' | 'active' | 'createdAt'>
type UpdateFamilyInput = Partial<Family>

export const familiesApi = {
  getAll: (onlyActive = true) =>
    api
      .get<Family[]>('/families', { params: { onlyActive } })
      .then((response) => response.data),
  getOne: (id: string) =>
    api.get<Family>(`/families/${id}`).then((response) => response.data),
  create: (data: CreateFamilyInput) =>
    api.post<Family>('/families', data).then((response) => response.data),
  update: (id: string, data: UpdateFamilyInput) =>
    api.patch<Family>(`/families/${id}`, data).then((response) => response.data),
  remove: (id: string) =>
    api.delete(`/families/${id}`).then((response) => response.data),
}