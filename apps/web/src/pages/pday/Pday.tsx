import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pdayApi } from '@/api/pday'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
    Settings, Trash2, Loader2, ShieldAlert,
    Calendar, RefreshCw, CheckCircle2, XCircle, Info,
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ConfigForm>({
        resolver: zodResolver(configSchema) as unknown as Resolver<ConfigForm>,
        defaultValues: { dayOfWeek: 1 },
    })

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
                        <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 text-violet-600" />
                        </div>
                        Nova configuração de P-Day
                    </DialogTitle>
                </DialogHeader>

                <Alert className="border-amber-200 bg-amber-50">
                    <Info className="w-4 h-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-700 ml-2">
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
                                    <div className="text-center py-2 rounded-lg border border-slate-200 text-xs font-medium
                                  text-slate-500 peer-checked:bg-violet-600 peer-checked:text-white
                                  peer-checked:border-violet-600 hover:border-violet-300 transition-all">
                                        {name}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Válido a partir de</Label>
                        <Input type="date" {...register('startDate')} min={dayjs().format('YYYY-MM-DD')} />
                        {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Motivo <span className="text-slate-400 font-normal">(opcional)</span></Label>
                        <Input placeholder="ex: Transferência de junho 2025" {...register('reason')} />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={save.isPending} className="bg-violet-600 hover:bg-violet-700">
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
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center
              ${defaultBlocked ? 'bg-red-100' : 'bg-green-100'}`}>
                            {defaultBlocked
                                ? <XCircle className="w-4 h-4 text-red-600" />
                                : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        </div>
                        {defaultBlocked ? 'Bloquear data específica' : 'Liberar data de P-Day'}
                    </DialogTitle>
                </DialogHeader>

                <Alert className={`${defaultBlocked ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                    <Info className={`w-4 h-4 ${defaultBlocked ? 'text-red-600' : 'text-green-600'}`} />
                    <AlertDescription className={`text-xs ml-2 ${defaultBlocked ? 'text-red-700' : 'text-green-700'}`}>
                        {defaultBlocked
                            ? 'Esta data será bloqueada mesmo que não seja o P-Day regular (ex: feriado).'
                            : 'Esta data de P-Day será liberada para agendamento (ex: semana de transferência).'}
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit(d => save.mutate({ ...d, blocked: defaultBlocked }))} className="space-y-4 py-1">
                    <div className="space-y-1.5">
                        <Label>Data da exceção</Label>
                        <Input type="date" {...register('date')} min={dayjs().format('YYYY-MM-DD')} />
                        {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Motivo <span className="text-slate-400 font-normal">(opcional)</span></Label>
                        <Input
                            placeholder={defaultBlocked
                                ? 'ex: Feriado nacional'
                                : 'ex: Semana de transferência — segunda liberada'}
                            {...register('reason')}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button
                            type="submit"
                            disabled={save.isPending}
                            className={defaultBlocked
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'}
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
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Configuração de P-Day</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Gerencie o Dia de Preparação e exceções do calendário
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto px-6 py-5 space-y-6">
                {/* Config vigente */}
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-violet-500" />
                                <h2 className="text-sm font-semibold text-slate-900">Configuração vigente</h2>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">
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
                                        ? 'bg-violet-600 border-violet-600 text-white'
                                        : 'bg-slate-50 border-slate-200 text-slate-400'
                                        }`}>
                                    <p className="text-xs font-bold">{DAY_SHORT[idx]}</p>
                                    {isActive && (
                                        <div className="mt-1.5 flex justify-center">
                                            <ShieldAlert className="w-4 h-4 text-violet-200" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    {current && (
                        <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                            <Settings className="w-3.5 h-3.5" />
                            P-Day atual: <strong className="text-slate-700">{current.dayName}</strong>
                            {current.reason && <span className="text-slate-400">· {current.reason}</span>}
                        </p>
                    )}
                </div>

                {/* Histórico de configs */}
                {configs.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-900">Histórico de configurações</h2>
                            <Badge variant="secondary">{configs.length}</Badge>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {configs.map((c, idx) => (
                                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                      ${idx === 0 ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {DAY_SHORT[c.dayOfWeek]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{DAY_NAMES[c.dayOfWeek]}</p>
                                            <p className="text-xs text-slate-400">
                                                A partir de {dayjs(c.startDate).format('DD/MM/YYYY')}
                                                {c.reason && ` · ${c.reason}`}
                                            </p>
                                        </div>
                                    </div>
                                    {idx === 0 && (
                                        <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">Atual</Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Exceções */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-sm font-semibold text-slate-900">Exceções pontuais</h2>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50"
                                    onClick={() => openExceptionModal(false)}>
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Liberar data
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => openExceptionModal(true)}>
                                    <XCircle className="w-3.5 h-3.5 mr-1.5" /> Bloquear data
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            Exceções sobrescrevem a regra semanal. Use para semanas de transferência ou feriados.
                        </p>
                    </div>

                    {exceptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Calendar className="w-9 h-9 text-slate-300 mb-2" />
                            <p className="text-sm text-slate-500 font-medium">Nenhuma exceção cadastrada</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Na semana de transferência, libere a segunda clicando em "Liberar data"
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {exceptions
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map(ex => {
                                    const isPast = dayjs(ex.date).isBefore(dayjs(), 'day')
                                    return (
                                        <div key={ex.id}
                                            className={`px-5 py-3 flex items-center justify-between ${isPast ? 'opacity-50' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                          ${ex.blocked ? 'bg-red-100' : 'bg-green-100'}`}>
                                                    {ex.blocked
                                                        ? <XCircle className="w-4 h-4 text-red-600" />
                                                        : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-slate-900 capitalize">
                                                            {dayjs(ex.date).format('dddd, DD/MM/YYYY')}
                                                        </p>
                                                        <Badge
                                                            className={`text-xs ${ex.blocked
                                                                ? 'bg-red-100 text-red-700 border-red-200'
                                                                : 'bg-green-100 text-green-700 border-green-200'
                                                                }`}>
                                                            {ex.blocked ? 'Bloqueado' : 'Liberado'}
                                                        </Badge>
                                                    </div>
                                                    {ex.reason && <p className="text-xs text-slate-400 mt-0.5">{ex.reason}</p>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => deleteException.mutate(ex.id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                </div>

                {/* Card explicativo */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-2 text-sm text-blue-800">
                            <p className="font-semibold">Como funciona o P-Day?</p>
                            <ul className="space-y-1 text-xs text-blue-700">
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
        </div>
    )
}