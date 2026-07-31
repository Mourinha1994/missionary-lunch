import { api } from './client'
import type { Missionary } from '@/types'

type CreateMissionaryInput = Omit<Missionary, 'id' | 'active' | 'createdAt'>
type UpdateMissionaryInput = Partial<Missionary>

export const missionariesApi = {
  getAll: (onlyActive = true) =>
    api
      .get<Missionary[]>('/missionaries', { params: { onlyActive } })
      .then((response) => response.data),
  getOne: (id: string) =>
    api.get<Missionary>(`/missionaries/${id}`).then((response) => response.data),
  create: (data: CreateMissionaryInput) =>
    api.post<Missionary>('/missionaries', data).then((response) => response.data),
  update: (id: string, data: UpdateMissionaryInput) =>
    api.patch<Missionary>(`/missionaries/${id}`, data).then((response) => response.data),
  remove: (id: string) =>
    api.delete(`/missionaries/${id}`).then((response) => response.data),
}