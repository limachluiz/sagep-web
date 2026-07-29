import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertTriangle, Download, FileChartColumn, FileSpreadsheet, FolderOpen, RefreshCw, Search, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/features/auth/auth.store"
import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import { ProjectSelect } from "@/features/projects/components/project-select"
import { projectsService } from "@/features/projects/projects.service"
import type { ProjectStatus } from "@/features/projects/projects.types"
import { reportsService } from "@/features/reports/reports.service"
import type { ProjectExportFilters } from "@/features/reports/reports.types"
import { cn } from "@/lib/utils"

const statusLabels: Record<ProjectStatus, string> = {
  PLANEJAMENTO: "Planejamento",
  EM_ANDAMENTO: "Em andamento",
  PAUSADO: "Pausado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

const stageLabels: Record<ProjectStage, string> = {
  ESTIMATIVA_PRECO: "Estimativa de preço",
  AGUARDANDO_NOTA_CREDITO: "Aguardando Nota de Crédito",
  DIEX_REQUISITORIO: "DIEx requisitório",
  AGUARDANDO_NOTA_EMPENHO: "Aguardando Nota de Empenho",
  OS_LIBERADA: "OS liberada",
  AGUARDANDO_OS_ASSINADA: "Aguardando OS assinada",
  AGUARDANDO_INICIO_EXECUCAO: "Aguardando início",
  SERVICO_EM_EXECUCAO: "Serviço em execução",
  ANALISANDO_AS_BUILT: "Analisando As-Built",
  ATESTAR_NF: "Atestar NF",
  SERVICO_CONCLUIDO: "Serviço concluído",
  CANCELADO: "Cancelado",
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}

export function ReportsPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState<ProjectStatus | "all">("all")
  const [stage, setStage] = useState<ProjectStage | "all">("all")
  const [includeArchived, setIncludeArchived] = useState(false)
  const [projectId, setProjectId] = useState("")

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(timeout)
  }, [search])

  const filters = useMemo<ProjectExportFilters>(() => ({
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    stage: stage === "all" ? undefined : stage,
    includeArchived: includeArchived || undefined,
  }), [debouncedSearch, includeArchived, stage, status])

  const projectsQuery = useQuery({
    queryKey: ["reports", "projects", filters],
    queryFn: () => projectsService.list({ page: 1, pageSize: 100, search: filters.search, status: filters.status, stage: filters.stage, includeArchived: filters.includeArchived }),
    placeholderData: (previous) => previous,
  })
  const dossierQuery = useQuery({
    queryKey: ["reports", "dossier", projectId],
    queryFn: () => reportsService.projectDossier(projectId),
    enabled: Boolean(projectId),
  })

  const exportMutation = useMutation({
    mutationFn: () => reportsService.exportProjects(filters),
    onSuccess: (blob) => {
      downloadBlob(blob, `projetos-sagep-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success("Planilha de projetos gerada com sucesso.")
    },
    onError: (error) => toast.error(error.message),
  })
  const pdfMutation = useMutation({
    mutationFn: () => reportsService.projectDossierPdf(projectId),
    onSuccess: (blob) => {
      const projectCode = dossierQuery.data?.project.projectCode ?? "projeto"
      downloadBlob(blob, `dossie-PRJ-${projectCode}.pdf`)
      toast.success("Dossiê do projeto gerado com sucesso.")
    },
    onError: (error) => toast.error(error.message),
  })

  const projects = projectsQuery.data?.items ?? []
  const canIncludeArchived = hasPermission("projects.view_all")
  const clearFilters = () => { setSearch(""); setDebouncedSearch(""); setStatus("all"); setStage("all"); setIncludeArchived(false) }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><Badge className="mb-3">Análise e prestação de contas</Badge><h1 className="text-3xl font-semibold tracking-tight">Relatórios e exportações</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Gere a planilha consolidada do portfólio e dossiês individuais com dados financeiros, documentos, pendências e histórico do projeto.</p></div><Button variant="outline" onClick={() => projectsQuery.refetch()} disabled={projectsQuery.isFetching}><RefreshCw className={cn("size-4", projectsQuery.isFetching && "animate-spin")} />Atualizar dados</Button></div>

    <div className="grid gap-4 md:grid-cols-3"><Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Projetos encontrados</p><p className="mt-2 text-2xl font-semibold">{projectsQuery.isLoading ? "—" : projectsQuery.data?.meta.totalItems ?? 0}</p></div><FolderOpen className="size-6 text-primary" /></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Formato consolidado</p><p className="mt-2 text-lg font-semibold">Excel (.xlsx)</p></div><FileSpreadsheet className="size-6 text-primary" /></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Dossiê individual</p><p className="mt-2 text-lg font-semibold">PDF auditável</p></div><ShieldCheck className="size-6 text-primary" /></CardContent></Card></div>

    <Card className="border-none shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="size-5 text-primary" />Planilha do portfólio</CardTitle><CardDescription>Os filtros abaixo são aplicados diretamente à geração do arquivo.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_220px_260px_auto]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Título ou descrição do projeto..." /></div><Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus | "all")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={stage} onValueChange={(value) => setStage(value as ProjectStage | "all")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as etapas</SelectItem>{Object.entries(stageLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><div className="flex gap-2"><Button variant="outline" onClick={clearFilters}>Limpar</Button><Button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}><Download className="size-4" />{exportMutation.isPending ? "Gerando..." : "Exportar"}</Button></div></div>{canIncludeArchived && <label className="flex w-fit cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />Incluir projetos arquivados na planilha</label>}</CardContent></Card>

    {projectsQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar os projetos</AlertTitle><AlertDescription>{projectsQuery.error.message}</AlertDescription></Alert>}

    <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Prévia dos projetos</CardTitle><CardDescription>A seleção atual também alimenta a geração do dossiê individual.</CardDescription></div><Badge variant="outline">até 100 registros</Badge></CardHeader><CardContent className="overflow-x-auto">{projectsQuery.isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div> : projects.length ? <Table><TableHeader><TableRow><TableHead>Projeto</TableHead><TableHead>OM</TableHead><TableHead>Status</TableHead><TableHead>Etapa</TableHead><TableHead>Responsável</TableHead><TableHead className="text-right">Dossiê</TableHead></TableRow></TableHeader><TableBody>{projects.slice(0, 10).map((project) => <TableRow key={project.id}><TableCell><p className="font-medium">PRJ-{project.projectCode} · {project.title}</p><p className="mt-1 text-xs text-muted-foreground">Atualizado em {formatDate(project.updatedAt)}</p></TableCell><TableCell>{project.om?.sigla ?? "Não definida"}</TableCell><TableCell><Badge variant={project.status === "CANCELADO" ? "destructive" : project.status === "EM_ANDAMENTO" ? "default" : "secondary"}>{statusLabels[project.status]}</Badge></TableCell><TableCell>{stageLabels[project.stage]}</TableCell><TableCell>{project.owner?.name ?? project.ownerName ?? "Não definido"}</TableCell><TableCell className="text-right"><Button size="sm" variant={projectId === project.id ? "default" : "outline"} onClick={() => setProjectId(project.id)}><FileChartColumn className="size-4" />{projectId === project.id ? "Selecionado" : "Selecionar"}</Button></TableCell></TableRow>)}</TableBody></Table> : <div className="py-14 text-center"><FolderOpen className="mx-auto size-10 text-muted-foreground" /><p className="mt-4 font-medium">Nenhum projeto encontrado</p><p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros para montar o relatório.</p></div>}</CardContent></Card>

    <Card className="border-none shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><FileChartColumn className="size-5 text-primary" />Dossiê individual</CardTitle><CardDescription>Selecione um projeto na prévia ou localize-o na lista completa.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="flex flex-col gap-3 sm:flex-row"><ProjectSelect projects={projects} value={projectId} onValueChange={setProjectId} loading={projectsQuery.isLoading} error={projectsQuery.isError} ariaLabel="Projeto do dossiê" className="w-full sm:max-w-xl" /><Button onClick={() => pdfMutation.mutate()} disabled={!projectId || pdfMutation.isPending}><Download className="size-4" />{pdfMutation.isPending ? "Gerando PDF..." : "Baixar dossiê PDF"}</Button></div>
      {!projectId && <div className="rounded-xl border border-dashed bg-muted/20 py-12 text-center"><FileChartColumn className="mx-auto size-10 text-muted-foreground" /><p className="mt-4 font-medium">Nenhum projeto selecionado</p></div>}
      {dossierQuery.isLoading && <div className="grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div>}
      {dossierQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível montar o dossiê</AlertTitle><AlertDescription>{dossierQuery.error.message}</AlertDescription></Alert>}
      {dossierQuery.data && <DossierPreview dossier={dossierQuery.data} />}
    </CardContent></Card>
  </div>
}

function DossierPreview({ dossier }: { dossier: Awaited<ReturnType<typeof reportsService.projectDossier>> }) {
  const cards = [
    ["Valor estimado", formatCurrency(dossier.financialSummary.estimatedTotalAmount)],
    ["Tarefas abertas", String(dossier.operationalSummary.openTasksCount)],
    ["Documentos", String(dossier.documents.estimates.length + dossier.documents.diexRequests.length + dossier.documents.serviceOrders.length)],
    ["Pendências", String(dossier.pendingActions.length)],
  ]
  return <div className="space-y-5 border-t pt-5"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">PRJ-{dossier.project.projectCode} · {dossier.project.title}</h3><Badge>{statusLabels[dossier.workflow.status]}</Badge><Badge variant="outline">{stageLabels[dossier.workflow.stage]}</Badge></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p></div>)}</div><div className="grid gap-5 lg:grid-cols-2"><div><p className="mb-3 text-sm font-medium">Próxima ação</p><div className="rounded-xl border p-4"><p className="font-medium">{dossier.workflow.nextAction.label}</p><p className="mt-1 text-sm text-muted-foreground">{dossier.workflow.nextAction.description}</p></div></div><div><p className="mb-3 text-sm font-medium">Últimos marcos</p><div className="space-y-2">{dossier.timelineSummary.slice(-3).reverse().map((item) => <div key={item.id} className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2"><div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.actorName ?? "Registro do sistema"}</p></div><span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.at)}</span></div>)}{!dossier.timelineSummary.length && <p className="text-sm text-muted-foreground">Nenhum marco registrado.</p>}</div></div></div><p className="text-xs text-muted-foreground">Prévia gerada em {formatDate(dossier.generatedAt)}. O PDF contém o detalhamento consolidado.</p></div>
}
