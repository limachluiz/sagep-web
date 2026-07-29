import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CalendarDays, CalendarRange, CheckCircle2, CircleDashed, ClockAlert, Gauge, RefreshCw, Target } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FilterToolbar } from "@/components/filter-toolbar"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectSelect } from "@/features/projects/components/project-select"
import { projectsService } from "@/features/projects/projects.service"
import type { FederativeUnit, ProjectType } from "@/features/projects/projects.types"
import { serviceOrdersService } from "@/features/service-orders/service-orders.service"
import { ganttIndicators } from "@/features/dashboard/planning-indicators"
import type { GanttServiceOrder } from "@/features/service-orders/service-orders.types"
import { usersService } from "@/features/users/users.service"

const dayMs = 86_400_000

function startOfDay(value: string | Date) {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * dayMs)
}

function formatDate(value: string | Date | null) {
  if (!value) return "Não definida"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
}

function differenceInDays(start: Date, end: Date) {
  return Math.max(0, Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / dayMs))
}

function GanttRow({
  item,
  rangeStart,
  rangeEnd,
  labelWidth,
  todayPosition,
}: {
  item: GanttServiceOrder
  rangeStart: Date
  rangeEnd: Date
  labelWidth: number
  todayPosition: number | null
}) {
  const totalDays = Math.max(1, differenceInDays(rangeStart, rangeEnd) + 1)
  const itemStart = item.plannedStartDate ? startOfDay(item.plannedStartDate) : rangeStart
  const itemEnd = item.plannedEndDate ? startOfDay(item.plannedEndDate) : itemStart
  const offset = Math.max(0, differenceInDays(rangeStart, itemStart))
  const duration = Math.max(1, differenceInDays(itemStart, itemEnd) + 1)
  const left = Math.min(100, (offset / totalDays) * 100)
  const width = Math.max(1.5, Math.min(100 - left, (duration / totalDays) * 100))

  return (
    <div
      className="grid min-w-[1100px] border-t"
      style={{ gridTemplateColumns: `${labelWidth}px minmax(820px, 1fr)` }}
    >
      <div className="border-r bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">OS-{item.serviceOrderCode} · PRJ-{item.project.projectCode}</p>
            <Link to={`/service-orders/${item.id}`} className="mt-1 block truncate font-medium hover:text-primary">{item.project.title}</Link>
          </div>
          {item.isDelayed ? <ClockAlert className="size-4 shrink-0 text-destructive" /> : <CheckCircle2 className="size-4 shrink-0 text-primary" />}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant={item.isDelayed ? "destructive" : "outline"}>{item.isDelayed ? "Atrasada" : `${item.progressPercent}%`}</Badge>
          <Badge variant="secondary">{item.tasks.length} etapa(s)</Badge>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{formatDate(item.plannedStartDate)} → {formatDate(item.plannedEndDate)}</p>
      </div>
      <div className="relative min-h-32 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px)] bg-[size:calc(100%/12)_100%] p-4">
        {todayPosition !== null && (
          <div
            className="pointer-events-none absolute inset-y-0 z-10 w-px bg-amber-500/80"
            style={{ left: `${todayPosition}%` }}
            aria-hidden="true"
          />
        )}
        <div
          className={`absolute top-1/2 h-11 -translate-y-1/2 overflow-hidden rounded-lg shadow-sm ${item.isDelayed ? "bg-destructive/20 ring-1 ring-destructive/40" : "bg-primary/15 ring-1 ring-primary/30"}`}
          style={{ left: `${left}%`, width: `${width}%` }}
          title={`${item.serviceOrderNumber ?? `OS-${item.serviceOrderCode}`} · ${formatDate(item.plannedStartDate)} a ${formatDate(item.plannedEndDate)}`}
        >
          <div className={item.isDelayed ? "h-full bg-destructive/55" : "h-full bg-primary/55"} style={{ width: `${item.progressPercent}%` }} />
          <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-foreground"><span className="truncate">{item.serviceOrderNumber ?? `OS-${item.serviceOrderCode}`}</span></span>
        </div>
      </div>
    </div>
  )
}

