import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
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
  const queryClient = useQueryClient()
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const canCreate = hasPermission("projects.edit_all") || hasPermission("projects.edit_own")
  const canViewArchived = hasPermission("projects.restore")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState<ProjectStatus | "all">("all")
  const [stage, setStage] = useState<ProjectStage | "all">("all")
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
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => projectsQuery.refetch()} disabled={projectsQuery.isFetching}>
            <RefreshCw className={projectsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
            Atualizar
          </Button>
          {canCreate && <Button className="gap-2" onClick={() => setCreateOpen(true)}><Plus className="size-4" />Novo projeto</Button>}
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_220px_260px_190px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por título ou descrição..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select value={status} onValueChange={(value) => { setStatus(value as ProjectStatus | "all"); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={stage} onValueChange={(value) => { setStage(value as ProjectStage | "all"); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Todas as etapas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {Object.entries(stageLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>

          {canViewArchived ? (
            <Select value={visibility} onValueChange={(value) => { setVisibility(value as "active" | "archived"); setPage(1) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
        </CardContent>
      </Card>

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
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16" />)}
            </div>
          ) : projectsQuery.data?.items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Etapa atual</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Atividades</TableHead>
                  <TableHead>Prazo</TableHead>
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
                      <p className="mt-1 text-xs text-muted-foreground">até {formatDate(project.endDate)}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(project.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/projects/${project.id}${visibility === "archived" ? "?includeArchived=true" : ""}`}>
                          Abrir
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              {visibility === "archived" ? <Archive className="size-10 text-muted-foreground" /> : <ClipboardList className="size-10 text-muted-foreground" />}
              <p className="mt-4 font-medium">Nenhum projeto encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou cadastre um novo projeto.</p>
            </div>
          )}

          {meta && meta.totalItems > 0 && (
            <div className="mt-6 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Exibir</span>
                <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1) }}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>por página</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Página {meta.page} de {meta.totalPages}</span>
                <Button variant="outline" size="icon" disabled={!meta.hasPreviousPage} onClick={() => setPage((current) => current - 1)} title="Página anterior">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={!meta.hasNextPage} onClick={() => setPage((current) => current + 1)} title="Próxima página">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
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
