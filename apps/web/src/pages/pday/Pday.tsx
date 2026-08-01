import { useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pdayApi } from '@/api/pday'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
    Settings, Trash2, Loader2, ShieldAlert,
    Calendar, CalendarRange, RefreshCw, CheckCircle2, XCircle, Info, ArrowRight,
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Mini-calendário que aplica uma regra (dayOfWeek) + exceções existentes no mês. */
function MiniMonthPreview({ month, dayOfWeek }: { month: dayjs.Dayjs; dayOfWeek: number }) {
    const { data: exceptions = [] } = useQuery({
        queryKey: ['pday', 'exceptions'],
        queryFn: pdayApi.getExceptions,
    })

    const cells = useMemo(() => {
        const start = month.startOf('month')
        const end = month.endOf('month')
        const excMap = new Map(exceptions.map(e => [String(e.date).slice(0, 10), e.blocked]))
        const result: Array<{ key: string; day: number; state: 'block' | 'liberated' | 'normal' } | null> = []
        for (let i = 0; i < start.day(); i++) result.push(null)
        for (let d = 1; d <= end.date(); d++) {
            const day = start.date(d)
            const key = day.format('YYYY-MM-DD')
            const exc = excMap.get(key)
            result.push({
                key,
                day: d,
                state: exc !== undefined ? (exc ? 'block' : 'liberated') : day.day() === dayOfWeek ? 'block' : 'normal',
            })
        }
        return result
    }, [month, dayOfWeek, exceptions])

    return (
        <div className="grid grid-cols-7 gap-1">
            {DAY_SHORT.map(n => (
                <div key={n} className="text-center text-[10px] font-semibold text-text-400 uppercase">{n}</div>
            ))}
            {cells.map((cell, i) =>
                cell === null ? (
                    <div key={`e-${i}`} />
                ) : (
                    <div
                        key={cell.key}
                        title={cell.key}
                        className={`h-8 rounded-md flex items-center justify-center text-xs transition-all ${
                            cell.state === 'block'
                                ? 'bg-danger-100 text-danger-700 font-medium'
                                : cell.state === 'liberated'
                                  ? 'bg-brand-100 text-brand-700'
                                  : 'bg-surface-2 text-text-500'
                        }`}
                    >
                        {cell.day}
                    </div>
                ),
            )}
        </div>
    )
}

