import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { CalendarClock, FileText, Link2, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { FormSection } from "@/components/form-section"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ProjectSelect } from "@/features/projects/components/project-select"
import type { ProjectSelectOption } from "@/features/projects/components/project-select.utils"
import { projectsService } from "@/features/projects/projects.service"
import { taskPriorityLabels, taskStatusLabels } from "@/features/tasks/tasks.constants"
import type {
  CreateTaskPayload,
  Task,
  TaskStatus,
  UpdateTaskPayload,
} from "@/features/tasks/tasks.types"
import { usersService } from "@/features/users/users.service"

const schema = z.object({
  projectId: z.string().min(1, "Selecione um projeto."),
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres."),
  description: z.string(),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "REVISAO", "CONCLUIDA", "CANCELADA"]),
  priority: z.enum(["1", "2", "3", "4", "5"]),
  assigneeId: z.string(),
  dueDate: z.string(),
})

type FormValues = z.infer<typeof schema>

type TaskFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task
  initialProjectId?: string
  initialProjectCode?: number
  initialProjectTitle?: string
  lockProject?: boolean
  canAssign: boolean
  pending?: boolean
  onSubmit: (payload: CreateTaskPayload | UpdateTaskPayload) => Promise<void>
}

function dateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ""
}

export function TaskFormSheet({
  open,
  onOpenChange,
  task,
  initialProjectId,
  initialProjectCode,
  initialProjectTitle,
  lockProject = false,
  canAssign,
  pending = false,
  onSubmit,
}: TaskFormSheetProps) {
  const isEditing = Boolean(task)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      projectId: initialProjectId ?? "",
      title: "",
      description: "",
      status: "PENDENTE",
      priority: "3",
      assigneeId: "",
      dueDate: "",
    },
  })
  const status = useWatch({ control: form.control, name: "status" })
  const priority = useWatch({ control: form.control, name: "priority" })
  const projectId = useWatch({ control: form.control, name: "projectId" })
  const assigneeId = useWatch({ control: form.control, name: "assigneeId" })
  const projectsQuery = useQuery({
    queryKey: ["projects", "task-options"],
    queryFn: () => projectsService.list({ page: 1, pageSize: 100 }),
    enabled: open && !isEditing && !lockProject,
  })
  const projectOptions = projectsQuery.data?.items ?? []
  const fixedProjectOption: ProjectSelectOption | null = task
    ? {
        id: task.project.id,
        projectCode: task.project.projectCode,
        title: task.project.title,
        om: null,
      }
    : lockProject && initialProjectId
      ? {
          id: initialProjectId,
          projectCode: initialProjectCode ?? 0,
          title: initialProjectTitle ?? "Projeto selecionado",
          om: null,
        }
      : null
  const visibleProjectOptions = fixedProjectOption ? [fixedProjectOption] : projectOptions
  const initialProject = initialProjectId
    ? projectOptions.find((project) => project.id === initialProjectId)
    : projectOptions.find((project) => project.projectCode === initialProjectCode)
  const selectedProjectId = projectId || initialProject?.id || ""
  const assigneeOptionsQuery = useQuery({
    queryKey: ["users", "options", "project", selectedProjectId],
    queryFn: () => usersService.options({ projectId: selectedProjectId }),
    enabled: open && canAssign && Boolean(selectedProjectId),
  })
  const assigneeOptions = assigneeOptionsQuery.data?.items ?? []
  const visibleAssigneeOptions = task?.assignee && !assigneeOptions.some((user) => user.id === task.assignee?.id)
    ? [task.assignee, ...assigneeOptions]
    : assigneeOptions

  useEffect(() => {
    if (!open) return
    form.reset({
      projectId: task?.project.id ?? initialProjectId ?? initialProject?.id ?? "",
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "PENDENTE",
      priority: String(task?.priority ?? 3) as FormValues["priority"],
      assigneeId: task?.assignee?.id ?? "",
      dueDate: dateInputValue(task?.dueDate),
    })
  }, [form, initialProject, initialProjectId, open, task])

  const submit = form.handleSubmit(async (values) => {
    const common = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      status: values.status as TaskStatus,
      priority: Number(values.priority),
      dueDate: values.dueDate || undefined,
    }

    if (task) {
      const payload: UpdateTaskPayload = { ...common }
      if (canAssign) {
        if (values.assigneeId) payload.assigneeId = values.assigneeId
        else if (task.assignee) payload.clearAssignee = true
      }
      if (!values.dueDate && task.dueDate) payload.clearDueDate = true
      await onSubmit(payload)
      return
    }

    const payload: CreateTaskPayload = {
      ...common,
      projectId: values.projectId,
    }
    if (canAssign && values.assigneeId) {
      payload.assigneeId = values.assigneeId
    }
    await onSubmit(payload)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle className="text-xl">{isEditing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Atualize os dados da TSK-${task?.taskCode}.`
              : "Cadastre uma atividade vinculada a um projeto do SAGEP."}
          </DialogDescription>
        </DialogHeader>

        <form id="task-form" className="min-h-0 space-y-4 overflow-y-auto px-6 py-4" onSubmit={submit}>
          <FormSection icon={Link2} title="Vínculo do projeto" description="Toda tarefa integra o histórico e a equipe de um projeto.">
            <div className="space-y-2">
              <Label>Projeto</Label>
              <ProjectSelect
                projects={visibleProjectOptions}
                value={projectId}
                onValueChange={(value) => {
                  form.setValue("projectId", value, { shouldDirty: true, shouldValidate: true })
                  form.setValue("assigneeId", "", { shouldDirty: true })
                }}
                disabled={isEditing || lockProject}
                loading={projectsQuery.isLoading}
                error={projectsQuery.isError}
                ariaLabel="Projeto da tarefa"
                className="h-auto min-h-9 w-full py-2 text-left whitespace-normal [&_[data-slot=select-value]]:line-clamp-2"
              />
              {form.formState.errors.projectId && <p className="text-xs text-destructive">{form.formState.errors.projectId.message}</p>}
              {projectsQuery.isError && <p className="text-xs text-destructive">{projectsQuery.error.message}</p>}
            </div>
          </FormSection>

          <FormSection icon={FileText} title="Descrição da atividade" description="Registre uma entrega objetiva e os critérios necessários para concluí-la.">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título</Label>
              <Input id="task-title" placeholder="Ex.: Conferir certificações da fibra" {...form.register("title")} />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea id="task-description" rows={5} placeholder="Detalhes, critérios de aceite e observações..." {...form.register("description")} />
            </div>
          </FormSection>

          <FormSection icon={CalendarClock} title="Execução e prazo" description="Classifique a prioridade, acompanhe o status e defina o responsável.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value) => form.setValue("status", value as TaskStatus, { shouldValidate: true })}>
                  <SelectTrigger className="w-full" aria-label="Status da tarefa"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(value) => form.setValue("priority", value as FormValues["priority"], { shouldValidate: true })}>
                  <SelectTrigger className="w-full" aria-label="Prioridade da tarefa"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskPriorityLabels).map(([value, label]) => <SelectItem key={value} value={value}>{value} · {label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-due-date">Prazo</Label>
                <Input id="task-due-date" type="date" {...form.register("dueDate")} />
              </div>

              {canAssign && (
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select
                    value={assigneeId || "__unassigned"}
                    onValueChange={(value) => form.setValue("assigneeId", value === "__unassigned" ? "" : value, { shouldDirty: true })}
                    disabled={!selectedProjectId || assigneeOptionsQuery.isLoading || assigneeOptionsQuery.isError}
                  >
                    <SelectTrigger className="w-full" aria-label="Responsável pela tarefa">
                      <SelectValue placeholder={selectedProjectId ? "Selecione um responsável" : "Selecione primeiro o projeto"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned">Não atribuído</SelectItem>
                      {visibleAssigneeOptions.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <span className="flex items-center gap-2"><UserAvatar user={user} className="size-6" />{user.name} · USR-{user.userCode}{"rank" in user && user.rank ? ` · ${user.rank}` : ""}{user.active === false ? " · inativo" : ""}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Disponíveis: responsável e membros ativos do projeto.</p>
                  {assigneeOptionsQuery.isError && <p className="text-xs text-destructive">{assigneeOptionsQuery.error.message}</p>}
                </div>
              )}
            </div>
          </FormSection>
        </form>

        <DialogFooter className="border-t px-6 py-5">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>
          <Button type="submit" form="task-form" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? "Salvar alterações" : "Criar tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
