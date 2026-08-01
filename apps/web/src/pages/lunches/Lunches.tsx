import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { lunchesApi } from '@/api/lunches'
import type { Lunch } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LunchFormModal } from '@/components/calendar/LunchFormModal.tsx'
import {
    Plus, Search, Pencil, Loader2,
    UtensilsCrossed, Calendar, Users, ChevronLeft, ChevronRight,
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

function LunchRow({ lunch, onEdit }: { lunch: Lunch; onEdit: (l: Lunch) => void }) {
    const isToday = dayjs(lunch.date).isSame(dayjs(), 'day')
    const isPast = dayjs(lunch.date).isBefore(dayjs(), 'day')

    return (
        <tr className={`border-b border-border hover:bg-canvas transition-colors ${isPast ? 'opacity-60' : ''}`}>
            <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                    {isToday && <span className="w-2 h-2 rounded-full bg-success-500 shrink-0" />}
                    <div>
                        <p className={`text-sm font-semibold ${isToday ? 'text-success-700' : 'text-text-900'}`}>
                            {dayjs(lunch.date).format('DD/MM/YYYY')}
                        </p>
                        <p className="text-xs text-text-400 capitalize">
                            {dayjs(lunch.date).format('dddd')}
                            {isToday && ' · Hoje'}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-100 grid place-items-center
                          text-xs font-bold text-brand-700 shrink-0">
                        {lunch.family.name[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-900">{lunch.family.name}</p>
                        <p className="text-xs text-text-400">{lunch.family.contact}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1">
                    {lunch.missionaries.map(m => (
                        <Badge key={m.id} variant={m.gender === 'FEMALE' ? 'female' : 'male'}>
                            {m.name.split(' ')[0]}
                        </Badge>
                    ))}
                </div>
            </td>
            <td className="px-4 py-4 text-xs text-text-500 max-w-xs">
                <span className="truncate block">{lunch.notes || '—'}</span>
            </td>
            <td className="px-4 py-4 text-right">
                <button onClick={() => onEdit(lunch)}
                    className="p-2 rounded-[8px] text-text-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                    <Pencil className="w-4 h-4" />
                </button>
            </td>
        </tr>
    )
}

export function LunchesPage() {
    const [currentMonth, setCurrentMonth] = useState(dayjs())
    const [search, setSearch] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedLunchId, setSelectedLunchId] = useState<string | null>(null)

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

    const handleEdit = (l: Lunch) => { setSelectedLunchId(l.id); setModalOpen(true) }
    const handleNew = () => { setSelectedLunchId(null); setModalOpen(true) }
    const handleClose = () => { setModalOpen(false); setSelectedLunchId(null) }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between gap-4 shrink-0 flex-wrap">
                <div>
                    <h1 className="text-[1.375rem] font-bold text-text-900">Almoços</h1>
                    <p className="text-sm text-text-500 mt-0.5">
                        {lunches.length} almoço{lunches.length !== 1 ? 's' : ''} em {currentMonth.format('MMMM [de] YYYY')}
                    </p>
                </div>
                <Button onClick={handleNew} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Agendar almoço
                </Button>
            </div>

            {/* Filtros */}
            <div className="bg-surface px-6 py-3 border-b border-border flex items-center gap-3 shrink-0 flex-wrap">
                {/* Navegação de mês */}
                <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1">
                    <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}
                        className="p-1.5 rounded-md hover:bg-surface transition-colors text-text-600 cursor-pointer">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-text-700 px-2 capitalize min-w-[120px] text-center">
                        {currentMonth.format('MMMM YYYY')}
                    </span>
                    <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))}
                        className="p-1.5 rounded-md hover:bg-surface transition-colors text-text-600 cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-400" />
                    <Input
                        placeholder="Buscar família ou missionário..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="px-6 pt-5 grid grid-cols-3 gap-4 shrink-0">
                {[
                    { label: 'Total no mês', value: lunches.length, icon: UtensilsCrossed, iconBg: 'bg-brand-100 text-brand-600' },
                    { label: 'Próximos', value: upcoming.length, icon: Calendar, iconBg: 'bg-success-100 text-success-600' },
                    { label: 'Realizados', value: past.length, icon: Users, iconBg: 'bg-info-100 text-info-700' },
                ].map(s => (
                    <div key={s.label} className="bg-surface border border-border rounded-[16px] p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg grid place-items-center ${s.iconBg}`}>
                            <s.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-text-900">{s.value}</p>
                            <p className="text-xs text-text-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabela */}
            <div className="flex-1 overflow-auto px-6 py-5">
                <div className="bg-surface rounded-[16px] border border-border overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-text-400" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                            <UtensilsCrossed className="w-10 h-10 text-text-400 mb-3" />
                            <p className="text-text-700 font-medium">Nenhum almoço encontrado</p>
                            <p className="text-text-400 text-sm mt-1">
                                {search ? 'Tente outro termo' : 'Clique em "Agendar almoço" para começar'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border bg-surface-2">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-500 uppercase tracking-wider w-36">Data</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-500 uppercase tracking-wider">Família</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-500 uppercase tracking-wider">Missionários</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-500 uppercase tracking-wider">Observações</th>
                                    <th className="px-4 py-3 w-10" />
                                </tr>
                            </thead>
                            <tbody>
                                {/* Próximos */}
                                {upcoming.length > 0 && (
                                    <>
                                        <tr className="bg-success-50/50">
                                            <td colSpan={5} className="px-4 py-2">
                                                <span className="text-xs font-semibold text-success-700 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-success-500 inline-block" />
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
                                        <tr className="bg-surface-2">
                                            <td colSpan={5} className="px-4 py-2">
                                                <span className="text-xs font-semibold text-text-500 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-text-400 inline-block" />
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

            <LunchFormModal
                open={modalOpen}
                onClose={handleClose}
                initialDate={null}
                lunchId={selectedLunchId}
            />
        </div>
    )
}
