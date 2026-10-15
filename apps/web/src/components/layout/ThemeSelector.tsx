import { Laptop, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const themes = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'system', label: 'Sistema', icon: Laptop },
  { value: 'dark', label: 'Escuro', icon: Moon },
] as const

type ThemeSelectorProps = {
  inverted?: boolean
  className?: string
}

export function ThemeSelector({ inverted = false, className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      className={cn(
        'inline-flex items-center gap-1 rounded-[10px] p-1',
        inverted ? 'bg-white/[0.08]' : 'bg-surface-2',
        className,
      )}
    >
      {themes.map(({ value, label, icon: Icon }) => {
        const selected = theme === value

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`Usar tema ${label.toLowerCase()}`}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'grid size-10 place-items-center rounded-[8px] transition-colors',
              inverted
                ? selected
                  ? 'bg-white/[0.18] text-white'
                  : 'text-white/60 hover:bg-white/[0.1] hover:text-white'
                : selected
                  ? 'bg-surface text-brand-700 shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                  : 'text-text-500 hover:bg-surface-3 hover:text-text-900',
            )}
          >
            <Icon className="size-4" />
          </button>
        )
      })}
    </div>
  )
}
