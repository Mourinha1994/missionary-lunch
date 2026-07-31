import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Role } from '@/types'

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const user = useAuthStore(s => s.user)

  if (user?.role !== role) return <Navigate to="/" replace />

  return <>{children}</>
}
