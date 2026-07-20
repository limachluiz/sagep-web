import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  FileCheck2,
  Loader2,
  PackageSearch,
  RefreshCw,
  TrendingUp,
  Activity,
  Ban,
  Target,
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

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { dashboardService } from "@/features/dashboard/dashboard.service"
import { executiveIndicators } from "@/features/dashboard/dashboard-indicators"
import type {
  AmountBreakdown,
  DashboardExecutiveFilters,
  DashboardExecutiveResponse,
  ProjectStage,
} from "@/features/dashboard/dashboard.types"

type FilterMode = "all" | "month" | "quarter" | "semester" | "year" | "interval" | "as_of"

const stageLabels: Record<ProjectStage, string> = {
  ESTIMATIVA_PRECO: "Estimativa",
  AGUARDANDO_NOTA_CREDITO: "Aguardando NC",
  DIEX_REQUISITORIO: "DIEx",
  AGUARDANDO_NOTA_EMPENHO: "Aguardando NE",
  OS_LIBERADA: "OS liberada",
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

function ExecutiveContent({ data }: { data: DashboardExecutiveResponse }) {
  const indicators = executiveIndicators(data)

  const metrics = [
    {
      label: "Projetos no período",
      value: data.summary.projectsTotal,
      helper: `${data.summary.projectsOpen} em aberto`,
      icon: BriefcaseBusiness,
    },
    {
      label: "Taxa de conclusão",
      value: `${indicators.completionRate.toFixed(1)}%`,
      helper: `${data.summary.projectsCompleted} concluídos`,
      icon: TrendingUp,
    },
    {
      label: "Valor estimado",
      value: formatCurrency(data.summary.totalEstimatedAmount),
      helper: `${data.summary.estimatesFinalized} estimativas finalizadas`,
      icon: CircleDollarSign,
    },
    {
      label: "Ordens de Serviço",
      value: data.summary.serviceOrdersIssued,
      helper: formatCurrency(data.summary.totalWithServiceOrder),
      icon: FileCheck2,
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

  return (
    <>
      <Card className="overflow-hidden border-none bg-slate-950 text-white shadow-lg">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-7 xl:flex-row xl:items-center">
            <div className="max-w-2xl"><Badge className="bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/15">Síntese para decisão</Badge><h2 className="mt-3 text-2xl font-semibold lg:text-3xl">Portfólio, execução financeira e resultado</h2><p className="mt-2 text-sm leading-6 text-slate-300">Leitura executiva para acompanhamento da carteira, eficiência documental e riscos que demandam direcionamento da chefia.</p></div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[600px]">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4"><dt className="text-xs text-slate-400">Carteira estimada</dt><dd className="mt-1 text-lg font-semibold">{formatCurrency(data.financial.totalEstimatedAmount)}</dd></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4"><dt className="text-xs text-slate-400">Valor com OS</dt><dd className="mt-1 text-lg font-semibold">{formatCurrency(data.financial.totalWithServiceOrder)}</dd></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4"><dt className="text-xs text-slate-400">Conversão até OS</dt><dd className="mt-1 text-2xl font-semibold text-emerald-300">{indicators.serviceOrderConversionRate.toFixed(1)}%</dd></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4"><dt className="text-xs text-slate-400">Projetos abertos</dt><dd className="mt-1 text-2xl font-semibold">{data.summary.projectsOpen}</dd></div>
            </dl>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="border-none shadow-sm">
              <CardContent className="p-5">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <p className="mt-5 text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{metric.helper}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none shadow-sm"><CardContent className="p-5"><Activity className="size-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">Carteira em aberto</p><p className="mt-1 text-2xl font-semibold">{indicators.openRate.toFixed(1)}%</p><p className="mt-2 text-xs text-muted-foreground">{data.summary.projectsOpen} projetos ativos</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><Ban className="size-5 text-destructive" /><p className="mt-4 text-sm text-muted-foreground">Taxa de cancelamento</p><p className="mt-1 text-2xl font-semibold">{indicators.cancellationRate.toFixed(1)}%</p><p className="mt-2 text-xs text-muted-foreground">{data.summary.projectsCanceled} cancelados</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><Target className="size-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">Conversão até DIEx</p><p className="mt-1 text-2xl font-semibold">{indicators.diexConversionRate.toFixed(1)}%</p><p className="mt-2 text-xs text-muted-foreground">Sobre o valor estimado</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><PackageSearch className="size-5 text-amber-600" /><p className="mt-4 text-sm text-muted-foreground">Risco de abastecimento</p><p className="mt-1 text-2xl font-semibold">{data.summary.ataItemsAtRisk + data.summary.ataItemsInsufficient}</p><p className="mt-2 text-xs text-muted-foreground">{data.summary.ataItemsInsufficient} itens insuficientes</p></CardContent></Card>
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
              <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
                <p className="text-xs">Itens em risco</p>
                <p className="mt-1 text-2xl font-semibold">{data.summary.ataItemsAtRisk}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 text-red-900">
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
  const [mode, setMode] = useState<FilterMode>("year")
  const [referenceDate, setReferenceDate] = useState(today())
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const [asOfDate, setAsOfDate] = useState(today())

  const filters = useMemo<DashboardExecutiveFilters>(() => {
    if (mode === "all") return {}
    if (mode === "interval") return { startDate, endDate }
    if (mode === "as_of") return { asOfDate }
    return { periodType: mode, referenceDate }
  }, [asOfDate, endDate, mode, referenceDate, startDate])

  const isInvalidInterval = mode === "interval" && (!startDate || !endDate || endDate < startDate)
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "executive", filters],
    queryFn: () => dashboardService.executive(filters),
    enabled: !isInvalidInterval,
    refetchInterval: 1000 * 60 * 5,
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <Badge className="mb-3">Dashboard executivo</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Visão gerencial do portfólio</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Indicadores consolidados de projetos, documentos, investimentos e saldos das ATAs.
          </p>
          {dashboardQuery.data && (
            <p className="mt-2 text-xs text-muted-foreground">
              {dashboardQuery.data.filter.label} · Atualizado em {formatDate(dashboardQuery.data.generatedAt)}
            </p>
          )}
        </div>
        <Button variant="outline" className="gap-2" onClick={() => dashboardQuery.refetch()} disabled={dashboardQuery.isFetching || isInvalidInterval}>
          {dashboardQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Atualizar
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 xl:flex-row xl:items-end">
          <div className="space-y-2">
            <Label>Período de análise</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as FilterMode)}>
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

          {(["month", "quarter", "semester", "year"] as FilterMode[]).includes(mode) && (
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

          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="size-4" />
            Atualização automática a cada 5 minutos
          </div>
        </CardContent>
      </Card>

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
        <ExecutiveContent data={dashboardQuery.data} />
      ) : null}
    </div>
  )
}
