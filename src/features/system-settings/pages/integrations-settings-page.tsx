import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Database, ExternalLink, PlugZap, RefreshCw, Save, Server, Settings2, ShieldCheck, TriangleAlert } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { systemSettingsService } from "../system-settings.service"
import type { ConnectionCheck, ConnectionStatus, IntegrationProvider, UpdateSystemSettings } from "../system-settings.types"

const providers: Array<{ id: IntegrationProvider; title: string; description: string; icon: typeof Database }> = [
  { id: "DATABASE", title: "Banco de dados", description: "PostgreSQL usado pelo SAGEP", icon: Database },
  { id: "PORTAL_TRANSPARENCIA", title: "Portal da Transparência", description: "Validação e atualização das NE", icon: ShieldCheck },
  { id: "COMPRAS_GOV", title: "Compras.gov.br", description: "Atas, pregões e saldos", icon: Server },
]

const statusMeta: Record<ConnectionStatus, { label: string; style: string }> = {
  OPERATIONAL: { label: "Operacional", style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  DEGRADED: { label: "Atenção", style: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  UNAVAILABLE: { label: "Indisponível", style: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300" },
  NOT_CONFIGURED: { label: "Não configurado", style: "border-border bg-muted text-muted-foreground" },
}

function Field({ label, value, onChange, type = "text", helper }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; helper?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />{helper && <p className="text-xs text-muted-foreground">{helper}</p>}</div>
}

function ConnectionCard({ provider, check, testing, onTest }: { provider: typeof providers[number]; check?: ConnectionCheck; testing: boolean; onTest?: () => void }) {
  const Icon = provider.icon
  const status = statusMeta[check?.status ?? "NOT_CONFIGURED"]
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="size-5" /></span><Badge variant="outline" className={status.style}>{status.label}</Badge></div><h3 className="mt-4 font-semibold">{provider.title}</h3><p className="mt-1 text-xs text-muted-foreground">{check?.message ?? provider.description}</p><div className="mt-4 flex items-center justify-between border-t pt-3"><span className="text-xs text-muted-foreground">{check ? `${check.latencyMs ?? "—"} ms · ${new Date(check.checkedAt).toLocaleString("pt-BR")}` : "Ainda não testada"}</span>{onTest && <Button size="sm" variant="outline" onClick={onTest} disabled={testing}><RefreshCw className={cn("size-4", testing && "animate-spin")} />Testar</Button>}</div></CardContent></Card>
}

export function IntegrationsSettingsPage() {
  const canManage = useAuthStore((state) => state.hasPermission("settings.manage"))
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ["system-settings"], queryFn: systemSettingsService.get })
  const [form, setForm] = useState<UpdateSystemSettings | null>(null)
  const [testing, setTesting] = useState<IntegrationProvider | "ALL" | null>(null)
  useEffect(() => { if (query.data) { const { id: _id, portalApiToken: _token, connections: _connections, ...values } = query.data; setForm(values) } }, [query.data])

  const saveMutation = useMutation({ mutationFn: () => systemSettingsService.update(form!), onSuccess: (data) => { queryClient.setQueryData(["system-settings"], data); toast.success("Integrações e parâmetros atualizados.") }, onError: (error) => toast.error(error.message) })
  const testOne = async (provider: IntegrationProvider) => { setTesting(provider); try { const check = await systemSettingsService.test(provider); queryClient.setQueryData(["system-settings"], (current: typeof query.data) => current ? { ...current, connections: { ...current.connections, [provider]: check } } : current); toast.success(check.message) } catch (error) { toast.error(error instanceof Error ? error.message : "Falha no teste") } finally { setTesting(null) } }
  const testAll = async () => { setTesting("ALL"); try { const response = await systemSettingsService.testAll(); queryClient.setQueryData(["system-settings"], (current: typeof query.data) => current ? { ...current, connections: { ...current.connections, ...Object.fromEntries(response.results.map((item) => [item.provider, item])) } } : current); toast.success("Todos os testes foram concluídos.") } catch (error) { toast.error(error instanceof Error ? error.message : "Falha nos testes") } finally { setTesting(null) } }
  const set = <K extends keyof UpdateSystemSettings>(key: K, value: UpdateSystemSettings[K]) => setForm((current) => current ? { ...current, [key]: value } : current)

  if (query.isLoading || !form) return <div className="space-y-6"><SettingsNavigation /><Skeleton className="h-28" /><Skeleton className="h-80" /></div>
  if (query.isError) return <Alert variant="destructive"><TriangleAlert /><AlertTitle>Não foi possível carregar as configurações</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>

  return <div className="space-y-6"><SettingsNavigation /><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="mb-3">Administração</Badge><h1 className="text-3xl font-semibold tracking-tight">Integrações e parâmetros</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Centralize os dados da OM e os endereços usados pelo SAGEP. As alterações passam a valer para as novas consultas.</p></div>{canManage && <div className="flex gap-2"><Button variant="outline" onClick={testAll} disabled={Boolean(testing)}><PlugZap />Testar tudo</Button><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Save />Salvar</Button></div>}</div>

    <div className="grid gap-4 lg:grid-cols-3">{providers.map((provider) => <ConnectionCard key={provider.id} provider={provider} check={query.data.connections[provider.id]} testing={testing === provider.id || testing === "ALL"} onTest={canManage ? () => testOne(provider.id) : undefined} />)}</div>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="size-5" />Identificação da organização</CardTitle><CardDescription>Valores institucionais utilizados como padrão em documentos e integrações.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><Field label="Nome da organização" value={form.organizationName} onChange={(v) => set("organizationName", v)} /><Field label="Sigla" value={form.organizationAcronym} onChange={(v) => set("organizationAcronym", v)} /><Field label="UASG" value={form.uasg} onChange={(v) => set("uasg", v.replace(/\D/g, "").slice(0, 6))} helper="6 dígitos" /><Field label="Gestão" value={form.management} onChange={(v) => set("management", v.replace(/\D/g, "").slice(0, 5))} helper="5 dígitos" /><Field label="Comando enquadrante" value={form.commandName} onChange={(v) => set("commandName", v)} /><Field label="Fuso horário" value={form.timeZone} onChange={(v) => set("timeZone", v)} helper="Ex.: America/Manaus" /></CardContent></Card>

    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Portal da Transparência</CardTitle><CardDescription>Consulta oficial de documentos de despesa e atualização das NE.</CardDescription></CardHeader><CardContent className="space-y-5"><Field label="URL base da API" value={form.portalTransparenciaBaseUrl} onChange={(v) => set("portalTransparenciaBaseUrl", v)} /><Field label="Intervalo automático (minutos)" type="number" value={form.portalSyncIntervalMinutes} onChange={(v) => set("portalSyncIntervalMinutes", Number(v))} /><label className="flex items-center gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={form.portalSyncOnStartup} onChange={(e) => set("portalSyncOnStartup", e.target.checked)} />Verificar NE automaticamente ao iniciar o backend</label><Alert><CheckCircle2 /><AlertTitle>Token protegido</AlertTitle><AlertDescription>{query.data.portalApiToken.configured ? `Configurado (${query.data.portalApiToken.masked})` : "Não configurado"}. Defina <code>PORTAL_TRANSPARENCIA_API_TOKEN</code> no arquivo <code>.env</code> do backend e reinicie o serviço. O token não é salvo nem exibido pelo navegador.</AlertDescription></Alert><a className="inline-flex items-center gap-2 text-sm text-primary hover:underline" href="https://portaldatransparencia.gov.br/api-de-dados" target="_blank" rel="noreferrer">Documentação oficial <ExternalLink className="size-4" /></a></CardContent></Card>

      <Card><CardHeader><CardTitle>Compras.gov.br e padrões</CardTitle><CardDescription>Endereço do serviço público e valores iniciais para importações e estimativas.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="URL base do Compras.gov.br" value={form.comprasGovBaseUrl} onChange={(v) => set("comprasGovBaseUrl", v)} /></div><Field label="Pregão padrão" value={form.defaultBiddingNumber ?? ""} onChange={(v) => set("defaultBiddingNumber", v || null)} /><Field label="Ano padrão" type="number" value={form.defaultBiddingYear ?? ""} onChange={(v) => set("defaultBiddingYear", v ? Number(v) : null)} /><Field label="Grupo padrão da estimativa" value={form.defaultEstimateGroup} onChange={(v) => set("defaultEstimateGroup", v)} /><label className="flex items-center gap-3 self-end rounded-lg border p-3 text-sm"><input type="checkbox" checked={form.defaultImmediateCommitment} onChange={(e) => set("defaultImmediateCommitment", e.target.checked)} />Empenho imediato por padrão</label></CardContent></Card></div>
  </div>
}
