import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Calendar, Users, Home, Clock, Settings, ShieldCheck, HelpCircle, LogOut, MoreHorizontal,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { startTutorial } from '@/lib/onboarding'

const mainItems = [
  { to: '/', icon: Calendar, label: 'Calendário', end: true },
  { to: '/lunches', icon: Clock, label: 'Almoços' },
  { to: '/missionaries', icon: Users, label: 'Missões' },
  { to: '/families', icon: Home, label: 'Famílias' },
]

export function BottomNav() {
  const { user, logout } = useAuthStore()
  const [moreOpen, setMoreOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex flex-1 flex-col items-center justify-center gap-0.5 h-14 text-[10px] font-medium transition-colors',
      isActive ? 'text-brand-600' : 'text-text-400',
    )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      {moreOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-black/20"
            aria-label="Fechar menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute inset-x-2 z-50 rounded-[16px] border border-border bg-surface p-2 shadow-[0_14px_34px_-10px_rgba(15,23,42,0.18)] max-h-[min(60vh,340px)] overflow-y-auto"
            style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            <NavLink
              to="/pday"
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-medium',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-text-700 hover:bg-surface-2',
                )
              }
            >
              <Settings className="w-4 h-4" /> P-Day e exceções
            </NavLink>
            {user?.role === 'ADMIN' && (
              <NavLink
                to="/users"
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-medium',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-text-700 hover:bg-surface-2',
                  )
                }
              >
                <ShieldCheck className="w-4 h-4" /> Usuários
              </NavLink>
            )}
            <button
              onClick={() => { setMoreOpen(false); startTutorial(user?.role ?? 'COORDINATOR') }}
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-medium text-text-700 hover:bg-surface-2"
            >
              <HelpCircle className="w-4 h-4" /> Refazer tutorial
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-medium text-danger-600 hover:bg-danger-50"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </>
      )}

      <div
        className="flex border-t border-border bg-surface"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {mainItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(v => !v)}
          className={cn(linkClass({ isActive: false }), 'cursor-pointer', moreOpen && 'text-brand-600')}
          aria-label="Mais opções"
        >
          <MoreHorizontal className="w-5 h-5" />
          Mais
        </button>
      </div>
    </nav>
  )
}
