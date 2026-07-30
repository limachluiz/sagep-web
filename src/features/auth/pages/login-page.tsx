import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import {
  ArrowRight,
  CheckSquare2,
  ClipboardList,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LockKeyhole,
  RadioTower,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import ctaLogo from "@/assets/cta-logo.svg"
import engineeringGear from "@/assets/engineering-gear.svg"
import loginMap from "@/assets/sagep-login-map.svg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"

const workflow = [
  { label: "Planejamento", icon: ClipboardList },
  { label: "Documentação", icon: FileText },
  { label: "Execução", icon: Settings2 },
  { label: "Entrega", icon: CheckSquare2 },
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
    <main className="sagep-login-shell relative min-h-screen overflow-hidden bg-[#06120e] text-[#f2efe5] selection:bg-[#c99b32] selection:text-[#152115]">
      <img
        src={loginMap}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full object-cover object-center opacity-80"
      />
      <div className="sagep-login-vignette pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="sagep-login-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />

      <div className="absolute right-4 top-4 z-30 flex items-center gap-2 sm:right-7 sm:top-6">
        <div className="hidden items-center gap-2 rounded-md border border-[#a9893d]/20 bg-[#07120f]/70 px-4 py-2 text-[9px] font-semibold uppercase tracking-[.2em] text-[#d8b45a] backdrop-blur-md sm:flex">
          <span className="size-2 rounded-full bg-[#e7b64b] shadow-[0_0_12px_#e7b64b]" />
          Sistema operacional
        </div>
        <div className="rounded-md border border-[#a9893d]/20 bg-[#07120f]/70 text-[#d8b45a] backdrop-blur-md">
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1680px] items-center gap-8 px-6 pb-10 pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(430px,520px)] lg:gap-14 lg:px-14 lg:pb-8 lg:pt-20 xl:grid-cols-[minmax(0,1.25fr)_minmax(460px,540px)] xl:px-20">
        <section className="hidden min-w-0 flex-col justify-center lg:flex">
          <div className="w-full max-w-[650px]">
            <div className="mx-auto flex w-fit flex-col items-center text-center">
              <div className="relative mb-3">
                <div className="absolute inset-3 rounded-full bg-[#d4a13a]/12 blur-2xl" aria-hidden="true" />
                <img
                  src={ctaLogo}
                  alt="Brasão do 4º Centro de Telemática de Área"
                  className="relative h-40 w-36 object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,.45)] xl:h-44 xl:w-40"
                />
              </div>
              <p className="font-heading text-[5.35rem] font-extrabold leading-[.8] tracking-[.05em] text-[#ece9df] drop-shadow-[0_5px_12px_rgba(0,0,0,.7)] xl:text-[6rem]">
                SAGEP
              </p>
              <p className="mt-5 max-w-[360px] font-heading text-lg font-semibold uppercase leading-6 tracking-[.08em] text-[#b8a276]">
                Sistema de Apoio à
                <span className="block">Gestão de Projetos</span>
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3 text-[#aa8a3f]/70" aria-hidden="true">
              <span className="h-px flex-1 bg-current" />
              <span className="size-2 rotate-45 border border-[#d8aa42] bg-[#8f742f]" />
              <span className="h-px flex-1 bg-current" />
            </div>

            <p className="mt-5 text-center font-heading text-lg font-semibold uppercase tracking-[.12em] text-[#b4aa80]">
              Planejamento. <span className="text-[#dda93a]">Controle.</span> Rastreabilidade.
            </p>

            <div className="mt-10">
              <p className="mb-4 text-[9px] font-semibold uppercase tracking-[.22em] text-[#b7a66e]">Fluxo de trabalho</p>
              <div className="grid grid-cols-4">
                {workflow.map(({ label, icon: Icon }, index) => (
                  <div className="relative flex flex-col items-center text-center" key={label}>
                    {index < workflow.length - 1 && (
                      <span className="absolute left-[calc(50%+25px)] top-6 h-px w-[calc(100%-50px)] bg-[linear-gradient(90deg,#bc8d2f_45%,transparent_45%)] bg-[length:6px_1px]" aria-hidden="true" />
                    )}
                    <span className="relative z-10 flex size-12 items-center justify-center rounded-full border border-[#bf8d2d] bg-[#0b1a13]/80 text-[#e0ac3d] shadow-[0_0_0_5px_rgba(5,17,13,.55)]">
                      <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <span className="mt-3 text-[8px] font-semibold uppercase tracking-[.16em] text-[#dca63b]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="sagep-login-card relative w-full max-w-[520px] bg-[#f1ede2] px-7 py-9 text-[#1d271d] shadow-[16px_22px_0_rgba(16,27,18,.64),0_28px_70px_rgba(0,0,0,.38)] sm:px-12 sm:py-11">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <img src={ctaLogo} alt="Brasão do 4º Centro de Telemática de Área" className="h-16 w-14 object-contain" />
              <div>
                <p className="font-heading text-2xl font-extrabold tracking-[.12em]">SAGEP</p>
                <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-[#66705c]">Sistema de Apoio à Gestão de Projetos</p>
              </div>
            </div>

            <div className="mb-7">
              <div className="mb-5 flex items-center gap-3">
                <p className="text-[9px] font-bold uppercase tracking-[.28em] text-[#42513b]">Acesso institucional</p>
                <span className="h-px flex-1 bg-[#aa914f]/60" aria-hidden="true" />
                <span className="size-1.5 rotate-45 border border-[#aa914f]" aria-hidden="true" />
              </div>
              <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-[2.65rem]">Bem-vindo ao SAGEP</h1>
              <p className="mt-2 text-sm text-[#5e6758]">Entre com suas credenciais para continuar.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-[#273126]">Usuário</Label>
                <div className="group relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#65705f] transition-colors group-focus-within:text-[#8b6b20]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="Digite seu usuário"
                    className="h-12 rounded-md border-[#b9b4a7] bg-white/25 pl-11 text-[#253025] shadow-none placeholder:text-[#777c73] focus-visible:border-[#9a7b31] focus-visible:ring-[#9a7b31]/20"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={loginMutation.isPending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[#273126]">Senha</Label>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-[17px] -translate-y-1/2 text-[#65705f] transition-colors group-focus-within:text-[#8b6b20]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className="h-12 rounded-md border-[#b9b4a7] bg-white/25 pl-11 pr-12 text-[#253025] shadow-none placeholder:text-[#777c73] focus-visible:border-[#9a7b31] focus-visible:ring-[#9a7b31]/20"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loginMutation.isPending}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#66705f] transition-colors hover:text-[#8b6b20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9a7b31]"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="group h-13 w-full rounded-md bg-[linear-gradient(90deg,#80681c,#9c7e24,#76601a)] text-sm font-medium tracking-[.02em] text-white shadow-[0_8px_20px_rgba(92,70,11,.18)] hover:brightness-110"
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="size-4 animate-spin" />Autenticando...</>
                ) : (
                  <>Entrar no sistema<ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" /></>
                )}
              </Button>
            </form>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#5c6757]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <span>Ambiente seguro e monitorado</span>
            </div>

            <div className="my-6 flex items-center gap-3 text-[#b7a66f]/65" aria-hidden="true">
              <span className="h-px flex-1 bg-current" />
              <span className="size-1.5 rotate-45 border border-[#a68c4b]" />
              <span className="h-px flex-1 bg-current" />
            </div>

            <button
              type="button"
              className="mx-auto block border-b border-dashed border-[#6d755f]/55 text-xs text-[#495346] transition-colors hover:border-[#8b6b20] hover:text-[#7a5c18]"
              onClick={() => toast.info("Entre em contato com o administrador do SAGEP.")}
            >
              Problemas de acesso?
            </button>
          </div>
        </section>
      </div>

      <footer className="relative z-20 grid min-h-[72px] items-center gap-3 border-t border-[#d0aa4b]/15 bg-[#06110e]/76 px-6 py-4 text-[#d5d0c1] backdrop-blur-sm sm:grid-cols-2 lg:px-12 xl:px-16">
        <div className="flex items-center gap-3">
          <RadioTower className="size-5 text-[#d5a032]" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-xs tracking-[.04em] sm:text-sm">
            4º Centro de Telemática de Área <span className="px-2 text-[#9e823c]">•</span> Divisão Técnica
          </p>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
          <p className="text-[10px] tracking-[.06em] text-[#b39b56] sm:text-xs">Desenvolvido pelo 2º Ten Luiz - 4º CTA</p>
          <img src={engineeringGear} alt="" aria-hidden="true" className="size-9 object-contain opacity-90" />
        </div>
      </footer>
    </main>
  )
}
