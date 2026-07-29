import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Edit3,
  ListTodo,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import { toast } from "sonner"

import { ArchiveActionDialog } from "@/components/archive-action-dialog"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/auth.store"
import { TaskFormSheet } from "@/features/tasks/components/task-form-sheet"
import {
  isTaskOverdue,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatusVariants,
} from "@/features/tasks/tasks.constants"
import { tasksService } from "@/features/tasks/tasks.service"
import type { CreateTaskPayload, TaskStatus, UpdateTaskPayload } from "@/features/tasks/tasks.types"

function formatDate(value: string | null, withTime = false) {
  if (!value) return "Não informado"
  return new Intl.DateTimeFormat("pt-BR", withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(new Date(value))
}

export function TaskDetailsPage() {
  const { taskId = "" } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const includeArchived = searchParams.get("includeArchived") === "true"
  const queryClient = useQueryClient()
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const canEdit = hasPermission("tasks.edit_all") || hasPermission("tasks.edit_own")
  const canChangeStatus = canEdit || hasPermission("tasks.complete")
  const canAssign = hasPermission("tasks.assign")
  const canArchive = hasPermission("tasks.archive")
  const canRestore = hasPermission("tasks.restore")
  const canDelete = hasPermission("tasks.delete")
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const query = useQuery({
    queryKey: ["tasks", "details", taskId, includeArchived],
    queryFn: () => tasksService.details(taskId, includeArchived),
    enabled: Boolean(taskId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] })
    queryClient.invalidateQueries({ queryKey: ["projects"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  }

  const updateMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload | UpdateTaskPayload) =>
      tasksService.update(taskId, payload as UpdateTaskPayload),
    onSuccess: (task) => {
      toast.success(`Tarefa TSK-${task.taskCode} atualizada.`)
      setEditOpen(false)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const statusMutation = useMutation({
    mutationFn: (status: TaskStatus) => tasksService.updateStatus(taskId, status),
    onSuccess: () => {
      toast.success("Status da tarefa atualizado.")
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const archiveMutation = useMutation({
    mutationFn: () => tasksService.archive(taskId),
    onSuccess: () => {
      toast.success("Tarefa arquivada com sucesso.")
      invalidate()
      navigate("/tasks")
    },
    onError: (error) => toast.error(error.message),
  })
  const restoreMutation = useMutation({
    mutationFn: () => tasksService.restore(taskId),
    onSuccess: () => {
      toast.success("Tarefa restaurada com sucesso.")
      invalidate()
      navigate(`/tasks/${taskId}`)
    },
    onError: (error) => toast.error(error.message),
  })
  const deleteMutation = useMutation({
    mutationFn: () => tasksService.softDelete(taskId),
    onSuccess: () => {
      toast.success("Tarefa excluída com sucesso.")
      invalidate()
      navigate("/tasks")
    },
    onError: (error) => toast.error(error.message),
  })

  if (query.isLoading) {
    return <div className="space-y-4">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost"><Link to="/tasks"><ArrowLeft className="size-4" />Voltar às tarefas</Link></Button>
        <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar a tarefa</AlertTitle><AlertDescription>{query.error?.message ?? "Tarefa não encontrada."}</AlertDescription></Alert>
      </div>
    )
  }

  const task = query.data
  const overdue = isTaskOverdue(task)

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3"><Link to="/tasks"><ArrowLeft className="size-4" />Voltar às tarefas</Link></Button>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge>TSK-{task.taskCode}</Badge>
            <Badge variant={taskStatusVariants[task.status]}>{taskStatusLabels[task.status]}</Badge>
            {task.archivedAt && <Badge variant="outline">Arquivada</Badge>}
            {overdue && <Badge variant="destructive">Em atraso</Badge>}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{task.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Vinculada ao projeto PRJ-{task.project.projectCode}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && !task.archivedAt && <Button variant="outline" onClick={() => setEditOpen(true)}><Edit3 className="size-4" />Editar</Button>}
          {canArchive && !task.archivedAt && <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setArchiveOpen(true)}><Archive className="size-4" />Arquivar</Button>}
          {canRestore && task.archivedAt && <Button variant="outline" onClick={() => setArchiveOpen(true)}><RotateCcw className="size-4" />Restaurar</Button>}
          {canDelete && task.archivedAt && <Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />Excluir</Button>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none shadow-sm"><CardContent className="p-5"><ListTodo className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Status</p>{canChangeStatus && !task.archivedAt ? <Select value={task.status} onValueChange={(value) => statusMutation.mutate(value as TaskStatus)} disabled={statusMutation.isPending}><SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(taskStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select> : <p className="mt-1 font-semibold">{taskStatusLabels[task.status]}</p>}</CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><AlertTriangle className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Prioridade</p><p className="mt-1 font-semibold">{task.priority} · {taskPriorityLabels[task.priority]}</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><CalendarClock className={overdue ? "size-5 text-destructive" : "size-5 text-primary"} /><p className="mt-3 text-xs text-muted-foreground">Prazo</p><p className={overdue ? "mt-1 font-semibold text-destructive" : "mt-1 font-semibold"}>{formatDate(task.dueDate)}</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><UserRound className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Responsável</p><p className="mt-1 font-semibold">{task.assignee?.name ?? "Não atribuído"}</p>{task.assignee && <p className="text-xs text-muted-foreground">USR-{task.assignee.userCode}</p>}</CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Descrição</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.description || "Nenhuma descrição cadastrada."}</p></CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Vínculos e registro</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Projeto</p><Button asChild variant="link" className="h-auto p-0"><Link to={`/projects/${task.project.id}`}>PRJ-{task.project.projectCode} · {task.project.title}</Link></Button></div>
            <div><p className="text-xs text-muted-foreground">Criada em</p><p>{formatDate(task.createdAt, true)}</p></div>
            <div><p className="text-xs text-muted-foreground">Última atualização</p><p>{formatDate(task.updatedAt, true)}</p></div>
            {task.status === "CONCLUIDA" && <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-primary"><CheckCircle2 className="size-5" /><span className="font-medium">Atividade concluída</span></div>}
          </CardContent>
        </Card>
      </div>

      <TaskFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        canAssign={canAssign}
        pending={updateMutation.isPending}
        onSubmit={async (payload) => { await updateMutation.mutateAsync(payload) }}
      />
      <ArchiveActionDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        mode={task.archivedAt ? "restore" : "archive"}
        entityLabel="tarefa"
        entityCode={`TSK-${task.taskCode}`}
        description={task.archivedAt ? "A tarefa voltará ao fluxo ativo do projeto." : "A atividade deixará as filas operacionais, mantendo seu histórico."}
        pending={archiveMutation.isPending || restoreMutation.isPending}
        onConfirm={() => task.archivedAt ? restoreMutation.mutate() : archiveMutation.mutate()}
      />
      <DeleteActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        entityLabel="tarefa"
        entityCode={`TSK-${task.taskCode}`}
        description="A exclusão é lógica e somente pode ser feita depois do arquivamento."
        pending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}