export function ServiceOrdersGanttPage() {
  const [projectId, setProjectId] = useState("")
  const [from, setFrom] = useState("")
  const [until, setUntil] = useState("")
  const [stateUf, setStateUf] = useState<FederativeUnit | "all">("all")
  const [projectType, setProjectType] = useState<ProjectType | "all">("all")
  const [ownerId, setOwnerId] = useState("all")
  const [scheduleView, setScheduleView] = useState<"all" | "delayed" | "on_track" | "unscheduled">("all")
  const [labelWidth, setLabelWidth] = useState(320)
  const projectsQuery = useQuery({
    queryKey: ["projects", "gantt-filter-options"],
    queryFn: () => projectsService.list({ page: 1, pageSize: 100 }),
  })
  const projectOptions = projectsQuery.data?.items ?? []
  const selectedProject = projectOptions.find((project) => project.id === projectId)
  const ownersQuery = useQuery({
    queryKey: ["users", "gantt-filter-options"],
    queryFn: () => usersService.options(),
    staleTime: 1000 * 60 * 10,
  })
  const filters = useMemo(() => ({
    projectCode: selectedProject?.projectCode,
    from: from || undefined,
    until: until || undefined,
    stateUf: stateUf === "all" ? undefined : stateUf,
    projectType: projectType === "all" ? undefined : projectType,
    ownerId: ownerId === "all" ? undefined : ownerId,
  }), [from, ownerId, projectType, selectedProject?.projectCode, stateUf, until])
  const invalidRange = Boolean(from && until && until < from)
  const ganttQuery = useQuery({ queryKey: ["service-orders", "gantt", filters], queryFn: () => serviceOrdersService.gantt(filters), enabled: !invalidRange })
  const allServiceOrders = ganttQuery.data?.serviceOrders ?? []
  const indicators = ganttQuery.data ? ganttIndicators(allServiceOrders) : null
  const visibleServiceOrders = allServiceOrders.filter((item) => {
    const hasSchedule = Boolean(item.plannedStartDate || item.plannedEndDate)
    if (scheduleView === "delayed") return hasSchedule && item.isDelayed
    if (scheduleView === "on_track") return hasSchedule && !item.isDelayed
    if (scheduleView === "unscheduled") return !hasSchedule
    return true
  })
  const scheduled = visibleServiceOrders.filter((item) => item.plannedStartDate || item.plannedEndDate)
  const unscheduled = visibleServiceOrders.filter((item) => !item.plannedStartDate && !item.plannedEndDate)
  const range = useMemo(() => {
    if (ganttQuery.data?.range.start && ganttQuery.data.range.end) {
      const start = startOfDay(ganttQuery.data.range.start)
      const end = startOfDay(ganttQuery.data.range.end)
      return start.getTime() === end.getTime() ? { start, end: addDays(end, 1) } : { start, end }
    }
    const today = startOfDay(new Date())
    return { start: today, end: addDays(today, 30) }
  }, [ganttQuery.data])
  const ticks = Array.from({ length: 7 }, (_, index) => addDays(range.start, Math.round((differenceInDays(range.start, range.end) * index) / 6)))
  const todayPosition = useMemo(() => {
    const current = startOfDay(new Date())
    if (current < range.start || current > range.end) return null
    const totalDays = Math.max(1, differenceInDays(range.start, range.end))
    return (differenceInDays(range.start, current) / totalDays) * 100
  }, [range])
  const clearFilters = () => { setProjectId(""); setFrom(""); setUntil(""); setStateUf("all"); setProjectType("all"); setOwnerId("all"); setScheduleView("all") }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planejamento temporal"
        title="Gantt de Ordens de Serviço"
        description="Visualize prazos, progresso e atrasos a partir do cronograma planejado de cada Ordem de Serviço."
        icon={CalendarRange}
        meta={ganttQuery.data ? `Janela exibida: ${formatDate(range.start)} a ${formatDate(range.end)}` : undefined}
        actions={<Button variant="outline" onClick={() => ganttQuery.refetch()} disabled={ganttQuery.isFetching}><RefreshCw className={ganttQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar</Button>}
      />

      <FilterToolbar className="xl:grid-cols-4">
        <ProjectSelect
          projects={projectOptions}
          value={projectId}
          onValueChange={setProjectId}
          allowAll
          loading={projectsQuery.isLoading}
          error={projectsQuery.isError}
          ariaLabel="Filtrar Gantt por projeto"
        />
        <Input type="date" aria-label="Data inicial" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input type="date" aria-label="Data final" value={until} onChange={(event) => setUntil(event.target.value)} />
        <Select value={stateUf} onValueChange={(value) => setStateUf(value as FederativeUnit | "all")}>
          <SelectTrigger aria-label="Filtrar Gantt por UF"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas as UFs</SelectItem>{(["AM", "RO", "RR", "AC"] as FederativeUnit[]).map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={projectType} onValueChange={(value) => setProjectType(value as ProjectType | "all")}>
          <SelectTrigger aria-label="Filtrar Gantt por tipo"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="CFTV">CFTV</SelectItem><SelectItem value="FIBRA_OPTICA_PONTO_LOGICO">Fibra / Ponto Lógico</SelectItem></SelectContent>
        </Select>
        <Select value={ownerId} onValueChange={setOwnerId}>
          <SelectTrigger aria-label="Filtrar Gantt por responsável"><SelectValue placeholder="Todos os responsáveis" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os responsáveis</SelectItem>{(ownersQuery.data?.items ?? []).filter((owner) => owner.active).map((owner) => <SelectItem key={owner.id} value={owner.id}>{owner.rank ? `${owner.rank} ` : ""}{owner.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={scheduleView} onValueChange={(value) => setScheduleView(value as typeof scheduleView)}>
          <SelectTrigger aria-label="Filtrar Gantt por situação do cronograma"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas as situações</SelectItem><SelectItem value="delayed">Somente atrasadas</SelectItem><SelectItem value="on_track">No prazo</SelectItem><SelectItem value="unscheduled">Sem cronograma</SelectItem></SelectContent>
        </Select>
        <label className="hidden items-center gap-3 rounded-md border px-3 text-xs text-muted-foreground lg:flex">
          <span className="whitespace-nowrap">Painel lateral</span>
          <input
            type="range"
            min="260"
            max="440"
            step="20"
            value={labelWidth}
            onChange={(event) => setLabelWidth(Number(event.target.value))}
            className="h-2 w-full cursor-ew-resize accent-primary"
            aria-label="Largura do painel lateral do Gantt"
          />
          <span className="w-12 text-right tabular-nums">{labelWidth}px</span>
        </label>
        <Button variant="ghost" onClick={clearFilters} disabled={!projectId && !from && !until && stateUf === "all" && projectType === "all" && ownerId === "all" && scheduleView === "all"}>Limpar filtros</Button>
      </FilterToolbar>

      {invalidRange && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Período inválido</AlertTitle><AlertDescription>A data final deve ser igual ou posterior à data inicial.</AlertDescription></Alert>}
      {projectsQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar os projetos</AlertTitle><AlertDescription>{projectsQuery.error.message}</AlertDescription></Alert>}

      {indicators && <Card className="sagep-signal-hero overflow-hidden"><CardContent className="flex flex-col justify-between gap-6 p-6 lg:flex-row lg:items-center"><div className="max-w-xl"><Badge>Controle de execução</Badge><h2 className="mt-3 text-2xl font-semibold">Prazos, avanço e risco do cronograma</h2><p className="mt-2 text-sm text-muted-foreground">Síntese das Ordens de Serviço planejadas para priorização de atrasos e correção de lacunas no cronograma.</p></div><dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[540px]"><div className="sagep-metric-tile p-3"><dt className="text-xs text-muted-foreground uppercase">Cobertura</dt><dd className="mt-1 text-2xl font-semibold">{indicators.planningCoverage.toFixed(1)}%</dd></div><div className="sagep-metric-tile p-3"><dt className="text-xs text-muted-foreground uppercase">Progresso médio</dt><dd className="mt-1 text-2xl font-semibold text-primary">{indicators.averageProgress}%</dd></div><div className="sagep-metric-tile p-3"><dt className="text-xs text-muted-foreground uppercase">Taxa de atraso</dt><dd className="mt-1 text-2xl font-semibold text-status-danger">{indicators.delayedRate.toFixed(1)}%</dd></div><div className="sagep-metric-tile p-3"><dt className="flex items-center gap-1 text-xs text-muted-foreground uppercase"><Target className="size-3" />No prazo</dt><dd className="mt-1 text-2xl font-semibold">{indicators.onTrack}</dd></div></dl></CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button type="button" className="text-left" onClick={() => setScheduleView("all")}><Card className="h-full border-none shadow-sm transition hover:ring-1 hover:ring-primary/40"><CardContent className="flex items-center gap-4 p-5"><CalendarDays className="size-6 text-primary" /><div><p className="text-sm text-muted-foreground">Planejadas</p><p className="text-2xl font-semibold">{indicators?.scheduled ?? 0}</p></div></CardContent></Card></button>
        <button type="button" className="text-left" onClick={() => setScheduleView("delayed")}><Card className="h-full border-none shadow-sm transition hover:ring-1 hover:ring-destructive/40"><CardContent className="flex items-center gap-4 p-5"><ClockAlert className="size-6 text-destructive" /><div><p className="text-sm text-muted-foreground">Atrasadas</p><p className="text-2xl font-semibold">{indicators?.delayed ?? 0}</p></div></CardContent></Card></button>
        <button type="button" className="text-left" onClick={() => setScheduleView("unscheduled")}><Card className="h-full border-none shadow-sm transition hover:ring-1 hover:ring-status-warning/40"><CardContent className="flex items-center gap-4 p-5"><CircleDashed className="size-6 text-status-warning" /><div><p className="text-sm text-muted-foreground">Sem cronograma</p><p className="text-2xl font-semibold">{indicators?.unscheduled ?? 0}</p></div></CardContent></Card></button>
        <Card className="border-none shadow-sm"><CardContent className="flex items-center gap-4 p-5"><Gauge className="size-6 text-primary" /><div><p className="text-sm text-muted-foreground">Progresso médio</p><p className="text-2xl font-semibold">{indicators?.averageProgress ?? 0}%</p></div></CardContent></Card>
      </div>

      {ganttQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar o Gantt</AlertTitle><AlertDescription>{ganttQuery.error.message}</AlertDescription></Alert>}
      {ganttQuery.isLoading ? <Skeleton className="h-[460px]" /> : scheduled.length ? (<>
        <div className="grid gap-3 lg:hidden" aria-label="Resumo móvel do cronograma">{scheduled.map((item) => <Link key={item.id} to={`/service-orders/${item.id}`} className="rounded-xl border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-primary">OS-{item.serviceOrderCode} · PRJ-{item.project.projectCode}</p><p className="mt-1 font-medium">{item.project.title}</p></div><Badge variant={item.isDelayed ? "destructive" : "outline"}>{item.isDelayed ? "Atrasada" : `${item.progressPercent}%`}</Badge></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className={item.isDelayed ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${item.progressPercent}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">{formatDate(item.plannedStartDate)} → {formatDate(item.plannedEndDate)} · {item.tasks.length} etapa(s)</p></Link>)}</div>
        <Card className="hidden overflow-hidden border-none shadow-sm lg:block"><div className="overflow-x-auto" tabIndex={0} aria-label="Cronograma detalhado das Ordens de Serviço">
          <div
            className="grid min-w-[1100px] bg-sidebar text-sidebar-foreground"
            style={{ gridTemplateColumns: `${labelWidth}px minmax(820px, 1fr)` }}
          >
            <div className="border-r border-white/10 p-4"><p className="text-sm font-semibold">Ordem de Serviço / Projeto</p><p className="mt-1 text-xs text-sidebar-foreground/60">{formatDate(range.start)} a {formatDate(range.end)}</p></div>
            <div className="relative flex items-end justify-between px-4 py-4">
              {ticks.map((tick, index) => <span key={`${tick.toISOString()}-${index}`} className="text-xs text-sidebar-foreground/70">{formatDate(tick)}</span>)}
              {todayPosition !== null && (
                <span
                  className="absolute bottom-0 z-10 -translate-x-1/2 rounded-t bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950"
                  style={{ left: `${todayPosition}%` }}
                >
                  Hoje
                </span>
              )}
            </div>
          </div>
          {scheduled.map((item) => <GanttRow key={item.id} item={item} rangeStart={range.start} rangeEnd={range.end} labelWidth={labelWidth} todayPosition={todayPosition} />)}
        </div></Card>
      </>) : <Card className="border-none shadow-sm"><CardContent className="flex flex-col items-center py-16 text-center"><CalendarRange className="size-10 text-muted-foreground" /><p className="mt-4 font-medium">Nenhuma OS planejada no período</p><p className="mt-1 text-sm text-muted-foreground">Cadastre o início e o término planejados na Ordem de Serviço.</p></CardContent></Card>}

      {unscheduled.length > 0 && <Card className="border-none shadow-sm"><CardContent className="p-5"><h2 className="font-semibold">Ordens de Serviço sem cronograma</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{unscheduled.map((item) => <Link key={item.id} to={`/service-orders/${item.id}`} className="rounded-xl border p-4 transition hover:border-primary/50 hover:bg-muted/50"><p className="text-xs font-semibold text-primary">OS-{item.serviceOrderCode} · PRJ-{item.project.projectCode}</p><p className="mt-1 font-medium">{item.project.title}</p></Link>)}</div></CardContent></Card>}
    </div>
  )
}