/** Assistente da semana de transferência — cria 2 exceções numa única ação. */
function TransferWeekModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const qc = useQueryClient()
    const user = useAuthStore(s => s.user)
    const { data: current } = useQuery({ queryKey: ['pday', 'current'], queryFn: pdayApi.getCurrent })

    const nextMonday = dayjs().day() === 1 ? dayjs().format('YYYY-MM-DD') : dayjs().day(8).format('YYYY-MM-DD')
    const [startDate, setStartDate] = useState(nextMonday)
    const [newDayOfWeek, setNewDayOfWeek] = useState(3)
    const [reason, setReason] = useState('Semana de transferência')

    const currentDay = current?.dayOfWeek ?? 1
    const weekStart = dayjs(startDate)
    const releaseDate = weekStart.add((currentDay - weekStart.day() + 7) % 7, 'day')
    const blockDate = weekStart.add((newDayOfWeek - weekStart.day() + 7) % 7, 'day')

    const save = useMutation({
        mutationFn: () =>
            pdayApi.createTransferWeek({
                startDate,
                newDayOfWeek,
                reason,
                createdBy: user?.name,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pday'] })
            toast.success('Semana de transferência preparada!')
            onClose()
        },
        onError: (err: { response?: { data?: { message?: string } } }) =>
            toast.error(err.response?.data?.message ?? 'Erro ao preparar a semana'),
    })

    const invalid = newDayOfWeek === currentDay

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-brand-100 rounded-lg grid place-items-center">
                            <CalendarRange className="w-4 h-4 text-brand-700" />
                        </div>
                        Semana de transferência
                    </DialogTitle>
                </DialogHeader>

                <Alert variant="info" className="border-brand-200 bg-brand-50">
                    <Info className="w-4 h-4 text-brand-700" />
                    <AlertDescription className="text-xs text-brand-700 ml-2">
                        Cria as exceções de uma vez: libera o P-Day da semana e bloqueia o dia extra de viagem.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4 py-1">
                    <div className="space-y-1.5">
                        <Label>Semana</Label>
                        <Input type="date" value={startDate} min={dayjs().format('YYYY-MM-DD')} onChange={e => setStartDate(e.target.value)} />
                        <p className="text-xs text-text-400 capitalize">
                            {weekStart.format('ddd, DD/MM')} — {weekStart.add(6, 'day').format('ddd, DD/MM/YYYY')}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Dia extra sem almoços</Label>
                        <div className="grid grid-cols-7 gap-1">
                            {DAY_SHORT.map((name, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setNewDayOfWeek(idx)}
                                    className={`text-center py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                                        newDayOfWeek === idx
                                            ? 'bg-brand-600 text-white border-brand-600'
                                            : 'bg-surface-2 text-text-500 border-transparent hover:border-brand-300'
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resumo das mudanças (1 ação → 2 exceções) */}
                    <div className="rounded-xl border border-border divide-y divide-border">
                        <div className="px-3 py-2.5 flex items-center gap-3">
                            <span className="w-8 text-center text-[11px] font-bold text-text-500">{DAY_SHORT[currentDay]}</span>
                            <span className="text-xs text-text-400 line-through">bloqueada (P-Day)</span>
                            <ArrowRight className="w-3.5 h-3.5 text-text-400" />
                            <span className="text-xs font-semibold text-success-700">liberada em {releaseDate.format('DD/MM')}</span>
                        </div>
                        <div className="px-3 py-2.5 flex items-center gap-3">
                            <span className="w-8 text-center text-[11px] font-bold text-text-500">{DAY_SHORT[newDayOfWeek]}</span>
                            <span className="text-xs text-text-400">livre</span>
                            <ArrowRight className="w-3.5 h-3.5 text-text-400" />
                            <span className="text-xs font-semibold text-danger-700">bloqueada em {blockDate.format('DD/MM')}</span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Motivo <span className="text-text-400 font-normal">(opcional)</span></Label>
                        <Input value={reason} onChange={e => setReason(e.target.value)} />
                    </div>

                    {invalid && (
                        <p className="text-xs text-danger-600">
                            O dia extra não pode ser o mesmo do P-Day vigente ({DAY_NAMES[currentDay].toLowerCase()}).
                        </p>
                    )}

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="button" onClick={() => save.mutate()} disabled={save.isPending || invalid}>
                            {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Aplicar mudanças
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const configSchema = z.object({
    dayOfWeek: z.coerce.number().min(0).max(6),
    startDate: z.string().min(1, 'Data obrigatória'),
    reason: z.string().optional(),
})

const exceptionSchema = z.object({
    date: z.string().min(1, 'Data obrigatória'),
    blocked: z.boolean(),
    reason: z.string().optional(),
})

type ConfigForm = z.infer<typeof configSchema>
type ExceptionForm = z.infer<typeof exceptionSchema>

function ConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const qc = useQueryClient()
    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<ConfigForm>({
        resolver: zodResolver(configSchema) as unknown as Resolver<ConfigForm>,
        defaultValues: { dayOfWeek: 1 },
    })

    const watchedDay = watch('dayOfWeek') ?? 1
    const watchedStart = watch('startDate')
    const previewMonth = watchedStart ? dayjs(watchedStart) : dayjs()

    const save = useMutation({
        mutationFn: pdayApi.createConfig,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pday'] })
            toast.success('Configuração de P-Day salva!')
            onClose(); reset()
        },
        onError: (err: { response?: { data?: { message?: string } } }) =>
            toast.error(err.response?.data?.message),
    })

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-brand-100 rounded-lg grid place-items-center">
                            <RefreshCw className="w-4 h-4 text-brand-700" />
                        </div>
                        Nova configuração de P-Day
                    </DialogTitle>
                </DialogHeader>

                <Alert variant="warning" className="border-warning-200 bg-warning-50">
                    <Info className="w-4 h-4 text-warning-700" />
                    <AlertDescription className="text-xs text-warning-700 ml-2">
                        Use isso durante as transferências, quando o P-Day muda permanentemente de dia da semana.
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4 py-1">
                    <div className="space-y-2">
                        <Label>Novo dia do P-Day</Label>
                        <div className="grid grid-cols-7 gap-1">
                            {DAY_SHORT.map((name, idx) => (
                                <label key={idx} className="cursor-pointer">
                                    <input type="radio" value={idx} {...register('dayOfWeek')} className="sr-only peer" />
                                    <div className="text-center py-2 rounded-lg border border-border text-xs font-medium
                                  text-text-500 peer-checked:bg-brand-600 peer-checked:text-white
                                  peer-checked:border-brand-600 hover:border-brand-300 transition-all">
                                        {name}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Válido a partir de</Label>
                        <Input type="date" {...register('startDate')} min={dayjs().format('YYYY-MM-DD')} />
                        {errors.startDate && <p className="text-xs text-danger-600">{errors.startDate.message}</p>}
                    </div>

                    {/* Preview ao vivo: aplica a regra + exceções antes de salvar */}
                    <div className="rounded-xl border border-border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="mb-0">Prévia — {previewMonth.format('MMMM [de] YYYY')}</Label>
                            <span className="text-[11px] text-text-400">vence exceções</span>
                        </div>
                        <MiniMonthPreview month={previewMonth} dayOfWeek={watchedDay} />
                        <p className="text-[11px] text-text-400">
                            Vermelho = P-Day ({DAY_NAMES[watchedDay].toLowerCase()}) · Azul = exceção liberada.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Motivo <span className="text-text-400 font-normal">(opcional)</span></Label>
                        <Input placeholder="ex: Transferência de junho 2025" {...register('reason')} />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={save.isPending}>
                            {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Salvar configuração
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function ExceptionModal({
    open,
    onClose,
    defaultBlocked,
}: {
    open: boolean
    onClose: () => void
    defaultBlocked: boolean
}) {
    const qc = useQueryClient()
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ExceptionForm>({
        resolver: zodResolver(exceptionSchema),
        defaultValues: { blocked: defaultBlocked },
    })

    const save = useMutation({
        mutationFn: pdayApi.createException,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pday'] })
            toast.success('Exceção salva!')
            onClose(); reset()
        },
        onError: (err: { response?: { data?: { message?: string } } }) =>
            toast.error(err.response?.data?.message),
    })

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg grid place-items-center
              ${defaultBlocked ? 'bg-danger-100' : 'bg-success-100'}`}>
                            {defaultBlocked
                                ? <XCircle className="w-4 h-4 text-danger-600" />
                                : <CheckCircle2 className="w-4 h-4 text-success-600" />}
                        </div>
                        {defaultBlocked ? 'Bloquear data específica' : 'Liberar data de P-Day'}
                    </DialogTitle>
                </DialogHeader>

                <Alert variant={defaultBlocked ? 'destructive' : 'success'} className={`${defaultBlocked ? 'border-danger-200 bg-danger-50' : 'border-success-200 bg-success-50'}`}>
                    <Info className={`w-4 h-4 ${defaultBlocked ? 'text-danger-600' : 'text-success-600'}`} />
                    <AlertDescription className={`text-xs ml-2 ${defaultBlocked ? 'text-danger-700' : 'text-success-700'}`}>
                        {defaultBlocked
                            ? 'Esta data será bloqueada mesmo que não seja o P-Day regular (ex: feriado).'
                            : 'Esta data de P-Day será liberada para agendamento (ex: semana de transferência).'}
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit(d => save.mutate({ ...d, blocked: defaultBlocked }))} className="space-y-4 py-1">
                    <div className="space-y-1.5">
                        <Label>Data da exceção</Label>
                        <Input type="date" {...register('date')} min={dayjs().format('YYYY-MM-DD')} />
                        {errors.date && <p className="text-xs text-danger-600">{errors.date.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Motivo <span className="text-text-400 font-normal">(opcional)</span></Label>
                        <Input
                            placeholder={defaultBlocked
                                ? 'ex: Feriado nacional'
                                : 'ex: Semana de transferência — segunda liberada'}
                            {...register('reason')}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button
                            type="submit"
                            disabled={save.isPending}
                            className={defaultBlocked
                                ? 'bg-danger-600 hover:bg-danger-700'
                                : 'bg-success-600 hover:bg-success-700'}
                        >
                            {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {defaultBlocked ? 'Bloquear data' : 'Liberar data'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function PdayPage() {
    const qc = useQueryClient()
    const [configModalOpen, setConfigModalOpen] = useState(false)
    const [exceptionModalOpen, setExceptionModalOpen] = useState(false)
    const [transferModalOpen, setTransferModalOpen] = useState(false)
    const [exceptionBlocked, setExceptionBlocked] = useState(false)

    const { data: current } = useQuery({ queryKey: ['pday', 'current'], queryFn: pdayApi.getCurrent })
    const { data: configs = [] } = useQuery({ queryKey: ['pday', 'configs'], queryFn: pdayApi.getAll })
    const { data: exceptions = [] } = useQuery({ queryKey: ['pday', 'exceptions'], queryFn: pdayApi.getExceptions })

    const deleteException = useMutation({
        mutationFn: pdayApi.deleteException,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pday'] })
            toast.success('Exceção removida.')
        },
    })

    const openExceptionModal = (blocked: boolean) => {
        setExceptionBlocked(blocked)
        setExceptionModalOpen(true)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between gap-4 shrink-0 flex-wrap">
                <div>
                    <h1 className="text-[1.375rem] font-bold text-text-900">Configuração de P-Day</h1>
                    <p className="text-sm text-text-500 mt-0.5">
                        Gerencie o Dia de Preparação e exceções do calendário
                    </p>
                </div>
                <Button size="sm" onClick={() => setTransferModalOpen(true)}>
                    <CalendarRange className="w-3.5 h-3.5 mr-1.5" /> Semana de transferência
                </Button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-5 space-y-6">
                {/* Config vigente */}
                <div className="bg-surface rounded-[16px] border border-border p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-brand-500" />
                                <h2 className="text-sm font-semibold text-text-900">Configuração vigente</h2>
                            </div>
                            <p className="text-xs text-text-500 mb-4">
                                Atualmente, o P-Day cai toda semana no(a):
                            </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setConfigModalOpen(true)}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Alterar P-Day
                        </Button>
                    </div>

                    {/* Seletor visual de dia */}
                    <div className="grid grid-cols-7 gap-2">
                        {DAY_NAMES.map((_, idx) => {
                            const isActive = current?.dayOfWeek === idx
                            return (
                                <div key={idx}
                                    className={`rounded-xl p-3 text-center border transition-all ${isActive
                                        ? 'bg-brand-600 border-brand-600 text-white'
                                        : 'bg-surface-2 border-border text-text-400'
                                        }`}>
                                    <p className="text-xs font-bold">{DAY_SHORT[idx]}</p>
                                    {isActive && (
                                        <div className="mt-1.5 flex justify-center">
                                            <ShieldAlert className="w-4 h-4 text-brand-200" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {current && (
                        <p className="text-xs text-text-500 mt-3 flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5" />
                            P-Day atual: <strong className="text-text-700">{current.dayName}</strong>
                            {current.reason && <span className="text-text-400">· {current.reason}</span>}
                        </p>
                    )}
                </div>

                {/* Histórico de configs */}
                {configs.length > 0 && (
                    <div className="bg-surface rounded-[16px] border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-text-900">Histórico de configurações</h2>
                            <Badge variant="neutral">{configs.length}</Badge>
                        </div>
                        <div className="divide-y divide-border">
                            {configs.map((c, idx) => (
                                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg grid place-items-center text-xs font-bold
                      ${idx === 0 ? 'bg-brand-100 text-brand-700' : 'bg-surface-2 text-text-500'}`}>
                                            {DAY_SHORT[c.dayOfWeek]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-900">{DAY_NAMES[c.dayOfWeek]}</p>
                                            <p className="text-xs text-text-400">
                                                A partir de {dayjs(c.startDate).format('DD/MM/YYYY')}
                                                {c.reason && ` · ${c.reason}`}
                                            </p>
                                        </div>
                                    </div>
                                    {idx === 0 && (
                                        <Badge variant="brand">Atual</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Exceções */}
                <div className="bg-surface rounded-[16px] border border-border overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                            <h2 className="text-sm font-semibold text-text-900">Exceções pontuais</h2>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-success-700 border-success-200 hover:bg-success-50"
                                    onClick={() => openExceptionModal(false)}>
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Liberar data
                                </Button>
                                <Button size="sm" variant="outline" className="text-danger-600 border-danger-200 hover:bg-danger-50"
                                    onClick={() => openExceptionModal(true)}>
                                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> Bloquear data
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-text-500">
                            Exceções sobrescrevem a regra semanal. Use para semanas de transferência ou feriados.
                        </p>
                    </div>

                    {exceptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Calendar className="w-9 h-9 text-text-400 mb-2" />
                            <p className="text-sm text-text-700 font-medium">Nenhuma exceção cadastrada</p>
                            <p className="text-xs text-text-400 mt-1">
                                Na semana de transferência, libere a segunda clicando em "Liberar data"
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {exceptions
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map(ex => {
                                    const isPast = dayjs(ex.date).isBefore(dayjs(), 'day')
                                    return (
                                        <div key={ex.id}
                                            className={`px-5 py-3 flex items-center justify-between ${isPast ? 'opacity-50' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg grid place-items-center
                          ${ex.blocked ? 'bg-danger-100' : 'bg-success-100'}`}>
                                                    {ex.blocked
                                                        ? <XCircle className="w-4 h-4 text-danger-600" />
                                                        : <CheckCircle2 className="w-4 h-4 text-success-600" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-text-900 capitalize">
                                                            {dayjs(ex.date).format('dddd, DD/MM/YYYY')}
                                                        </p>
                                                        <Badge variant={ex.blocked ? 'destructive' : 'success'}>
                                                            {ex.blocked ? 'Bloqueado' : 'Liberado'}
                                                        </Badge>
                                                    </div>
                                                    {ex.reason && <p className="text-xs text-text-400 mt-0.5">{ex.reason}</p>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteException.mutate(ex.id)}
                                                className="p-1.5 rounded-lg text-text-400 hover:text-danger-600 hover:bg-danger-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                </div>

                {/* Card explicativo */}
                <div className="bg-info-50 border border-info-200 rounded-[16px] p-5">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-info-700 shrink-0 mt-0.5" />
                        <div className="space-y-2 text-sm text-info-800">
                            <p className="font-semibold">Como funciona o P-Day?</p>
                            <ul className="space-y-1 text-xs text-info-700">
                                <li>• O <strong>P-Day</strong> (Dia de Preparação) é bloqueado toda semana com base na configuração vigente</li>
                                <li>• Quando há <strong>transferência</strong>, crie uma nova configuração com o novo dia a partir da data de início</li>
                                <li>• Na <strong>semana de transferência</strong>, a segunda-feira costuma ser liberada — use "Liberar data" para isso</li>
                                <li>• Para <strong>feriados</strong> que caiam em dias normais, use "Bloquear data" para impedir agendamentos</li>
                                <li>• Exceções têm <strong>prioridade</strong> sobre a configuração recorrente</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <ConfigModal open={configModalOpen} onClose={() => setConfigModalOpen(false)} />
            <ExceptionModal
                open={exceptionModalOpen}
                onClose={() => setExceptionModalOpen(false)}
                defaultBlocked={exceptionBlocked}
            />
            <TransferWeekModal open={transferModalOpen} onClose={() => setTransferModalOpen(false)} />
        </div>
    )
}
