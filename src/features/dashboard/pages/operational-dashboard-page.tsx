import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileWarning,
  ListTodo,
  Loader2,
  PackageSearch,
  Radar,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  Zap,
} from "lucide-react"
import { Link } from "react-router"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ItemDescription } from "@/components/item-description"
import { PageHeader } from "@/components/page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { dashboardService } from "@/features/dashboard/dashboard.service"
import { buildOperationalWorkflow, operationalIndicators } from "@/features/dashboard/dashboard-indicators"
import type {
  DashboardOperationalResponse,
  OperationalAlert,
  ProjectStage,
} from "@/features/dashboard/dashboard.types"

const stageLabels: Record<ProjectStage, string> = {
  ESTIMATIVA_PRECO: "Estimativa de preço",
  AGUARDANDO_NOTA_CREDITO: "Aguardando NC",
  DIEX_REQUISITORIO: "DIEx requisitório",
  AGUARDANDO_NOTA_EMPENHO: "Aguardando NE",
  OS_LIBERADA: "OS liberada",
  AGUARDANDO_OS_ASSINADA: "Aguardando OS assinada",
  AGUARDANDO_INICIO_EXECUCAO: "Aguardando início",
  SERVICO_EM_EXECUCAO: "Em execução",
  ANALISANDO_AS_BUILT: "Analisando As-Built",
  ATESTAR_NF: "Atestar NF",
  SERVICO_CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

const severityLabels = {
  CRITICAL: "Crítico",
  WARNING: "Atenção",
  INFO: "Informativo",
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

function MetricSkeletons() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-36 rounded-xl" />
      ))}
    </div>
  )
}

function AlertBadge({ alert }: { alert: OperationalAlert }) {
  return (
    <Badge variant={alert.severity === "CRITICAL" ? "destructive" : "outline"}>
      {severityLabels[alert.severity]}
    </Badge>
  )
}

