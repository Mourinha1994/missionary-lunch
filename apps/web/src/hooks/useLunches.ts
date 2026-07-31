import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lunchesApi } from '@/api/lunches'
import { toast } from 'sonner'
import axios from 'axios'

function getErrorMessage(err: unknown, fallback: string) {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback
}

export const LUNCHES_KEY = ['lunches']

type UpdateLunchPayload = Parameters<typeof lunchesApi.update>[1]

export function useLunches(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...LUNCHES_KEY, { startDate, endDate }],
    queryFn: () => lunchesApi.getAll(startDate, endDate),
  })
}

export function useLunch(id: string) {
  return useQuery({
    queryKey: [...LUNCHES_KEY, 'detail', id],
    queryFn: () => lunchesApi.getOne(id),
    enabled: Boolean(id),
  })
}

export function useCreateLunch() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: lunchesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LUNCHES_KEY })
      toast.success('Almoço cadastrado com sucesso!')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao cadastrar'))
    },
  })
}

export function useUpdateLunch() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLunchPayload }) =>
      lunchesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LUNCHES_KEY })
      toast.success('Almoço atualizado')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao atualizar'))
    },
  })
}

export function useRemoveLunch() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: lunchesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LUNCHES_KEY })
      toast.success('Almoço removido.')
    },
  })
}
