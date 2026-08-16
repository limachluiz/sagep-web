import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import ctaLogo from "@/assets/cta-logo.svg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LoginViewProps } from "@/features/auth/components/login-view.types"
import { PublicSystemStatus } from "@/features/auth/components/public-system-status"

const stages = [
  { number: "01", label: "Planejar" },
  { number: "02", label: "Documentar" },
  { number: "03", label: "Executar" },
  { number: "04", label: "Entregar" },
]

function ProjectNetwork() {
  return (
    <svg
      viewBox="0 0 880 760"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="v2-node-halo">
          <stop offset="0" stopColor="#d5ae4f" stopOpacity=".34" />
          <stop offset="1" stopColor="#d5ae4f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="v2-line" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#d5ae4f" stopOpacity=".08" />
          <stop offset=".5" stopColor="#d5ae4f" stopOpacity=".6" />
          <stop offset="1" stopColor="#d5ae4f" stopOpacity=".12" />
        </linearGradient>
      </defs>

      <g fill="none" stroke="#d5ae4f">
        <circle cx="430" cy="362" r="268" strokeOpacity=".08" />
        <circle cx="430" cy="362" r="214" strokeOpacity=".12" strokeDasharray="2 10" />
        <circle cx="430" cy="362" r="154" strokeOpacity=".16" />
        <path d="M150 112 303 217 430 362 603 225 749 118" stroke="url(#v2-line)" />
        <path d="M87 375 252 319 430 362 611 441 790 375" stroke="url(#v2-line)" />
        <path d="M151 649 279 512 430 362 576 535 735 653" stroke="url(#v2-line)" />
        <path d="M303 217 252 319 279 512M603 225 611 441 576 535" strokeOpacity=".28" />
        <path d="M430 78V646M128 362H744" strokeOpacity=".08" strokeDasharray="4 12" />
      </g>

      <g fill="#d5ae4f">
        {[
          [150, 112], [303, 217], [430, 362], [603, 225], [749, 118],
          [87, 375], [252, 319], [611, 441], [790, 375], [151, 649],
          [279, 512], [576, 535], [735, 653],
        ].map(([x, y], index) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r={index === 2 ? 42 : 22} fill="url(#v2-node-halo)" />
            <circle cx={x} cy={y} r={index === 2 ? 6 : 3.5} fillOpacity={index === 2 ? 1 : .72} />
          </g>
        ))}
      </g>

      <g fill="none" stroke="#f1e7ca" strokeOpacity=".18">
        <path d="M384 320h92v84h-92z" />
        <path d="m395 320 35-31 35 31M407 346h46M407 365h46M407 384h28" />
      </g>
    </svg>
  )
}

