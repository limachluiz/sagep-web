import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ListChecks,
  ListTodo,
  Plus,
  Search,
} from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  isTaskOverdue,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatusVariants,
} from "@/features/tasks/tasks.constants"
import type { TaskStatus } from "@/features/tasks/tasks.types"
import { buildProjectTaskSummary, getPriorityProjectTasks } from "../project-task-insights"
import type { ProjectTaskItem } from "../projects.types"

function formatDate(value: string | null) {
  if (!value) return "Sem prazo"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
}

type ProjectTasksOverviewProps = {
  tasks: ProjectTaskItem[]
  canCreate: boolean
  onCreate: () => void
  onShowAll: () => void
}

export function ProjectTasksOverview({
  tasks,
  canCreate,
  onCreate,
  onShowAll,
}: ProjectTasksOverviewProps) {
  const summary = buildProjectTaskSummary(tasks)
  const priorities = getPriorityProjectTasks(tasks)
  const metrics = [
    { label: "Total", value: summary.total, icon: ListChecks },
    { label: "Pendentes", value: summary.pending, icon: CircleDot },
    { label: "Em andamento", value: summary.inProgress, icon: ListTodo },
    { label: "Atrasadas", value: summary.overdue, icon: AlertTriangle, destructive: summary.overdue > 0 },
    { label: "Concluídas", value: summary.completed, icon: CheckCircle2 },
  ]

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-5 text-primary" />
            Tarefas do projeto
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Progresso e próximas atividades que exigem atenção.</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onShowAll}>Ver todas</Button>
          {canCreate && <Button size="sm" onClick={onCreate}><Plus className="size-4" />Nova tarefa</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso de conclusão</span>
            <span className="font-semibold">{summary.completionPercent}%</span>
          </div>
          <Progress value={summary.completionPercent} aria-label={`${summary.completionPercent}% das tarefas concluídas`} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="rounded-xl border bg-muted/20 p-3">
                <Icon className={metric.destructive ? "size-4 text-destructive" : "size-4 text-primary"} />
                <p className="mt-3 text-xs text-muted-foreground">{metric.label}</p>
                <p className={metric.destructive ? "mt-1 text-xl font-semibold text-destructive" : "mt-1 text-xl font-semibold"}>{metric.value}</p>
              </div>
            )
          })}
        </div>

        {priorities.length ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Próximas prioridades</p>
            {priorities.map((task) => {
              const overdue = isTaskOverdue(task)
              return (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-primary">TSK-{task.taskCode}</span>
                      <Badge variant={taskStatusVariants[task.status]}>{taskStatusLabels[task.status]}</Badge>
                      {overdue && <Badge variant="destructive">Em atraso</Badge>}
                    </div>
                    <p className="mt-1 truncate font-medium">{task.title}</p>
                  </div>
                  <div className="shrink-0 text-left text-xs text-muted-foreground sm:text-right">
                    <p>{task.assignee?.name ?? "Não atribuído"}</p>
                    <p className={overdue ? "mt-1 text-destructive" : "mt-1"}>{formatDate(task.dueDate)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-8 text-center">
            <CheckCircle2 className="mx-auto size-8 text-primary" />
            <p className="mt-3 font-medium">{tasks.length ? "Nenhuma tarefa aberta" : "Nenhuma tarefa cadastrada"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tasks.length ? "As atividades deste projeto estão encerradas." : "Crie a primeira atividade para organizar a execução."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type ProjectTasksPanelProps = {
  tasks: ProjectTaskItem[]
  canCreate: boolean
  canChangeStatus: boolean
  statusPendingId: string | null
  onCreate: () => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}

export function ProjectTasksPanel({
  tasks,
  canCreate,
  canChangeStatus,
  statusPendingId,
  onCreate,
  onStatusChange,
}: ProjectTasksPanelProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<TaskStatus | "all">("all")
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR")
    return tasks.filter((task) => {
      const matchesSearch = !normalizedSearch
        || task.title.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
        || `tsk-${task.taskCode}`.includes(normalizedSearch)
        || task.assignee?.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
      return matchesSearch && (status === "all" || task.status === status)
    })
  }, [search, status, tasks])

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <CardTitle className="flex items-center gap-2"><ListTodo className="size-5 text-primary" />Gestão de tarefas</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe e atualize todas as atividades vinculadas a este projeto.</p>
        </div>
        {canCreate && <Button onClick={onCreate}><Plus className="size-4" />Nova tarefa</Button>}
      </CardHeader>
      <CardContent>
        <div className="mb-5 grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar tarefas do projeto"
              className="pl-9"
              placeholder="Buscar por tarefa ou responsável..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus | "all")}>
            <SelectTrigger className="w-full" aria-label="Filtrar tarefas do projeto por status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(taskStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarefa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((task) => {
                const overdue = isTaskOverdue(task)
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <p className="font-medium">TSK-{task.taskCode}</p>
                      <p className="max-w-72 truncate text-xs text-muted-foreground">{task.title}</p>
                      {task.archivedAt && <Badge variant="outline" className="mt-1">Arquivada</Badge>}
                    </TableCell>
                    <TableCell>
                      {canChangeStatus && !task.archivedAt ? (
                        <Select
                          value={task.status}
                          onValueChange={(value) => onStatusChange(task.id, value as TaskStatus)}
                          disabled={statusPendingId === task.id}
                        >
                          <SelectTrigger className="w-40" aria-label={`Status da TSK-${task.taskCode}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(taskStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : <Badge variant={taskStatusVariants[task.status]}>{taskStatusLabels[task.status]}</Badge>}
                    </TableCell>
                    <TableCell>{task.priority} · {taskPriorityLabels[task.priority]}</TableCell>
                    <TableCell>{task.assignee?.name ?? "Não atribuído"}</TableCell>
                    <TableCell>
                      <span className={overdue ? "font-medium text-destructive" : ""}>{formatDate(task.dueDate)}</span>
                      {overdue && <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><CalendarClock className="size-3" />Em atraso</p>}
                    </TableCell>
                    <TableCell className="text-right"><Button asChild size="sm" variant="outline"><Link to={`/tasks/${task.id}${task.archivedAt ? "?includeArchived=true" : ""}`}>Detalhes</Link></Button></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-xl border border-dashed py-12 text-center">
            <ListTodo className="mx-auto size-9 text-muted-foreground/50" />
            <p className="mt-3 font-medium">Nenhuma tarefa encontrada</p>
            <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou cadastre uma nova atividade.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
