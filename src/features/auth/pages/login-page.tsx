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
import loginMap from "@/assets/sagep-login-cartography.webp"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"

const workflow = [
  { label: "Planejamento", icon: ClipboardList },
  { label: "Documentação", icon: FileText },
  { label: "Execução", icon: Settings2 },
  { label: "Entrega", icon: CheckSquare2 },
]

function CartographyEffects() {
  return (
    <svg
      width="1920"
      height="1080"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid meet"
      className="absolute max-h-full max-w-full object-contain object-center"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="capital-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffe2a0" stopOpacity=".95" />
          <stop offset=".18" stopColor="#e8b94f" stopOpacity=".78" />
          <stop offset=".48" stopColor="#c99128" stopOpacity=".26" />
          <stop offset="1" stopColor="#c99128" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="manaus-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff1bd" />
          <stop offset=".14" stopColor="#f0c662" stopOpacity=".9" />
          <stop offset=".42" stopColor="#d69e2d" stopOpacity=".34" />
          <stop offset="1" stopColor="#d69e2d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="route" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8d6a28" stopOpacity=".18" />
          <stop offset=".5" stopColor="#e2b44f" stopOpacity=".72" />
          <stop offset="1" stopColor="#8d6a28" stopOpacity=".18" />
        </linearGradient>
        <filter id="soft-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="route-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g fill="none" stroke="url(#route)" strokeLinecap="round" filter="url(#route-glow)">
        <path d="M825 294 C790 250 792 211 801 170" strokeWidth="1.3" />
        <path d="M825 294 C750 335 671 366 587 397" strokeWidth="1.15" />
        <path d="M825 294 C810 352 778 407 750 463" strokeWidth="1.25" />
        <path d="M587 397 C640 425 692 448 750 463" strokeWidth=".9" strokeDasharray="5 9" />
        <path d="M801 170 C785 273 767 367 750 463" strokeWidth=".8" strokeDasharray="4 10" opacity=".7" />
      </g>

      <g>
        <circle cx="801" cy="170" r="30" fill="url(#capital-halo)" opacity=".74" />
        <circle cx="587" cy="397" r="28" fill="url(#capital-halo)" opacity=".72" />
        <circle cx="750" cy="463" r="29" fill="url(#capital-halo)" opacity=".72" />
        <circle cx="825" cy="294" r="48" fill="url(#manaus-halo)" opacity=".9" />
        <g fill="#f6cf72" stroke="#fff0b5" filter="url(#soft-glow)">
          <circle cx="801" cy="170" r="3.5" strokeWidth=".8" />
          <circle cx="587" cy="397" r="3.5" strokeWidth=".8" />
          <circle cx="750" cy="463" r="3.5" strokeWidth=".8" />
          <circle cx="825" cy="294" r="5" strokeWidth="1" />
        </g>
        <circle cx="825" cy="294" r="12" fill="none" stroke="#e3b34b" strokeWidth=".8" opacity=".48" />
        <circle cx="825" cy="294" r="20" fill="none" stroke="#d39d31" strokeWidth=".55" opacity=".28" />
      </g>

      <g transform="translate(210 842)" fill="none" stroke="#b8903d" opacity=".72">
        <circle r="54" strokeWidth=".8" opacity=".38" />
        <circle r="39" strokeWidth=".6" opacity=".3" />
        <path d="M0-66V66M-66 0H66" strokeWidth=".7" opacity=".42" />
        <path d="M0-49 9-10 0 0-9-10Z" fill="#caa14a" fillOpacity=".55" strokeWidth=".7" />
        <path d="M0 49 7 10 0 0-7 10Z" fill="#8a6d30" fillOpacity=".35" strokeWidth=".6" />
        <path d="M49 0 10-7 0 0 10 7Z" fill="#9f7d34" fillOpacity=".38" strokeWidth=".6" />
        <path d="M-49 0-10-7 0 0-10 7Z" fill="#9f7d34" fillOpacity=".38" strokeWidth=".6" />
        <circle r="5" fill="#cda44b" fillOpacity=".5" strokeWidth=".7" />
        <g fill="#c9a557" stroke="none" fontFamily="ui-sans-serif, system-ui, sans-serif" fontSize="15" fontWeight="600" textAnchor="middle">
          <text x="0" y="-75">N</text>
          <text x="0" y="87">S</text>
          <text x="81" y="5">L</text>
          <text x="-81" y="5">O</text>
        </g>
      </g>
    </svg>
  )
}

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
    <main className="sagep-login-shell relative flex min-h-svh flex-col overflow-x-hidden bg-[#06120e] text-[#f2efe5] selection:bg-[#c99b32] selection:text-[#152115]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
        <img
          src={loginMap}
          alt=""
          className="absolute max-h-full max-w-full object-contain object-center opacity-95"
        />
        <CartographyEffects />
      </div>
      <div className="sagep-login-vignette pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="sagep-login-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />

      <div className="absolute right-3 top-3 z-30 sm:right-6 sm:top-5 lg:right-7 lg:top-6">
        <div className="hidden items-center gap-2 rounded-md border border-[#a9893d]/20 bg-[#07120f]/70 px-4 py-2 text-[9px] font-semibold uppercase tracking-[.2em] text-[#d8b45a] backdrop-blur-md sm:flex">
          <span className="size-2 rounded-full bg-[#e7b64b] shadow-[0_0_12px_#e7b64b]" />
          Sistema operacional
        </div>
      </div>

      <div className="sagep-login-content relative z-10 grid w-full flex-1 items-center gap-8 px-4 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-24 xl:grid-cols-[minmax(0,1fr)_minmax(440px,520px)] xl:gap-10 xl:px-[46px] xl:pb-8 xl:pt-20 2xl:gap-16">
        <section className="sagep-login-identity hidden min-w-0 -translate-y-5 flex-col justify-center xl:flex">
          <div className="w-full max-w-[620px]">
            <div className="mx-auto flex w-fit flex-col items-center text-center">
              <div className="relative mb-3">
                <div className="absolute inset-3 rounded-full bg-[#d4a13a]/12 blur-2xl" aria-hidden="true" />
                <img
                  src={ctaLogo}
                  alt="Brasão do 4º Centro de Telemática de Área"
                  className="relative h-52 w-44 object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,.5)] xl:h-56 xl:w-48"
                />
              </div>
              <p className="font-heading text-[6.4rem] font-extrabold leading-[.78] tracking-[.045em] text-[#ece9df] drop-shadow-[0_5px_12px_rgba(0,0,0,.72)] xl:text-[7rem]">
                SAGEP
              </p>
              <p className="mt-6 max-w-[390px] font-heading text-[1.35rem] font-semibold uppercase leading-7 tracking-[.075em] text-[#b8a276]">
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

        <section className="flex min-w-0 items-center justify-center xl:justify-end">
          <div className="sagep-login-card relative w-full max-w-[520px] bg-[#f1ede2] px-5 py-7 text-[#1d271d] shadow-[10px_14px_0_rgba(16,27,18,.58),0_24px_56px_rgba(0,0,0,.34)] sm:px-9 sm:py-9 lg:px-12 lg:py-11 xl:shadow-[16px_22px_0_rgba(16,27,18,.64),0_28px_70px_rgba(0,0,0,.38)]">
            <div className="mb-5 flex items-center gap-3 sm:mb-7 xl:hidden">
              <img src={ctaLogo} alt="Brasão do 4º Centro de Telemática de Área" className="h-14 w-12 shrink-0 object-contain sm:h-16 sm:w-14" />
              <div>
                <p className="font-heading text-2xl font-extrabold tracking-[.12em] sm:text-[1.7rem]">SAGEP</p>
                <p className="max-w-[260px] text-[8px] font-semibold uppercase leading-3 tracking-[.075em] text-[#66705c] sm:text-[9px] sm:tracking-[.09em]">Sistema de Apoio à Gestão de Projetos</p>
              </div>
            </div>

            <div className="mb-5 sm:mb-7">
              <div className="mb-4 flex items-center gap-3 sm:mb-5">
                <p className="text-[9px] font-bold uppercase tracking-[.28em] text-[#42513b]">Acesso institucional</p>
                <span className="h-px flex-1 bg-[#aa914f]/60" aria-hidden="true" />
                <span className="size-1.5 rotate-45 border border-[#aa914f]" aria-hidden="true" />
              </div>
              <h1 className="font-heading text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.65rem]">Bem-vindo ao SAGEP</h1>
              <p className="mt-2 text-sm text-[#5e6758]">Entre com suas credenciais para continuar.</p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
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

            <div className="my-5 flex items-center gap-3 text-[#b7a66f]/65 sm:my-6" aria-hidden="true">
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

      <footer className="relative z-20 grid min-h-[88px] items-center gap-3 border-t border-[#d0aa4b]/15 bg-[#06110e]/76 px-4 py-4 text-[#d5d0c1] backdrop-blur-sm sm:grid-cols-2 sm:px-6 lg:px-[46px] xl:min-h-[105px]">
        <div className="flex items-center justify-center gap-2 text-center sm:justify-start sm:text-left">
          <RadioTower className="size-5 shrink-0 text-[#d5a032]" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-[11px] leading-4 tracking-[.035em] sm:text-sm">
            4º Centro de Telemática de Área <span className="px-1.5 text-[#9e823c] sm:px-2">•</span> Divisão Técnica
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 sm:justify-end sm:gap-3">
          <p className="text-center text-[9px] tracking-[.045em] text-[#b39b56] sm:text-right sm:text-xs sm:tracking-[.06em]">Desenvolvido pelo 2º Ten Luiz - 4º CTA</p>
          <img src={engineeringGear} alt="" aria-hidden="true" className="size-8 shrink-0 object-contain opacity-90 sm:size-9" />
        </div>
      </footer>
    </main>
  )
}
