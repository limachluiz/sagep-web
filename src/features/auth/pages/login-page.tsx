import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  LockKeyhole,
  Network,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"

const platformMetrics = [
  { value: "09", label: "etapas rastreáveis" },
  { value: "04", label: "perfis de acesso" },
  { value: "24/7", label: "auditoria ativa" },
]

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
    loginMutation.mutate({ email, password })
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050807] text-[#edf7f0] selection:bg-[#58f28b] selection:text-[#051008]">
      <div className="sagep-signal-grid absolute inset-0" aria-hidden="true" />
      <div className="absolute left-[14%] top-[-22rem] size-[38rem] rounded-full bg-[#39ff88]/8 blur-[130px]" aria-hidden="true" />
      <div className="absolute bottom-[-25rem] right-[-8rem] size-[45rem] rounded-full bg-[#22c965]/8 blur-[150px]" aria-hidden="true" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,.92fr)]">
        <section className="relative hidden min-h-screen flex-col justify-between border-r border-white/[.07] p-10 lg:flex xl:p-14">
          <header className="flex items-center gap-4">
            <div className="relative flex size-11 items-center justify-center border border-[#58f28b]/40 bg-[#58f28b]/10 text-[#58f28b] shadow-[0_0_32px_rgba(88,242,139,.12)]">
              <Network className="size-5" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 size-2 bg-[#58f28b] shadow-[0_0_12px_#58f28b]" />
            </div>
            <div>
              <p className="font-heading text-xl font-bold tracking-[.16em]">SAGEP</p>
              <p className="font-mono text-[9px] uppercase tracking-[.24em] text-[#718078]">4º Centro de Telemática de Área</p>
            </div>
          </header>

          <div className="max-w-2xl py-12">
            <div className="mb-7 inline-flex items-center gap-2 border border-[#58f28b]/20 bg-[#58f28b]/[.06] px-3 py-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#58f28b]">
              <span className="size-1.5 animate-pulse rounded-full bg-[#58f28b] shadow-[0_0_10px_#58f28b]" />
              Sistema operacional
            </div>
            <h1 className="font-heading text-5xl font-semibold uppercase leading-[.96] tracking-[-.02em] xl:text-7xl">
              Projetos sob
              <span className="block text-[#58f28b]">controle total.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#8b9b92] xl:text-lg">
              Planejamento, execução e rastreabilidade em uma única plataforma de comando para a gestão técnica do 4º CTA.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 border-y border-white/[.08]">
              {platformMetrics.map((metric) => (
                <div className="border-r border-white/[.08] px-4 py-5 first:pl-0 last:border-r-0" key={metric.label}>
                  <p className="font-mono text-xl font-semibold text-[#dfffe8]">{metric.value}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[.15em] text-[#617067]">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <footer className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[.18em] text-[#4e5b54]">
            <span>Divisão Técnica · Seção de Projetos</span>
            <span className="flex items-center gap-2 text-[#6f8177]"><CheckCircle2 className="size-3 text-[#58f28b]" /> ambiente monitorado</span>
          </footer>
        </section>

        <section className="flex min-h-screen items-center justify-center p-5 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center border border-[#58f28b]/40 bg-[#58f28b]/10 text-[#58f28b]">
                <Network className="size-5" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold tracking-[.16em]">SAGEP</p>
                <p className="font-mono text-[8px] uppercase tracking-[.2em] text-[#718078]">4º CTA</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[.24em] text-[#58f28b]">// autenticação segura</p>
              <h2 className="font-heading text-4xl font-semibold uppercase tracking-tight sm:text-5xl">Acesso ao sistema</h2>
              <p className="mt-3 text-sm leading-6 text-[#7e8d84]">Use suas credenciais institucionais para iniciar uma sessão.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-[10px] uppercase tracking-[.16em] text-[#91a097]">E-mail institucional</Label>
                <div className="group relative">
                  <Fingerprint className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#526159] transition-colors group-focus-within:text-[#58f28b]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="nome@4cta.eb.mil.br"
                    className="h-13 rounded-none border-white/[.1] bg-white/[.025] pl-11 text-[#edf7f0] placeholder:text-[#465249] focus-visible:border-[#58f28b]/60 focus-visible:ring-2 focus-visible:ring-[#58f28b]/10"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loginMutation.isPending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-mono text-[10px] uppercase tracking-[.16em] text-[#91a097]">Senha</Label>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#526159] transition-colors group-focus-within:text-[#58f28b]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-13 rounded-none border-white/[.1] bg-white/[.025] pl-11 pr-12 text-[#edf7f0] placeholder:text-[#465249] focus-visible:border-[#58f28b]/60 focus-visible:ring-2 focus-visible:ring-[#58f28b]/10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loginMutation.isPending}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#65736b] transition-colors hover:text-[#58f28b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#58f28b]"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="group h-13 w-full rounded-none border border-[#58f28b] bg-[#58f28b] font-mono text-xs font-bold uppercase tracking-[.16em] text-[#061009] shadow-[0_0_28px_rgba(88,242,139,.12)] transition-all hover:bg-[#72ff9d] hover:shadow-[0_0_34px_rgba(88,242,139,.22)]"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="size-4 animate-spin" />Autenticando...</>
                ) : (
                  <>Entrar no sistema<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></>
                )}
              </Button>
            </form>

            <div className="mt-7 flex gap-3 border border-white/[.07] bg-white/[.02] p-4 text-xs leading-5 text-[#69776f]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#58f28b]" aria-hidden="true" />
              <p>Acesso restrito a usuários autorizados. Sessões e operações são registradas para fins de segurança e auditoria.</p>
            </div>

            <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[.18em] text-[#455149]">SAGEP v1.0 · Exército Brasileiro</p>
          </div>
        </section>
      </div>
    </main>
  )
}
