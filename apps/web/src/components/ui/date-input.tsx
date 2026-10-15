import * as React from 'react'
import { CalendarDays } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type DateInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'onChange'
> & {
  value?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-')
  return year && month && day ? `${day}-${month}-${year}` : ''
}

function parseDate(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value)

  if (!match) return null

  const [, day, month, year] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null
  }

  return `${year}-${month}-${day}`
}

export function DateInput({
  className,
  disabled,
  name,
  onBlur,
  onChange,
  value = '',
  ...props
}: DateInputProps) {
  const [displayValue, setDisplayValue] = React.useState(() => formatDate(value))
  const [invalid, setInvalid] = React.useState(false)

  React.useEffect(() => {
    setDisplayValue(formatDate(value))
    setInvalid(false)
  }, [value])

  const notifyChange = (nextValue: string) => {
    onChange?.({
      target: { name, value: nextValue },
      currentTarget: { name, value: nextValue },
    } as React.ChangeEvent<HTMLInputElement>)
  }

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDisplayValue = event.target.value
    const parsedValue = parseDate(nextDisplayValue)

    setDisplayValue(nextDisplayValue)
    setInvalid(Boolean(nextDisplayValue) && !parsedValue)
    notifyChange(parsedValue ?? '')
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const parsedValue = parseDate(displayValue)

    if (parsedValue) {
      setDisplayValue(formatDate(parsedValue))
      setInvalid(false)
    }

    onBlur?.(event)
  }

  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        name={name}
        value={displayValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="dd-MM-yyyy"
        inputMode="numeric"
        aria-invalid={invalid || props['aria-invalid']}
        className={cn('pr-10', className)}
      />
      <input
        type="date"
        value={value}
        min={props.min}
        max={props.max}
        disabled={disabled}
        onChange={(event) => {
          setDisplayValue(formatDate(event.target.value))
          setInvalid(false)
          notifyChange(event.target.value)
        }}
        aria-label="Abrir calendário"
        className="absolute inset-y-0 right-0 w-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-400" />
    </div>
  )
}
