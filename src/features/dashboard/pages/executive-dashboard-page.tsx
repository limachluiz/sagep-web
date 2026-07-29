import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  FileCheck2,
  Landmark,
  Loader2,
  PackageSearch,
  BadgeCheck,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from "lucide-react"
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
import { Link } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterToolbar } from "@/components/filter-toolbar"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { dashboardService } from "@/features/dashboard/dashboard.service"
import { executiveIndicators } from "@/features/dashboard/dashboard-indicators"
import { previousPeriodFilters, type ExecutiveFilterMode } from "@/features/dashboard/executive-period"
import { militaryOrganizationsService } from "@/features/projects/military-organizations.service"
import type { FederativeUnit, ProjectType } from "@/features/projects/projects.types"
import { usersService } from "@/features/users/users.service"
import type {
  AmountBreakdown,
  DashboardExecutiveFilters,
  DashboardExecutiveResponse,
  ProjectStage,
} from "@/features/dashboard/dashboard.types"

type ComparisonMetric = {
  label: string
  current: number
  previous: number
}

const stageLabels: Record<ProjectStage, string> = {
  ESTIMATIVA_PRECO: "Estimativa",
  AGUARDANDO_NOTA_CREDITO: "Aguardando NC",
  DIEX_REQUISITORIO: "DIEx",
  AGUARDANDO_NOTA_EMPENHO: "Aguardando NE",
  OS_LIBERADA: "OS liberada",
  AGUARDANDO_OS_ASSINADA: "Aguardando OS assinada",
  AGUARDANDO_INICIO_EXECUCAO: "Aguardando início",
  SERVICO_EM_EXECUCAO: "Em execução",
  ANALISANDO_AS_BUILT: "As-Built",
  ATESTAR_NF: "Atestar NF",
  SERVICO_CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

const chartColors = ["#66733c", "#9ba566", "#c89b3c", "#27311d", "#8a6f42", "#55612f"]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function firstDayOfMonth() {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}

function RankingList({ items }: { items: AmountBreakdown[] }) {
  if (!items.length) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Nenhum dado para o período.</div>
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 8).map((item, index) => (
        <div key={item.label} className="flex items-center gap-3 rounded-xl border p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-medium">{item.label}</p>
              <p className="shrink-0 font-medium">{formatCurrency(item.totalAmount)}</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(item.percentage, 2)}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.count} registro(s) · {item.percentage}%</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function variation(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / Math.abs(previous)) * 100
}

