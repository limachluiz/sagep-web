import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, setAuth } = useAuthStore()
  const [email, setEmail] = useState("admin@sagep.com")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })

      toast.success("Login realizado com sucesso.")
      const destination = location.state?.from?.pathname ?? "/dashboard"
      navigate(destination, { replace: true })
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível realizar o login.")
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    loginMutation.mutate({
      email,
      password,
    })
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#283315] p-4 sm:p-6">
      <div className="sagep-grid-pattern absolute inset-0" />
      <div className="absolute -right-40 -top-52 size-[620px] rounded-full bg-[#c8a84b]/12 blur-3xl" />
      <div className="absolute -bottom-60 -left-32 size-[540px] rounded-full bg-[#6b7d35]/20 blur-3xl" />

      <Card className="relative z-10 grid w-full max-w-4xl overflow-hidden border-[#c8a84b]/30 bg-white/98 p-0 shadow-[0_28px_90px_rgba(0,0,0,.42)] lg:grid-cols-[320px_1fr]">
        <section className="relative flex min-h-56 flex-col overflow-hidden bg-[linear-gradient(155deg,#252e13_0%,#3d4a1e_100%)] p-7 text-white sm:p-9 lg:min-h-[590px]">
          <div className="sagep-grid-pattern absolute inset-0 opacity-50" />
          <div className="relative flex items-center gap-4 lg:block">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-[#dfc070]/50 bg-[radial-gradient(circle_at_35%_30%,#dfc070,#8a6e28)] text-[#283315] shadow-lg lg:mx-auto lg:size-24">
              <ShieldCheck className="size-8 lg:size-11" strokeWidth={1.7} />
            </div>
            <div className="lg:mt-6 lg:text-center">
              <p className="font-heading text-3xl font-extrabold tracking-[0.22em] text-[#d8b85e]">SAGEP</p>
              <p className="mt-1 max-w-56 text-[10px] uppercase leading-4 tracking-[0.18em] text-white/55">
                Sistema de Apoio à Gestão de Projetos
              </p>
            </div>
          </div>

          <div className="relative mt-7 border-y border-[#c8a84b]/25 py-4 text-center lg:mt-10">
            <p className="font-heading text-lg font-bold tracking-wide text-white">4º Centro de Telemática de Área</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[#dfc070]">Divisão Técnica · Seção de Projetos</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/45">Exército Brasileiro</p>
          </div>

          <div className="relative mt-auto hidden text-center lg:block">
            <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">Classificação</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">Uso interno</p>
          </div>
        </section>

        <section className="flex items-center bg-[#f9f7f2] p-6 text-[#1f2710] sm:p-10 lg:p-12">
          <CardContent className="w-full p-0">
            <div className="mb-9">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6b7d35]">Ambiente institucional seguro</p>
              <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-wide">Acesso ao sistema</h1>
              <p className="mt-2 text-sm text-[#6b6b55]">Informe suas credenciais institucionais para continuar.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b6b55]">E-mail institucional</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sagep.com"
                  className="h-11 border-[#d6d0c0] bg-white focus-visible:ring-[#6b7d35]"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loginMutation.isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b6b55]">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-11 border-[#d6d0c0] bg-white pr-11 focus-visible:ring-[#6b7d35]"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loginMutation.isPending}
                    required
                  />
                  <button type="button" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#6b6b55] hover:text-[#3d4a1e]" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="h-12 w-full gap-2 bg-[linear-gradient(135deg,#4e5e26,#2b3516)] font-heading text-base font-bold uppercase tracking-[0.12em] text-white shadow-md hover:brightness-110"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar no sistema
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-7 flex items-start gap-3 border-l-2 border-[#c8a84b] bg-[#f1ede4] p-4 text-xs leading-5 text-[#6b6b55]">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#4e5e26]" />
              <p>
                Acesso restrito a militares e servidores autorizados. As ações realizadas neste ambiente são registradas para auditoria.
              </p>
            </div>
            <p className="mt-6 text-center text-[10px] uppercase tracking-[0.12em] text-[#8b8876]">SAGEP · 4º CTA · Ambiente operacional</p>
          </CardContent>
        </section>
      </Card>
    </div>
  )
}
