import { api } from './client'
import type { BlockedDate, PdayConfig, PdayException } from '@/types'

type CreatePdayConfigInput = {
  dayOfWeek: number
  startDate: string
  reason?: string
}

type CreatePdayExceptionInput = {
  date: string
  blocked: boolean
  reason?: string
}

export const pdayApi = {
  getAll: () => api.get<PdayConfig[]>('/pday').then((response) => response.data),
  getCurrent: () =>
    api.get<PdayConfig>('/pday/current').then((response) => response.data),
  getBlockedDates: (startDate: string, endDate: string) =>
    api
      .get<BlockedDate[]>('/pday/blocked-dates', { params: { startDate, endDate } })
      .then((response) => response.data),
  createConfig: (data: CreatePdayConfigInput) =>
    api.post<PdayConfig>('/pday/config', data).then((response) => response.data),
  getExceptions: () =>
    api.get<PdayException[]>('/pday/exceptions').then((response) => response.data),
  createException: (data: CreatePdayExceptionInput) =>
    api
      .post<PdayException>('/pday/exceptions', data)
      .then((response) => response.data),
  deleteException: (id: string) =>
    api.delete(`/pday/exceptions/${id}`).then((response) => response.data),
}
