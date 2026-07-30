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
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import ctaLogo from "@/assets/cta-logo.svg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
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
      const destination = location.state?.from?.pathname ?? "/inicio"
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
    return <Navigate to="/inicio" replace />
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="sagep-signal-grid absolute inset-0" aria-hidden="true" />
      <div className="absolute left-[14%] top-[-22rem] size-[38rem] rounded-full bg-primary/8 blur-[130px]" aria-hidden="true" />
      <div className="absolute bottom-[-25rem] right-[-8rem] size-[45rem] rounded-full bg-gold/8 blur-[150px]" aria-hidden="true" />
      <div className="absolute right-5 top-5 z-20 rounded-lg border border-border/70 bg-card/75 shadow-sm backdrop-blur-md">
        <ThemeToggle />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,.92fr)]">
        <section className="relative hidden min-h-screen flex-col justify-between border-r border-sidebar-border bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-14">
          <header className="flex items-center gap-4">
            <div className="flex h-16 w-14 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/95 p-1.5 shadow-sm">
              <img src={ctaLogo} alt="Brasão do 4º Centro de Telemática de Área" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="font-heading text-xl font-bold tracking-[.16em]">SAGEP</p>
              <p className="mt-0.5 text-[10px] font-medium text-sidebar-foreground/85">Sistema de Apoio à Gestão de Projetos</p>
              <p className="mt-1 text-[8px] uppercase tracking-[.18em] text-sidebar-foreground/60">4º Centro de Telemática de Área</p>
            </div>
          </header>

          <div className="max-w-2xl py-12">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-sidebar-primary/20 bg-sidebar-primary/[.07] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.18em] text-sidebar-primary">
              <ShieldCheck className="size-3.5" />
              Gestão institucional
            </div>
            <h1 className="font-heading text-5xl font-semibold leading-[.96] tracking-[-.02em] xl:text-7xl">
              Projetos com
              <span className="block text-sidebar-primary">visão completa.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-sidebar-foreground/78 xl:text-lg">
              Planejamento, execução e rastreabilidade em uma plataforma integrada para a gestão técnica do 4º CTA.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 border-y border-sidebar-border">
              {platformMetrics.map((metric) => (
                <div className="border-r border-sidebar-border px-4 py-5 first:pl-0 last:border-r-0" key={metric.label}>
                  <p className="font-heading text-xl font-semibold text-sidebar-foreground">{metric.value}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[.15em] text-sidebar-foreground/65">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <footer className="flex items-center justify-between text-[9px] uppercase tracking-[.16em] text-sidebar-foreground/60">
            <span>Divisão Técnica · Seção de Projetos</span>
            <span className="flex items-center gap-2 text-sidebar-foreground/70"><CheckCircle2 className="size-3 text-sidebar-primary" /> ambiente monitorado</span>
          </footer>
        </section>

        <section className="flex min-h-screen items-center justify-center p-5 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-white p-1 shadow-sm">
                <img src={ctaLogo} alt="Brasão do 4º Centro de Telemática de Área" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold tracking-[.16em]">SAGEP</p>
                <p className="text-[9px] font-medium text-muted-foreground">Sistema de Apoio à Gestão de Projetos</p>
                <p className="mt-0.5 text-[8px] uppercase tracking-[.18em] text-muted-foreground/75">4º CTA</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.2em] text-primary">Acesso institucional</p>
              <h2 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Acesso ao sistema</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Use suas credenciais institucionais para iniciar uma sessão.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">E-mail institucional</Label>
                <div className="group relative">
                  <Fingerprint className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="nome@4cta.eb.mil.br"
                    className="h-13 rounded-lg border-border/80 bg-card/70 pl-11 shadow-sm focus-visible:bg-card"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loginMutation.isPending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Senha</Label>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-13 rounded-lg border-border/80 bg-card/70 pl-11 pr-12 shadow-sm focus-visible:bg-card"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loginMutation.isPending}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="group h-13 w-full rounded-lg text-xs font-bold uppercase tracking-[.14em]"
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

            <div className="mt-7 flex gap-3 rounded-lg border border-border/70 bg-muted/45 p-4 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p>Acesso restrito a usuários autorizados. Sessões e operações são registradas para fins de segurança e auditoria.</p>
            </div>

            <footer className="mt-8 space-y-2 text-center">
              <p className="text-[9px] uppercase tracking-[.16em] text-muted-foreground/60">SAGEP v1.0 · Exército Brasileiro</p>
              <p className="text-[10px] font-medium text-muted-foreground/75">Desenvolvido pelo 2º Ten Luiz - 4º CTA</p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  )
}
