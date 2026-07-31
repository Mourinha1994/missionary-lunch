import { useState } from 'react'
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { lunchesApi } from '@/api/lunches'
import { familiesApi } from '@/api/families'
import { missionariesApi } from '@/api/missionaries'
import type { Lunch } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import axios from 'axios'
import {
    Plus, Search, Pencil, Trash2, Loader2,
    UtensilsCrossed, Calendar, Users, ChevronLeft, ChevronRight,
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const schema = z.object({
    date: z.string().min(1, 'Data obrigatória'),
    familyId: z.string().min(1, 'Selecione uma família'),
    missionaryIds: z.array(z.string()).min(1, 'Selecione ao menos um missionário'),
    notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const GENDER_COLOR: Record<string, string> = {
    MALE: 'bg-blue-100 text-blue-700',
    FEMALE: 'bg-pink-100 text-pink-700',
}

function LunchFormModal({
    open,
    onClose,
    lunch,
    defaultDate,
}: {
    open: boolean
    onClose: () => void
    lunch?: Lunch | null
    defaultDate?: string
}) {
    const qc = useQueryClient()
    const isEditing = !!lunch

    const { data: families = [] } = useQuery({ queryKey: ['families'], queryFn: () => familiesApi.getAll(), enabled: open })
    const { data: missionaries = [] } = useQuery({ queryKey: ['missionaries'], queryFn: () => missionariesApi.getAll(), enabled: open })

    const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { missionaryIds: [] },
    })

    useEffect(() => {
        if (open) {
            reset(lunch
                ? { date: lunch.date.split('T')[0], familyId: lunch.familyId, missionaryIds: lunch.missionaryIds, notes: lunch.notes ?? '' }
                : { date: defaultDate ?? '', familyId: '', missionaryIds: [], notes: '' }
            )
        }
    }, [open, lunch, defaultDate, reset])

    const save = useMutation({
        mutationFn: (data: FormData) =>
            isEditing ? lunchesApi.update(lunch.id, data) : lunchesApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['lunches'] })
            toast.success(isEditing ? 'Almoço atualizado!' : 'Almoço agendado!')
            onClose(); reset()
        },
        onError: (err) =>
            toast.error(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Erro' : 'Erro'),
    })

    const remove = useMutation({
        mutationFn: () => lunchesApi.remove(lunch!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['lunches'] })
            toast.success('Almoço removido.')
            onClose()
        },
    })

    const selectedIds = watch('missionaryIds') ?? []
    const toggleMissionary = (id: string) =>
        setValue('missionaryIds', selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id])

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                        </div>
                        {isEditing ? 'Editar almoço' : 'Agendar almoço'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Data</Label>
                            <Input type="date" {...register('date')} />
                            {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Família responsável</Label>
                            <Controller name="familyId" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {families.map(f => (
                                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )} />
                            {errors.familyId && <p className="text-xs text-red-500">{errors.familyId.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Missionários presentes</Label>
                        <div className="flex flex-wrap gap-2">
                            {missionaries.map(m => (
                                <button key={m.id} type="button" onClick={() => toggleMissionary(m.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedIds.includes(m.id)
                                            ? m.gender === 'MALE'
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-pink-500 text-white border-pink-500'
                                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                        }`}>
                                    {m.name}
                                </button>
                            ))}
                        </div>
                        {errors.missionaryIds && <p className="text-xs text-red-500">{errors.missionaryIds.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Observações <span className="text-slate-400 font-normal">(opcional)</span></Label>
                        <Textarea placeholder="Preferências alimentares, restrições, observações..." rows={2} {...register('notes')} />
                    </div>

                    <DialogFooter className="pt-2 gap-2">
                        {isEditing && (
                            <Button type="button" variant="destructive" size="sm" onClick={() => remove.mutate()}>
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remover
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" disabled={save.isPending}>
                                {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {isEditing ? 'Salvar' : 'Agendar'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function LunchRow({ lunch, onEdit }: { lunch: Lunch; onEdit: (l: Lunch) => void }) {
    const isToday = dayjs(lunch.date).isSame(dayjs(), 'day')
    const isPast = dayjs(lunch.date).isBefore(dayjs(), 'day')

    return (
        <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors group ${isPast ? 'opacity-60' : ''}`}>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    {isToday && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                    <div>
                        <p className={`text-sm font-semibold ${isToday ? 'text-green-700' : 'text-slate-900'}`}>
                            {dayjs(lunch.date).format('DD/MM/YYYY')}
                        </p>
                        <p className="text-xs text-slate-400 capitalize">
                            {dayjs(lunch.date).format('dddd')}
                            {isToday && ' · Hoje'}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center
                          text-xs font-bold text-emerald-700">
                        {lunch.family.name[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-900">{lunch.family.name}</p>
                        <p className="text-xs text-slate-400">{lunch.family.contact}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                    {lunch.missionaries.map(m => (
                        <span key={m.id}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${GENDER_COLOR[m.gender]}`}>
                            {m.name.split(' ')[0]}
                        </span>
                    ))}
                </div>
            </td>
            <td className="px-4 py-3 text-xs text-slate-500 max-w-xs">
                <span className="truncate block">{lunch.notes || '—'}</span>
            </td>
            <td className="px-4 py-3">
                <button onClick={() => onEdit(lunch)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50
                     transition-colors opacity-0 group-hover:opacity-100">
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            </td>
        </tr>
    )
}

export function LunchesPage() {
    const [currentMonth, setCurrentMonth] = useState(dayjs())
    const [search, setSearch] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<Lunch | null>(null)

    const startDate = currentMonth.startOf('month').format('YYYY-MM-DD')
    const endDate = currentMonth.endOf('month').format('YYYY-MM-DD')

    const { data: lunches = [], isLoading } = useQuery({
        queryKey: ['lunches', startDate, endDate],
        queryFn: () => lunchesApi.getAll(startDate, endDate),
    })

    const filtered = lunches.filter(l =>
        l.family.name.toLowerCase().includes(search.toLowerCase()) ||
        l.missionaries.some(m => m.name.toLowerCase().includes(search.toLowerCase()))
    )

    const upcoming = filtered.filter(l => !dayjs(l.date).isBefore(dayjs(), 'day'))
    const past = filtered.filter(l => dayjs(l.date).isBefore(dayjs(), 'day'))

    const handleEdit = (l: Lunch) => { setSelected(l); setModalOpen(true) }
    const handleClose = () => { setModalOpen(false); setSelected(null) }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Almoços</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {lunches.length} almoço{lunches.length !== 1 ? 's' : ''} em {currentMonth.format('MMMM [de] YYYY')}
                        </p>
                    </div>
                    <Button onClick={() => { setSelected(null); setModalOpen(true) }} size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Agendar almoço
                    </Button>
                </div>

                <div className="flex items-center gap-3 mt-4">
                    {/* Navegação de mês */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}
                            className="p-1.5 rounded-md hover:bg-white transition-colors text-slate-600">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-slate-700 px-2 capitalize min-w-[120px] text-center">
                            {currentMonth.format('MMMM YYYY')}
                        </span>
                        <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))}
                            className="p-1.5 rounded-md hover:bg-white transition-colors text-slate-600">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar família ou missionário..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-6 pt-5 pb-0 grid grid-cols-3 gap-4 shrink-0">
                {[
                    { label: 'Total no mês', value: lunches.length, icon: UtensilsCrossed, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Próximos', value: upcoming.length, icon: Calendar, color: 'bg-green-50 text-green-600' },
                    { label: 'Realizados', value: past.length, icon: Users, color: 'bg-slate-100 text-slate-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                            <s.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">{s.value}</p>
                            <p className="text-xs text-slate-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabela */}
            <div className="flex-1 overflow-auto px-6 py-5">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                            <UtensilsCrossed className="w-10 h-10 text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">Nenhum almoço encontrado</p>
                            <p className="text-slate-400 text-sm mt-1">
                                {search ? 'Tente outro termo' : 'Clique em "Agendar almoço" para começar'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Data</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Família</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Missionários</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Observações</th>
                                    <th className="px-4 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody>
                                {/* Próximos */}
                                {upcoming.length > 0 && (
                                    <>
                                        <tr className="bg-green-50/50">
                                            <td colSpan={5} className="px-4 py-2">
                                                <span className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                                    Próximos almoços ({upcoming.length})
                                                </span>
                                            </td>
                                        </tr>
                                        {upcoming.map(l => <LunchRow key={l.id} lunch={l} onEdit={handleEdit} />)}
                                    </>
                                )}
                                {/* Realizados */}
                                {past.length > 0 && (
                                    <>
                                        <tr className="bg-slate-50">
                                            <td colSpan={5} className="px-4 py-2">
                                                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                                                    Realizados ({past.length})
                                                </span>
                                            </td>
                                        </tr>
                                        {past.map(l => <LunchRow key={l.id} lunch={l} onEdit={handleEdit} />)}
                                    </>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <LunchFormModal open={modalOpen} onClose={handleClose} lunch={selected} />
        </div>
    )
}