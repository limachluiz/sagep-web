import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  ClipboardList,
  FileSpreadsheet,
  ListChecks,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { DataTableSkeleton, EmptyState } from "@/components/data-table-state"
import { FilterToolbar, SearchField } from "@/components/filter-toolbar"
import { ListPagination } from "@/components/list-pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuthStore } from "@/features/auth/auth.store"
import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import { ProjectFormSheet } from "@/features/projects/components/project-form-sheet"
import { projectsService } from "@/features/projects/projects.service"
import type { ProjectMutationPayload, ProjectStatus } from "@/features/projects/projects.types"

const projectTypeLabels = {
  CFTV: "CFTV",
  FIBRA_OPTICA_PONTO_LOGICO: "Fibra / Ponto Lógico",
} as const

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
  SERVICO_EM_EXECUCAO: "Serviço em execução",
  ANALISANDO_AS_BUILT: "Analisando As-Built",
  ATESTAR_NF: "Atestar NF",
  SERVICO_CONCLUIDO: "Serviço concluído",
  CANCELADO: "Cancelado",
}

const statusVariants: Record<ProjectStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PLANEJAMENTO: "outline",
  EM_ANDAMENTO: "default",
  PAUSADO: "secondary",
  CONCLUIDO: "secondary",
  CANCELADO: "destructive",
}

function formatDate(value: string | null) {
  if (!value) return "Não definida"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
}

