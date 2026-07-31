import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import type { CreateUserInput, UpdateUserInput } from '@/api/users'
import { toast } from 'sonner'
import axios from 'axios'

function getErrorMessage(err: unknown, fallback: string) {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback
}

export const USERS_KEY = ['users']

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: usersApi.getAll,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserInput) => usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY })
      toast.success('Usuário cadastrado com sucesso!')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao cadastrar usuário'))
    },
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY })
      toast.success('Usuário atualizado')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao atualizar usuário'))
    },
  })
}

export function useRemoveUser() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY })
      toast.success('Usuário desativado.')
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Erro ao desativar usuário'))
    },
  })
}