function ComparisonStrip({ metrics }: { metrics: ComparisonMetric[] }) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Comparação com o período anterior</span>
          <Badge variant="outline">Variação financeira</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const delta = variation(metric.current, metric.previous)
          const increased = delta !== null && delta > 0
          const decreased = delta !== null && delta < 0
          const Icon = increased ? TrendingUp : decreased ? TrendingDown : Minus
          return (
            <div key={metric.label} className="rounded-xl border bg-card/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <span className={`flex items-center gap-1 text-xs font-semibold ${increased ? "text-status-success" : decreased ? "text-status-warning" : "text-muted-foreground"}`}>
                  <Icon className="size-3.5" />
                  {delta === null ? "Novo" : `${Math.abs(delta).toFixed(1)}%`}
                </span>
              </div>
              <p className="mt-3 text-lg font-semibold">{formatCurrency(metric.current)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Anterior: {formatCurrency(metric.previous)}</p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ExecutiveContent({
  data,
  previousData,
  comparisonLoading,
}: {
  data: DashboardExecutiveResponse
  previousData?: DashboardExecutiveResponse
  comparisonLoading: boolean
}) {
  const indicators = executiveIndicators(data)

  const metrics = [
    {
      label: "Valor estimado",
      value: formatCurrency(data.summary.totalEstimatedAmount),
      helper: `${data.summary.estimatesFinalized} estimativas finalizadas`,
      icon: CircleDollarSign,
      to: "/estimates",
    },
    {
      label: "Valor empenhado",
      value: formatCurrency(data.summary.totalCommittedAmount),
      helper: "Projetos com Nota de Empenho",
      icon: Landmark,
      to: "/projects",
    },
    {
      label: "Projetos concluídos",
      value: formatCurrency(data.summary.totalCompletedProjectsAmount),
      helper: `${data.summary.projectsCompleted} projetos finalizados`,
      icon: BadgeCheck,
      to: "/projects?status=CONCLUIDO",
    },
    {
      label: "Valor em Ordens de Serviço",
      value: formatCurrency(data.summary.totalWithServiceOrder),
      helper: `${data.summary.serviceOrdersIssued} OS emitidas`,
      icon: FileCheck2,
      to: "/service-orders",
    },
  ]

  const documentFunnel = [
    { label: "Estimado", value: Number(data.financial.totalEstimatedAmount) },
    { label: "Com DIEx", value: Number(data.financial.totalWithDiex) },
    { label: "Com OS", value: Number(data.financial.totalWithServiceOrder) },
  ]

  const stages = data.projects.byStage.map((item) => ({
    ...item,
    label: stageLabels[item.label as ProjectStage] ?? item.label,
  }))

  const inventory = [
    { label: "Disponível", value: Number(data.financial.inventoryCurrentAvailableAmount) },
    { label: "Reservado", value: Number(data.financial.inventoryCurrentReservedAmount) },
    { label: "Consumido", value: Number(data.financial.inventoryCurrentConsumedAmount) },
  ]

  const comparisonMetrics: ComparisonMetric[] = previousData
    ? [
        { label: "Valor estimado", current: Number(data.summary.totalEstimatedAmount), previous: Number(previousData.summary.totalEstimatedAmount) },
        { label: "Valor empenhado", current: Number(data.summary.totalCommittedAmount), previous: Number(previousData.summary.totalCommittedAmount) },
        { label: "Projetos concluídos", current: Number(data.summary.totalCompletedProjectsAmount), previous: Number(previousData.summary.totalCompletedProjectsAmount) },
        { label: "Valor em OS", current: Number(data.summary.totalWithServiceOrder), previous: Number(previousData.summary.totalWithServiceOrder) },
      ]
    : []

  return (
    <>
      <Card className="sagep-signal-hero overflow-hidden">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
            <div className="max-w-2xl"><Badge className="bg-status-success/10 text-status-success hover:bg-status-success/10">Síntese para decisão</Badge><h2 className="mt-3 text-2xl font-semibold lg:text-3xl">Portfólio, execução financeira e resultado</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Leitura executiva para acompanhamento da carteira, eficiência documental e riscos que demandam direcionamento da chefia.</p></div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[600px]">
              <div className="sagep-metric-tile p-4"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Carteira estimada</dt><dd className="mt-1 text-lg font-semibold">{formatCurrency(data.financial.totalEstimatedAmount)}</dd></div>
              <div className="sagep-metric-tile p-4"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Valor com OS</dt><dd className="mt-1 text-lg font-semibold">{formatCurrency(data.financial.totalWithServiceOrder)}</dd></div>
              <div className="sagep-metric-tile p-4"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Conversão até OS</dt><dd className="mt-1 text-2xl font-semibold text-primary">{indicators.serviceOrderConversionRate.toFixed(1)}%</dd></div>
              <div className="sagep-metric-tile p-4"><dt className="text-xs tracking-wide text-muted-foreground uppercase">Projetos abertos</dt><dd className="mt-1 text-2xl font-semibold">{data.summary.projectsOpen}</dd></div>
            </dl>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Link key={metric.label} to={metric.to} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full border-none shadow-sm transition hover:-translate-y-0.5 hover:ring-1 hover:ring-primary/30">
              <CardContent className="p-5">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <p className="mt-5 text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{metric.helper}</p>
              </CardContent>
            </Card>
            </Link>
          )
        })}
      </div>

      {comparisonLoading ? (
        <Skeleton className="h-44 rounded-xl" />
      ) : comparisonMetrics.length ? (
        <ComparisonStrip metrics={comparisonMetrics} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none shadow-sm"><CardContent className="p-5"><BriefcaseBusiness className="size-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">Carteira de projetos</p><p className="mt-1 text-2xl font-semibold">{data.summary.projectsTotal}</p><p className="mt-2 text-xs text-muted-foreground">{data.summary.projectsOpen} em aberto · {indicators.completionRate.toFixed(1)}% concluídos</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><Activity className="size-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">Carteira em aberto</p><p className="mt-1 text-2xl font-semibold">{indicators.openRate.toFixed(1)}%</p><p className="mt-2 text-xs text-muted-foreground">{data.summary.projectsOpen} projetos ativos</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><TrendingUp className="size-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">Conversão financeira</p><p className="mt-1 text-2xl font-semibold">{indicators.serviceOrderConversionRate.toFixed(1)}%</p><p className="mt-2 text-xs text-muted-foreground">Valor estimado convertido em OS</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><PackageSearch className="size-5 text-status-warning" /><p className="mt-4 text-sm text-muted-foreground">Risco de abastecimento</p><p className="mt-1 text-2xl font-semibold">{data.summary.ataItemsAtRisk + data.summary.ataItemsInsufficient}</p><p className="mt-2 text-xs text-muted-foreground">{data.summary.ataItemsInsufficient} itens insuficientes</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Conversão financeira documental</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={documentFunnel} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `${Math.round(Number(value) / 1000)} mil`} />
                <YAxis type="category" dataKey="label" width={80} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" name="Valor" radius={[0, 8, 8, 0]} fill="#66733c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="grid grid-cols-3 gap-2 border-t px-5 py-4 text-center text-xs"><div><p className="text-muted-foreground">Estimado → DIEx</p><p className="mt-1 font-semibold">{indicators.diexConversionRate.toFixed(1)}%</p></div><div><p className="text-muted-foreground">Estimado → OS</p><p className="mt-1 font-semibold">{indicators.serviceOrderConversionRate.toFixed(1)}%</p></div><div><p className="text-muted-foreground">Conclusão</p><p className="mt-1 font-semibold">{indicators.completionRate.toFixed(1)}%</p></div></div>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Projetos por etapa</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {stages.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stages} dataKey="count" nameKey="label" innerRadius={60} outerRadius={105} paddingAngle={3}>
                    {stages.map((item, index) => <Cell key={item.label} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Nenhum projeto no período.</div>
            )}
          </CardContent>
          {stages.length > 0 && <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t px-5 py-4 text-xs">{stages.slice(0, 8).map((item, index) => <div key={item.label} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="truncate text-muted-foreground">{item.label}</span></span><strong>{item.count}</strong></div>)}</div>}
        </Card>
      </div>

      <Card className="border-none shadow-sm"><CardHeader><CardTitle>Produção no período</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[
        ["Projetos criados", data.periodIndicators.projectsCreated],
        ["Estimativas criadas", data.periodIndicators.estimatesCreated],
        ["DIEx emitidos", data.periodIndicators.diexIssued],
        ["OS emitidas", data.periodIndicators.serviceOrdersIssued],
        ["Ticket médio", formatCurrency(data.periodIndicators.averageEstimatedAmount)],
      ].map(([label, value]) => <div key={label} className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}</CardContent></Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Distribuição dos investimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="region">
            <TabsList className="mb-5 w-full overflow-x-auto sm:w-auto">
              <TabsTrigger value="region">Por UF</TabsTrigger>
              <TabsTrigger value="city">Por município</TabsTrigger>
              <TabsTrigger value="om">Por OM</TabsTrigger>
            </TabsList>
            <TabsContent value="region"><RankingList items={data.distribution.byRegion} /></TabsContent>
            <TabsContent value="city"><RankingList items={data.distribution.byCity} /></TabsContent>
            <TabsContent value="om"><RankingList items={data.distribution.byOm} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch className="size-5 text-primary" />
              Posição atual das ATAs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inventory.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl border p-4">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: chartColors[index] }} />
                  {item.label}
                </span>
                <span className="font-semibold">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-status-warning/20 bg-status-warning/10 p-4 text-status-warning">
                <p className="text-xs">Itens em risco</p>
                <p className="mt-1 text-2xl font-semibold">{data.summary.ataItemsAtRisk}</p>
              </div>
              <div className="rounded-xl border border-status-danger/20 bg-status-danger/10 p-4 text-status-danger">
                <p className="text-xs">Insuficientes</p>
                <p className="mt-1 text-2xl font-semibold">{data.summary.ataItemsInsufficient}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Distribuição por tipo de ATA</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {data.financial.byAtaType.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.financial.byAtaType}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)} mil`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="totalAmount" name="Valor estimado" radius={[8, 8, 0, 0]} fill="#66733c" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Nenhuma estimativa no período.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export function ExecutiveDashboardPage() {
  const [mode, setMode] = useState<ExecutiveFilterMode>("year")
  const [referenceDate, setReferenceDate] = useState(today())
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const [asOfDate, setAsOfDate] = useState(today())
  const [stateUf, setStateUf] = useState<FederativeUnit | "all">("all")
  const [omId, setOmId] = useState("all")
  const [projectType, setProjectType] = useState<ProjectType | "all">("all")
  const [ownerId, setOwnerId] = useState("all")

  const organizationsQuery = useQuery({
    queryKey: ["military-organizations", "dashboard-filters"],
    queryFn: () => militaryOrganizationsService.list({ page: 1, pageSize: 100, active: true }),
    staleTime: 1000 * 60 * 10,
  })
  const ownersQuery = useQuery({
    queryKey: ["users", "dashboard-filter-options"],
    queryFn: () => usersService.options(),
    staleTime: 1000 * 60 * 10,
  })
  const organizationOptions = (organizationsQuery.data?.items ?? []).filter(
    (organization) => stateUf === "all" || organization.stateUf === stateUf,
  )

  const filters = useMemo<DashboardExecutiveFilters>(() => {
    const portfolioFilters = {
      stateUf: stateUf === "all" ? undefined : stateUf,
      omId: omId === "all" ? undefined : omId,
      projectType: projectType === "all" ? undefined : projectType,
      ownerId: ownerId === "all" ? undefined : ownerId,
    }
    if (mode === "all") return portfolioFilters
    if (mode === "interval") return { ...portfolioFilters, startDate, endDate }
    if (mode === "as_of") return { ...portfolioFilters, asOfDate }
    return { ...portfolioFilters, periodType: mode, referenceDate }
  }, [asOfDate, endDate, mode, omId, ownerId, projectType, referenceDate, startDate, stateUf])
  const comparisonFilters = useMemo(() => previousPeriodFilters(mode, filters), [filters, mode])

  const isInvalidInterval = mode === "interval" && (!startDate || !endDate || endDate < startDate)
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "executive", filters],
    queryFn: () => dashboardService.executive(filters),
    enabled: !isInvalidInterval,
    refetchInterval: 1000 * 60 * 5,
  })
  const comparisonQuery = useQuery({
    queryKey: ["dashboard", "executive", "previous", comparisonFilters],
    queryFn: () => dashboardService.executive(comparisonFilters ?? {}),
    enabled: !isInvalidInterval && comparisonFilters !== null,
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard executivo"
        title="Visão gerencial do portfólio"
        description="Indicadores consolidados de projetos, documentos, investimentos e saldos das ATAs."
        icon={BarChart3}
        meta={dashboardQuery.data ? `${dashboardQuery.data.filter.label} · Atualizado em ${formatDate(dashboardQuery.data.generatedAt)}` : undefined}
        actions={<Button variant="outline" className="gap-2" onClick={() => dashboardQuery.refetch()} disabled={dashboardQuery.isFetching || isInvalidInterval}>
          {dashboardQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Atualizar
        </Button>}
      />

      <FilterToolbar className="gap-4 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Período de análise</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as ExecutiveFilterMode)}>
              <SelectTrigger className="w-full xl:w-56" aria-label="Período de análise"><SelectValue /></SelectTrigger>
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
              <Label htmlFor="reference-date">Data de referência</Label>
              <Input id="reference-date" type="date" className="xl:w-48" value={referenceDate} onChange={(event) => setReferenceDate(event.target.value)} />
            </div>
          )}

          {mode === "interval" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="start-date">Data inicial</Label>
                <Input id="start-date" type="date" className="xl:w-48" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Data final</Label>
                <Input id="end-date" type="date" className="xl:w-48" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </div>
            </>
          )}

          {mode === "as_of" && (
            <div className="space-y-2">
              <Label htmlFor="as-of-date">Posição até</Label>
              <Input id="as-of-date" type="date" className="xl:w-48" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>UF</Label>
            <Select value={stateUf} onValueChange={(value) => { setStateUf(value as FederativeUnit | "all"); setOmId("all") }}>
              <SelectTrigger aria-label="Filtrar Dashboard por UF"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as UFs</SelectItem>{(["AM", "RO", "RR", "AC"] as FederativeUnit[]).map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Organização Militar</Label>
            <Select value={omId} onValueChange={setOmId}>
              <SelectTrigger aria-label="Filtrar Dashboard por OM"><SelectValue placeholder={organizationsQuery.isLoading ? "Carregando..." : "Todas as OMs"} /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as OMs</SelectItem>{organizationOptions.map((organization) => <SelectItem key={organization.id} value={organization.id}>{organization.sigla} · {organization.cityName}/{organization.stateUf}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de projeto</Label>
            <Select value={projectType} onValueChange={(value) => setProjectType(value as ProjectType | "all")}>
              <SelectTrigger aria-label="Filtrar Dashboard por tipo"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="CFTV">CFTV</SelectItem><SelectItem value="FIBRA_OPTICA_PONTO_LOGICO">Fibra / Ponto Lógico</SelectItem></SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger aria-label="Filtrar Dashboard por responsável"><SelectValue placeholder={ownersQuery.isLoading ? "Carregando..." : "Todos os responsáveis"} /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos os responsáveis</SelectItem>{(ownersQuery.data?.items ?? []).filter((owner) => owner.active).map((owner) => <SelectItem key={owner.id} value={owner.id}>{owner.rank ? `${owner.rank} ` : ""}{owner.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground md:col-span-2 xl:col-span-4">
            <BarChart3 className="size-4" />
            <span>Atualização automática a cada 5 minutos</span>
            {(stateUf !== "all" || omId !== "all" || projectType !== "all" || ownerId !== "all") && (
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setStateUf("all"); setOmId("all"); setProjectType("all"); setOwnerId("all") }}>Limpar filtros da carteira</Button>
            )}
          </div>
      </FilterToolbar>

      {isInvalidInterval && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Intervalo inválido</AlertTitle>
          <AlertDescription>A data final deve ser igual ou posterior à data inicial.</AlertDescription>
        </Alert>
      )}

      {dashboardQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar o Dashboard Executivo</AlertTitle>
          <AlertDescription>{dashboardQuery.error.message}</AlertDescription>
        </Alert>
      )}

      {dashboardQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}
        </div>
      ) : dashboardQuery.data ? (
        <ExecutiveContent
          data={dashboardQuery.data}
          previousData={comparisonQuery.data}
          comparisonLoading={comparisonQuery.isLoading}
        />
      ) : null}
    </div>
  )
}
