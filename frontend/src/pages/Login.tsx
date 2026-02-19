import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Zap, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'

import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { extractErrorMessage } from '@/api/client'

const schema = z.object({
  username: z.string().min(1, 'Informe o usuário'),
  password: z.string().min(1, 'Informe a senha'),
})

type FormData = z.infer<typeof schema>

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const response = await authApi.login(data)
      login(response.access_token, response.usuario)
      toast.success(`Bem-vindo, ${response.usuario.username}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-800/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-modal p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 shadow-lg mb-4">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">UST Gestão</h1>
            <p className="mt-1 text-sm text-slate-500">
              Plataforma de Orçamentos Corporativos
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Usuário"
              placeholder="Digite seu usuário"
              autoComplete="username"
              autoFocus
              leftIcon={<User className="w-4 h-4" />}
              error={errors.username?.message}
              {...register('username')}
            />

            <div>
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="pointer-events-auto text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={isSubmitting}
            >
              Entrar
            </Button>
          </form>

          {/* Hint */}
          <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 text-center font-medium">
              Credenciais padrão:{' '}
              <span className="text-slate-700 font-semibold">admin</span>
              {' / '}
              <span className="text-slate-700 font-semibold">admin123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} UST Gestão · Sistema Corporativo
        </p>
      </div>
    </div>
  )
}