function DashboardContent({ data }: { data: DashboardOperationalResponse }) {
  const indicators = operationalIndicators(data)
  const workflow = buildOperationalWorkflow(data)
  const pendingData = [
    { stage: "Nota de Crédito", total: data.pendingByStage.awaitingCreditNote },
    { stage: "DIEx", total: data.pendingByStage.awaitingDiex },
    { stage: "Nota de Empenho", total: data.pendingByStage.awaitingCommitmentNote },
    { stage: "Ordem de Serviço", total: data.pendingByStage.awaitingServiceOrder },
    { stage: "OS assinada", total: data.pendingByStage.awaitingSignedServiceOrder },
    { stage: "Início execução", total: data.pendingByStage.awaitingExecutionStart },
    { stage: "As-Built", total: data.pendingByStage.awaitingAsBuilt },
    { stage: "Atesto NF", total: data.pendingByStage.awaitingInvoiceAttestation },
  ]

  const inventoryData = [
    { name: "Disponível", value: Number(data.inventory.summary.totalAvailableAmount), color: "var(--chart-1)" },
    { name: "Reservado", value: Number(data.inventory.summary.totalReservedAmount), color: "#f4b942" },
    { name: "Consumido", value: Number(data.inventory.summary.totalConsumedAmount), color: "#718078" },
  ]

  const metrics = [
    {
      label: "Projetos na fila",
      value: data.operationalQueue.length,
      helper: `${data.staleProjects.length} sem avanço`,
      icon: ListTodo,
      tone: "primary",
      to: "/projects",
    },
    {
      label: "Alertas críticos",
      value: data.alerts.summary.bySeverity.CRITICAL,
      helper: `${data.alerts.summary.bySeverity.WARNING} em atenção`,
      icon: ShieldAlert,
      tone: "danger",
      to: "/alerts",
    },
    {
      label: "Itens de ATA em risco",
      value: data.inventory.summary.lowStockItems + data.inventory.summary.insufficientItems,
      helper: `${data.inventory.summary.insufficientItems} insuficientes`,
      icon: PackageSearch,
      tone: "warning",
      to: "/atas",
    },
    {
      label: "Saldo disponível",
      value: formatCurrency(data.inventory.summary.totalAvailableAmount),
      helper: `${data.inventory.summary.itemsWithActiveReserve} itens reservados`,
      icon: Boxes,
      tone: "primary",
      to: "/atas",
    },
  ]

  const quickActions = [
    { label: "Nova estimativa", description: "Iniciar composição de custos", to: "/estimates/new", icon: FilePlus2 },
    { label: "Projetos", description: "Abrir carteira operacional", to: "/projects", icon: Target },
    { label: "Kanban", description: "Visualizar fluxo por etapa", to: "/kanban", icon: Activity },
    { label: "Ordens de Serviço", description: "Acompanhar execução", to: "/service-orders", icon: Zap },
  ]

  return (
    <>
      <Card className="sagep-signal-hero overflow-hidden">
        <CardContent className="p-6 lg:p-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl"><Badge className="bg-status-success/10 text-status-success hover:bg-status-success/10">Situação operacional</Badge><h2 className="mt-3 text-2xl font-semibold">Prioridades que exigem atuação</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Visão consolidada dos gargalos documentais, projetos sem avanço e riscos de saldo que podem comprometer a execução.</p></div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
              <div className="sagep-metric-tile p-3"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Pendências</dt><dd className="mt-1 text-2xl font-semibold">{indicators.totalPending}</dd></div>
              <div className="sagep-metric-tile p-3"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Alertas urgentes</dt><dd className="mt-1 text-2xl font-semibold text-status-warning">{indicators.urgentAlerts}</dd></div>
              <div className="sagep-metric-tile p-3"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Sem avanço</dt><dd className="mt-1 text-2xl font-semibold">{indicators.staleProjects}</dd></div>
              <div className="sagep-metric-tile p-3"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Itens em risco</dt><dd className="mt-1 text-2xl font-semibold text-status-danger">{indicators.inventoryAtRisk}</dd></div>
            </dl>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Link key={metric.label} to={metric.to} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="group h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/35">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`flex size-11 items-center justify-center rounded-sm border ${
                    metric.tone === "danger"
                      ? "border-status-danger/20 bg-status-danger/10 text-status-danger"
                      : metric.tone === "warning"
                        ? "border-status-warning/20 bg-status-warning/10 text-status-warning"
                        : "border-primary/20 bg-primary/10 text-primary"
                  }`}>
                    <Icon className="size-5" />
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[.14em] text-muted-foreground uppercase">
                    <CheckCircle2 className="size-3 text-primary" />
                    Atualizado
                  </span>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">{metric.label}</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <p className="font-heading text-3xl font-semibold tracking-tight">{metric.value}</p>
                  <p className="text-right text-xs text-muted-foreground">{metric.helper}</p>
                </div>
                <div className="mt-4 h-px bg-gradient-to-r from-primary/70 via-primary/15 to-transparent transition-all group-hover:from-primary" />
              </CardContent>
            </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.65fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[.16em] text-primary uppercase">Painel operacional</p>
              <CardTitle className="mt-1">Ações rápidas</CardTitle>
            </div>
            <Sparkles className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.label} to={action.to} className="group flex items-center gap-3 rounded-sm border border-primary/10 bg-background/35 p-3 transition hover:border-primary/35 hover:bg-primary/[.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary"><Icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{action.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{action.description}</span>
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[.16em] text-primary uppercase">Fluxo de projetos</p>
              <CardTitle className="mt-1">Fluxo operacional</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Volume aguardando atuação em cada transição documental.</p>
            </div>
            <Badge variant="outline">{indicators.totalPending} pendências</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map((step, index) => (
                <div key={step.label} className="relative rounded-sm border border-primary/10 bg-background/35 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] tracking-[.16em] text-primary">{step.shortLabel}</span>
                    <span className="font-heading text-2xl font-semibold">{step.count}</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{step.label}</p>
                  {index < workflow.length - 1 && <ArrowRight className="absolute top-1/2 -right-2.5 z-10 hidden size-4 -translate-y-1/2 rounded-full bg-card text-primary lg:block" />}
                </div>
              ))}
              <div className="rounded-sm border border-primary/25 bg-primary/[.06] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-[.16em] text-primary">STATUS</span>
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <p className="mt-4 text-xs font-medium text-primary">Conclusão e baixa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Pendências por etapa documental</CardTitle>
          </CardHeader>
          <CardContent className="h-80" aria-label="Gráfico de pendências por etapa">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pendingData} layout="vertical" margin={{ left: 12, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="stage" width={105} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="total" name="Projetos" radius={[0, 3, 3, 0]} fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Posição financeira da ATA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={inventoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {inventoryData.map((item) => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {inventoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alertas prioritários</CardTitle>
            <Badge variant="outline">{data.alerts.summary.total} alertas</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alerts.items.length ? data.alerts.items.slice(0, 6).map((alert) => (
              <Link key={alert.id} to={alert.detailsPath} className="block rounded-2xl border p-4 transition hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{alert.description}</p>
                  </div>
                  <AlertBadge alert={alert} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Próxima ação: {alert.nextAction.label}</span>
                  {alert.daysSinceUpdate !== undefined && <span>{alert.daysSinceUpdate} dias</span>}
                </div>
              </Link>
            )) : (
              <div className="flex flex-col items-center py-12 text-center">
                <CheckCircle2 className="size-10 text-primary" />
                <p className="mt-3 font-medium">Nenhum alerta operacional</p>
                <p className="mt-1 text-sm text-muted-foreground">O fluxo não possui pendências críticas.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fila operacional</CardTitle>
            <Badge variant="outline">{data.operationalQueue.length} projetos</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.operationalQueue.length ? data.operationalQueue.slice(0, 7).map((item) => (
              <Link key={item.id} to={item.detailsPath} className="flex flex-col gap-3 rounded-2xl border p-4 transition hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileWarning className="size-4 text-primary" />
                    <p className="font-medium">PRJ-{item.projectCode} · {item.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stageLabels[item.stage]} · Responsável: {item.owner.name}
                  </p>
                </div>
                <div className="md:text-right">
                  <Badge variant="secondary">{item.nextAction.label}</Badge>
                  <p className="mt-2 text-xs text-muted-foreground">Atualizado em {formatDate(item.updatedAt)}</p>
                </div>
              </Link>
            )) : (
              <div className="py-12 text-center text-sm text-muted-foreground">Nenhum projeto na fila operacional.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Itens críticos da ATA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.inventory.criticalItems.length ? data.inventory.criticalItems.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border p-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">ITEM-{item.ataItemCode}</p>
                  <ItemDescription className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</ItemDescription>
                  <p className="mt-1 text-xs text-muted-foreground">{item.ata.number} · {item.ata.vendorName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant={item.balance.insufficient ? "destructive" : "outline"}>
                    {item.balance.insufficient ? "Insuficiente" : item.balance.lowStock ? "Saldo baixo" : "Reservado"}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">Disponível: {item.balance.availableQuantity}</p>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-sm text-muted-foreground">Nenhum item crítico.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Movimentações recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.latestMovements.length ? data.latestMovements.slice(0, 7).map((movement) => (
              <div key={movement.id} className="flex gap-3 border-b pb-3 last:border-0">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock3 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{movement.summary}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {movement.actorName ?? "Sistema"} · {formatDate(movement.at)}
                  </p>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma movimentação recente.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Target className="size-5 text-primary" />Ações mais demandadas</CardTitle><Badge variant="outline">Carga de trabalho</Badge></CardHeader>
        <CardContent>{data.frequentNextActions.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.frequentNextActions.slice(0, 8).map((action, index) => <div key={action.label} className="rounded-xl border p-4"><div className="flex items-center justify-between gap-3"><span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><Badge variant="secondary">{action.count}</Badge></div><p className="mt-3 text-sm font-medium">{action.label}</p></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma ação pendente no momento.</p>}</CardContent>
      </Card>
    </>
  )
}

export function OperationalDashboardPage({ embedded = false }: { embedded?: boolean }) {
  const [staleDays, setStaleDays] = useState(15)
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "operational", staleDays],
    queryFn: () => dashboardService.operational(staleDays),
    refetchInterval: 1000 * 60 * 5,
  })

  return (
    <div className="space-y-8">
      {embedded ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-[.16em] text-primary uppercase">Perspectiva operacional</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prioridades, alertas e posição atual da execução.
                {dashboardQuery.data ? ` Atualizado em ${formatDate(dashboardQuery.data.generatedAt)}.` : ""}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={String(staleDays)} onValueChange={(value) => setStaleDays(Number(value))}>
                <SelectTrigger className="w-full sm:w-52" aria-label="Período sem avanço"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Sem avanço há 7 dias</SelectItem>
                  <SelectItem value="15">Sem avanço há 15 dias</SelectItem>
                  <SelectItem value="30">Sem avanço há 30 dias</SelectItem>
                  <SelectItem value="60">Sem avanço há 60 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2" onClick={() => dashboardQuery.refetch()} disabled={dashboardQuery.isFetching}>
                {dashboardQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PageHeader
          eyebrow="Dashboard operacional"
          title="Visão geral da operação"
          description="Projetos, pendências documentais, alertas e posição atual dos itens da ATA com dados da API."
          icon={Radar}
          meta={dashboardQuery.data ? `Atualizado em ${formatDate(dashboardQuery.data.generatedAt)}` : undefined}
          actions={<>
          <Select value={String(staleDays)} onValueChange={(value) => setStaleDays(Number(value))}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Período sem avanço"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Sem avanço há 7 dias</SelectItem>
              <SelectItem value="15">Sem avanço há 15 dias</SelectItem>
              <SelectItem value="30">Sem avanço há 30 dias</SelectItem>
              <SelectItem value="60">Sem avanço há 60 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => dashboardQuery.refetch()} disabled={dashboardQuery.isFetching}>
            {dashboardQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Atualizar
          </Button>
          </>}
        />
      )}

      {dashboardQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar o Dashboard</AlertTitle>
          <AlertDescription>{dashboardQuery.error.message}</AlertDescription>
        </Alert>
      )}

      {dashboardQuery.isLoading ? <MetricSkeletons /> : dashboardQuery.data ? <DashboardContent data={dashboardQuery.data} /> : null}
    </div>
  )
}
