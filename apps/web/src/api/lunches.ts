import { api } from './client'
import type { Lunch } from '@/types'

type CreateLunchInput = {
  date: string
  familyId: string
  missionaryIds: string[]
  notes?: string
}

type UpdateLunchInput = Partial<CreateLunchInput>

export const lunchesApi = {
  getAll: (startDate?: string, endDate?: string) =>
    api
      .get<Lunch[]>('/lunches', { params: { startDate, endDate } })
      .then((response) => response.data),
  getOne: (id: string) =>
    api.get<Lunch>(`/lunches/${id}`).then((response) => response.data),
  create: (data: CreateLunchInput) =>
    api.post<Lunch>('/lunches', data).then((response) => response.data),
  update: (id: string, data: UpdateLunchInput) =>
    api.patch<Lunch>(`/lunches/${id}`, data).then((response) => response.data),
  remove: (id: string) =>
    api.delete(`/lunches/${id}`).then((response) => response.data),
}
