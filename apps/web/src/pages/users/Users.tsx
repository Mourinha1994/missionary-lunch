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
        <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 gap-1">
            <ShieldCheck className="w-3 h-3" />
            {ROLE_LABEL.ADMIN}
        </Badge>
    ) : (
        <Badge variant="secondary">{ROLE_LABEL.COORDINATOR}</Badge>
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
                        <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-violet-600" />
                        </div>
                        {isEditing ? 'Editar usuário' : 'Novo usuário'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(save)} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                            <Label>Nome</Label>
                            <Input placeholder="ex: João Coordenador" {...register('name')} />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>E-mail</Label>
                            <Input type="email" placeholder="usuario@igreja.com" {...register('email')} />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <Label>{isEditing ? 'Senha ' : 'Senha '}<span className="text-slate-400 font-normal">({isEditing ? 'deixe em branco para manter' : 'mínimo 6 caracteres'})</span></Label>
                            <Input type="password" placeholder={isEditing ? '••••••' : 'Nova senha'} {...register('password')} />
                            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
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
                            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={createUser.isPending || updateUser.isPending} className="bg-violet-600 hover:bg-violet-700">
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
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Usuários</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {users.length} usuário{users.length !== 1 ? 's cadastrado' : ' cadastrado'}
                        </p>
                    </div>
                    <Button onClick={() => { setSelected(null); setModalOpen(true) }} size="sm"
                        className="bg-violet-600 hover:bg-violet-700">
                        <Plus className="w-4 h-4 mr-2" /> Novo usuário
                    </Button>
                </div>

                <div className="flex items-center gap-3 mt-4">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por nome ou e-mail..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm"
                        />
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
                        <Users className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">Nenhum usuário encontrado</p>
                        <p className="text-slate-400 text-sm mt-1">
                            {search ? 'Tente outro termo' : 'Clique em "Novo usuário" para começar'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                                        <TableCell className="font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-semibold text-violet-700">
                                                    {u.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                {u.name}
                                                {isSelf(u) && <Badge variant="outline" className="text-[10px]">você</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500">{u.email}</TableCell>
                                        <TableCell><RoleBadge role={u.role} /></TableCell>
                                        <TableCell>
                                            {u.active ? (
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Ativo</Badge>
                                            ) : (
                                                <Badge variant="destructive">Inativo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => { setSelected(u); setModalOpen(true) }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Editar usuário"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                {!isSelf(u) && (
                                                    u.active ? (
                                                        <button
                                                            onClick={() => toggleActive(u)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Desativar usuário"
                                                        >
                                                            <UserX className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => toggleActive(u)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                            title="Reativar usuário"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5" />
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
