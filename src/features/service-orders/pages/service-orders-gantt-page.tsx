import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CalendarDays, CalendarRange, CheckCircle2, CircleDashed, ClockAlert, Gauge, RefreshCw, Search, Target } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { serviceOrdersService } from "@/features/service-orders/service-orders.service"
import { ganttIndicators } from "@/features/dashboard/planning-indicators"
import type { GanttServiceOrder } from "@/features/service-orders/service-orders.types"

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

function GanttRow({ item, rangeStart, rangeEnd }: { item: GanttServiceOrder; rangeStart: Date; rangeEnd: Date }) {
  const totalDays = Math.max(1, differenceInDays(rangeStart, rangeEnd) + 1)
  const itemStart = item.plannedStartDate ? startOfDay(item.plannedStartDate) : rangeStart
  const itemEnd = item.plannedEndDate ? startOfDay(item.plannedEndDate) : itemStart
  const offset = Math.max(0, differenceInDays(rangeStart, itemStart))
  const duration = Math.max(1, differenceInDays(itemStart, itemEnd) + 1)
  const left = Math.min(100, (offset / totalDays) * 100)
  const width = Math.max(1.5, Math.min(100 - left, (duration / totalDays) * 100))

  return (
    <div className="grid min-w-[1180px] grid-cols-[320px_minmax(820px,1fr)] border-t">
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
  const [projectCode, setProjectCode] = useState("")
  const [from, setFrom] = useState("")
  const [until, setUntil] = useState("")
  const filters = useMemo(() => ({ projectCode: projectCode ? Number(projectCode) : undefined, from: from || undefined, until: until || undefined }), [from, projectCode, until])
  const invalidRange = Boolean(from && until && until < from)
  const ganttQuery = useQuery({ queryKey: ["service-orders", "gantt", filters], queryFn: () => serviceOrdersService.gantt(filters), enabled: !invalidRange })
  const scheduled = ganttQuery.data?.serviceOrders.filter((item) => item.plannedStartDate || item.plannedEndDate) ?? []
  const unscheduled = ganttQuery.data?.serviceOrders.filter((item) => !item.plannedStartDate && !item.plannedEndDate) ?? []
  const delayed = scheduled.filter((item) => item.isDelayed).length
  const indicators = ganttQuery.data ? ganttIndicators(ganttQuery.data.serviceOrders) : null
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
  const clearFilters = () => { setProjectCode(""); setFrom(""); setUntil("") }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div><Badge className="mb-3">Planejamento temporal</Badge><h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight"><CalendarRange className="size-7 text-primary" />Gantt de Ordens de Serviço</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Visualize prazos, progresso e atrasos a partir do cronograma planejado de cada Ordem de Serviço.</p></div>
        <Button variant="outline" onClick={() => ganttQuery.refetch()} disabled={ganttQuery.isFetching}><RefreshCw className={ganttQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar</Button>
      </div>

      <Card className="border-none shadow-sm"><CardContent className="grid gap-3 p-4 md:grid-cols-[200px_1fr_1fr_auto]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="number" min="1" placeholder="Código do projeto" value={projectCode} onChange={(event) => setProjectCode(event.target.value)} aria-label="Código do projeto" /></div>
        <Input type="date" aria-label="Data inicial" value={from} onChange={(event) => setFrom(event.target.value)} />
        <Input type="date" aria-label="Data final" value={until} onChange={(event) => setUntil(event.target.value)} />
        <Button variant="ghost" onClick={clearFilters} disabled={!projectCode && !from && !until}>Limpar</Button>
      </CardContent></Card>

      {invalidRange && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Período inválido</AlertTitle><AlertDescription>A data final deve ser igual ou posterior à data inicial.</AlertDescription></Alert>}

      {indicators && <Card className="overflow-hidden border-none bg-slate-950 text-white shadow-lg"><CardContent className="flex flex-col justify-between gap-6 p-6 lg:flex-row lg:items-center"><div className="max-w-xl"><Badge className="bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/15">Controle de execução</Badge><h2 className="mt-3 text-2xl font-semibold">Prazos, avanço e risco do cronograma</h2><p className="mt-2 text-sm text-slate-300">Síntese das Ordens de Serviço planejadas para priorização de atrasos e correção de lacunas no cronograma.</p></div><dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[540px]"><div className="rounded-xl border border-white/10 bg-white/5 p-3"><dt className="text-xs text-slate-400">Cobertura</dt><dd className="mt-1 text-2xl font-semibold">{indicators.planningCoverage.toFixed(1)}%</dd></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><dt className="text-xs text-slate-400">Progresso médio</dt><dd className="mt-1 text-2xl font-semibold text-emerald-300">{indicators.averageProgress}%</dd></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><dt className="text-xs text-slate-400">Taxa de atraso</dt><dd className="mt-1 text-2xl font-semibold text-red-300">{indicators.delayedRate.toFixed(1)}%</dd></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><dt className="flex items-center gap-1 text-xs text-slate-400"><Target className="size-3" />No prazo</dt><dd className="mt-1 text-2xl font-semibold">{indicators.onTrack}</dd></div></dl></CardContent></Card>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none shadow-sm"><CardContent className="flex items-center gap-4 p-5"><CalendarDays className="size-6 text-primary" /><div><p className="text-sm text-muted-foreground">Planejadas</p><p className="text-2xl font-semibold">{scheduled.length}</p></div></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="flex items-center gap-4 p-5"><ClockAlert className="size-6 text-destructive" /><div><p className="text-sm text-muted-foreground">Atrasadas</p><p className="text-2xl font-semibold">{delayed}</p></div></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="flex items-center gap-4 p-5"><CircleDashed className="size-6 text-amber-600" /><div><p className="text-sm text-muted-foreground">Sem cronograma</p><p className="text-2xl font-semibold">{unscheduled.length}</p></div></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="flex items-center gap-4 p-5"><Gauge className="size-6 text-primary" /><div><p className="text-sm text-muted-foreground">Progresso médio</p><p className="text-2xl font-semibold">{indicators?.averageProgress ?? 0}%</p></div></CardContent></Card>
      </div>

      {ganttQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar o Gantt</AlertTitle><AlertDescription>{ganttQuery.error.message}</AlertDescription></Alert>}
      {ganttQuery.isLoading ? <Skeleton className="h-[460px]" /> : scheduled.length ? (<>
        <div className="grid gap-3 lg:hidden" aria-label="Resumo móvel do cronograma">{scheduled.map((item) => <Link key={item.id} to={`/service-orders/${item.id}`} className="rounded-xl border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-primary">OS-{item.serviceOrderCode} · PRJ-{item.project.projectCode}</p><p className="mt-1 font-medium">{item.project.title}</p></div><Badge variant={item.isDelayed ? "destructive" : "outline"}>{item.isDelayed ? "Atrasada" : `${item.progressPercent}%`}</Badge></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className={item.isDelayed ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${item.progressPercent}%` }} /></div><p className="mt-3 text-xs text-muted-foreground">{formatDate(item.plannedStartDate)} → {formatDate(item.plannedEndDate)} · {item.tasks.length} etapa(s)</p></Link>)}</div>
        <Card className="hidden overflow-hidden border-none shadow-sm lg:block"><div className="overflow-x-auto" tabIndex={0} aria-label="Cronograma detalhado das Ordens de Serviço">
          <div className="grid min-w-[1180px] grid-cols-[320px_minmax(820px,1fr)] bg-sidebar text-sidebar-foreground"><div className="border-r border-white/10 p-4"><p className="text-sm font-semibold">Ordem de Serviço / Projeto</p><p className="mt-1 text-xs text-sidebar-foreground/60">{formatDate(range.start)} a {formatDate(range.end)}</p></div><div className="flex items-end justify-between px-4 py-4">{ticks.map((tick, index) => <span key={`${tick.toISOString()}-${index}`} className="text-xs text-sidebar-foreground/70">{formatDate(tick)}</span>)}</div></div>
          {scheduled.map((item) => <GanttRow key={item.id} item={item} rangeStart={range.start} rangeEnd={range.end} />)}
        </div></Card>
      </>) : <Card className="border-none shadow-sm"><CardContent className="flex flex-col items-center py-16 text-center"><CalendarRange className="size-10 text-muted-foreground" /><p className="mt-4 font-medium">Nenhuma OS planejada no período</p><p className="mt-1 text-sm text-muted-foreground">Cadastre o início e o término planejados na Ordem de Serviço.</p></CardContent></Card>}

      {unscheduled.length > 0 && <Card className="border-none shadow-sm"><CardContent className="p-5"><h2 className="font-semibold">Ordens de Serviço sem cronograma</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{unscheduled.map((item) => <Link key={item.id} to={`/service-orders/${item.id}`} className="rounded-xl border p-4 transition hover:border-primary/50 hover:bg-muted/50"><p className="text-xs font-semibold text-primary">OS-{item.serviceOrderCode} · PRJ-{item.project.projectCode}</p><p className="mt-1 font-medium">{item.project.title}</p></Link>)}</div></CardContent></Card>}
    </div>
  )
}
