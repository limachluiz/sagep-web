import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  CalendarClock,
  ListTodo,
  Plus,
  RefreshCw,
  X,
} from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { DataTableSkeleton, EmptyState } from "@/components/data-table-state"
import { FilterToolbar, SearchField } from "@/components/filter-toolbar"
import { ListPagination } from "@/components/list-pagination"
import { UserAvatar } from "@/components/user-avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/features/auth/auth.store"
import { ProjectSelect } from "@/features/projects/components/project-select"
import { projectsService } from "@/features/projects/projects.service"
import { TaskFormSheet } from "@/features/tasks/components/task-form-sheet"
import {
  isTaskOverdue,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatusVariants,
} from "@/features/tasks/tasks.constants"
import { tasksService } from "@/features/tasks/tasks.service"
import type { CreateTaskPayload, TaskStatus, UpdateTaskPayload } from "@/features/tasks/tasks.types"

function formatDate(value: string | null) {
  if (!value) return "Sem prazo"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
}

function positiveNumber(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export function TasksListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const canCreate = hasPermission("tasks.create")
  const canAssign = hasPermission("tasks.assign")
  const canViewArchived = hasPermission("tasks.restore") || hasPermission("tasks.delete")
  const initialProjectCode = positiveNumber(searchParams.get("projectCode"))
  const initialProjectId = searchParams.get("projectId") ?? ""
  const shouldOpenCreate = searchParams.get("new") === "true" && canCreate

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [projectId, setProjectId] = useState(initialProjectId)
  const [status, setStatus] = useState<TaskStatus | "all">("all")
  const [visibility, setVisibility] = useState<"active" | "archived">("active")
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(shouldOpenCreate)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 400)
    return () => window.clearTimeout(timeout)
  }, [search])

  const projectsQuery = useQuery({
    queryKey: ["projects", "task-filter-options"],
    queryFn: () => projectsService.list({ page: 1, pageSize: 100 }),
  })
  const projectOptions = projectsQuery.data?.items ?? []
  const selectedProject = projectOptions.find((project) => project.id === projectId)
  const selectedProjectId = selectedProject?.id ?? projectId

  const filters = useMemo(() => ({
    page,
    pageSize: 10,
    search: debouncedSearch || undefined,
    projectCode: selectedProject?.projectCode,
    status: status === "all" ? undefined : status,
    onlyArchived: visibility === "archived" || undefined,
  }), [debouncedSearch, page, selectedProject?.projectCode, status, visibility])

  const query = useQuery({
    queryKey: ["tasks", "list", filters],
    queryFn: () => tasksService.list(filters),
    placeholderData: (previous) => previous,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload | UpdateTaskPayload) =>
      tasksService.create(payload as CreateTaskPayload),
    onSuccess: (task) => {
      toast.success(`Tarefa TSK-${task.taskCode} criada com sucesso.`)
      setCreateOpen(false)
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate(`/tasks/${task.id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const hasActiveFilters = Boolean(search || selectedProjectId || status !== "all" || visibility !== "active")
  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setProjectId("")
    setStatus("all")
    setVisibility("active")
    setPage(1)
    setSearchParams({}, { replace: true })
  }
  const meta = query.data?.meta

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge className="mb-3">Execução operacional</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Tarefas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Organize atividades, responsáveis, prioridades e prazos dos projetos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar
          </Button>
          {canCreate && <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" />Nova tarefa</Button>}
        </div>
      </div>

      <FilterToolbar className="xl:grid-cols-[minmax(260px,1fr)_160px_200px_180px_auto]">
          <SearchField aria-label="Buscar tarefas" placeholder="Buscar por título ou descrição..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <ProjectSelect
            projects={projectOptions}
            value={selectedProjectId}
            onValueChange={(value) => { setProjectId(value); setPage(1) }}
            allowAll
            loading={projectsQuery.isLoading}
            error={projectsQuery.isError}
            ariaLabel="Filtrar por projeto"
          />
          <Select value={status} onValueChange={(value) => { setStatus(value as TaskStatus | "all"); setPage(1) }}>
            <SelectTrigger className="w-full" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(taskStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
          {canViewArchived ? (
            <Select value={visibility} onValueChange={(value) => { setVisibility(value as "active" | "archived"); setPage(1) }}>
              <SelectTrigger className="w-full" aria-label="Filtrar por situação"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Tarefas ativas</SelectItem>
                <SelectItem value="archived">Arquivadas</SelectItem>
              </SelectContent>
            </Select>
          ) : <div />}
          {hasActiveFilters && <Button variant="ghost" onClick={clearFilters}><X className="size-4" />Limpar</Button>}
      </FilterToolbar>

      {query.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar as tarefas</AlertTitle>
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><ListTodo className="size-5 text-primary" />{visibility === "archived" ? "Tarefas arquivadas" : "Tarefas cadastradas"}</CardTitle>
          {meta && <Badge variant="outline">{meta.totalItems} tarefa(s)</Badge>}
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <DataTableSkeleton />
          ) : query.data?.items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((task) => {
                  const overdue = isTaskOverdue(task)
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <p className="font-medium">TSK-{task.taskCode}</p>
                        <p className="max-w-64 truncate text-xs text-muted-foreground">{task.title}</p>
                        {task.archivedAt && <Badge variant="outline" className="mt-1">Arquivada</Badge>}
                      </TableCell>
                      <TableCell>
                        <Link className="font-medium text-primary hover:underline" to={`/projects/${task.project.id}`}>PRJ-{task.project.projectCode}</Link>
                        <p className="max-w-48 truncate text-xs text-muted-foreground">{task.project.title}</p>
                      </TableCell>
                      <TableCell><Badge variant={taskStatusVariants[task.status]}>{taskStatusLabels[task.status]}</Badge></TableCell>
                      <TableCell>{task.priority} · {taskPriorityLabels[task.priority] ?? "Não definida"}</TableCell>
                      <TableCell>{task.assignee ? <div className="flex items-center gap-2"><UserAvatar user={task.assignee} className="size-8" /><div><p>{task.assignee.name}</p><p className="text-xs text-muted-foreground">USR-{task.assignee.userCode}</p></div></div> : "Não atribuído"}</TableCell>
                      <TableCell>
                        <span className={overdue ? "font-medium text-destructive" : ""}>{formatDate(task.dueDate)}</span>
                        {overdue && <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><CalendarClock className="size-3" />Em atraso</p>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/tasks/${task.id}${visibility === "archived" ? "?includeArchived=true" : ""}`}>Detalhes</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={ListTodo}
              title="Nenhuma tarefa encontrada"
              description="Ajuste os filtros ou cadastre uma nova atividade."
            />
          )}

          {meta && meta.totalItems > 0 && (
            <ListPagination
              page={meta.page}
              totalPages={meta.totalPages}
              hasPreviousPage={meta.hasPreviousPage}
              hasNextPage={meta.hasNextPage}
              onPrevious={() => setPage((value) => value - 1)}
              onNext={() => setPage((value) => value + 1)}
            />
          )}
        </CardContent>
      </Card>

      <TaskFormSheet
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open && searchParams.has("new")) {
            const next = new URLSearchParams(searchParams)
            next.delete("new")
            setSearchParams(next, { replace: true })
          }
        }}
        initialProjectCode={initialProjectCode}
        initialProjectId={selectedProjectId}
        canAssign={canAssign}
        pending={createMutation.isPending}
        onSubmit={async (payload) => { await createMutation.mutateAsync(payload) }}
      />
    </div>
  )
}
