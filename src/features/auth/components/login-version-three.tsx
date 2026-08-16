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
import { PublicSystemStatus } from "@/features/auth/components/public-system-status"

export type LoginViewProps = {
  email: string
  password: string
  showPassword: boolean
  pending: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onAccessHelp: () => void
}

const radialMarks = Array.from({ length: 24 }, (_, index) => index * 15)

function TechnicalArtwork() {
  return (
    <div className="relative -my-14 hidden min-h-0 self-stretch items-center justify-center xl:flex" aria-hidden="true">
      <svg viewBox="0 0 820 720" className="h-auto max-h-[850px] w-full max-w-[1000px]">
        <defs>
          <radialGradient id="technical-wash" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#a9852e" stopOpacity=".08" />
            <stop offset=".62" stopColor="#183126" stopOpacity=".025" />
            <stop offset="1" stopColor="#183126" stopOpacity="0" />
          </radialGradient>
          <pattern id="technical-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="#183126" strokeOpacity=".055" strokeWidth=".7" />
          </pattern>
        </defs>

        <circle cx="410" cy="350" r="300" fill="url(#technical-wash)" />
        <circle cx="410" cy="350" r="286" fill="url(#technical-grid)" opacity=".32" />

        <g fill="none" stroke="#183126">
          <circle cx="410" cy="350" r="250" strokeOpacity=".14" strokeWidth="1" />
          <circle cx="410" cy="350" r="218" strokeOpacity=".22" strokeWidth="1.2" />
          <circle cx="410" cy="350" r="184" strokeOpacity=".36" strokeWidth="1.4" />
          <circle cx="410" cy="350" r="142" strokeOpacity=".17" strokeWidth=".9" />
          <circle cx="410" cy="350" r="108" strokeOpacity=".1" strokeWidth=".8" />
          <circle cx="410" cy="350" r="74" strokeOpacity=".12" strokeWidth=".8" />

          <circle cx="410" cy="350" r="234" stroke="#7e846f" strokeDasharray="108 42 64 38" strokeWidth="8" opacity=".58" transform="rotate(-24 410 350)" />
          <circle cx="410" cy="350" r="194" stroke="#183126" strokeDasharray="144 70 38 72" strokeWidth="5" opacity=".72" transform="rotate(38 410 350)" />
          <circle cx="410" cy="350" r="158" stroke="#a9852e" strokeDasharray="38 92 18 84" strokeWidth="3" opacity=".72" transform="rotate(-58 410 350)" />
        </g>

        <g stroke="#183126" strokeOpacity=".2" strokeWidth=".8">
          {radialMarks.map((angle) => (
            <path key={angle} d="M410 100V126" transform={`rotate(${angle} 410 350)`} />
          ))}
        </g>

        <g fill="none" stroke="#183126" strokeLinecap="round" strokeLinejoin="round">
          <path d="M104 184h82l42 42h52l66 65" strokeOpacity=".48" strokeWidth="1.2" />
          <path d="M82 498h116l49-58h57l31-31" strokeOpacity=".56" strokeWidth="1.2" />
          <path d="M501 254h67l42-42h102v-82" strokeOpacity=".46" strokeWidth="1.1" />
          <path d="M514 426h52l48 48h98v104" strokeOpacity=".54" strokeWidth="1.2" />
          <path d="M151 291h74l38 38h42" strokeOpacity=".3" strokeWidth="1" />
          <path d="M551 309h53l42-42h84" strokeOpacity=".32" strokeWidth="1" />
          <path d="M410 82v85M410 533v103" strokeOpacity=".3" strokeWidth="1" />
          <path d="M124 350h128M568 350h128" strokeOpacity=".34" strokeWidth="1" />
        </g>

        <g fill="#ece8dc" stroke="#183126" strokeWidth="1">
          <rect x="219" y="251" width="10" height="10" />
          <rect x="299" y="286" width="8" height="8" />
          <rect x="208" y="435" width="10" height="10" />
          <rect x="603" y="207" width="9" height="9" />
          <rect x="608" y="469" width="10" height="10" />
          <rect x="681" y="545" width="10" height="10" />
        </g>

        <g fill="#a9852e" stroke="#ece8dc" strokeWidth="3">
          <circle cx="104" cy="184" r="5" />
          <circle cx="82" cy="498" r="5" />
          <circle cx="712" cy="130" r="5" />
          <circle cx="712" cy="578" r="5" />
          <circle cx="410" cy="112" r="6" />
          <circle cx="410" cy="610" r="6" />
          <circle cx="174" cy="350" r="6" />
          <circle cx="646" cy="350" r="6" />
        </g>

        <g fill="#183126" fontFamily="Barlow Condensed, ui-sans-serif, sans-serif" fontSize="13" fontWeight="600" letterSpacing="2">
          <text x="410" y="66" textAnchor="middle">DOCUMENTAR</text>
          <text x="410" y="665" textAnchor="middle">ENTREGAR</text>
          <text x="88" y="355">PLANEJAR</text>
          <text x="666" y="355">EXECUTAR</text>
        </g>

        <g stroke="#183126" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M458 288c-17-25-69-31-94-7-24 23-8 48 28 59l37 12c39 12 48 42 24 67-25 25-76 22-99-5" strokeWidth="8" strokeOpacity=".82" />
          <path d="M455 281c-23-16-67-18-91 1M356 421c27 18 71 17 96-4" strokeWidth="1.2" strokeOpacity=".38" />
          <path d="M410 258v184M326 350h168" strokeWidth=".8" strokeDasharray="3 7" strokeOpacity=".28" />
        </g>
      </svg>
    </div>
  )
}

