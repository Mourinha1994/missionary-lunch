import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUsers, useCreateUser, useUpdateUser, useRemoveUser } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/authStore'
import type { User, Role } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Plus, Search, Pencil, Loader2, ShieldCheck, Users, UserCheck, UserX,
} from 'lucide-react'

const ROLE_LABEL: Record<Role, string> = {
    ADMIN: 'Administrador',
    COORDINATOR: 'Coordenador',
}

const schema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Mínimo de 6 caracteres'),
    role: z.enum(['ADMIN', 'COORDINATOR']),
})
type FormData = z.infer<typeof schema>

function RoleBadge({ role }: { role: Role }) {
    return role === 'ADMIN' ? (
        <Badge variant="brand" className="gap-1">
            <ShieldCheck className="w-3 h-3" />
            {ROLE_LABEL.ADMIN}
        </Badge>
    ) : (
        <Badge variant="neutral">{ROLE_LABEL.COORDINATOR}</Badge>
    )
}

function UserFormModal({
    open,
    onClose,
    user,
}: {
    open: boolean
    onClose: () => void
    user?: User | null
}) {
    const isEditing = !!user
    const createUser = useCreateUser()
    const updateUser = useUpdateUser()

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { role: 'COORDINATOR' },
    })

    useEffect(() => {
        if (open) {
            reset(user
                ? { name: user.name, email: user.email, password: '', role: user.role }
                : { name: '', email: '', password: '', role: 'COORDINATOR' }
            )
        }
    }, [open, user, reset])

    const save = (data: FormData) => {
        if (isEditing) {
            const payload: Record<string, unknown> = { name: data.name, email: data.email, role: data.role }
            if (data.password) payload.password = data.password
            updateUser.mutate(
                { id: user!.id, data: payload },
                { onSuccess: () => { onClose(); reset() } }
            )
        } else {
            createUser.mutate(data, { onSuccess: () => { onClose(); reset() } })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-brand-100 rounded-lg grid place-items-center">
                            <Users className="w-4 h-4 text-brand-600" />
                        </div>
                        {isEditing ? 'Editar usuário' : 'Novo usuário'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(save)} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                            <Label>Nome</Label>
                            <Input placeholder="ex: João Coordenador" {...register('name')} />
                            {errors.name && <p className="text-xs text-danger-600">{errors.name.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>E-mail</Label>
                            <Input type="email" placeholder="usuario@igreja.com" {...register('email')} />
                            {errors.email && <p className="text-xs text-danger-600">{errors.email.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>{isEditing ? 'Senha ' : 'Senha '}<span className="text-text-400 font-normal">({isEditing ? 'deixe em branco para manter' : 'mínimo 6 caracteres'})</span></Label>
                            <Input type="password" placeholder={isEditing ? '••••••' : 'Nova senha'} {...register('password')} />
                            {errors.password && <p className="text-xs text-danger-600">{errors.password.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>Papel</Label>
                            <Select value={watch('role')} onValueChange={(v) => setValue('role', v as Role, { shouldValidate: true })}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione o papel" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                    <SelectItem value="COORDINATOR">Coordenador</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && <p className="text-xs text-danger-600">{errors.role.message}</p>}
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                            {(createUser.isPending || updateUser.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEditing ? 'Salvar alterações' : 'Cadastrar usuário'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function UsersPage() {
    const { data: users = [], isLoading } = useUsers()
    const updateUser = useUpdateUser()
    const removeUser = useRemoveUser()
    const currentUser = useAuthStore(s => s.user)

    const [search, setSearch] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<User | null>(null)

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )

    const isSelf = (u: User) => u.id === currentUser?.id

    const toggleActive = (u: User) => {
        if (u.active) {
            removeUser.mutate(u.id)
        } else {
            updateUser.mutate({ id: u.id, data: { active: true } })
        }
    }

    const handleClose = () => { setModalOpen(false); setSelected(null) }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between gap-4 shrink-0 flex-wrap">
                <div>
                    <h1 className="text-[1.375rem] font-bold text-text-900">Usuários</h1>
                    <p className="text-sm text-text-500 mt-0.5">
                        {users.length} usuário{users.length !== 1 ? 's cadastrado' : ' cadastrado'}
                    </p>
                </div>
                <Button onClick={() => { setSelected(null); setModalOpen(true) }} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Novo usuário
                </Button>
            </div>

            {/* Filtros */}
            <div className="bg-surface px-6 py-3 border-b border-border flex items-center gap-3 shrink-0">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-400" />
                    <Input
                        placeholder="Buscar por nome ou e-mail..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
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
                        <Users className="w-10 h-10 text-text-400 mb-3" />
                        <p className="text-text-700 font-medium">Nenhum usuário encontrado</p>
                        <p className="text-text-400 text-sm mt-1">
                            {search ? 'Tente outro termo' : 'Clique em "Novo usuário" para começar'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-surface rounded-[16px] border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-surface-2 hover:bg-surface-2">
                                    <TableHead>Nome</TableHead>
                                    <TableHead>E-mail</TableHead>
                                    <TableHead>Papel</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(u => (
                                    <TableRow key={u.id} className={u.active ? '' : 'opacity-50'}>
                                        <TableCell className="font-medium text-text-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-100 grid place-items-center text-xs font-semibold text-brand-700 shrink-0">
                                                    {u.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                {u.name}
                                                {isSelf(u) && <Badge variant="outline" className="text-[10px]">você</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-text-500">{u.email}</TableCell>
                                        <TableCell><RoleBadge role={u.role} /></TableCell>
                                        <TableCell>
                                            {u.active ? (
                                                <Badge variant="success">Ativo</Badge>
                                            ) : (
                                                <Badge variant="destructive">Inativo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => { setSelected(u); setModalOpen(true) }}
                                                    className="p-2 rounded-[8px] text-text-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                                    title="Editar usuário"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                {!isSelf(u) && (
                                                    u.active ? (
                                                        <button
                                                            onClick={() => toggleActive(u)}
                                                            className="p-2 rounded-[8px] text-text-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                                                            title="Desativar usuário"
                                                        >
                                                            <UserX className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => toggleActive(u)}
                                                            className="p-2 rounded-[8px] text-text-400 hover:text-success-600 hover:bg-success-50 transition-colors"
                                                            title="Reativar usuário"
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <UserFormModal open={modalOpen} onClose={handleClose} user={selected} />
        </div>
    )
}
