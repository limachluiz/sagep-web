import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Download, KeyRound, Network, RefreshCw, Save, Server, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/auth.store"
import { SettingsNavigation } from "@/features/system-health/components/settings-navigation"
import { deploymentService } from "../deployment.service"
import type { CertificateMode, UpdateDeploymentSettings } from "../deployment.types"

const splitList = (value: string) => value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean)
const joinList = (value: string[]) => value.join(", ")

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function Field({ label, value, onChange, placeholder, helper }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helper?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />{helper && <p className="text-xs text-muted-foreground">{helper}</p>}</div>
}

export function NetworkSettingsPage() {
  const canManage = useAuthStore((state) => state.hasPermission("settings.manage"))
  const canDiagnose = useAuthStore((state) => state.hasPermission("system_health.view_details"))
  const queryClient = useQueryClient()
  const settingsQuery = useQuery({ queryKey: ["deployment-settings"], queryFn: deploymentService.get })
  const diagnosticsQuery = useQuery({ queryKey: ["deployment-diagnostics"], queryFn: deploymentService.diagnostics, enabled: canDiagnose, retry: false })
  const [formChanges, setFormChanges] = useState<Partial<UpdateDeploymentSettings>>({})
  const form = settingsQuery.data ? {
    hostName: settingsQuery.data.hostName,
    expectedIp: settingsQuery.data.expectedIp,
    gateway: settingsQuery.data.gateway,
    dnsServers: settingsQuery.data.dnsServers,
    ntpServers: settingsQuery.data.ntpServers,
    allowedNetworks: settingsQuery.data.allowedNetworks,
    proxyUrl: settingsQuery.data.proxyUrl,
    certificateMode: settingsQuery.data.certificateMode,
    ...formChanges,
  } : null

  const save = useMutation({
    mutationFn: () => deploymentService.update(form!),
    onSuccess: (data) => { queryClient.setQueryData(["deployment-settings"], data); setFormChanges({}); toast.success("Configuração de implantação atualizada.") },
    onError: (error) => toast.error(error.message),
  })
  const certificate = useMutation({
    mutationFn: ({ hostName, rotate }: { hostName: string; rotate: boolean }) => deploymentService.initializeCertificate(hostName, rotate),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["deployment-settings"] }); toast.success("Certificado interno emitido com sucesso.") },
    onError: (error) => toast.error(error.message),
  })
  const [downloading, setDownloading] = useState<"windows" | "linux" | null>(null)
  const downloadKit = async (platform: "windows" | "linux") => {
    setDownloading(platform)
    try {
      downloadBlob(await deploymentService.trustKit(platform), `sagep-kit-confianca-${platform}.zip`)
      toast.success("Kit de confiança gerado e auditado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar o kit")
    } finally { setDownloading(null) }
  }

  if (settingsQuery.isError) return <Alert variant="destructive"><TriangleAlert /><AlertTitle>Não foi possível carregar a implantação</AlertTitle><AlertDescription>{settingsQuery.error.message}</AlertDescription></Alert>
  if (!form || !settingsQuery.data) return <div className="space-y-6"><SettingsNavigation /><Skeleton className="h-28" /><Skeleton className="h-96" /></div>

  const settings = settingsQuery.data
  const diagnostics = diagnosticsQuery.data
  const set = <K extends keyof UpdateDeploymentSettings>(key: K, value: UpdateDeploymentSettings[K]) => setFormChanges((current) => ({ ...current, [key]: value }))
  const statusGood = settings.certificate.status === "VALID"

  return <div className="space-y-6">
    <SettingsNavigation />
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="mb-3">Implantação da OM</Badge><h1 className="text-3xl font-semibold tracking-tight">Rede, servidores e HTTPS</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Registre os parâmetros esperados, valide DNS e distribua confiança HTTPS aos clientes Windows 11, Linux Mint e Ubuntu.</p></div>{canManage && <Button onClick={() => save.mutate()} disabled={save.isPending}><Save />Salvar configuração</Button>}</div>

    <Alert><ShieldAlert /><AlertTitle>Configuração segura e assistida</AlertTitle><AlertDescription>Esta tela não altera IP, gateway ou DNS do sistema operacional. Ela registra os valores aprovados e compara com o ambiente detectado, evitando perda remota de acesso ao servidor.</AlertDescription></Alert>

    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Network className="size-5" />Parâmetros da rede interna</CardTitle><CardDescription>Use o endereço reservado no DHCP e o nome publicado no DNS interno da OM.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Nome DNS completo" value={form.hostName ?? ""} onChange={(value) => set("hostName", value || null)} placeholder="sagep.4cta.eb.mil.br" /></div>
        <Field label="IP interno esperado" value={form.expectedIp ?? ""} onChange={(value) => set("expectedIp", value || null)} placeholder="10.78.xxx.xxx" />
        <Field label="Gateway" value={form.gateway ?? ""} onChange={(value) => set("gateway", value || null)} placeholder="10.78.xxx.1" />
        <Field label="Servidores DNS" value={joinList(form.dnsServers)} onChange={(value) => set("dnsServers", splitList(value))} helper="Separe múltiplos endereços por vírgula." />
        <Field label="Servidores NTP" value={joinList(form.ntpServers)} onChange={(value) => set("ntpServers", splitList(value))} />
        <Field label="Redes autorizadas" value={joinList(form.allowedNetworks)} onChange={(value) => set("allowedNetworks", splitList(value))} placeholder="10.78.0.0/16" helper="Faixas CIDR que deverão alcançar o proxy reverso." />
        <Field label="Proxy de saída (opcional)" value={form.proxyUrl ?? ""} onChange={(value) => set("proxyUrl", value || null)} placeholder="http://proxy.om:3128" />
        <div className="space-y-2 sm:col-span-2"><Label>Modo de certificado</Label><select className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm" value={form.certificateMode} onChange={(event) => set("certificateMode", event.target.value as CertificateMode)}><option value="INTERNAL_CA">Autoridade interna por OM</option><option value="IMPORTED">Certificado importado</option><option value="ACME_DNS">ACME DNS-01</option></select></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Server className="size-5" />Diagnóstico observado</CardTitle><CardDescription>Dados vistos pelo container da API. Execute novamente após alterar DNS ou DHCP.</CardDescription></CardHeader><CardContent className="space-y-4">
        {!canDiagnose && <p className="text-sm text-muted-foreground">Sua conta não possui acesso aos detalhes técnicos.</p>}
        {diagnostics && <><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Host do servidor</p><p className="mt-1 font-mono text-sm">{diagnostics.hostName}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">DNS do sistema</p><p className="mt-1 font-mono text-sm">{diagnostics.systemDnsServers.join(", ") || "—"}</p></div></div>
          <div className="space-y-2">{diagnostics.interfaces.map((item) => <div key={`${item.interface}-${item.address}`} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{item.interface}</span><code>{item.address}</code></div>)}</div>
          <div className="rounded-lg border p-3 text-sm"><p className="font-medium">DNS interno</p><p className="mt-1 text-muted-foreground">{diagnostics.configuredHostName || "Nome ainda não configurado"} → {diagnostics.resolvedAddresses.join(", ") || "não resolvido"}</p>{diagnostics.dnsError && <p className="mt-2 text-xs text-destructive">{diagnostics.dnsError}</p>}</div>
          <div className="flex flex-wrap gap-2"><Badge variant="outline" className={diagnostics.expectedIpMatches ? "text-emerald-600" : "text-amber-600"}>{diagnostics.expectedIpMatches ? "IP esperado detectado" : "IP esperado divergente"}</Badge><Badge variant="outline" className={diagnostics.dnsMatchesExpectedIp ? "text-emerald-600" : "text-amber-600"}>{diagnostics.dnsMatchesExpectedIp ? "DNS coerente" : "DNS divergente"}</Badge></div></>}
        {canDiagnose && <Button variant="outline" onClick={() => diagnosticsQuery.refetch()} disabled={diagnosticsQuery.isFetching}><RefreshCw className={diagnosticsQuery.isFetching ? "animate-spin" : ""} />Executar diagnóstico</Button>}
      </CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Certificado HTTPS e confiança dos clientes</CardTitle><CardDescription>A raiz é exclusiva desta instalação. A chave privada permanece no volume protegido do servidor e nunca integra os kits.</CardDescription></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Estado</p><p className="mt-2 flex items-center gap-2 font-medium">{statusGood ? <CheckCircle2 className="size-4 text-emerald-500" /> : <TriangleAlert className="size-4 text-amber-500" />}{settings.certificate.status}</p></div><div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Validade restante</p><p className="mt-2 font-medium">{settings.certificate.daysRemaining == null ? "—" : `${settings.certificate.daysRemaining} dias`}</p></div><div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">OpenSSL no servidor</p><p className="mt-2 font-medium">{settings.certificate.toolAvailable ? "Disponível" : "Indisponível"}</p></div></div>
      {settings.certificate.rootFingerprintSha256 && <div className="rounded-lg border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Impressão digital SHA-256 da raiz</p><code className="mt-2 block break-all text-sm">{settings.certificate.rootFingerprintSha256}</code><p className="mt-2 text-xs text-muted-foreground">Confirme este valor por um canal confiável antes de instalar em qualquer estação.</p></div>}
      {canManage && <div className="flex flex-wrap gap-2"><Button onClick={() => { if (!form.hostName) return toast.error("Informe o nome DNS completo."); const rotate = settings.certificate.configured; if (rotate && !window.confirm("A rotação da raiz invalidará a confiança instalada nos clientes. Continuar?")) return; certificate.mutate({ hostName: form.hostName, rotate }) }} disabled={certificate.isPending || !settings.certificate.toolAvailable}><KeyRound />{settings.certificate.configured ? "Rotacionar certificado" : "Inicializar certificado interno"}</Button><Button variant="outline" onClick={() => downloadKit("windows")} disabled={!settings.certificate.configured || Boolean(downloading)}><Download />Kit Windows 11</Button><Button variant="outline" onClick={() => downloadKit("linux")} disabled={!settings.certificate.configured || Boolean(downloading)}><Download />Kit Mint / Ubuntu</Button></div>}
    </CardContent></Card>
  </div>
}
