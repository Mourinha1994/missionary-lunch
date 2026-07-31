import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { familiesApi } from '@/api/families'
import type { Family } from '@/types'
import { toast } from 'sonner'
import axios from 'axios'

function getErrorMessage(err: unknown, fallback: string) {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback
}

export const FAMILIES_KEY = ['families']

export function useFamilies(onlyActive = true) {
  return useQuery({
    queryKey: [...FAMILIES_KEY, onlyActive],
    queryFn: () => familiesApi.getAll(onlyActive),
  })
}

export function useFamily(id: string) {
  return useQuery({
    queryKey: [...FAMILIES_KEY, 'detail', id],
    queryFn: () => familiesApi.getOne(id),
    enabled: Boolean(id),
  })
}

export function useCreateFamily() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: familiesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAMILIES_KEY })
      toast.success('Família cadastrada com sucesso!')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao cadastrar'))
    },
  })
}

export function useUpdateFamily() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Family> }) =>
      familiesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAMILIES_KEY })
      toast.success('Família atualizada')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao atualizar'))
    },
  })
}

export function useRemoveFamily() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: familiesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAMILIES_KEY })
      toast.success('Família removida.')
    },
  })
}
