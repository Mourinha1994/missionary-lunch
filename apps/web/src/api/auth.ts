import axios from 'axios'
import { api } from './client'
import type { User } from '@/types'

export type LoginCredentials = {
  email: string
  password: string
}

type LoginResponseRaw = {
  user?: User
  token?: string
  access_token?: string
  accessToken?: string
}

function extractMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const o = data as Record<string, unknown>
  const msg = o.message ?? o.error
  if (typeof msg === 'string') return msg
  if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0]
  return undefined
}

export function getLoginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const msg = extractMessage(error.response?.data)
    if (msg) return msg
    if (status === 401) return 'E-mail ou senha incorretos.'
    if (status === 404) return 'Serviço de login não encontrado. Verifique a URL da API.'
    if (status === 422) return 'Dados inválidos.'
    if (status && status >= 500) return 'Erro no servidor. Tente novamente em instantes.'
    if (error.code === 'ERR_NETWORK') return 'Não foi possível conectar. Verifique sua rede e a API.'
  }
  if (error instanceof Error) return error.message
  return 'Não foi possível entrar. Tente novamente.'
}

/**
 * POST `/auth/login` — espera JSON com usuário e token JWT.
 * Formatos aceitos: `{ user, token }`, `{ user, access_token }` ou `{ user, accessToken }`.
 */
export async function login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
  const { data } = await api.post<LoginResponseRaw>('/auth/login', credentials)
  const token =
    (typeof data.token === 'string' && data.token) ||
    (typeof data.access_token === 'string' && data.access_token) ||
    (typeof data.accessToken === 'string' && data.accessToken)

  if (!token) {
    throw new Error('Resposta da API sem token. Ajuste normalizeLoginResponse em src/api/auth.ts.')
  }
  if (!data.user || typeof data.user !== 'object') {
    throw new Error('Resposta da API sem usuário.')
  }

  return { user: data.user, token }
}
