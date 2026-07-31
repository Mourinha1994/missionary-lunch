import { useState } from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { familiesApi } from '@/api/families'
import type { Family } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import axios from 'axios'
import {
    Plus, Search, Pencil, Trash2, Loader2,
    Home, Phone, Mail, MapPin, User, Users,
} from 'lucide-react'

const schema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    contact: z.string().min(2, 'Responsável obrigatório'),
    phone: z.string().min(8, 'Telefone obrigatório'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
    address: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function getFamilyColor(name: string) {
    const colors = [
        'bg-blue-100 text-blue-700',
        'bg-emerald-100 text-emerald-700',
        'bg-violet-100 text-violet-700',
        'bg-amber-100 text-amber-700',
        'bg-pink-100 text-pink-700',
        'bg-cyan-100 text-cyan-700',
        'bg-orange-100 text-orange-700',
        'bg-teal-100 text-teal-700',
    ]
    const idx = name.charCodeAt(0) % colors.length
    return colors[idx]
}

function FamilyCard({
    family,
    onEdit,
    onDeactivate,
}: {
    family: Family
    onEdit: (f: Family) => void
    onDeactivate: (id: string) => void
}) {
    const initials = family.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300
                    hover:shadow-sm transition-all duration-200 group flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${getFamilyColor(family.name)}`}>
                        {initials}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 text-sm">{family.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-500">{family.contact}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(family)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeactivate(family.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <a href={`tel:${family.phone}`} className="hover:text-blue-600 transition-colors">
                        {family.phone}
                    </a>
                </div>
                {family.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <a href={`mailto:${family.email}`} className="hover:text-blue-600 transition-colors truncate">
                            {family.email}
                        </a>
                    </div>
                )}
                {family.address && (
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <span className="line-clamp-2">{family.address}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function FamilyFormModal({
    open,
    onClose,
    family,
}: {
    open: boolean
    onClose: () => void
    family?: Family | null
}) {
    const qc = useQueryClient()
    const isEditing = !!family

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    })

    useEffect(() => {
        if (open) {
            reset(family
                ? { name: family.name, contact: family.contact, phone: family.phone, email: family.email ?? '', address: family.address ?? '' }
                : { name: '', contact: '', phone: '', email: '', address: '' }
            )
        }
    }, [open, family, reset])

    const save = useMutation({
        mutationFn: (data: FormData) =>
            isEditing
                ? familiesApi.update(family.id, data)
                : familiesApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['families'] })
            toast.success(isEditing ? 'Família atualizada!' : 'Família cadastrada!')
            onClose(); reset()
        },
        onError: (err) =>
            toast.error('Erro', { description: axios.isAxiosError(err) ? err.response?.data?.message : undefined }),
    })

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Home className="w-4 h-4 text-emerald-600" />
                        </div>
                        {isEditing ? 'Editar família' : 'Nova família'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                            <Label>Nome da família</Label>
                            <Input placeholder="ex: Família Silva" {...register('name')} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>Irmão/Irmã responsável</Label>
                            <Input placeholder="ex: Irmão João Silva" {...register('contact')} />
                            {errors.contact && <p className="text-xs text-red-500">{errors.contact.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Telefone / WhatsApp</Label>
                            <Input placeholder="(61) 99999-9999" {...register('phone')} />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>E-mail <span className="text-slate-400 font-normal">(opcional)</span></Label>
                            <Input type="email" placeholder="familia@email.com" {...register('email')} />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>Endereço <span className="text-slate-400 font-normal">(opcional)</span></Label>
                            <Input placeholder="Rua das Flores, 123 — Asa Norte" {...register('address')} />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={save.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                            {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {isEditing ? 'Salvar alterações' : 'Cadastrar família'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function FamiliesPage() {
    const qc = useQueryClient()
    const [search, setSearch] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<Family | null>(null)

    const { data: families = [], isLoading } = useQuery({
        queryKey: ['families'],
        queryFn: () => familiesApi.getAll(),
    })

    const deactivate = useMutation({
        mutationFn: familiesApi.remove,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['families'] })
            toast.success('Família desativada.')
        },
    })

    const filtered = families.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.contact.toLowerCase().includes(search.toLowerCase())
    )

    const handleEdit = (f: Family) => { setSelected(f); setModalOpen(true) }
    const handleClose = () => { setModalOpen(false); setSelected(null) }

    // Agrupa por letra inicial
    const grouped = filtered.reduce<Record<string, Family[]>>((acc, f) => {
        const letter = f.name[0].toUpperCase()
        if (!acc[letter]) acc[letter] = []
        acc[letter].push(f)
        return acc
    }, {})
    const sortedLetters = Object.keys(grouped).sort()

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Famílias</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {families.length} famíli{families.length !== 1 ? 'as cadastradas' : 'a cadastrada'}
                        </p>
                    </div>
                    <Button onClick={() => { setSelected(null); setModalOpen(true) }} size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" /> Nova família
                    </Button>
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar família ou responsável..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="px-6 pt-5 pb-0 grid grid-cols-2 gap-4 shrink-0 max-w-sm">
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-slate-900">{families.length}</p>
                        <p className="text-xs text-slate-500">Famílias ativas</p>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Home className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-slate-900">
                            {Math.ceil(families.length / 4)}
                        </p>
                        <p className="text-xs text-slate-500">Semanas cobertas</p>
                    </div>
                </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-auto px-6 py-5">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                        <Home className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">Nenhuma família encontrada</p>
                        <p className="text-slate-400 text-sm mt-1">
                            {search ? 'Tente outro termo' : 'Clique em "Nova família" para começar'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedLetters.map(letter => (
                            <section key={letter}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold text-emerald-700 w-5">{letter}</span>
                                    <div className="h-px flex-1 bg-emerald-100" />
                                    <Badge variant="secondary" className="text-xs">{grouped[letter].length}</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {grouped[letter].map(f => (
                                        <FamilyCard
                                            key={f.id}
                                            family={f}
                                            onEdit={handleEdit}
                                            onDeactivate={id => deactivate.mutate(id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>

            <FamilyFormModal open={modalOpen} onClose={handleClose} family={selected} />
        </div>
    )
}