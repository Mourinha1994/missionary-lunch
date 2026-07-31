import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { missionariesApi } from "@/api/missionaries";
import { toast } from "sonner";
import axios from "axios";

function getErrorMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;
}

export const MISSIONARIES_KEY = ['missionaries']

export function useMissionaries(onlyActive = true) {
    return useQuery({
        queryKey: [...MISSIONARIES_KEY, onlyActive],
        queryFn: () => missionariesApi.getAll(onlyActive)
    })
}

export function useCreateMissionary() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: missionariesApi.create,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: MISSIONARIES_KEY })
            toast.success('Missionário cadastrado com sucesso!')
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Erro ao cadastrar'))
        }
    })
}

export function useUpdateMissionary() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof missionariesApi.update>[1] }) => missionariesApi.update(id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: MISSIONARIES_KEY })
            toast.success('Missionário atualizado')
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Erro ao atualizar'))
        }
    })
}

export function useRemoveMissionary() {
    const qc = useQueryClient()

    return useMutation({
        mutationFn: missionariesApi.remove,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: MISSIONARIES_KEY })
            toast.success('Missionário removido.')
        }
    })
}