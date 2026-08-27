import { cloneElement, useId, useState, type ReactElement } from "react"
import { Navigate, useNavigate } from "react-router"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowRight, Building2, KeyRound, Loader2, Network, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import ctaLogo from "@/assets/cta-logo.svg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setupService } from "../setup.service"
import type { SetupPayload } from "../setup.types"

const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean)

export function SetupPage() {
  const navigate = useNavigate()
  const status = useQuery({ queryKey: ["setup", "status"], queryFn: setupService.status, retry: false })
  const [form, setForm] = useState({
    setupToken: "", adminName: "", adminEmail: "", password: "", passwordConfirmation: "",
    organizationName: "", acronym: "", cityName: "", stateUf: "AM" as SetupPayload["organization"]["stateUf"],
    uasg: "", management: "00001", timeZone: "America/Manaus", commandName: "COMANDO MILITAR DA AMAZÔNIA",
    hostName: "", expectedIp: "", gateway: "", dnsServers: "", ntpServers: "", allowedNetworks: "", proxyUrl: "",
  })

  const set = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const initialize = useMutation({
    mutationFn: setupService.initialize,
    onSuccess: () => {
      toast.success("Instalação inicial concluída com segurança.")
      navigate("/login", { replace: true })
    },
    onError: (error) => toast.error(error.message || "Não foi possível inicializar o SAGEP."),
  })

  if (status.isPending) return <div className="flex min-h-svh items-center justify-center bg-[#07140f] text-white"><Loader2 className="size-8 animate-spin" /><span className="sr-only">Verificando instalação</span></div>
  if (status.data && !status.data.requiresSetup) return <Navigate to="/login" replace />

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (form.password !== form.passwordConfirmation) return toast.error("As senhas não coincidem.")
    initialize.mutate({
      setupToken: form.setupToken,
      administrator: { name: form.adminName, email: form.adminEmail, password: form.password },
      organization: {
        name: form.organizationName, acronym: form.acronym, cityName: form.cityName,
        stateUf: form.stateUf, uasg: form.uasg, management: form.management,
        timeZone: form.timeZone, commandName: form.commandName,
      },
      network: {
        hostName: form.hostName || null, expectedIp: form.expectedIp || null,
        gateway: form.gateway || null, dnsServers: splitList(form.dnsServers),
        ntpServers: splitList(form.ntpServers), allowedNetworks: splitList(form.allowedNetworks),
        proxyUrl: form.proxyUrl || null,
      },
    })
  }

  return (
    <main className="min-h-svh bg-[#07140f] px-4 py-8 text-[#17251d] sm:px-6 lg:py-12">
      <form onSubmit={submit} className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-[#b08a36]/35 bg-[#f2eee3] shadow-2xl">
        <header className="flex flex-col gap-5 border-b border-[#b08a36]/30 bg-[#10291f] px-6 py-6 text-white sm:flex-row sm:items-center sm:px-9">
          <img src={ctaLogo} alt="Brasão da organização" className="h-20 w-16 object-contain" />
          <div><p className="text-xs font-semibold uppercase tracking-[.24em] text-[#d4ae53]">Primeira inicialização</p><h1 className="mt-2 font-heading text-3xl font-bold">Configurar o SAGEP</h1><p className="mt-1 text-sm text-white/65">Cadastre a OM, o administrador e os parâmetros da rede interna.</p></div>
        </header>

        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-2">
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 font-semibold"><KeyRound className="size-5 text-[#96731f]" />Segurança e administrador</h2>
            {!status.data?.setupTokenConfigured && <p className="rounded-md border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-900">A chave de instalação ainda não está disponível. Reinicie a API e consulte os logs do contêiner.</p>}
            {status.data?.setupTokenGenerated && <p className="rounded-md border border-emerald-400/50 bg-emerald-50 p-3 text-sm text-emerald-900">A chave foi gerada automaticamente. Consulte-a com <code>docker compose logs api</code> no servidor.</p>}
            <Field label="Chave de instalação"><Input type="password" autoComplete="off" value={form.setupToken} onChange={set("setupToken")} required minLength={32} /></Field>
            <Field label="Nome completo"><Input value={form.adminName} onChange={set("adminName")} required minLength={3} /></Field>
            <Field label="E-mail institucional"><Input type="email" value={form.adminEmail} onChange={set("adminEmail")} required /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Senha inicial"><Input type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required minLength={12} /></Field><Field label="Confirmar senha"><Input type="password" autoComplete="new-password" value={form.passwordConfirmation} onChange={set("passwordConfirmation")} required minLength={12} /></Field></div>
            <p className="text-xs text-muted-foreground">Use ao menos 12 caracteres, com maiúscula, minúscula, número e símbolo.</p>
          </section>

          <section className="space-y-4">
            <h2 className="flex items-center gap-2 font-semibold"><Building2 className="size-5 text-[#96731f]" />Organização Militar</h2>
            <Field label="Nome da OM"><Input value={form.organizationName} onChange={set("organizationName")} required /></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Sigla"><Input value={form.acronym} onChange={set("acronym")} required /></Field><Field label="Cidade"><Input value={form.cityName} onChange={set("cityName")} required /></Field></div>
            <div className="grid gap-4 sm:grid-cols-3"><Field label="UF"><select className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={form.stateUf} onChange={set("stateUf")}>{["AM","RO","RR","AC"].map((uf) => <option key={uf}>{uf}</option>)}</select></Field><Field label="UASG"><Input inputMode="numeric" value={form.uasg} onChange={set("uasg")} required pattern="[0-9]{6}" /></Field><Field label="Gestão"><Input inputMode="numeric" value={form.management} onChange={set("management")} required pattern="[0-9]{5}" /></Field></div>
            <Field label="Comando"><Input value={form.commandName} onChange={set("commandName")} required /></Field>
          </section>

          <section className="space-y-4 lg:col-span-2">
            <h2 className="flex items-center gap-2 font-semibold"><Network className="size-5 text-[#96731f]" />Rede e servidores <span className="text-xs font-normal text-muted-foreground">(pode ser concluído depois)</span></h2>
            <div className="grid gap-4 md:grid-cols-3"><Field label="Nome DNS"><Input placeholder="sagep.4cta.eb.mil.br" value={form.hostName} onChange={set("hostName")} /></Field><Field label="IP reservado"><Input placeholder="10.72.x.x" value={form.expectedIp} onChange={set("expectedIp")} /></Field><Field label="Gateway"><Input placeholder="10.72.x.1" value={form.gateway} onChange={set("gateway")} /></Field></div>
            <div className="grid gap-4 md:grid-cols-3"><Field label="Servidores DNS"><Input placeholder="10.72.0.10, 10.72.0.11" value={form.dnsServers} onChange={set("dnsServers")} /></Field><Field label="Servidores NTP"><Input placeholder="separados por vírgula" value={form.ntpServers} onChange={set("ntpServers")} /></Field><Field label="Redes autorizadas"><Input placeholder="10.72.0.0/16" value={form.allowedNetworks} onChange={set("allowedNetworks")} /></Field></div>
          </section>
        </div>

        <footer className="flex flex-col gap-4 border-t border-[#b08a36]/25 bg-white/30 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-9">
          <p className="flex items-center gap-2 text-xs text-[#536158]"><ShieldCheck className="size-4" />A chave temporária será removida após a criação do administrador.</p>
          <Button type="submit" className="bg-[#17392c] hover:bg-[#214c3c]" disabled={initialize.isPending || !status.data?.setupTokenConfigured}>{initialize.isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}Concluir configuração</Button>
        </footer>
      </form>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId()
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{cloneElement(children, { id })}</div>
}
