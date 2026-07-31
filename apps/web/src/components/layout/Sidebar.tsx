// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { Calendar, Users, Home, Clock, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Calendar, label: 'Calendário' },
  { to: '/missionaries', icon: Users, label: 'Missionários' },
  { to: '/families', icon: Home, label: 'Famílias' },
  { to: '/lunches', icon: Clock, label: 'Almoços' },
]

const configItems = [
  { to: '/pday', icon: Settings, label: 'P-Day' },
]

export function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="flex flex-col h-full" style={{ background: 'var(--sidebar-bg)' }}>
      <div className="p-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100 leading-tight">Almoço dos</p>
            <p className="text-sm font-semibold text-slate-100 leading-tight">Missionários</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <p className="px-3 py-2 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
          Principal
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-900/50 text-blue-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        <p className="px-3 py-2 mt-4 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
          Configurações
        </p>
        {configItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-900/50 text-blue-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-semibold text-blue-300">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500">Coordenadora</p>
          </div>
          <button onClick={logout} className="text-slate-500 hover:text-slate-300 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}