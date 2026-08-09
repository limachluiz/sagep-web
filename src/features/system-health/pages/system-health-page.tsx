import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import {
  Activity,
  AlertTriangle,
  Box,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Database,
  Gauge,
  HardDrive,
  Info,
  MonitorCheck,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  WifiOff,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/auth.store"
import { SettingsNavigation } from "@/features/system-health/components/settings-navigation"
import { systemHealthService } from "@/features/system-health/system-health.service"
import type { HealthComponent, HealthStatus, SystemHealthSnapshot } from "@/features/system-health/system-health.types"
import { cn } from "@/lib/utils"

const statusMeta: Record<HealthStatus, { label: string; className: string; dot: string }> = {
  operational: { label: "Operacional", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  degraded: { label: "Atenção", className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  unavailable: { label: "Indisponível", className: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300", dot: "bg-red-500" },
  not_monitored: { label: "Não monitorado", className: "border-border bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value))
}

function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days) return `${days}d ${hours}h`
  if (hours) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

function StatusBadge({ status }: { status: HealthStatus }) {
  const meta = statusMeta[status]
  return <Badge variant="outline" className={cn("gap-2", meta.className)}><span className={cn("size-1.5 rounded-full", meta.dot, status === "operational" && "shadow-[0_0_8px_currentColor]")} />{meta.label}</Badge>
}

function MetricCard({ label, value, helper, icon: Icon }: { label: string; value: string; helper: string; icon: typeof Gauge }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div><p className="text-xs font-semibold uppercase tracking-[.13em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></div>
        <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="size-5" /></span>
      </CardContent>
    </Card>
  )
}

function ComponentCard({ component, icon: Icon }: { component: HealthComponent; icon: typeof Activity }) {
  return (
    <Card className="relative overflow-hidden border-none shadow-sm">
      <span className={cn("absolute inset-y-0 left-0 w-1", statusMeta[component.status].dot)} />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-lg border bg-muted/40 p-2.5 text-primary"><Icon className="size-5" /></span>
          <StatusBadge status={component.status} />
        </div>
        <h3 className="mt-4 font-semibold">{component.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{component.description}</p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">{component.message}</p>
          <p className="shrink-0 font-mono text-sm font-semibold">{component.latencyMs === null ? "—" : `${component.latencyMs} ms`}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function HealthLoading() {
  return <div className="space-y-5"><Skeleton className="h-52 w-full" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)}</div><Skeleton className="h-80 w-full" /></div>
}

function disconnectedSnapshot(): SystemHealthSnapshot {
  const now = new Date().toISOString()
  return {
    status: "unavailable", checkedAt: now, uptimeSeconds: 0, availabilityPercent: 0, observationWindowStartedAt: now,
    components: [
      { id: "api", name: "API SAGEP", description: "Comunicação entre frontend e backend", status: "unavailable", latencyMs: null, critical: true, message: "O navegador não conseguiu alcançar a API" },
      { id: "database", name: "PostgreSQL", description: "Persistência e consultas do SAGEP", status: "not_monitored", latencyMs: null, critical: true, message: "Sem comunicação com a API para executar o diagnóstico" },
      { id: "pgadmin", name: "pgAdmin", description: "Console administrativo do PostgreSQL", status: "not_monitored", latencyMs: null, critical: false, message: "Sem comunicação com a API para executar o diagnóstico" },
    ],
    summary: { operational: 0, degraded: 0, unavailable: 1, notMonitored: 2 }, history: [],
  }
}

export function SystemHealthPage() {
  const queryClient = useQueryClient()
  const [manualRefreshing, setManualRefreshing] = useState(false)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const canViewDetails = hasPermission("system_health.view_details")
  const statusQuery = useQuery({
    queryKey: ["system-health", "status"],
    queryFn: () => systemHealthService.getStatus(),
    refetchInterval: 30_000,
    retry: 1,
  })
  const detailsQuery = useQuery({
    queryKey: ["system-health", "details"],
    queryFn: () => systemHealthService.getDetails(),
    enabled: canViewDetails && Boolean(statusQuery.data),
    refetchInterval: 60_000,
    retry: false,
  })

  const refresh = async () => {
    setManualRefreshing(true)
    try {
      const [status, details] = await Promise.all([
        systemHealthService.getStatus(true),
        canViewDetails ? systemHealthService.getDetails(true).catch(() => null) : Promise.resolve(null),
      ])
      queryClient.setQueryData(["system-health", "status"], status)
      if (details) queryClient.setQueryData(["system-health", "details"], details)
    } finally {
      setManualRefreshing(false)
    }
  }

  if (statusQuery.isLoading) return <div className="space-y-6"><SettingsNavigation /><HealthLoading /></div>

  const disconnected = statusQuery.isError
  const snapshot = statusQuery.data?.snapshot ?? disconnectedSnapshot()
  const roundTripMs = statusQuery.data?.roundTripMs ?? null
  const frontend: HealthComponent = {
    id: "api",
    name: "Frontend",
    description: "Interface carregada no navegador",
    status: navigator.onLine ? "operational" : "degraded",
    latencyMs: roundTripMs,
    critical: true,
    message: navigator.onLine ? "Aplicação carregada e navegador conectado" : "Navegador sinaliza ausência de rede",
  }
  const combinedStatus = disconnected ? "unavailable" : !navigator.onLine && snapshot.status === "operational" ? "degraded" : snapshot.status
  const databaseLatency = snapshot.components.find((item) => item.id === "database")?.latencyMs ?? null
  const chartData = snapshot.history.map((point) => ({ ...point, time: formatTime(point.timestamp), availability: point.status === "operational" ? 100 : point.status === "degraded" ? 60 : 0 }))
  const componentIcons = { api: ServerCog, database: Database, pgadmin: HardDrive } as const
  const transitions = snapshot.history.filter((point, index, items) => index > 0 && point.status !== items[index - 1].status).slice(-5).reverse()

  return (
    <div className="space-y-6">
      <SettingsNavigation />

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><Badge className="mb-3">Configurações · Observabilidade</Badge><h1 className="text-3xl font-semibold tracking-tight">Centro de Saúde do SAGEP</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Visão integrada da comunicação, serviços essenciais e infraestrutura da aplicação.</p></div>
        <Button variant="outline" onClick={() => void refresh()} disabled={manualRefreshing || statusQuery.isFetching || detailsQuery.isFetching}><RefreshCw className={cn("size-4", (manualRefreshing || statusQuery.isFetching || detailsQuery.isFetching) && "animate-spin")} />Executar diagnóstico</Button>
      </div>

      {disconnected && <Alert variant="destructive"><WifiOff /><AlertTitle>A comunicação com o backend foi interrompida</AlertTitle><AlertDescription>O frontend está carregado, mas a API não respondeu. Confirme o container <span className="font-mono">sagep_api</span> e a porta configurada antes de verificar o banco.</AlertDescription></Alert>}

      <Card className="overflow-hidden border-none bg-sidebar text-sidebar-foreground shadow-lg">
        <CardContent className="relative p-6 lg:p-8">
          <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-sidebar-primary/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <span className={cn("rounded-xl border p-3", combinedStatus === "operational" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : combinedStatus === "degraded" ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-red-400/20 bg-red-400/10 text-red-300")}>
                {combinedStatus === "operational" ? <ShieldCheck className="size-8" /> : <AlertTriangle className="size-8" />}
              </span>
              <div><div className="flex flex-wrap items-center gap-3"><p className="text-xs font-bold uppercase tracking-[.2em] text-sidebar-primary">Situação geral</p><StatusBadge status={combinedStatus} /></div><h2 className="mt-3 text-2xl font-semibold lg:text-3xl">{combinedStatus === "operational" ? "Todos os sistemas operacionais" : combinedStatus === "degraded" ? "O ambiente exige atenção" : "Há indisponibilidade no SAGEP"}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-sidebar-foreground/65">{combinedStatus === "operational" ? "Frontend, API e serviços essenciais estão respondendo dentro dos parâmetros observados." : "Consulte os componentes abaixo para identificar a origem e a ação recomendada."}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 text-center sm:grid-cols-3 lg:min-w-[420px]">
              <div className="bg-sidebar/80 p-4"><p className="text-2xl font-semibold text-sidebar-primary">{snapshot.availabilityPercent}%</p><p className="mt-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/55">Disponibilidade</p></div>
              <div className="bg-sidebar/80 p-4"><p className="text-2xl font-semibold">{snapshot.summary.operational + (frontend.status === "operational" ? 1 : 0)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/55">Operacionais</p></div>
              <div className="col-span-2 bg-sidebar/80 p-4 sm:col-span-1"><p className="text-sm font-semibold">{formatDateTime(snapshot.checkedAt)}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-sidebar-foreground/55">Última verificação</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Disponibilidade observada" value={`${snapshot.availabilityPercent}%`} helper="Desde a inicialização da API" icon={CircleGauge} />
        <MetricCard label="Resposta frontend → API" value={roundTripMs === null ? "—" : `${roundTripMs} ms`} helper="Tempo completo da requisição" icon={Activity} />
        <MetricCard label="Resposta do PostgreSQL" value={databaseLatency === null ? "—" : `${databaseLatency} ms`} helper="Consulta real SELECT 1" icon={Database} />
        <MetricCard label="Uptime da API" value={formatDuration(snapshot.uptimeSeconds)} helper="Desde a última inicialização" icon={Clock3} />
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold">Cadeia de funcionamento</h2><p className="mt-1 text-sm text-muted-foreground">Cada etapa é verificada por uma sonda adequada ao serviço.</p></div><Badge variant="outline">Atualização automática · 30 s</Badge></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ComponentCard component={frontend} icon={MonitorCheck} />
          {snapshot.components.map((component) => <ComponentCard key={component.id} component={component} icon={componentIcons[component.id]} />)}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.8fr)]">
        <Card className="border-none shadow-sm"><CardHeader><CardTitle>Latência dos serviços</CardTitle><CardDescription>Histórico das últimas {snapshot.history.length} verificações armazenadas em memória.</CardDescription></CardHeader><CardContent><div className="h-[270px] w-full">{chartData.length > 1 ? <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ left: -14, right: 12, top: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.28} /><XAxis dataKey="time" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={30} /><YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" ms" /><Tooltip contentStyle={{ borderRadius: 8, borderColor: "hsl(var(--border))" }} /><Line type="monotone" dataKey="apiLatencyMs" name="API" stroke="#b58a2d" strokeWidth={2.2} dot={false} /><Line type="monotone" dataKey="databaseLatencyMs" name="PostgreSQL" stroke="#3f7d61" strokeWidth={2.2} dot={false} connectNulls /></LineChart></ResponsiveContainer> : <div className="flex h-full flex-col items-center justify-center text-center"><Activity className="size-9 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Histórico em formação</p><p className="mt-1 text-xs text-muted-foreground">O gráfico aparecerá após a próxima verificação automática.</p></div>}</div></CardContent></Card>
        <Card className="border-none shadow-sm"><CardHeader><CardTitle>Estabilidade observada</CardTitle><CardDescription>Percentual de saúde em cada amostra.</CardDescription></CardHeader><CardContent><div className="h-[190px] w-full">{chartData.length > 1 ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ left: -28, right: 4, top: 8 }}><defs><linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3f7d61" stopOpacity={0.45} /><stop offset="95%" stopColor="#3f7d61" stopOpacity={0.03} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} /><XAxis dataKey="time" hide /><YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit="%" /><Tooltip /><Area type="stepAfter" dataKey="availability" name="Saúde" stroke="#3f7d61" fill="url(#healthFill)" strokeWidth={2} /></AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Aguardando novas amostras</div>}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-md bg-emerald-500/10 p-2"><p className="font-semibold text-emerald-700 dark:text-emerald-300">{snapshot.summary.operational}</p><p className="text-[10px] text-muted-foreground">Operacionais</p></div><div className="rounded-md bg-amber-500/10 p-2"><p className="font-semibold text-amber-700 dark:text-amber-300">{snapshot.summary.degraded}</p><p className="text-[10px] text-muted-foreground">Atenção</p></div><div className="rounded-md bg-red-500/10 p-2"><p className="font-semibold text-red-700 dark:text-red-300">{snapshot.summary.unavailable}</p><p className="text-[10px] text-muted-foreground">Indisponíveis</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-none shadow-sm"><CardHeader><CardTitle>Ocorrências recentes</CardTitle><CardDescription>Mudanças de estado detectadas desde a inicialização da API.</CardDescription></CardHeader><CardContent>{transitions.length ? <div className="space-y-4">{transitions.map((point) => <div key={point.timestamp} className="flex items-start gap-3"><span className={cn("mt-1 size-2.5 rounded-full", statusMeta[point.status].dot)} /><div><p className="text-sm font-medium">Estado alterado para {statusMeta[point.status].label.toLowerCase()}</p><p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(point.timestamp)}</p></div></div>)}</div> : <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 text-center"><CheckCircle2 className="size-8 text-emerald-600" /><p className="mt-3 text-sm font-medium">Nenhuma ocorrência detectada</p><p className="mt-1 text-xs text-muted-foreground">O ambiente permaneceu estável na janela observada.</p></div>}</CardContent></Card>

        <Card className="border-none shadow-sm"><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Diagnóstico técnico</CardTitle><CardDescription className="mt-1">Detalhes protegidos para administração do ambiente.</CardDescription></div><Badge variant="outline"><ShieldCheck className="size-3.5" />ADMIN</Badge></div></CardHeader><CardContent>{canViewDetails && detailsQuery.data ? <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><div className="rounded-lg border bg-muted/25 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Runtime</p><p className="mt-1 font-mono text-sm font-semibold">Node {detailsQuery.data.diagnostics.runtime.nodeVersion}</p></div><div className="rounded-lg border bg-muted/25 p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Memória</p><p className="mt-1 font-mono text-sm font-semibold">{detailsQuery.data.diagnostics.memory.heapUsedMb} / {detailsQuery.data.diagnostics.memory.heapTotalMb} MB</p></div></div><div className="divide-y rounded-lg border">{detailsQuery.data.diagnostics.infrastructure.units.map((unit) => <div key={unit.name} className="flex items-center gap-3 px-4 py-3"><Box className="size-4 text-primary" /><div className="min-w-0 flex-1"><p className="truncate font-mono text-sm font-medium">{unit.name}</p><p className="text-xs text-muted-foreground">{unit.healthSource === "process" ? "Processo da API" : unit.healthSource === "database-query" ? "Consulta ao banco" : "Sonda HTTP interna"}</p></div><StatusBadge status={unit.status} /></div>)}</div><Alert><Info /><AlertTitle>Monitoramento com privilégio mínimo</AlertTitle><AlertDescription>O SAGEP verifica os serviços sem expor o socket administrativo do Docker ao container da API.</AlertDescription></Alert></div> : canViewDetails && detailsQuery.isError ? <Alert variant="destructive"><AlertTriangle /><AlertTitle>Detalhes técnicos temporariamente indisponíveis</AlertTitle><AlertDescription>O resumo sanitizado continua ativo. O diagnóstico administrativo depende de uma sessão válida e da comunicação com o banco.</AlertDescription></Alert> : <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 text-center"><ServerCog className="size-9 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Visão técnica restrita</p><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">O resumo acima é suficiente para o usuário identificar indisponibilidade. Runtime, memória e unidades de infraestrutura são exibidos somente ao administrador.</p></div>}</CardContent></Card>
      </div>
    </div>
  )
}
