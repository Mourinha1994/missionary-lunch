// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import {
  Calendar, Users, Home, Clock, Settings, ShieldCheck, LogOut, HelpCircle, UtensilsCrossed,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { startTutorial } from '@/lib/onboarding'
import type { Role } from '@/types'

const navItems = [
  { to: '/', icon: Calendar, label: 'Calendário', tour: 'nav-calendar' },
  { to: '/missionaries', icon: Users, label: 'Missionários', tour: 'nav-missionaries' },
  { to: '/families', icon: Home, label: 'Famílias', tour: 'nav-families' },
  { to: '/lunches', icon: Clock, label: 'Almoços', tour: 'nav-lunches' },
]

const configItems = [
  { to: '/pday', icon: Settings, label: 'P-Day', tour: 'nav-pday' },
]

const adminItems = [
  { to: '/users', icon: ShieldCheck, label: 'Usuários', tour: 'nav-users' },
]

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordenador',
}

function NavLinkItem({ to, icon: Icon, label, tour, end }: {
  to: string; icon: typeof Calendar; label: string; tour?: string; end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      data-tour={tour}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-brand-600 text-white font-semibold'
            : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
        )
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="flex flex-col h-full bg-brand-900 text-white">
      <div className="flex items-center gap-2.5 px-3 pt-4 pb-4 border-b border-white/10 mb-3.5">
        <div className="w-8 h-8 rounded-[10px] bg-brand-500 flex items-center justify-center shrink-0">
          <UtensilsCrossed className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Almoço dos</p>
          <p className="text-sm font-semibold">Missionários</p>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto">
        <p className="px-2.5 pt-2 pb-1.5 text-[10px] font-semibold text-white/35 uppercase tracking-[0.08em]">
          Principal
        </p>
        {navItems.map(({ to, icon, label, tour }) => (
          <NavLinkItem key={to} to={to} icon={icon} label={label} tour={tour} end={to === '/'} />
        ))}

        <p className="px-2.5 pt-4 pb-1.5 text-[10px] font-semibold text-white/35 uppercase tracking-[0.08em]">
          Configurações
        </p>
        {configItems.map(({ to, icon, label, tour }) => (
          <NavLinkItem key={to} to={to} icon={icon} label={label} tour={tour} />
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <p className="px-2.5 pt-4 pb-1.5 text-[10px] font-semibold text-white/35 uppercase tracking-[0.08em]">
              Administração
            </p>
            {adminItems.map(({ to, icon, label, tour }) => (
              <NavLinkItem key={to} to={to} icon={icon} label={label} tour={tour} />
            ))}
          </>
        )}
      </nav>

      <div className="px-3 pt-3 pb-4 border-t border-white/10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">{user?.name}</p>
          <p className="text-[10px] text-white/50">{user ? ROLE_LABEL[user.role] : ''}</p>
        </div>
        <button
          onClick={() => startTutorial(user?.role ?? 'COORDINATOR')}
          title="Refazer tutorial"
          aria-label="Refazer tutorial"
          className="w-9 h-9 rounded-[8px] grid place-items-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        <button
          onClick={logout}
          title="Sair"
          aria-label="Sair"
          className="w-9 h-9 rounded-[8px] grid place-items-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
