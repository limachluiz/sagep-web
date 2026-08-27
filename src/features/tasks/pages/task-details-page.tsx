import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit3,
  ListTodo,
  MessageSquarePlus,
  RotateCcw,
  Send,
  Trash2,
  UserRound,
} from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import { toast } from "sonner"

import { ArchiveActionDialog } from "@/components/archive-action-dialog"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { UserAvatar } from "@/components/user-avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/features/auth/auth.store"
import { TaskFormSheet } from "@/features/tasks/components/task-form-sheet"
import { EvidencesPanel } from "@/features/evidences/components/evidences-panel"
import {
  isTaskOverdue,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatusVariants,
} from "@/features/tasks/tasks.constants"
import { tasksService } from "@/features/tasks/tasks.service"
import type { CreateTaskPayload, TaskActivityType, TaskStatus, UpdateTaskPayload } from "@/features/tasks/tasks.types"

const activityLabels: Record<TaskActivityType, string> = {
  NOTE: "Andamento",
  STATUS_CHANGE: "Mudança de status",
  COMPLETION: "Conclusão",
  REOPENED: "Reabertura",
}

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
  const [completeOpen, setCompleteOpen] = useState(false)
  const [progressNote, setProgressNote] = useState("")
  const [completionNote, setCompletionNote] = useState("")

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
  const activityMutation = useMutation({
    mutationFn: (content: string) => tasksService.addActivity(taskId, content),
    onSuccess: (task) => {
      queryClient.setQueryData(["tasks", "details", taskId, includeArchived], task)
      setProgressNote("")
      toast.success("Andamento registrado com data e hora.")
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const completeMutation = useMutation({
    mutationFn: (content?: string) => tasksService.complete(taskId, content),
    onSuccess: (task) => {
      queryClient.setQueryData(["tasks", "details", taskId, includeArchived], task)
      setCompleteOpen(false)
      setCompletionNote("")
      toast.success(`Tarefa TSK-${task.taskCode} concluída.`)
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
  const canComplete = canChangeStatus && !task.archivedAt && task.status !== "CONCLUIDA" && task.status !== "CANCELADA"
  const canAddActivity = canChangeStatus && !task.archivedAt && task.status !== "CONCLUIDA" && task.status !== "CANCELADA"

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
          {canComplete && <Button onClick={() => setCompleteOpen(true)}><CheckCircle2 className="size-4" />Concluir tarefa</Button>}
          {canEdit && !task.archivedAt && <Button variant="outline" onClick={() => setEditOpen(true)}><Edit3 className="size-4" />Editar</Button>}
          {canArchive && !task.archivedAt && <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setArchiveOpen(true)}><Archive className="size-4" />Arquivar</Button>}
          {canRestore && task.archivedAt && <Button variant="outline" onClick={() => setArchiveOpen(true)}><RotateCcw className="size-4" />Restaurar</Button>}
          {canDelete && task.archivedAt && <Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />Excluir</Button>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none shadow-sm"><CardContent className="p-5"><ListTodo className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Status</p>{canChangeStatus && !task.archivedAt && task.status !== "CONCLUIDA" ? <Select value={task.status} onValueChange={(value) => statusMutation.mutate(value as TaskStatus)} disabled={statusMutation.isPending}><SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(taskStatusLabels).filter(([value]) => value !== "CONCLUIDA").map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select> : <p className="mt-1 font-semibold">{taskStatusLabels[task.status]}</p>}</CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><AlertTriangle className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Prioridade</p><p className="mt-1 font-semibold">{task.priority} · {taskPriorityLabels[task.priority]}</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><CalendarClock className={overdue ? "size-5 text-destructive" : "size-5 text-primary"} /><p className="mt-3 text-xs text-muted-foreground">Prazo</p><p className={overdue ? "mt-1 font-semibold text-destructive" : "mt-1 font-semibold"}>{formatDate(task.dueDate)}</p></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="p-5"><UserRound className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Responsável</p>{task.assignee ? <div className="mt-2 flex items-center gap-2"><UserAvatar user={task.assignee} className="size-9" /><div><p className="font-semibold">{task.assignee.name}</p><p className="text-xs text-muted-foreground">USR-{task.assignee.userCode}</p></div></div> : <p className="mt-1 font-semibold">Não atribuído</p>}</CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Descrição</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.description || "Nenhuma descrição cadastrada."}</p></CardContent>
        </Card>
        <Card className="min-w-0 border-none shadow-sm">
          <CardHeader><CardTitle>Vínculos e registro</CardTitle></CardHeader>
          <CardContent className="min-w-0 space-y-4 text-sm">
            <div className="min-w-0"><p className="text-xs text-muted-foreground">Projeto</p><Button asChild variant="link" className="h-auto max-w-full min-w-0 justify-start whitespace-normal p-0 text-left leading-5 [overflow-wrap:anywhere]"><Link to={`/projects/${task.project.id}`}>PRJ-{task.project.projectCode} · {task.project.title}</Link></Button></div>
            <div><p className="text-xs text-muted-foreground">Criada em</p><p>{formatDate(task.createdAt, true)}</p></div>
            <div><p className="text-xs text-muted-foreground">Última atualização</p><p>{formatDate(task.updatedAt, true)}</p></div>
            {task.status === "CONCLUIDA" && <div className="space-y-1 rounded-xl bg-primary/10 p-3 text-primary"><div className="flex items-center gap-2"><CheckCircle2 className="size-5" /><span className="font-medium">Atividade concluída</span></div><p className="pl-7 text-xs">{formatDate(task.completedAt ?? null, true)}{task.completedBy ? ` · por ${task.completedBy.name}` : ""}</p></div>}
          </CardContent>
        </Card>
      </div>

      <EvidencesPanel projectId={task.project.id} taskId={task.id} canManage={canEdit && !task.archivedAt} />

      <Card className="border-none shadow-sm">
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2"><MessageSquarePlus className="size-5 text-primary" />Andamentos da tarefa</CardTitle>
          <p className="text-sm text-muted-foreground">Registre o que foi executado. Cada anotação preserva automaticamente o autor, a data e a hora.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {canAddActivity && (
            <div className="rounded-xl border bg-muted/20 p-4">
              <Textarea
                value={progressNote}
                onChange={(event) => setProgressNote(event.target.value)}
                placeholder="Ex.: Conferi a documentação enviada e solicitei a correção do item 3."
                maxLength={4000}
                aria-label="Novo andamento"
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">Se estiver pendente, a tarefa será iniciada automaticamente.</p>
                <Button
                  onClick={() => activityMutation.mutate(progressNote.trim())}
                  disabled={progressNote.trim().length < 2 || activityMutation.isPending}
                >
                  <Send className="size-4" />{activityMutation.isPending ? "Registrando..." : "Registrar andamento"}
                </Button>
              </div>
            </div>
          )}

          {(task.activities?.length ?? 0) > 0 ? (
            <div className="space-y-0">
              {task.activities?.map((activity, index) => (
                <div key={activity.id} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-3 pb-6 last:pb-0">
                  {index < (task.activities?.length ?? 0) - 1 && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-border" />}
                  <span className={`relative z-10 flex size-8 items-center justify-center rounded-full border bg-background ${activity.type === "COMPLETION" ? "text-primary" : "text-muted-foreground"}`}>
                    {activity.type === "COMPLETION" ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}
                  </span>
                  <div className="min-w-0 rounded-xl border bg-background/60 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2"><Badge variant={activity.type === "COMPLETION" ? "default" : "outline"}>{activityLabels[activity.type]}</Badge>{activity.fromStatus && activity.toStatus && <span className="text-xs text-muted-foreground">{taskStatusLabels[activity.fromStatus]} → {taskStatusLabels[activity.toStatus]}</span>}</div>
                      <time className="shrink-0 text-xs text-muted-foreground" dateTime={activity.createdAt}>{formatDate(activity.createdAt, true)}</time>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{activity.content}</p>
                    {activity.author ? <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><UserAvatar user={activity.author} className="size-6" /><span>Registrado por {activity.author.name} · USR-{activity.author.userCode}</span></div> : <p className="mt-3 text-xs text-muted-foreground">Registrado por usuário removido</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center"><Clock3 className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 font-medium">Nenhum andamento registrado</p><p className="mt-1 text-sm text-muted-foreground">As atividades executadas aparecerão aqui em ordem cronológica.</p></div>
          )}
        </CardContent>
      </Card>

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
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir tarefa TSK-{task.taskCode}</DialogTitle>
            <DialogDescription>O encerramento ficará registrado no histórico com seu usuário, data e hora. Você pode incluir uma observação final.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={completionNote}
            onChange={(event) => setCompletionNote(event.target.value)}
            placeholder="Observação final (opcional)"
            maxLength={4000}
            aria-label="Observação de conclusão"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)} disabled={completeMutation.isPending}>Cancelar</Button>
            <Button onClick={() => completeMutation.mutate(completionNote.trim() || undefined)} disabled={completeMutation.isPending}><CheckCircle2 className="size-4" />{completeMutation.isPending ? "Concluindo..." : "Concluir tarefa"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
