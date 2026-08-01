import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useFamilies } from '@/hooks/useFamilies'
import { useMissionaries } from '@/hooks/useMissionaries'
import {
  useCreateLunch,
  useLunch,
  useLunches,
  useRemoveLunch,
  useUpdateLunch,
} from '@/hooks/useLunches'
import { pdayApi } from '@/api/pday'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Trash2, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'

type Props = {
  open: boolean
  onClose: () => void
  initialDate: string | null
  lunchId: string | null
}

const SUGGEST_WINDOW_DAYS = 45
const NEXT_FREE_COUNT = 5

function initials(name: string) {
  return name
    .replace('Família', '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export function LunchFormModal({ open, onClose, initialDate, lunchId }: Props) {
  const { data: families = [], isLoading: familiesLoading } = useFamilies(true)
  const { data: missionaries = [], isLoading: missionariesLoading } = useMissionaries(true)
  const { data: existing, isLoading: lunchLoading } = useLunch(lunchId ?? '')

  const createLunch = useCreateLunch()
  const updateLunch = useUpdateLunch()
  const removeLunch = useRemoveLunch()

  const [date, setDate] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [missionaryIds, setMissionaryIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const isEdit = Boolean(lunchId)
  const saving = createLunch.isPending || updateLunch.isPending || removeLunch.isPending
  const loading = familiesLoading || missionariesLoading || (isEdit && lunchLoading)

  const from = dayjs().format('YYYY-MM-DD')
  const to = dayjs().add(SUGGEST_WINDOW_DAYS, 'day').format('YYYY-MM-DD')

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['pday', 'blocked', 'suggest', from, to],
    queryFn: () => pdayApi.getBlockedDates(from, to),
    enabled: open,
  })

  const { data: windowLunches = [] } = useLunches(from, to)

  const blockedSet = useMemo(() => new Set(blockedDates.map((b) => b.date)), [blockedDates])
  const occupiedSet = useMemo(
    () => new Set(windowLunches.map((l) => String(l.date).split('T')[0])),
    [windowLunches],
  )

  const nextFreeDates = useMemo(() => {
    const start = dayjs(initialDate ?? undefined).isBefore(dayjs(), 'day')
      ? dayjs()
      : dayjs(initialDate ?? undefined)
    const result: string[] = []
    for (let i = 0; i < SUGGEST_WINDOW_DAYS && result.length < NEXT_FREE_COUNT; i++) {
      const candidate = start.add(i, 'day')
      const key = candidate.format('YYYY-MM-DD')
      if (blockedSet.has(key) || occupiedSet.has(key)) continue
      if (candidate.isBefore(dayjs(), 'day')) continue
      result.push(key)
    }
    return result
  }, [initialDate, blockedSet, occupiedSet])

  const familyCounts = useMemo(() => {
    const monthStart = dayjs().startOf('month')
    const monthEnd = dayjs().endOf('month')
    const counts = new Map<string, number>()
    for (const l of windowLunches) {
      const d = dayjs(l.date)
      if (d.isBefore(monthStart) || d.isAfter(monthEnd)) continue
      counts.set(l.familyId, (counts.get(l.familyId) ?? 0) + 1)
    }
    return counts
  }, [windowLunches])

  // Famílias ordenadas das menos usadas no mês (rotação justa)
  const sortedFamilies = useMemo(() => {
    const active = families.filter((f) => f.active)
    return [...active].sort(
      (a, b) =>
        (familyCounts.get(a.id) ?? 0) - (familyCounts.get(b.id) ?? 0) ||
        a.name.localeCompare(b.name),
    )
  }, [families, familyCounts])

  const suggestedFamily = sortedFamilies[0] ?? null

  const lastPairIds = useMemo(() => {
    const latest = [...windowLunches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    if (!latest?.missionaryIds?.length) return []
    const activeIds = new Set(missionaries.map((m) => m.id))
    return latest.missionaryIds.filter((id) => activeIds.has(id))
  }, [windowLunches, missionaries])

  const suggestionsReady = !familiesLoading && !missionariesLoading && !isEdit

  const didInit = useRef(false)

  useEffect(() => {
    if (!open) {
      didInit.current = false
      return
    }

    if (isEdit) {
      if (existing) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com dados externos carregados
        setDate(existing.date.slice(0, 10))
        setFamilyId(existing.familyId)
        setMissionaryIds(existing.missionaryIds ?? [])
        setNotes(existing.notes ?? '')
        didInit.current = true
      }
      return
    }

    if (didInit.current || !suggestionsReady) return

    setDate(initialDate ?? nextFreeDates[0] ?? '')
    setFamilyId(suggestedFamily?.id ?? '')
    setMissionaryIds(lastPairIds)
    setNotes('')
    didInit.current = true
  }, [open, isEdit, existing, initialDate, suggestionsReady, nextFreeDates, suggestedFamily, lastPairIds])

  const toggleMissionary = (id: string) => {
    setMissionaryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!date || !familyId || missionaryIds.length === 0) return

    const payload = {
      date,
      familyId,
      missionaryIds,
      notes: notes.trim() || undefined,
    }

    if (isEdit && lunchId) {
      updateLunch.mutate({ id: lunchId, data: payload }, { onSuccess: () => onClose() })
    } else {
      createLunch.mutate(payload, { onSuccess: () => onClose() })
    }
  }

  const handleRemove = () => {
    if (!lunchId) return
    removeLunch.mutate(lunchId, { onSuccess: () => onClose() })
  }

  const selectedDateLabel = date ? dayjs(date).format('dddd, D [de] MMMM') : ''

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-brand-100 grid place-items-center shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <DialogTitle className="text-[0.9375rem] font-semibold">
                {isEdit ? 'Editar almoço' : 'Agendar almoço'}
              </DialogTitle>
              <p className="text-xs text-text-400 mt-0.5">
                {isEdit
                  ? selectedDateLabel
                  : `Sugestão: ${nextFreeDates[0] ? dayjs(nextFreeDates[0]).format('dddd') : '—'} livre`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 mt-4">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-text-900">Data</Label>
            {!isEdit && nextFreeDates.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {nextFreeDates.map((d) => {
                  const selected = date === d
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDate(d)}
                      className={cn(
                        'flex flex-col items-center gap-0.5 border rounded-[8px] px-3 py-2 cursor-pointer transition-all duration-150',
                        selected
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-border bg-surface hover:border-brand-300',
                      )}
                    >
                      <span className={cn('text-[11px] font-semibold uppercase', selected ? 'text-brand-600' : 'text-text-400')}>
                        {dayjs(d).format('ddd')}
                      </span>
                      <span className={cn('text-[0.9375rem] font-bold', selected ? 'text-brand-600' : 'text-text-900')}>
                        {dayjs(d).format('D')}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={loading || saving}
              />
            )}
            <p className="text-xs text-text-400">
              P-Days e datas já ocupadas foram pulados automaticamente.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-text-900">Família responsável</Label>
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {sortedFamilies.map((f) => {
                const count = familyCounts.get(f.id) ?? 0
                const selected = familyId === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFamilyId(f.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] border cursor-pointer transition-all duration-150 text-left',
                      selected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-border bg-surface hover:border-brand-300',
                    )}
                  >
                    <div className="w-[34px] h-[34px] rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-semibold shrink-0">
                      {initials(f.name)}
                    </div>
                    <span className="flex-1 text-sm font-medium text-text-900">{f.name}</span>
                    <Badge variant={count === 0 ? 'success' : 'warning'}>{count}x este mês</Badge>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-text-400">
              Ordenadas das menos usadas — a rotação acontece sozinha.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-text-900">Missionários presentes</Label>
            <div className="flex flex-wrap gap-1.5">
              {missionaries.map((m) => {
                const selected = missionaryIds.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMissionary(m.id)}
                    disabled={loading || saving}
                    className={cn(
                      'h-[34px] inline-flex items-center gap-1 rounded-full border px-3 text-xs font-medium cursor-pointer transition-all duration-150',
                      selected
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-surface border-border-strong text-text-500 hover:border-brand-300 hover:text-brand-700',
                    )}
                  >
                    {m.name}
                  </button>
                )
              })}
            </div>
            {missionaryIds.length === 0 && (
              <p className="text-xs text-danger-600">Selecione pelo menos um missionário.</p>
            )}
            {!isEdit && lastPairIds.length > 0 && (
              <button
                type="button"
                onClick={() => setMissionaryIds(lastPairIds)}
                className="text-xs text-text-500 underline underline-offset-3 hover:text-brand-600 self-start cursor-pointer"
              >
                ↻ Usar mesmo par da última vez
              </button>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="lunch-notes" className="text-xs font-semibold text-text-900">
              Observações <span className="font-normal text-text-400">(opcional)</span>
            </Label>
            <Textarea
              id="lunch-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Preferências alimentares, restrições…"
              disabled={loading || saving}
            />
          </div>

          <DialogFooter className="-mx-6 -mb-6 flex items-center justify-between gap-2 px-6 pt-4">
            <div>
              {isEdit && (
                <Button type="button" variant="destructive" size="sm" onClick={handleRemove} disabled={saving}>
                  {removeLunch.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-1.5" />
                  )}
                  Remover
                </Button>
              )}
            </div>
            <div className="flex gap-2.5">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || saving || !familyId || missionaryIds.length === 0}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando…
                  </>
                ) : (
                  isEdit ? 'Salvar' : 'Agendar'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
