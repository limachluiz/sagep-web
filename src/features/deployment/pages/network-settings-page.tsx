import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Download, KeyRound, Network, RefreshCw, Save, Server, ShieldAlert, ShieldCheck, TriangleAlert, XCircle } from "lucide-react"
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
import type { UpdateDeploymentSettings } from "../deployment.types"

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
  const preflightQuery = useQuery({ queryKey: ["deployment-preflight"], queryFn: deploymentService.preflight, enabled: canDiagnose, retry: false })
  const [formChanges, setFormChanges] = useState<Partial<UpdateDeploymentSettings>>({})
  const [proxyRestartPending, setProxyRestartPending] = useState(false)
  const form = settingsQuery.data ? {
    hostName: settingsQuery.data.hostName,
    expectedIp: settingsQuery.data.expectedIp,
    gateway: settingsQuery.data.gateway,
    dnsServers: settingsQuery.data.dnsServers,
    ntpServers: settingsQuery.data.ntpServers,
    allowedNetworks: settingsQuery.data.allowedNetworks,
    proxyUrl: settingsQuery.data.proxyUrl,
    certificateMode: "INTERNAL_CA" as const,
    ...formChanges,
  } : null

  const save = useMutation({
    mutationFn: () => deploymentService.update(form!),
    onSuccess: (data) => { queryClient.setQueryData(["deployment-settings"], data); setFormChanges({}); toast.success("Configuração de implantação atualizada.") },
    onError: (error) => toast.error(error.message),
  })
  const authority = useMutation({
    mutationFn: ({ hostName, rotate }: { hostName: string; rotate: boolean }) => deploymentService.initializeCertificate(hostName, rotate),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["deployment-settings"] }); void queryClient.invalidateQueries({ queryKey: ["deployment-preflight"] }); void queryClient.invalidateQueries({ queryKey: ["header", "operational-alerts"] }); setProxyRestartPending(true); toast.success("Autoridade e certificado emitidos com sucesso.") },
    onError: (error) => toast.error(error.message),
  })
  const renewal = useMutation({
    mutationFn: deploymentService.renewCertificate,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["deployment-settings"] }); void queryClient.invalidateQueries({ queryKey: ["deployment-preflight"] }); void queryClient.invalidateQueries({ queryKey: ["header", "operational-alerts"] }); setProxyRestartPending(true); toast.success("Certificado renovado sem alterar a autoridade da OM.") },
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
  const preflight = preflightQuery.data
  const set = <K extends keyof UpdateDeploymentSettings>(key: K, value: UpdateDeploymentSettings[K]) => setFormChanges((current) => ({ ...current, [key]: value }))
  const statusGood = settings.certificate.status === "VALID"

  return <div className="space-y-6">
    <SettingsNavigation />
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="mb-3">Implantação da OM</Badge><h1 className="text-3xl font-semibold tracking-tight">Rede, servidores e HTTPS</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Registre os parâmetros esperados, valide DNS e distribua confiança HTTPS aos clientes Windows 11, Linux Mint e Ubuntu.</p></div>{canManage && <Button onClick={() => save.mutate()} disabled={save.isPending}><Save />Salvar configuração</Button>}</div>

    <Alert><ShieldAlert /><AlertTitle>Configuração segura e assistida</AlertTitle><AlertDescription>Esta tela não altera IP, gateway ou DNS do sistema operacional. Ela registra os valores aprovados e compara com o ambiente detectado, evitando perda remota de acesso ao servidor.</AlertDescription></Alert>

    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Prontidão para produção</CardTitle><CardDescription className="mt-2">Verificação somente leitura dos requisitos necessários para ativar o SAGEP com segurança na OM.</CardDescription></div>
        {canDiagnose && <Button variant="outline" onClick={() => preflightQuery.refetch()} disabled={preflightQuery.isFetching}><RefreshCw className={preflightQuery.isFetching ? "animate-spin" : ""} />Verificar novamente</Button>}
      </CardHeader>
      <CardContent className="space-y-5">
        {!canDiagnose && <p className="text-sm text-muted-foreground">Sua conta não possui acesso aos detalhes técnicos da implantação.</p>}
        {preflightQuery.isError && <Alert variant="destructive"><TriangleAlert /><AlertTitle>Verificação indisponível</AlertTitle><AlertDescription>{preflightQuery.error.message}</AlertDescription></Alert>}
        {canDiagnose && preflightQuery.isPending && <Skeleton className="h-32" />}
        {preflight && <>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Resultado</p><p className={`mt-2 font-semibold ${preflight.status === "READY" ? "text-emerald-600" : preflight.status === "BLOCKED" ? "text-destructive" : "text-amber-600"}`}>{preflight.status === "READY" ? "Pronto" : preflight.status === "BLOCKED" ? "Bloqueado" : "Requer atenção"}</p></div>
            <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Aprovados</p><p className="mt-2 text-xl font-semibold text-emerald-600">{preflight.counts.pass}</p></div>
            <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Alertas</p><p className="mt-2 text-xl font-semibold text-amber-600">{preflight.counts.warn}</p></div>
            <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Bloqueios</p><p className="mt-2 text-xl font-semibold text-destructive">{preflight.counts.fail}</p></div>
          </div>
          <div className="space-y-3">
            {preflight.checks.filter((item) => item.status !== "PASS").map((item) => <div key={item.id} className={`rounded-lg border p-4 ${item.status === "FAIL" ? "border-destructive/40 bg-destructive/5" : "border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/10"}`}>
              <div className="flex items-start gap-3">{item.status === "FAIL" ? <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" /> : <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />}<div><p className="font-medium">{item.label}</p><p className="mt-1 text-sm text-muted-foreground">{item.message}</p>{item.remediation && <p className="mt-2 text-sm font-medium">Correção: {item.remediation}</p>}</div></div>
            </div>)}
            {preflight.counts.fail === 0 && preflight.counts.warn === 0 && <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4"><CheckCircle2 className="size-5 text-emerald-600" /><p className="text-sm font-medium">Todos os requisitos verificados foram aprovados.</p></div>}
          </div>
          <p className="text-xs text-muted-foreground">Última verificação: {new Date(preflight.checkedAt).toLocaleString("pt-BR")}</p>
        </>}
      </CardContent>
    </Card>

    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Network className="size-5" />Parâmetros da rede interna</CardTitle><CardDescription>Use o endereço reservado no DHCP e o nome publicado no DNS interno da OM.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Nome DNS completo" value={form.hostName ?? ""} onChange={(value) => set("hostName", value || null)} placeholder="sagep.4cta.eb.mil.br" /></div>
        <Field label="IP interno esperado" value={form.expectedIp ?? ""} onChange={(value) => set("expectedIp", value || null)} placeholder="10.78.xxx.xxx" />
        <Field label="Gateway" value={form.gateway ?? ""} onChange={(value) => set("gateway", value || null)} placeholder="10.78.xxx.1" />
        <Field label="Servidores DNS" value={joinList(form.dnsServers)} onChange={(value) => set("dnsServers", splitList(value))} helper="Separe múltiplos endereços por vírgula." />
        <Field label="Servidores NTP" value={joinList(form.ntpServers)} onChange={(value) => set("ntpServers", splitList(value))} />
        <Field label="Redes autorizadas" value={joinList(form.allowedNetworks)} onChange={(value) => set("allowedNetworks", splitList(value))} placeholder="10.78.0.0/16" helper="Faixas CIDR que deverão alcançar o proxy reverso." />
        <Field label="Proxy de saída (opcional)" value={form.proxyUrl ?? ""} onChange={(value) => set("proxyUrl", value || null)} placeholder="http://proxy.om:3128" />
        <div className="space-y-2 sm:col-span-2"><Label>Modo de certificado</Label><div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">Autoridade interna exclusiva da OM</div><p className="text-xs text-muted-foreground">Fluxo homologado para redes internas sem dependência do DNS público.</p></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Server className="size-5" />Diagnóstico observado</CardTitle><CardDescription>Dados vistos pelo container da API. Execute novamente após alterar DNS ou DHCP.</CardDescription></CardHeader><CardContent className="space-y-4">
        {!canDiagnose && <p className="text-sm text-muted-foreground">Sua conta não possui acesso aos detalhes técnicos.</p>}
        {diagnostics && <><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Host do servidor</p><p className="mt-1 font-mono text-sm">{diagnostics.hostName}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">DNS do sistema</p><p className="mt-1 font-mono text-sm">{diagnostics.systemDnsServers.join(", ") || "—"}</p></div></div>
          <div className="rounded-lg border p-3 text-sm"><p className="text-xs text-muted-foreground">Publicação do proxy</p><p className="mt-1 font-mono">{diagnostics.environmentHostName || "hostname não carregado"} → {diagnostics.bindIp || "IP não carregado"}</p></div>
          <div className="space-y-2">{diagnostics.interfaces.map((item) => <div key={`${item.interface}-${item.address}`} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{item.interface}</span><code>{item.address}</code></div>)}</div>
          <div className="rounded-lg border p-3 text-sm"><p className="font-medium">DNS interno</p><p className="mt-1 text-muted-foreground">{diagnostics.configuredHostName || "Nome ainda não configurado"} → {diagnostics.resolvedAddresses.join(", ") || "não resolvido"}</p>{diagnostics.dnsError && <p className="mt-2 text-xs text-destructive">{diagnostics.dnsError}</p>}</div>
          <div className="flex flex-wrap gap-2"><Badge variant="outline" className={diagnostics.expectedIpMatches ? "text-emerald-600" : "text-amber-600"}>{diagnostics.expectedIpMatches ? "IP esperado detectado" : "IP esperado divergente"}</Badge><Badge variant="outline" className={diagnostics.dnsMatchesExpectedIp ? "text-emerald-600" : "text-amber-600"}>{diagnostics.dnsMatchesExpectedIp ? "DNS coerente" : "DNS divergente"}</Badge></div></>}
        {canDiagnose && <Button variant="outline" onClick={() => diagnosticsQuery.refetch()} disabled={diagnosticsQuery.isFetching}><RefreshCw className={diagnosticsQuery.isFetching ? "animate-spin" : ""} />Executar diagnóstico</Button>}
      </CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Certificado HTTPS e confiança dos clientes</CardTitle><CardDescription>A raiz é exclusiva desta instalação. A chave privada permanece no volume protegido do servidor e nunca integra os kits.</CardDescription></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3"><div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Estado</p><p className="mt-2 flex items-center gap-2 font-medium">{statusGood ? <CheckCircle2 className="size-4 text-emerald-500" /> : <TriangleAlert className="size-4 text-amber-500" />}{settings.certificate.status}</p></div><div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Validade restante</p><p className="mt-2 font-medium">{settings.certificate.daysRemaining == null ? "—" : `${settings.certificate.daysRemaining} dias`}</p></div><div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">OpenSSL no servidor</p><p className="mt-2 font-medium">{settings.certificate.toolAvailable ? "Disponível" : "Indisponível"}</p></div></div>
      {settings.certificate.renewalAlert && <Alert variant={settings.certificate.renewalAlert.severity === "CRITICAL" ? "destructive" : "default"}><TriangleAlert /><AlertTitle>{settings.certificate.renewalAlert.label}</AlertTitle><AlertDescription>Renove o certificado do servidor. A autoridade raiz será preservada e os kits já instalados continuarão confiáveis.</AlertDescription></Alert>}
      {proxyRestartPending && <Alert><RefreshCw /><AlertTitle>Recarregamento do proxy pendente</AlertTitle><AlertDescription>Execute <code>docker compose --profile https restart caddy</code> no servidor para o Caddy carregar o novo certificado.</AlertDescription></Alert>}
      {settings.certificate.rootFingerprintSha256 && <div className="rounded-lg border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Impressão digital SHA-256 da raiz</p><code className="mt-2 block break-all text-sm">{settings.certificate.rootFingerprintSha256}</code><p className="mt-2 text-xs text-muted-foreground">Confirme este valor por um canal confiável antes de instalar em qualquer estação.</p></div>}
      {canManage && <div className="flex flex-wrap gap-2">{settings.certificate.configured ? <><Button onClick={() => renewal.mutate()} disabled={renewal.isPending || authority.isPending || !settings.certificate.toolAvailable}><RefreshCw className={renewal.isPending ? "animate-spin" : ""} />Renovar certificado do servidor</Button><Button variant="outline" onClick={() => { if (!form.hostName) return toast.error("Informe o nome DNS completo."); if (!window.confirm("A rotação substituirá a autoridade raiz e exigirá reinstalar os kits de confiança em todas as estações. Continuar?")) return; authority.mutate({ hostName: form.hostName, rotate: true }) }} disabled={renewal.isPending || authority.isPending || !settings.certificate.toolAvailable}><KeyRound />Rotacionar autoridade raiz</Button></> : <Button onClick={() => { if (!form.hostName) return toast.error("Informe o nome DNS completo."); authority.mutate({ hostName: form.hostName, rotate: false }) }} disabled={authority.isPending || !settings.certificate.toolAvailable}><KeyRound />Inicializar autoridade interna</Button>}<Button variant="outline" onClick={() => downloadKit("windows")} disabled={!settings.certificate.configured || Boolean(downloading)}><Download />Kit Windows 11</Button><Button variant="outline" onClick={() => downloadKit("linux")} disabled={!settings.certificate.configured || Boolean(downloading)}><Download />Kit Mint / Ubuntu</Button></div>}
    </CardContent></Card>
  </div>
}
