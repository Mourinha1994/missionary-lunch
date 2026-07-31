import { useEffect, useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFamilies } from '@/hooks/useFamilies'
import { useMissionaries } from '@/hooks/useMissionaries'
import { useCreateLunch, useLunch, useUpdateLunch } from '@/hooks/useLunches'

type Props = {
  open: boolean
  onClose: () => void
  initialDate: string | null
  lunchId: string | null
}

export function LunchFormModal({ open, onClose, initialDate, lunchId }: Props) {
  const { data: families = [], isLoading: familiesLoading } = useFamilies(true)
  const { data: missionaries = [], isLoading: missionariesLoading } = useMissionaries(true)
  const { data: existing, isLoading: lunchLoading } = useLunch(lunchId ?? '')

  const createLunch = useCreateLunch()
  const updateLunch = useUpdateLunch()

  const [date, setDate] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [missionaryIds, setMissionaryIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const isEdit = Boolean(lunchId)
  const saving = createLunch.isPending || updateLunch.isPending
  const loading = familiesLoading || missionariesLoading || (isEdit && lunchLoading)

  // Sincroniza o formulário com os dados externos (almoço carregado / data clicada).
  useEffect(() => {
    if (!open) return

    if (isEdit && existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com dados externos carregados
      setDate(existing.date.slice(0, 10))
      setFamilyId(existing.familyId)
      setMissionaryIds(existing.missionaryIds ?? [])
      setNotes(existing.notes ?? '')
      return
    }

    if (!isEdit) {
      setDate(initialDate ?? '')
      setFamilyId('')
      setMissionaryIds([])
      setNotes('')
    }
  }, [open, isEdit, existing, initialDate])

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
      updateLunch.mutate(
        { id: lunchId, data: payload },
        { onSuccess: () => onClose() },
      )
    } else {
      createLunch.mutate(payload, { onSuccess: () => onClose() })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar almoço' : 'Novo almoço'}</DialogTitle>
          <DialogDescription>
            Defina data, família anfitriã e missionários convidados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lunch-date">Data</Label>
            <Input
              id="lunch-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={loading || saving}
            />
          </div>

          <div className="grid gap-2">
            <Label>Família</Label>
            <Select
              value={familyId}
              onValueChange={setFamilyId}
              disabled={loading || saving || families.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma família" />
              </SelectTrigger>
              <SelectContent>
                {families.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Missionários</Label>
            <div className="max-h-36 overflow-y-auto rounded-md border border-input p-2 space-y-2">
              {missionaries.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={missionaryIds.includes(m.id)}
                    onChange={() => toggleMissionary(m.id)}
                    disabled={loading || saving}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
            {missionaryIds.length === 0 && (
              <p className="text-xs text-slate-500">
                Selecione pelo menos um missionário.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lunch-notes">Observações</Label>
            <Textarea
              id="lunch-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={loading || saving}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || saving || !familyId || missionaryIds.length === 0}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
