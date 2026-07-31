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
import { Loader2, BookOpen } from 'lucide-react'

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
    <div className="min-h-screen flex" style={{ background: '#0F172A' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #0F172A 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">Almoço dos Missionários</span>
        </div>

        <div>
          <blockquote className="text-slate-300 text-xl font-light leading-relaxed mb-6 italic">
            "Quem quiser ser o primeiro entre vós, seja servo de todos."
          </blockquote>
          <p className="text-slate-500 text-sm">Marcos 10:44</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Famílias', value: '24+' },
            { label: 'Missionários', value: '6' },
            { label: 'Almoços/mês', value: '20' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">Almoço dos Missionários</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h1>
          <p className="text-slate-400 text-sm mb-8">Acesse sua conta para continuar</p>

          <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">E-mail</Label>
              <Input
                type="email"
                placeholder="coordenador@igreja.com"
                autoComplete="email"
                {...register('email')}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500
                           focus:border-blue-500 focus:ring-blue-500/20 h-11"
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500
                           focus:border-blue-500 focus:ring-blue-500/20 h-11"
              />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</>
                : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}