export function LoginVersionTwo({
  email,
  password,
  showPassword,
  pending,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onAccessHelp,
}: LoginViewProps) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[#07140f] text-[#eee9dc] selection:bg-[#d0a746] selection:text-[#102219]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(68,111,82,.24),transparent_32%),radial-gradient(circle_at_78%_68%,rgba(164,127,42,.13),transparent_30%),linear-gradient(135deg,#0a1d15_0%,#07130e_54%,#0c1f17_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(207,173,83,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(207,173,83,.035)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(circle_at_50%_45%,black,transparent_78%)]" />
        <div className="absolute -left-[18rem] top-[28%] size-[38rem] rounded-full border border-[#cda74d]/10" />
        <div className="absolute -left-[14rem] top-[32%] size-[30rem] rounded-full border border-[#cda74d]/10" />
      </div>

      <header className="relative z-20 flex h-20 items-center justify-between border-b border-white/[.07] px-5 sm:h-24 sm:px-8 lg:px-12 2xl:px-16">
        <div className="flex items-center gap-4">
          <img
            src={ctaLogo}
            alt="Brasão do 4º Centro de Telemática de Área"
            className="h-14 w-12 object-contain sm:h-16 sm:w-14"
          />
          <div className="border-l border-[#cda74d]/35 pl-4">
            <p className="font-heading text-xl font-bold tracking-[.16em] text-[#f1ede3] sm:text-2xl">SAGEP</p>
            <p className="hidden text-[8px] font-medium uppercase tracking-[.19em] text-[#9da99f] sm:block">
              Sistema de Apoio à Gestão de Projetos
            </p>
          </div>
        </div>
        <PublicSystemStatus />
      </header>

      <div className="relative z-10 grid min-h-[calc(100svh-9rem)] sm:min-h-[calc(100svh-10rem)] lg:grid-cols-[minmax(0,1.15fr)_minmax(430px,.85fr)]">
        <section className="relative hidden min-h-0 overflow-hidden border-r border-white/[.07] lg:flex lg:flex-col">
          <div className="absolute inset-0 opacity-90"><ProjectNetwork /></div>
          <div className="relative z-10 flex flex-1 flex-col justify-between px-12 py-12 2xl:px-16 2xl:py-16">
            <div>
              <div className="mb-5 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[.24em] text-[#c9a44b]">
                <span className="h-px w-10 bg-current" />
                Gestão integrada
              </div>
              <h1 className="max-w-[640px] font-heading text-6xl font-bold leading-[.92] tracking-[-.025em] text-[#f1ede3] 2xl:text-7xl">
                Projetos sob
                <span className="block text-[#cba548]">comando.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-[#98a39c]">
                Planejamento, controle e rastreabilidade em um único ambiente institucional.
              </p>
            </div>

            <div className="grid max-w-[700px] grid-cols-4 border-y border-white/[.08]">
              {stages.map((stage, index) => (
                <div
                  key={stage.number}
                  className={`relative py-5 ${index > 0 ? "border-l border-white/[.08] pl-5" : "pr-5"}`}
                >
                  <span className="font-heading text-xs font-semibold tracking-[.15em] text-[#cba548]">{stage.number}</span>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.14em] text-[#c5cdc7]">{stage.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 2xl:px-20">
          <div className="pointer-events-none absolute inset-y-10 left-0 hidden w-px bg-gradient-to-b from-transparent via-[#cda74d]/35 to-transparent lg:block" aria-hidden="true" />
          <div className="w-full max-w-[470px]">
            <div className="mb-8 lg:mb-10">
              <p className="mb-4 font-heading text-[10px] font-semibold uppercase tracking-[.3em] text-[#cba548]">Acesso institucional</p>
              <h2 aria-label="Acesso ao SAGEP" className="font-heading text-4xl font-bold leading-tight text-[#f1ede3] sm:text-5xl">Bem-vindo ao SAGEP</h2>
              <p className="mt-3 text-sm leading-6 text-[#98a39c]">Entre com suas credenciais para continuar.</p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-[#d9ded9]">Usuário</Label>
                <div className="group relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#829087] transition-colors group-focus-within:text-[#d1aa4d]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="Digite seu usuário"
                    className="h-14 rounded-none border-white/[.14] bg-white/[.045] pl-12 text-[#f0ede4] shadow-none placeholder:text-[#6e7c73] focus-visible:border-[#cda74d]/70 focus-visible:bg-white/[.065] focus-visible:ring-[#cda74d]/15"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    disabled={pending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-[#d9ded9]">Senha</Label>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#829087] transition-colors group-focus-within:text-[#d1aa4d]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className="h-14 rounded-none border-white/[.14] bg-white/[.045] pl-12 pr-12 text-[#f0ede4] shadow-none placeholder:text-[#6e7c73] focus-visible:border-[#cda74d]/70 focus-visible:bg-white/[.065] focus-visible:ring-[#cda74d]/15"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    disabled={pending}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#829087] transition-colors hover:text-[#d1aa4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#cda74d]"
                    onClick={onTogglePassword}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="group h-14 w-full rounded-none bg-[#c49b3c] px-5 text-sm font-bold text-[#102219] shadow-[0_12px_34px_rgba(0,0,0,.22)] hover:bg-[#d5ae4f]"
                type="submit"
                disabled={pending}
              >
                {pending ? (
                  <><Loader2 className="size-4 animate-spin" />Autenticando...</>
                ) : (
                  <>Entrar no sistema<ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-1" /></>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-2 text-xs text-[#87948c]">
              <ShieldCheck className="size-4 text-[#b39449]" aria-hidden="true" />
              <span>Ambiente seguro e monitorado</span>
            </div>
            <button
              type="button"
              className="mt-8 border-b border-[#cda74d]/55 pb-0.5 text-sm text-[#b9c3bc] transition-colors hover:text-[#d5ae4f]"
              onClick={onAccessHelp}
            >
              Problemas de acesso?
            </button>
          </div>
        </section>
      </div>

      <footer className="relative z-20 flex min-h-16 flex-col items-center justify-between gap-1 border-t border-white/[.07] px-5 py-4 text-center text-[10px] text-[#718078] sm:flex-row sm:px-8 lg:px-12 lg:text-xs 2xl:px-16">
        <p>4º Centro de Telemática de Área <span className="px-1 text-[#b28e3d]">•</span> Divisão Técnica</p>
        <p>Desenvolvido pelo 2º Ten Luiz - 4º CTA</p>
      </footer>
    </main>
  )
}
