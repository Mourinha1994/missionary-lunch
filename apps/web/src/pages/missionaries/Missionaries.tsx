import { useState } from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { missionariesApi } from '@/api/missionaries'
import type { Missionary } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'
import axios from 'axios'
import {
    Plus, Search, Pencil, Trash2, Loader2,
    User, Phone, MapPin, Calendar, Users,
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const schema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    gender: z.enum(['MALE', 'FEMALE']),
    area: z.string().min(2, 'Área obrigatória'),
    startDate: z.string().min(1, 'Data de início obrigatória'),
    endDate: z.string().min(1, 'Data de término obrigatória'),
    phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const GENDER_LABEL: Record<string, string> = { MALE: 'Élder', FEMALE: 'Irmã' }

function MissionaryCard({
    missionary,
    onEdit,
    onDeactivate,
}: {
    missionary: Missionary
    onEdit: (m: Missionary) => void
    onDeactivate: (id: string) => void
}) {
    const daysLeft = dayjs(missionary.endDate).diff(dayjs(), 'day')
    const totalDays = dayjs(missionary.endDate).diff(dayjs(missionary.startDate), 'day')
    const elapsed = totalDays - daysLeft
    const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100))
    const isFemale = missionary.gender === 'FEMALE'

    return (
        <div className="bg-surface rounded-[16px] border border-border p-5 hover:border-brand-300 hover:shadow-[0_2px_8px_rgba(37,83,224,0.06)] transition-all duration-200 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full grid place-items-center font-semibold text-sm shrink-0 ${isFemale ? 'bg-cat-female-100 text-cat-female-600' : 'bg-cat-male-100 text-cat-male-600'}`}>
                        {missionary.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-text-900 text-sm leading-tight truncate">{missionary.name}</p>
                        <Badge variant={isFemale ? 'female' : 'male'} className="mt-1.5">
                            {GENDER_LABEL[missionary.gender]}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-1 shrink-0">
                    <button onClick={() => onEdit(missionary)} title="Editar"
                        className="p-2 rounded-[8px] text-text-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeactivate(missionary.id)} title="Desativar"
                        className="p-2 rounded-[8px] text-text-400 hover:text-danger-600 hover:bg-danger-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-text-400" />
                    <span className="truncate">{missionary.area}</span>
                </div>
                {missionary.phone && (
                    <div className="flex items-center gap-2 text-xs text-text-500">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-text-400" />
                        <span>{missionary.phone}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs text-text-500">
                    <Calendar className="w-3.5 h-3.5 shrink-0 text-text-400" />
                    <span>
                        {dayjs(missionary.startDate).format('MMM/YY')} →{' '}
                        {dayjs(missionary.endDate).format('MMM/YY')}
                    </span>
                </div>
            </div>

            <div className="mt-auto">
                <div className="flex justify-between text-xs text-text-400 mb-1.5">
                    <span>Progresso da missão</span>
                    <span className={daysLeft < 30 ? 'text-warning-600 font-medium' : ''}>
                        {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Missão encerrada'}
                    </span>
                </div>
                <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${daysLeft < 30 ? 'bg-warning-500' : 'bg-brand-600'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

function MissionaryFormModal({
    open,
    onClose,
    missionary,
}: {
    open: boolean
    onClose: () => void
    missionary?: Missionary | null
}) {
    const qc = useQueryClient()
    const isEditing = !!missionary

    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { gender: 'MALE' },
    })

    useEffect(() => {
        if (open) {
            reset(missionary
                ? { name: missionary.name, gender: missionary.gender, area: missionary.area, startDate: missionary.startDate.split('T')[0], endDate: missionary.endDate.split('T')[0], phone: missionary.phone ?? '' }
                : { gender: 'MALE', name: '', area: '', startDate: '', endDate: '', phone: '' }
            )
        }
    }, [open, missionary, reset])

    const save = useMutation({
        mutationFn: (data: FormData) =>
            isEditing
                ? missionariesApi.update(missionary.id, data)
                : missionariesApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['missionaries'] })
            toast(isEditing ? 'Missionário atualizado!' : 'Missionário cadastrado!')
            onClose()
            reset()
        },
        onError: (err) =>
            toast.error('Erro', { description: axios.isAxiosError(err) ? err.response?.data?.message : undefined }),
    })

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-brand-100 rounded-lg grid place-items-center">
                            <User className="w-4 h-4 text-brand-600" />
                        </div>
                        {isEditing ? 'Editar missionário' : 'Novo missionário'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                            <Label>Nome completo</Label>
                            <Input placeholder="Elder Silva / Irmã Santos" {...register('name')} />
                            {errors.name && <p className="text-xs text-danger-600">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Gênero</Label>
                            <Controller name="gender" control={control} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Élder (masculino)</SelectItem>
                                        <SelectItem value="FEMALE">Irmã (feminino)</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Área de atuação</Label>
                            <Input placeholder="ex: Asa Norte" {...register('area')} />
                            {errors.area && <p className="text-xs text-danger-600">{errors.area.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Data de início</Label>
                            <Input type="date" {...register('startDate')} />
                            {errors.startDate && <p className="text-xs text-danger-600">{errors.startDate.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Data de término</Label>
                            <Input type="date" {...register('endDate')} />
                            {errors.endDate && <p className="text-xs text-danger-600">{errors.endDate.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>Telefone <span className="text-text-400 font-normal">(opcional)</span></Label>
                            <Input placeholder="(61) 99999-9999" {...register('phone')} />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={save.isPending}>
                            {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {isEditing ? 'Salvar alterações' : 'Cadastrar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function MissionariesPage() {
    const qc = useQueryClient()
    const [search, setSearch] = useState('')
    const [showInactive, setShowInactive] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<Missionary | null>(null)

    const { data: missionaries = [], isLoading } = useQuery({
        queryKey: ['missionaries', showInactive],
        queryFn: () => missionariesApi.getAll(!showInactive),
    })

    const deactivate = useMutation({
        mutationFn: missionariesApi.remove,
        onSuccess: (_data, missionaryId) => {
            qc.invalidateQueries({ queryKey: ['missionaries'] })
            toast('Missionário desativado', {
                description: 'Sem novos almoços a partir de hoje. Dados preservados.',
                action: {
                    label: 'Desfazer',
                    onClick: () => {
                        missionariesApi.update(missionaryId, { active: true }).then(() => {
                            qc.invalidateQueries({ queryKey: ['missionaries'] })
                        })
                    },
                },
            })
        },
    })

    const filtered = missionaries.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.area.toLowerCase().includes(search.toLowerCase())
    )

    const elders = filtered.filter(m => m.gender === 'MALE')
    const sisters = filtered.filter(m => m.gender === 'FEMALE')

    const handleEdit = (m: Missionary) => { setSelected(m); setModalOpen(true) }
    const handleClose = () => { setModalOpen(false); setSelected(null) }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between gap-4 shrink-0 flex-wrap">
                <div>
                    <h1 className="text-[1.375rem] font-bold text-text-900">Missionários</h1>
                    <p className="text-sm text-text-500 mt-0.5">
                        {missionaries.length} missionário{missionaries.length !== 1 ? 's' : ''} cadastrado{missionaries.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button onClick={() => { setSelected(null); setModalOpen(true) }} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Novo missionário
                </Button>
            </div>

            {/* Filtros */}
            <div className="bg-surface px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-400" />
                    <Input
                        placeholder="Buscar por nome ou área..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
                <button
                    onClick={() => setShowInactive(v => !v)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${showInactive
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-surface text-text-500 border-border-strong hover:border-brand-300 hover:text-brand-700'
                        }`}
                >
                    {showInactive ? 'Mostrando todos' : 'Mostrar inativos'}
                </button>
            </div>

            {/* Stats rápidas */}
            <div className="px-6 pt-5 grid grid-cols-3 gap-4 shrink-0">
                {[
                    { label: 'Total ativo', value: missionaries.filter(m => m.active).length, icon: Users, iconBg: 'bg-brand-100 text-brand-600' },
                    { label: 'Élders', value: missionaries.filter(m => m.gender === 'MALE' && m.active).length, icon: User, iconBg: 'bg-cat-male-100 text-cat-male-600' },
                    { label: 'Irmãs', value: missionaries.filter(m => m.gender === 'FEMALE' && m.active).length, icon: User, iconBg: 'bg-cat-female-100 text-cat-female-600' },
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

            {/* Conteúdo */}
            <div className="flex-1 overflow-auto px-6 py-5">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-text-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                        <Users className="w-10 h-10 text-text-400 mb-3" />
                        <p className="text-text-700 font-medium">Nenhum missionário encontrado</p>
                        <p className="text-text-400 text-sm mt-1">
                            {search ? 'Tente outro termo de busca' : 'Clique em "Novo missionário" para começar'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {elders.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-semibold text-cat-male-600 uppercase tracking-wider">Élders</span>
                                    <div className="h-px flex-1 bg-cat-male-100" />
                                    <Badge variant="male">{elders.length}</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {elders.map(m => (
                                        <MissionaryCard
                                            key={m.id}
                                            missionary={m}
                                            onEdit={handleEdit}
                                            onDeactivate={id => deactivate.mutate(id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                        {sisters.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-semibold text-cat-female-600 uppercase tracking-wider">Irmãs</span>
                                    <div className="h-px flex-1 bg-cat-female-100" />
                                    <Badge variant="female">{sisters.length}</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {sisters.map(m => (
                                        <MissionaryCard
                                            key={m.id}
                                            missionary={m}
                                            onEdit={handleEdit}
                                            onDeactivate={id => deactivate.mutate(id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            <MissionaryFormModal open={modalOpen} onClose={handleClose} missionary={selected} />
        </div>
    )
}
