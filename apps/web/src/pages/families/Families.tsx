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
        'bg-brand-100 text-brand-700',
        'bg-success-100 text-success-700',
        'bg-cat-male-100 text-cat-male-600',
        'bg-warning-100 text-warning-700',
        'bg-cat-female-100 text-cat-female-600',
        'bg-info-100 text-info-700',
        'bg-warning-100 text-warning-700',
        'bg-success-100 text-success-700',
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
        <div className="bg-surface rounded-[16px] border border-border p-5 hover:border-brand-300 hover:shadow-[0_2px_8px_rgba(37,83,224,0.06)] transition-all duration-200 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-[12px] grid place-items-center font-bold text-sm shrink-0 ${getFamilyColor(family.name)}`}>
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-text-900 text-sm truncate">{family.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <User className="w-3 h-3 text-text-400 shrink-0" />
                            <p className="text-xs text-text-500 truncate">{family.contact}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 shrink-0">
                    <button onClick={() => onEdit(family)} title="Editar"
                        className="p-2 rounded-[8px] text-text-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeactivate(family.id)} title="Desativar"
                        className="p-2 rounded-[8px] text-text-400 hover:text-danger-600 hover:bg-danger-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-text-500">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-text-400" />
                    <a href={`tel:${family.phone}`} className="hover:text-brand-600 transition-colors">
                        {family.phone}
                    </a>
                </div>
                {family.email && (
                    <div className="flex items-center gap-2 text-xs text-text-500">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-text-400" />
                        <a href={`mailto:${family.email}`} className="hover:text-brand-600 transition-colors truncate">
                            {family.email}
                        </a>
                    </div>
                )}
                {family.address && (
                    <div className="flex items-start gap-2 text-xs text-text-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-text-400 mt-0.5" />
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
                        <div className="w-7 h-7 bg-brand-100 rounded-lg grid place-items-center">
                            <Home className="w-4 h-4 text-brand-600" />
                        </div>
                        {isEditing ? 'Editar família' : 'Nova família'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(d => save.mutate(d))} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                            <Label>Nome da família</Label>
                            <Input placeholder="ex: Família Silva" {...register('name')} />
                            {errors.name && <p className="text-xs text-danger-600">{errors.name.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>Irmão/Irmã responsável</Label>
                            <Input placeholder="ex: Irmão João Silva" {...register('contact')} />
                            {errors.contact && <p className="text-xs text-danger-600">{errors.contact.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Telefone / WhatsApp</Label>
                            <Input placeholder="(61) 99999-9999" {...register('phone')} />
                            {errors.phone && <p className="text-xs text-danger-600">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label>E-mail <span className="text-text-400 font-normal">(opcional)</span></Label>
                            <Input type="email" placeholder="familia@email.com" {...register('email')} />
                            {errors.email && <p className="text-xs text-danger-600">{errors.email.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>Endereço <span className="text-text-400 font-normal">(opcional)</span></Label>
                            <Input placeholder="Rua das Flores, 123 — Asa Norte" {...register('address')} />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={save.isPending}>
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
        onSuccess: (_data, familyId) => {
            qc.invalidateQueries({ queryKey: ['families'] })
            toast('Família desativada', {
                description: 'Sem novos almoços a partir de hoje. Dados preservados.',
                action: {
                    label: 'Desfazer',
                    onClick: () => {
                        familiesApi.update(familyId, { active: true }).then(() => {
                            qc.invalidateQueries({ queryKey: ['families'] })
                        })
                    },
                },
            })
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
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between gap-4 shrink-0 flex-wrap">
                <div>
                    <h1 className="text-[1.375rem] font-bold text-text-900">Famílias</h1>
                    <p className="text-sm text-text-500 mt-0.5">
                        {families.length} famíli{families.length !== 1 ? 'as cadastradas' : 'a cadastrada'}
                    </p>
                </div>
                <Button onClick={() => { setSelected(null); setModalOpen(true) }} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Nova família
                </Button>
            </div>

            {/* Filtros */}
            <div className="bg-surface px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-400" />
                    <Input
                        placeholder="Buscar família ou responsável..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="px-6 pt-5 grid grid-cols-2 gap-4 shrink-0 max-w-sm">
                <div className="bg-surface border border-border rounded-[16px] p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-100 grid place-items-center">
                        <Users className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-text-900">{families.length}</p>
                        <p className="text-xs text-text-500">Famílias ativas</p>
                    </div>
                </div>
                <div className="bg-surface border border-border rounded-[16px] p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-warning-100 grid place-items-center">
                        <Home className="w-4 h-4 text-warning-700" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-text-900">
                            {Math.ceil(families.length / 4)}
                        </p>
                        <p className="text-xs text-text-500">Semanas cobertas</p>
                    </div>
                </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-auto px-6 py-5">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="w-6 h-6 animate-spin text-text-400" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                        <Home className="w-10 h-10 text-text-400 mb-3" />
                        <p className="text-text-700 font-medium">Nenhuma família encontrada</p>
                        <p className="text-text-400 text-sm mt-1">
                            {search ? 'Tente outro termo' : 'Clique em "Nova família" para começar'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedLetters.map(letter => (
                            <section key={letter}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold text-brand-700 w-5">{letter}</span>
                                    <div className="h-px flex-1 bg-brand-100" />
                                    <Badge variant="brand">{grouped[letter].length}</Badge>
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