export function ProjectsListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const canCreate = hasPermission("projects.edit_all") || hasPermission("projects.edit_own")
  const canViewArchived = hasPermission("projects.restore") || hasPermission("projects.delete")
  const initialSearch = searchParams.get("search") ?? ""
  const initialStatus = searchParams.get("status")
  const initialStage = searchParams.get("stage")
  const [search, setSearch] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [status, setStatus] = useState<ProjectStatus | "all">(
    initialStatus && initialStatus in statusLabels ? initialStatus as ProjectStatus : "all",
  )
  const [stage, setStage] = useState<ProjectStage | "all">(
    initialStage && initialStage in stageLabels ? initialStage as ProjectStage : "all",
  )
  const [visibility, setVisibility] = useState<"active" | "archived">("active")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)

  const createMutation = useMutation({
    mutationFn: (payload: ProjectMutationPayload) => projectsService.create(payload),
    onSuccess: (project) => {
      toast.success(`Projeto PRJ-${project.projectCode} criado com sucesso.`)
      setCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      navigate(`/projects/${project.id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) next.set("search", debouncedSearch)
    else next.delete("search")
    if (status !== "all") next.set("status", status)
    else next.delete("status")
    if (stage !== "all") next.set("stage", stage)
    else next.delete("stage")
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [debouncedSearch, searchParams, setSearchParams, stage, status])

  const filters = useMemo(
    () => ({
      page,
      pageSize,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      stage: stage === "all" ? undefined : stage,
      onlyArchived: visibility === "archived" || undefined,
    }),
    [debouncedSearch, page, pageSize, stage, status, visibility],
  )

  const projectsQuery = useQuery({
    queryKey: ["projects", "list", filters],
    queryFn: () => projectsService.list(filters),
    placeholderData: (previousData) => previousData,
  })

  const hasActiveFilters = Boolean(search || status !== "all" || stage !== "all" || visibility !== "active")

  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setStatus("all")
    setStage("all")
    setVisibility("active")
    setPage(1)
  }

  const meta = projectsQuery.data?.meta

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge className="mb-3">Portfólio de projetos</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Projetos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consulte o andamento, responsável, etapa documental e volume de atividades de cada projeto.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => projectsQuery.refetch()} disabled={projectsQuery.isFetching}>
            <RefreshCw className={projectsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
            Atualizar
          </Button>
          {canCreate && <Button className="w-full gap-2 sm:w-auto" onClick={() => setCreateOpen(true)}><Plus className="size-4" />Novo projeto</Button>}
        </div>
      </div>

      <FilterToolbar className="xl:grid-cols-[minmax(280px,1fr)_220px_260px_190px_auto]">
          <SearchField
            aria-label="Buscar projetos"
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <Select value={status} onValueChange={(value) => { setStatus(value as ProjectStatus | "all"); setPage(1) }}>
            <SelectTrigger className="w-full" aria-label="Filtrar por status"><SelectValue placeholder="Todos os status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={stage} onValueChange={(value) => { setStage(value as ProjectStage | "all"); setPage(1) }}>
            <SelectTrigger className="w-full" aria-label="Filtrar por etapa"><SelectValue placeholder="Todas as etapas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {Object.entries(stageLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>

          {canViewArchived ? (
            <Select value={visibility} onValueChange={(value) => { setVisibility(value as "active" | "archived"); setPage(1) }}>
              <SelectTrigger className="w-full" aria-label="Filtrar por situação"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Projetos ativos</SelectItem>
                <SelectItem value="archived">Arquivados</SelectItem>
              </SelectContent>
            </Select>
          ) : <div />}

          {hasActiveFilters && (
            <Button variant="ghost" className="gap-2" onClick={clearFilters}>
              <X className="size-4" /> Limpar
            </Button>
          )}
      </FilterToolbar>

      {projectsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar os projetos</AlertTitle>
          <AlertDescription>{projectsQuery.error.message}</AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            {visibility === "archived" ? "Projetos arquivados" : "Projetos ativos"}
          </CardTitle>
          {meta && <Badge variant="outline">{meta.totalItems} projeto(s)</Badge>}
        </CardHeader>
        <CardContent>
          {projectsQuery.isLoading ? (
            <DataTableSkeleton />
          ) : projectsQuery.data?.items.length ? (
            <>
            <div className="space-y-3 md:hidden" aria-label="Projetos encontrados">
              {projectsQuery.data.items.map((project) => (
                <article key={project.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-semibold">PRJ-{project.projectCode}</p><h2 className="mt-1 text-sm font-medium leading-5">{project.title}</h2></div>
                    <Badge variant={statusVariants[project.status]}>{statusLabels[project.status]}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{stageLabels[project.stage]}</Badge>{project.projectType && <Badge variant="secondary">{projectTypeLabels[project.projectType]}</Badge>}</div>
                  {project.om && <p className="mt-3 text-sm"><span className="text-muted-foreground">OM:</span> {project.om.sigla} · {project.om.cityName}/{project.om.stateUf}</p>}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground"><span>Responsável: {project.owner?.name ?? project.ownerName ?? "Não informado"}</span><span className="text-right">Início: {formatDate(project.startDate)}</span></div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <div className="flex gap-3 text-xs text-muted-foreground" aria-label="Resumo de atividades"><span className="flex items-center gap-1" aria-label={`${project._count.members} membros`}><Users className="size-3.5" />{project._count.members}</span><span className="flex items-center gap-1" aria-label={`${project._count.tasks} tarefas`}><ListChecks className="size-3.5" />{project._count.tasks}</span><span className="flex items-center gap-1" aria-label={`${project._count.estimates} estimativas`}><FileSpreadsheet className="size-3.5" />{project._count.estimates}</span></div>
                    <Button asChild variant="outline" size="sm"><Link to={`/projects/${project.id}${visibility === "archived" ? "?includeArchived=true" : ""}`} aria-label={`Abrir projeto PRJ-${project.projectCode}`}><span>Abrir</span><ArrowUpRight className="size-4" /></Link></Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden md:block">
            <Table>
              <TableCaption className="sr-only">Lista de projetos com status, etapa, responsável e data de início</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Etapa atual</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Atividades</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Atualização</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsQuery.data.items.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="max-w-72">
                        <p className="font-medium">PRJ-{project.projectCode} · {project.title}</p>
                        {(project.projectType || project.om) && (
                          <p className="mt-1 text-xs font-medium text-primary">
                            {project.projectType ? projectTypeLabels[project.projectType] : "Tipo não classificado"}
                            {project.om && ` · ${project.om.sigla} (${project.om.cityName}/${project.om.stateUf})`}
                          </p>
                        )}
                        <p className="mt-1 truncate text-xs text-muted-foreground">{project.description || "Sem descrição"}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={statusVariants[project.status]}>{statusLabels[project.status]}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{stageLabels[project.stage]}</Badge></TableCell>
                    <TableCell>
                      <p className="font-medium">{project.owner?.name ?? project.ownerName ?? "Não informado"}</p>
                      {project.owner?.email && <p className="mt-1 text-xs text-muted-foreground">{project.owner.email}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1" title="Membros"><Users className="size-3.5" />{project._count.members}</span>
                        <span className="flex items-center gap-1" title="Tarefas"><ListChecks className="size-3.5" />{project._count.tasks}</span>
                        <span className="flex items-center gap-1" title="Estimativas"><FileSpreadsheet className="size-3.5" />{project._count.estimates}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">{formatDate(project.startDate)}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(project.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/projects/${project.id}${visibility === "archived" ? "?includeArchived=true" : ""}`} aria-label={`Abrir projeto PRJ-${project.projectCode}`}>
                          Abrir
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
          ) : (
            <EmptyState
              icon={visibility === "archived" ? Archive : ClipboardList}
              title="Nenhum projeto encontrado"
              description="Ajuste os filtros ou cadastre um novo projeto."
            />
          )}

          {meta && meta.totalItems > 0 && (
            <ListPagination
              page={meta.page}
              totalPages={meta.totalPages}
              hasPreviousPage={meta.hasPreviousPage}
              hasNextPage={meta.hasNextPage}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50]}
              itemLabel="Projetos"
              onPageSizeChange={(value) => { setPageSize(value); setPage(1) }}
              onPrevious={() => setPage((current) => current - 1)}
              onNext={() => setPage((current) => current + 1)}
            />
          )}
        </CardContent>
      </Card>

      <ProjectFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        pending={createMutation.isPending}
        onSubmit={async (payload) => { await createMutation.mutateAsync(payload) }}
      />
    </div>
  )
}
