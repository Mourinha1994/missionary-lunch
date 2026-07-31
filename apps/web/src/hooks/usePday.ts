// src/hooks/usePday.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pdayApi } from '@/api/pday'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import axios from 'axios'

export function usePdayCurrent() {
  return useQuery({ queryKey: ['pday', 'current'], queryFn: pdayApi.getCurrent })
}

export function useBlockedDates(year: number, month: number) {
  const startDate = dayjs().year(year).month(month).startOf('month').format('YYYY-MM-DD')
  const endDate = dayjs().year(year).month(month).endOf('month').format('YYYY-MM-DD')
  return useQuery({
    queryKey: ['pday', 'blocked', year, month],
    queryFn: () => pdayApi.getBlockedDates(startDate, endDate),
  })
}

export function useCreatePdayException() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: pdayApi.createException,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pday'] })
      toast.success('Exceção de P-Day salva!')
    },
    onError: (err) => {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Erro ao salvar exceção' : 'Erro ao salvar exceção')
    },
  })
}