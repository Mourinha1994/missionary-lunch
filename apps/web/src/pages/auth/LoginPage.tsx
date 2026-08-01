import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { login, getLoginErrorMessage } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UtensilsCrossed } from 'lucide-react'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(s => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ user, token }) => {
      setAuth(user, token)
      navigate('/')
    },
    onError: (err) => {
      toast.error(getLoginErrorMessage(err))
    },
  })

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 px-12 py-12 text-white"
        style={{ background: 'linear-gradient(135deg, #1B3378 0%, #1E43C0 100%)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[12px] bg-brand-500 grid place-items-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-semibold leading-tight">Almoço dos Missionários</p>
          </div>
        </div>

        <blockquote
          className="text-[1.4rem] font-light italic leading-relaxed text-white/85 max-w-[26ch]"
        >
          "Quem quiser ser o primeiro entre vós, seja servo de todos."
        </blockquote>
        <p className="text-sm text-white/45">Marcos 10:44</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 grid place-items-center bg-surface p-8">
        <div className="w-full max-w-[340px]">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-[12px] bg-brand-600 grid place-items-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <p className="text-lg font-semibold text-text-900">Almoço dos Missionários</p>
          </div>

          <h1 className="text-[clamp(1.75rem,3.2vw,2.25rem)] font-bold text-text-900 leading-tight mb-1.5">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-text-500 mb-7">Acesse sua conta para continuar</p>

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-text-900">E-mail</Label>
              <Input
                type="email"
                placeholder="coordenador@igreja.com"
                autoComplete="email"
                className="h-12"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-danger-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-text-900">Senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-12"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-danger-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full font-medium" disabled={mutation.isPending}>
              {mutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
                : 'Entrar'}
            </Button>
          </form>

          <p className="text-xs text-text-400 text-center mt-4">
            Contas são criadas por um administrador da ala.
          </p>
        </div>
      </div>
    </div>
  )
}