export function LoginVersionThree({
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
    <main className="relative min-h-svh overflow-hidden bg-[#ece8dc] text-[#17231d] selection:bg-[#a9852e] selection:text-white lg:grid lg:grid-cols-[168px_minmax(0,1fr)]">
      <aside className="relative z-20 flex h-20 items-center border-b border-[#a9852e]/35 bg-[#183126] px-4 text-[#ece8dc] lg:h-svh lg:flex-col lg:border-b-0 lg:border-r lg:px-0 lg:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute inset-x-8 top-1/2 h-px bg-[#c9a348] lg:hidden" />
        </div>

        <img src={ctaLogo} alt="Brasão do 4º Centro de Telemática de Área" className="relative h-14 w-12 object-contain lg:h-[124px] lg:w-[100px]" />
        <div className="relative ml-3 lg:ml-0 lg:mt-12 lg:[writing-mode:vertical-rl] lg:rotate-180">
          <p className="font-heading text-xl font-bold tracking-[.16em] lg:text-lg lg:text-[#c9a348]">4º CTA</p>
          <p className="text-[8px] uppercase tracking-[.14em] text-[#c9bea2] lg:mt-3 lg:hidden">4º Centro de Telemática de Área</p>
        </div>
        <div className="relative ml-auto lg:ml-0 lg:mt-8 lg:w-full lg:flex-1">
          <div className="lg:hidden"><PublicSystemStatus /></div>
          <div className="relative mx-auto hidden h-full w-12 lg:block" aria-hidden="true">
            <span className="absolute bottom-10 left-1/2 top-3 w-px -translate-x-1/2 bg-[#c9a348]/34" />
            <span className="absolute left-1/2 top-3 h-px w-7 -translate-x-1/2 bg-[#c9a348]" />
            <span className="absolute bottom-10 left-1/2 h-px w-7 -translate-x-1/2 bg-[#c9a348]" />
            <span className="absolute bottom-12 left-1/2 top-5 w-8 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,transparent_0_12px,#c9a348_12px_14px,transparent_14px_27px)] opacity-60" />
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-h-[calc(100svh-5rem)] min-w-0 flex-col lg:min-h-svh">
        <div className="pointer-events-none absolute inset-0 opacity-35" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(169,133,46,.08),transparent_32%),linear-gradient(115deg,rgba(255,255,255,.32),transparent_42%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(24,49,38,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(24,49,38,.025)_1px,transparent_1px)] bg-[size:84px_84px]" />
          <svg className="absolute inset-0 size-full opacity-20">
            <filter id="login-paper-noise">
              <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="7" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#login-paper-noise)" opacity=".22" />
          </svg>
        </div>

        <header className="relative z-10 hidden h-20 shrink-0 items-center justify-end px-8 lg:flex xl:px-12">
          <PublicSystemStatus variant="light" />
        </header>

        <div className="relative z-10 grid flex-1 items-center gap-10 px-5 py-10 sm:px-8 lg:px-12 lg:py-8 xl:grid-cols-[460px_minmax(580px,1fr)] xl:gap-16 2xl:px-20">
          <section className="mx-auto w-full max-w-[460px] xl:mx-0">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-[.22em] text-[#52665b]">
              Sistema de Apoio à Gestão de Projetos
            </p>
            <h1 className="mt-5 font-heading text-5xl font-bold leading-[.92] tracking-tight text-[#183126] sm:text-6xl">
              Acesso ao SAGEP
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#667168] sm:text-base">
              Entre com suas credenciais institucionais para continuar.
            </p>

            <form className="mt-9 space-y-5 sm:mt-10" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-[#22362b]">Usuário</Label>
                <div className="group relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#647168] transition-colors group-focus-within:text-[#8f7027]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="Digite seu usuário"
                    className="h-14 rounded-none border-[#aaa795] bg-white/20 pl-12 text-[#17231d] shadow-none placeholder:text-[#7b8079] focus-visible:border-[#a9852e] focus-visible:bg-white/35 focus-visible:ring-[#a9852e]/15"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    disabled={pending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold text-[#22362b]">Senha</Label>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#647168] transition-colors group-focus-within:text-[#8f7027]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    className="h-14 rounded-none border-[#aaa795] bg-white/20 pl-12 pr-12 text-[#17231d] shadow-none placeholder:text-[#7b8079] focus-visible:border-[#a9852e] focus-visible:bg-white/35 focus-visible:ring-[#a9852e]/15"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    disabled={pending}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#667168] transition-colors hover:text-[#8f7027] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a9852e]"
                    onClick={onTogglePassword}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                className="group h-14 w-full rounded-none bg-[#183126] px-5 text-sm font-semibold tracking-[.02em] text-[#f2eee3] shadow-[0_10px_28px_rgba(24,49,38,.14)] hover:bg-[#234638]"
                type="submit"
                disabled={pending}
              >
                {pending ? (
                  <><Loader2 className="size-4 animate-spin" />Autenticando...</>
                ) : (
                  <>Entrar no sistema<ArrowRight className="ml-auto size-4 text-[#c9a348] transition-transform group-hover:translate-x-1" /></>
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-2 text-xs text-[#667168]">
              <ShieldCheck className="size-4 text-[#52665b]" aria-hidden="true" />
              <span>Ambiente seguro e monitorado</span>
            </div>
            <button
              type="button"
              className="mt-8 border-b border-[#a9852e]/70 pb-0.5 text-sm text-[#31473b] transition-colors hover:text-[#8f7027]"
              onClick={onAccessHelp}
            >
              Problemas de acesso?
            </button>
          </section>

          <TechnicalArtwork />
        </div>

        <footer className="relative z-10 grid shrink-0 gap-1 border-t border-[#183126]/10 px-5 py-4 text-center text-[10px] text-[#5e6b63] sm:px-8 lg:grid-cols-2 lg:px-12 lg:text-xs xl:ml-auto xl:w-[62%] xl:text-right 2xl:px-20">
          <p>4º Centro de Telemática de Área <span className="px-1 text-[#a9852e]">•</span> Divisão Técnica</p>
          <p className="text-[#7c7768]">Desenvolvido pelo 2º Ten Luiz - 4º CTA</p>
        </footer>
      </div>
    </main>
  )
}
