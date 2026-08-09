import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  FileText,
  Loader2,
  RefreshCw,
  WalletCards,
} from "lucide-react"
import { Link } from "react-router"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { dashboardService } from "@/features/dashboard/dashboard.service"
import type {
  DashboardOverviewFilters,
  DashboardOverviewResponse,
  ProjectStage,
} from "@/features/dashboard/dashboard.types"
import type { ExecutiveFilterMode } from "@/features/dashboard/executive-period"

const stageLabels: Record<ProjectStage, string> = {
  ESTIMATIVA_PRECO: "Estimativa",
  AGUARDANDO_NOTA_CREDITO: "Aguardando NC",
  DIEX_REQUISITORIO: "DIEx",
  AGUARDANDO_NOTA_EMPENHO: "Aguardando NE",
  OS_LIBERADA: "OS liberada",
  AGUARDANDO_OS_ASSINADA: "OS assinada",
  AGUARDANDO_INICIO_EXECUCAO: "Aguardando início",
  SERVICO_EM_EXECUCAO: "Em execução",
  ANALISANDO_AS_BUILT: "As-Built",
  ATESTAR_NF: "Atestar NF",
  SERVICO_CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function firstDayOfMonth() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function OverviewContent({ data }: { data: DashboardOverviewResponse }) {
  const pendingActions = [
    { label: "Nota de Crédito", value: data.pendingActions.awaitingCreditNote },
    { label: "Formalizar DIEx", value: data.pendingActions.awaitingDiexFormalization },
    { label: "Nota de Empenho", value: data.pendingActions.awaitingCommitmentNote },
    { label: "Emitir OS", value: data.pendingActions.awaitingServiceOrder },
    { label: "Receber OS assinada", value: data.pendingActions.awaitingSignedServiceOrder },
    { label: "Iniciar execução", value: data.pendingActions.awaitingExecutionStart },
    { label: "Analisar As-Built", value: data.pendingActions.awaitingAsBuiltAnalysis },
    { label: "Atestar NF", value: data.pendingActions.awaitingInvoiceAttestation },
  ]
  const pendingTotal = pendingActions.reduce((total, item) => total + item.value, 0)
  const pipeline = data.pipeline.projectsByStage.map((item) => ({
    ...item,
    label: stageLabels[item.stage],
  }))
  const metrics = [
    {
      label: "Projetos abertos",
      value: data.summary.projectsOpen,
      helper: `${data.summary.projectsCompleted} concluídos`,
      icon: BriefcaseBusiness,
      tone: "primary",
    },
    {
      label: "Valor estimado",
      value: formatCurrency(data.financial.totalEstimatedAmount),
      helper: `${data.summary.estimatesFinalized} estimativas finalizadas`,
      icon: WalletCards,
      tone: "primary",
    },
    {
      label: "Ordens de Serviço",
      value: data.summary.serviceOrdersIssued,
      helper: `${data.documents.serviceOrders.scheduled} programadas`,
      icon: ClipboardCheck,
      tone: "success",
    },
    {
      label: "Exigem atenção",
      value: data.summary.projectsNeedingAttention,
      helper: `${pendingTotal} ações pendentes`,
      icon: FileClock,
      tone: "warning",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="sagep-signal-hero overflow-hidden">
        <CardContent className="p-6 lg:p-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <Badge className="bg-status-success/10 text-status-success hover:bg-status-success/10">SITREP do portfólio</Badge>
              <h2 className="mt-3 text-2xl font-semibold">Posição consolidada do SAGEP</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Leitura integrada da carteira, tramitação documental e valores registrados.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
              <div className="sagep-metric-tile p-3"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Projetos</dt><dd className="mt-1 text-2xl font-semibold">{data.totals.projects}</dd></div>
              <div className="sagep-metric-tile p-3"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Tarefas</dt><dd className="mt-1 text-2xl font-semibold">{data.totals.tasks}</dd></div>
              <div className="sagep-metric-tile p-3"><dt className="text-xs tracking-wide text-muted-foreground uppercase">DIEx emitidos</dt><dd className="mt-1 text-2xl font-semibold">{data.summary.diexIssued}</dd></div>
              <div className="sagep-metric-tile p-3"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Itens de ATA</dt><dd className="mt-1 text-2xl font-semibold">{data.totals.ataItems}</dd></div>
            </dl>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className={`flex size-11 items-center justify-center rounded-sm border ${
                    metric.tone === "warning"
                      ? "border-status-warning/20 bg-status-warning/10 text-status-warning"
                      : metric.tone === "success"
                        ? "border-status-success/20 bg-status-success/10 text-status-success"
                        : "border-primary/20 bg-primary/10 text-primary"
                  }`}>
                    <Icon className="size-5" />
                  </span>
                  <CheckCircle2 className="size-4 text-primary" />
                </div>
                <p className="mt-5 text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-1 font-heading text-3xl font-semibold tracking-tight">{metric.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{metric.helper}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[.16em] text-primary uppercase">Carteira por etapa</p>
              <CardTitle className="mt-1">Pipeline de projetos</CardTitle>
            </div>
            <Badge variant="outline">{data.totals.projects} projetos</Badge>
          </CardHeader>
          <CardContent className="h-80">
            {pipeline.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline} layout="vertical" margin={{ left: 12, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="label" width={115} tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip formatter={(value, name) => name === "Valor estimado" ? formatCurrency(Number(value)) : value} />
                  <Bar dataKey="count" name="Projetos" radius={[0, 3, 3, 0]} fill="var(--chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Nenhum projeto no período.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingActions.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-sm border border-primary/10 bg-background/35 px-3 py-2.5">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <Badge variant={item.value ? "secondary" : "outline"}>{item.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Projetos que exigem atenção</CardTitle>
            <Badge variant="outline">{data.attention.length} prioritários</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.attention.length ? data.attention.slice(0, 7).map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`} className="flex flex-col gap-3 rounded-xl border p-4 transition hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">PRJ-{project.projectCode} · {project.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{project.reason} · {stageLabels[project.stage]}</p>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="text-sm font-medium">{formatCurrency(project.totalEstimatedAmount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(project.updatedAt)}</p>
                </div>
              </Link>
            )) : (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="size-10 text-status-success" />
                <p className="mt-3 font-medium">Nenhum projeto exige atenção</p>
                <p className="mt-1 text-sm text-muted-foreground">A carteira não possui gargalos no período selecionado.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos e valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="size-4 text-primary" />DIEx formalizados</span><strong>{data.documents.diex.withNumber}</strong></div>
              <p className="mt-2 text-xs text-muted-foreground">{data.documents.diex.draft} minutas em aberto</p>
            </div>
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted-foreground"><ClipboardCheck className="size-4 text-primary" />Ordens de Serviço</span><strong>{data.documents.serviceOrders.total}</strong></div>
              <p className="mt-2 text-xs text-muted-foreground">{data.documents.serviceOrders.emergency} emergenciais</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/[.04] p-4">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Valor com OS</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(data.financial.totalWithServiceOrder)}</p>
            </div>
            <Link to="/projects" className="flex items-center justify-between rounded-sm px-1 py-2 text-sm font-medium text-primary hover:underline">
              Abrir carteira de projetos <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DashboardOverviewPage() {
  const [mode, setMode] = useState<ExecutiveFilterMode>("all")
  const [referenceDate, setReferenceDate] = useState(today())
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const [asOfDate, setAsOfDate] = useState(today())

  const filters = useMemo<DashboardOverviewFilters>(() => {
    if (mode === "all") return {}
    if (mode === "interval") return { startDate, endDate }
    if (mode === "as_of") return { asOfDate }
    return { periodType: mode, referenceDate }
  }, [asOfDate, endDate, mode, referenceDate, startDate])
  const isInvalidInterval = mode === "interval" && (!startDate || !endDate || endDate < startDate)
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "overview", filters],
    queryFn: () => dashboardService.overview(filters),
    enabled: !isInvalidInterval,
    refetchInterval: 1000 * 60 * 5,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="space-y-2">
            <Label>Período da visão geral</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as ExecutiveFilterMode)}>
              <SelectTrigger className="w-full sm:w-56" aria-label="Período da visão geral"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visão acumulada</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="semester">Semestre</SelectItem>
                <SelectItem value="year">Ano</SelectItem>
                <SelectItem value="interval">Intervalo personalizado</SelectItem>
                <SelectItem value="as_of">Posição acumulada até</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(["month", "quarter", "semester", "year"] as ExecutiveFilterMode[]).includes(mode) && (
            <div className="space-y-2">
              <Label htmlFor="overview-reference-date">Data de referência</Label>
              <Input id="overview-reference-date" type="date" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} />
            </div>
          )}
          {mode === "interval" && (
            <>
              <div className="space-y-2"><Label htmlFor="overview-start-date">Data inicial</Label><Input id="overview-start-date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="overview-end-date">Data final</Label><Input id="overview-end-date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
            </>
          )}
          {mode === "as_of" && (
            <div className="space-y-2"><Label htmlFor="overview-as-of-date">Posição até</Label><Input id="overview-as-of-date" type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} /></div>
          )}
          <div className="flex flex-1 flex-col gap-2 lg:items-end">
            {dashboardQuery.data && <p className="text-xs text-muted-foreground">{dashboardQuery.data.filter.label} · Atualizado em {formatDate(dashboardQuery.data.generatedAt)}</p>}
            <Button variant="outline" className="gap-2" onClick={() => dashboardQuery.refetch()} disabled={dashboardQuery.isFetching || isInvalidInterval}>
              {dashboardQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isInvalidInterval && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Intervalo inválido</AlertTitle><AlertDescription>A data final deve ser igual ou posterior à data inicial.</AlertDescription></Alert>}
      {dashboardQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar a visão geral</AlertTitle><AlertDescription>{dashboardQuery.error.message}</AlertDescription></Alert>}
      {dashboardQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}</div>
      ) : dashboardQuery.data ? <OverviewContent data={dashboardQuery.data} /> : null}
    </div>
  )
}
