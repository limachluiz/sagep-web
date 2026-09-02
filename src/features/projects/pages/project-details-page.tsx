import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Edit3,
  FileCheck2,
  FileSignature,
  FileText,
  FileSpreadsheet,
  Images,
  Landmark,
  ListChecks,
  Loader2,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Play,
  UserRound,
  Users,
} from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArchiveActionDialog } from "@/components/archive-action-dialog"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/features/auth/auth.store"
import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import { ProjectFormSheet } from "@/features/projects/components/project-form-sheet"
import { ProjectAuditPanel } from "@/features/projects/components/project-audit-panel"
import { ProjectDocumentsPanel } from "@/features/projects/components/project-documents-panel"
import { ProjectDeliveryPanel } from "@/features/projects/components/project-delivery-panel"
import { EvidencesPanel } from "@/features/evidences/components/evidences-panel"
import { ProjectExecutionPanel } from "@/features/projects/components/project-execution-panel"
import { CancelCommitmentNoteDialog } from "@/features/projects/components/cancel-commitment-note-dialog"
import { ProjectFinancialCard } from "@/features/projects/components/project-financial-card"
import { ProjectTeamCard } from "@/features/projects/components/project-team-card"
import { ProjectTeamSummary } from "@/features/projects/components/project-team-summary"
import { ProjectTasksOverview, ProjectTasksPanel } from "@/features/projects/components/project-tasks-panel"
import { ProjectWorkflowProgress } from "@/features/projects/components/project-workflow-progress"
import { dateInputValue } from "@/features/projects/project-execution-flow"
import {
  resolveProjectDetailsTab,
  searchParamsForProjectTab,
  type ProjectDetailsTab,
} from "@/features/projects/project-details-tabs"
import { CreditNoteDialog } from "@/features/projects/components/credit-note-dialog"
import { CommitmentNoteDialog } from "@/features/projects/components/commitment-note-dialog"
import { DateFlowDialog, ReviewAsBuiltDialog } from "@/features/projects/components/project-closing-dialogs"
import { CreateDiexDialog } from "@/features/diex/components/create-diex-dialog"
import { CreateServiceOrderDialog } from "@/features/service-orders/components/create-service-order-dialog"
import { StartExecutionDialog } from "@/features/service-orders/components/start-execution-dialog"
import { RegisterSignedServiceOrderDialog } from "@/features/service-orders/components/register-signed-service-order-dialog"
import { projectsService } from "@/features/projects/projects.service"
import { invalidateProjectFlow } from "@/features/projects/project-flow-cache"
import {
  getActiveWorkflowDocuments,
  isDiexReadyForCommitmentNote,
} from "@/features/projects/project-document-flow"
import { TaskFormSheet } from "@/features/tasks/components/task-form-sheet"
import { tasksService } from "@/features/tasks/tasks.service"
import type { CreateTaskPayload, TaskStatus, UpdateTaskPayload } from "@/features/tasks/tasks.types"
import type {
  ProjectDetailsResponse,
  ProjectMutationPayload,
  ProjectStatus,
} from "@/features/projects/projects.types"
import { useRef, useState } from "react"
import { toast } from "sonner"

const statusLabels: Record<ProjectStatus, string> = {
  PLANEJAMENTO: "Planejamento",
  EM_ANDAMENTO: "Em andamento",
  PAUSADO: "Pausado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

const projectTypeLabels = {
  CFTV: "CFTV",
  FIBRA_OPTICA_PONTO_LOGICO: "Fibra Óptica / Ponto Lógico",
} as const

const stageLabels: Record<ProjectStage, string> = {
  ESTIMATIVA_PRECO: "Estimativa de preço",
  AGUARDANDO_NOTA_CREDITO: "Aguardando Nota de Crédito",
  DIEX_REQUISITORIO: "DIEx requisitório",
  AGUARDANDO_NOTA_EMPENHO: "Aguardando Nota de Empenho",
  OS_LIBERADA: "OS liberada",
  AGUARDANDO_OS_ASSINADA: "Aguardando OS assinada",
  AGUARDANDO_INICIO_EXECUCAO: "Aguardando início da execução",
  SERVICO_EM_EXECUCAO: "Serviço em execução",
  ANALISANDO_AS_BUILT: "Analisando As-Built",
  ATESTAR_NF: "Atestar NF",
  ENTREGA_TECNICA: "Entrega Técnica",
  SERVICO_CONCLUIDO: "Serviço concluído",
  CANCELADO: "Cancelado",
}

const milestoneLabels: Record<string, string> = {
  creditNoteNumber: "Número da Nota de Crédito",
  creditNoteReceivedAt: "Recebimento da Nota de Crédito",
  diexNumber: "Número do DIEx",
  diexIssuedAt: "Emissão do DIEx",
  commitmentNoteNumber: "Número da Nota de Empenho",
  commitmentNoteReceivedAt: "Recebimento da Nota de Empenho",
  serviceOrderNumber: "Número da Ordem de Serviço",
  serviceOrderIssuedAt: "Emissão da Ordem de Serviço",
  signedServiceOrderLink: "Link da OS assinada",
  signedServiceOrderReceivedAt: "Recebimento da OS assinada",
  executionStartedAt: "Início da execução",
  asBuiltReceivedAt: "Recebimento do As-Built",
  asBuiltReviewedAt: "Análise do As-Built",
  asBuiltApprovedAt: "Aprovação do As-Built",
  asBuiltRejectedAt: "Reprovação do As-Built",
  asBuiltRejectionReason: "Motivo da reprovação",
  invoiceAttestedAt: "Atesto da Nota Fiscal",
  serviceCompletedAt: "Conclusão do serviço",
  deliveryReportGeneratedAt: "Geração do relatório de entrega",
  deliveryReportSignedAt: "Assinatura do relatório de entrega",
  deliveryReportSignedLink: "Documento de entrega assinado",
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "Não informado"
  return new Intl.DateTimeFormat("pt-BR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }).format(new Date(value))
}

function ProjectOverview({
  canManage,
  details,
  canViewTasks,
  canCreateTasks,
  onCreateTask,
  onShowDocuments,
  onShowTeam,
  onShowTasks,
}: {
  canManage: boolean
  details: ProjectDetailsResponse
  canViewTasks: boolean
  canCreateTasks: boolean
  onCreateTask: () => void
  onShowDocuments: () => void
  onShowTeam: () => void
  onShowTasks: () => void
}) {
  const milestoneEntries = Object.entries(details.workflow.milestones).filter(
    ([key]) => key !== "asBuiltRejectionReason" || details.workflow.milestones[key],
  )

  return (
    <div className="space-y-6">
      {canViewTasks && (
        <ProjectTasksOverview
          tasks={details.tasks}
          canCreate={canCreateTasks}
          onCreate={onCreateTask}
          onShowAll={onShowTasks}
        />
      )}

      <ProjectFinancialCard details={details} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Marcos do workflow</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {milestoneEntries.map(([key, value]) => {
              const isDate = key.endsWith("At")
              return (
                <div key={key} className="flex gap-3 rounded-xl border p-3">
                  <div className={value ? "mt-0.5 text-primary" : "mt-0.5 text-muted-foreground"}>
                    {value ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{milestoneLabels[key] ?? key}</p>
                    <p className="mt-1 text-sm font-medium">{value ? (isDate ? formatDate(value) : value) : "Pendente"}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Pendências do projeto</CardTitle>
            <Badge variant={details.pendingActions.some((action) => action.severity === "BLOCKER") ? "destructive" : "outline"}>
              {details.pendingActions.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {details.pendingActions.length ? details.pendingActions.map((action) => (
              <div key={action.code} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={action.severity === "BLOCKER" ? "size-5 text-destructive" : "size-5 text-status-warning"} />
                  <div>
                    <p className="font-medium">{action.label}</p>
                    {action.targetStage && <p className="mt-1 text-xs text-muted-foreground">Próxima etapa: {stageLabels[action.targetStage]}</p>}
                  </div>
                </div>
                <Badge variant={action.severity === "BLOCKER" ? "destructive" : "outline"}>
                  {action.severity === "BLOCKER" ? "Bloqueador" : action.severity === "WARNING" ? "Atenção" : "Informativo"}
                </Badge>
              </div>
            )) : (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="size-10 text-primary" />
                <p className="mt-3 font-medium">Nenhuma pendência identificada</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <div className="space-y-6">
          <ProjectTeamSummary canManage={canManage} details={details} onShowTeam={onShowTeam} />

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Controle documental</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Estimativas</span><span className="font-medium">{details.documents.estimates.length}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">DIEx</span><span className="font-medium">{details.documents.diexRequests.length}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Ordens de Serviço</span><span className="font-medium">{details.documents.serviceOrders.length}</span></div>
              <Button variant="outline" className="mt-2 w-full" onClick={onShowDocuments}>Abrir documentos</Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader><CardTitle>Datas do projeto</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Início previsto</span><span className="font-medium">{formatDate(details.project.startDate)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Tipo</span><span className="text-right font-medium">{details.project.projectType ? projectTypeLabels[details.project.projectType] : "Não classificado"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">OM de destino</span><span className="text-right font-medium">{details.project.om ? `${details.project.om.sigla} · ${details.project.om.cityName}/${details.project.om.stateUf}` : "Não informada"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Criado em</span><span className="font-medium">{formatDate(details.project.createdAt)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Última atualização</span><span className="font-medium">{formatDate(details.project.updatedAt, true)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Timeline({ details }: { details: ProjectDetailsResponse }) {
  const entityLabels: Record<string, string> = {
    PROJECT: "Projeto",
    TASK: "Tarefa",
    ESTIMATE: "Estimativa",
    DIEX_REQUEST: "DIEx",
    SERVICE_ORDER: "Ordem de Serviço",
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader><CardTitle>Histórico unificado</CardTitle></CardHeader>
      <CardContent>
        {details.timeline.length ? (
          <div className="relative space-y-0 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-border">
            {details.timeline.map((item) => {
              const isTask = item.entityType === "TASK"
              const linkedTask = isTask ? details.tasks.find((task) => task.id === item.entityId) : undefined
              return (
              <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className={isTask ? "z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary" : "z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-primary"}>
                  {isTask ? <ListChecks className="size-4" /> : <Clock3 className="size-4" />}
                </div>
                <div className="min-w-0 flex-1 rounded-xl border p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      {item.summary && <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>}
                      {isTask && <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs"><Link to={`/tasks/${item.entityId}${linkedTask?.archivedAt ? "?includeArchived=true" : ""}`}>Abrir tarefa</Link></Button>}
                    </div>
                    <Badge variant={isTask ? "secondary" : "outline"}>{entityLabels[item.entityType] ?? item.entityType}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{item.actorName ?? "Sistema"} · {formatDate(item.at, true)}</p>
                </div>
              </div>
              )
            })}
          </div>
        ) : <p className="py-12 text-center text-sm text-muted-foreground">Nenhum evento registrado.</p>}
      </CardContent>
    </Card>
  )
}

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [editOpen, setEditOpen] = useState(false)
  const [creditNoteOpen, setCreditNoteOpen] = useState(false)
  const [createDiexOpen, setCreateDiexOpen] = useState(false)
  const [commitmentNoteOpen, setCommitmentNoteOpen] = useState(false)
  const [cancelCommitmentNoteOpen, setCancelCommitmentNoteOpen] = useState(false)
  const [createServiceOrderOpen, setCreateServiceOrderOpen] = useState(false)
  const [registerSignedServiceOrderOpen, setRegisterSignedServiceOrderOpen] = useState(false)
  const [startExecutionOpen, setStartExecutionOpen] = useState(false)
  const [receiveAsBuiltOpen, setReceiveAsBuiltOpen] = useState(false)
  const [reviewAsBuiltOpen, setReviewAsBuiltOpen] = useState(false)
  const [invoiceAttestationOpen, setInvoiceAttestationOpen] = useState(false)
  const [completeServiceOpen, setCompleteServiceOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const tabsSectionRef = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const includeArchived = searchParams.get("includeArchived") === "true"
  const canViewTasks = hasPermission("tasks.view_all") || hasPermission("tasks.create") || hasPermission("tasks.edit_all") || hasPermission("tasks.edit_own") || hasPermission("tasks.complete") || hasPermission("tasks.assign") || hasPermission("tasks.archive") || hasPermission("tasks.restore") || hasPermission("tasks.delete")
  const canViewAudit = hasPermission("audit.view")
  const activeTab = resolveProjectDetailsTab(searchParams.get("tab"), canViewTasks, canViewAudit)
  const selectTab = (tab: ProjectDetailsTab, scrollIntoView = false) => {
    setSearchParams(searchParamsForProjectTab(searchParams, tab), { replace: true })
    if (scrollIntoView) {
      requestAnimationFrame(() => {
        tabsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }
  const detailsQuery = useQuery({
    queryKey: ["projects", "details", projectId, includeArchived],
    queryFn: () => projectsService.details(projectId!, includeArchived),
    enabled: Boolean(projectId),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: ProjectMutationPayload) => projectsService.update(projectId!, payload),
    onSuccess: () => {
      toast.success("Projeto atualizado com sucesso.")
      setEditOpen(false)
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
    onError: (error) => toast.error(error.message),
  })

  const invalidateTaskContext = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] })
    queryClient.invalidateQueries({ queryKey: ["projects"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  }

  const createTaskMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload | UpdateTaskPayload) =>
      tasksService.create(payload as CreateTaskPayload),
    onSuccess: (task) => {
      toast.success(`Tarefa TSK-${task.taskCode} criada com sucesso.`)
      setCreateTaskOpen(false)
      selectTab("tasks", true)
      invalidateTaskContext()
    },
    onError: (error) => toast.error(error.message),
  })

  const taskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksService.updateStatus(taskId, status),
    onSuccess: () => {
      toast.success("Status da tarefa atualizado.")
      invalidateTaskContext()
    },
    onError: (error) => toast.error(error.message),
  })

  const archiveMutation = useMutation({
    mutationFn: () => projectsService.archive(projectId!),
    onSuccess: () => {
      toast.success("Projeto arquivado. O histórico e os documentos vinculados foram preservados.")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate("/projects")
    },
    onError: (error) => toast.error(error.message),
  })

  const restoreMutation = useMutation({
    mutationFn: () => projectsService.restore(projectId!),
    onSuccess: () => {
      toast.success("Projeto restaurado com sucesso.")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate(`/projects/${projectId}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => projectsService.softDelete(projectId!),
    onSuccess: () => {
      toast.success("Projeto excluído com sucesso.")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate("/projects")
    },
    onError: (error) => toast.error(error.message),
  })

  if (detailsQuery.isLoading) {
    return <div className="space-y-4">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className={index === 0 ? "h-40" : "h-28"} />)}</div>
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost"><Link to="/projects"><ArrowLeft className="size-4" />Voltar aos projetos</Link></Button>
        <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar o projeto</AlertTitle><AlertDescription>{detailsQuery.error?.message ?? "Projeto não encontrado."}</AlertDescription></Alert>
      </div>
    )
  }

  const details = detailsQuery.data
  const canManage = hasPermission("projects.edit_all") || (hasPermission("projects.edit_own") && details.project.owner.id === user?.id)
  const canArchive = canManage && !details.project.archivedAt && [
    "ESTIMATIVA_PRECO",
    "AGUARDANDO_NOTA_CREDITO",
    "DIEX_REQUISITORIO",
    "AGUARDANDO_NOTA_EMPENHO",
    "OS_LIBERADA",
    "AGUARDANDO_OS_ASSINADA",
    "AGUARDANDO_INICIO_EXECUCAO",
  ].includes(details.workflow.stage)
  const canRestore = Boolean(details.project.archivedAt) && hasPermission("projects.restore")
  const canDelete = Boolean(details.project.archivedAt) && hasPermission("projects.delete")
  const canCreateTasks = hasPermission("tasks.create") && !details.project.archivedAt
  const activeEstimate = details.documents.estimates.find((estimate) => !estimate.archivedAt)
  const canOpenEstimateStep = hasPermission("estimates.create") && canManage && !details.project.archivedAt
    && details.workflow.stage === "ESTIMATIVA_PRECO"
  const canChangeTaskStatus = !details.project.archivedAt && (hasPermission("tasks.edit_all") || hasPermission("tasks.edit_own") || hasPermission("tasks.complete"))
  const canRegisterCreditNote = canManage && !details.project.archivedAt && details.workflow.stage === "AGUARDANDO_NOTA_CREDITO"
  const canCreateDiex = hasPermission("diex.issue") && canManage && !details.project.archivedAt && details.workflow.stage === "DIEX_REQUISITORIO"
  const activeDocuments = getActiveWorkflowDocuments(details)
  const diexReadyForCommitmentNote = isDiexReadyForCommitmentNote(details)
  const canCompleteDiex = hasPermission("diex.issue") && canManage && !details.project.archivedAt
    && details.workflow.stage === "AGUARDANDO_NOTA_EMPENHO"
    && Boolean(activeDocuments.diex)
    && !diexReadyForCommitmentNote
  const canRegisterCommitmentNote = canManage && !details.project.archivedAt
    && details.workflow.stage === "AGUARDANDO_NOTA_EMPENHO"
    && diexReadyForCommitmentNote
  const canCancelCommitmentNote = canManage && !details.project.archivedAt
    && Boolean(details.workflow.milestones.commitmentNoteNumber || details.workflow.milestones.commitmentNoteReceivedAt)
  const canIssueServiceOrder = hasPermission("service_orders.issue") && canManage && !details.project.archivedAt && details.workflow.stage === "OS_LIBERADA"
  const canRegisterSignedServiceOrder = canManage && !details.project.archivedAt
    && details.workflow.stage === "AGUARDANDO_OS_ASSINADA"
    && details.documents.serviceOrders.some((order) => !order.archivedAt)
  const canStartExecution = canManage && !details.project.archivedAt
    && (details.workflow.stage === "AGUARDANDO_INICIO_EXECUCAO"
      || (details.workflow.stage === "OS_LIBERADA"
        && !details.workflow.serviceOrderSignature.required))
    && details.documents.serviceOrders.some((order) => !order.archivedAt)
  const canReceiveAsBuilt = canManage && !details.project.archivedAt && details.workflow.stage === "SERVICO_EM_EXECUCAO"
  const canReviewAsBuilt = canManage && !details.project.archivedAt && details.workflow.stage === "ANALISANDO_AS_BUILT"
  const canAttestInvoice = canManage && !details.project.archivedAt && details.workflow.stage === "ATESTAR_NF" && !details.workflow.milestones.invoiceAttestedAt
  const canCompleteService = canManage && !details.project.archivedAt && details.workflow.stage === "ATESTAR_NF" && Boolean(details.workflow.milestones.invoiceAttestedAt)
  const canFinalizeProject = hasPermission("projects.complete") && canManage && !details.project.archivedAt && details.workflow.stage === "ENTREGA_TECNICA" && Boolean(details.workflow.milestones.deliveryReportGeneratedAt && details.workflow.milestones.deliveryReportSignedAt)
  const executionActions = {
    ...(canRegisterSignedServiceOrder ? { registerSignedServiceOrder: () => setRegisterSignedServiceOrderOpen(true) } : {}),
    ...(canStartExecution ? { startExecution: () => setStartExecutionOpen(true) } : {}),
    ...(canReceiveAsBuilt ? { receiveAsBuilt: () => setReceiveAsBuiltOpen(true) } : {}),
    ...(canReviewAsBuilt ? { reviewAsBuilt: () => setReviewAsBuiltOpen(true) } : {}),
    ...(canAttestInvoice ? { attestInvoice: () => setInvoiceAttestationOpen(true) } : {}),
    ...(canCompleteService ? { completeService: () => setCompleteServiceOpen(true) } : {}),
  }
  const primaryAction = canFinalizeProject
    ? { label: "Concluir projeto", icon: CheckCircle2, run: () => setCompleteServiceOpen(true) }
    : canCompleteService
    ? { label: "Iniciar Entrega Técnica", icon: FileText, run: () => setCompleteServiceOpen(true) }
    : canAttestInvoice
      ? { label: "Atestar NF", icon: ReceiptText, run: () => setInvoiceAttestationOpen(true) }
      : canReviewAsBuilt
        ? { label: "Analisar As-Built", icon: ClipboardCheck, run: () => setReviewAsBuiltOpen(true) }
        : canReceiveAsBuilt
          ? { label: "Receber As-Built", icon: PackageCheck, run: () => setReceiveAsBuiltOpen(true) }
          : canStartExecution
            ? { label: "Iniciar execução", icon: Play, run: () => setStartExecutionOpen(true) }
            : canRegisterSignedServiceOrder
              ? { label: "Registrar OS assinada", icon: FileSignature, run: () => setRegisterSignedServiceOrderOpen(true) }
            : canIssueServiceOrder
              ? { label: "Emitir OS", icon: FileCheck2, run: () => setCreateServiceOrderOpen(true) }
              : canRegisterCommitmentNote
                ? { label: "Registrar Nota de Empenho", icon: Landmark, run: () => setCommitmentNoteOpen(true) }
                : canCompleteDiex
                  ? { label: "Completar DIEx", icon: ClipboardCheck, run: () => navigate(`/diex/${activeDocuments.diex!.id}`) }
                : canCreateDiex
                  ? { label: "Emitir DIEx", icon: ClipboardCheck, run: () => setCreateDiexOpen(true) }
                  : canRegisterCreditNote
                    ? { label: "Registrar Nota de Crédito", icon: CircleDollarSign, run: () => setCreditNoteOpen(true) }
                    : canOpenEstimateStep
                      ? activeEstimate
                        ? { label: "Abrir estimativa", icon: FileSpreadsheet, run: () => navigate(`/estimates/${activeEstimate.id}`) }
                        : { label: "Criar estimativa", icon: FileSpreadsheet, run: () => navigate(`/estimates/new?projectId=${details.project.id}`) }
                    : null
  const metricCards = [
    { label: "Valor estimado", value: formatCurrency(details.financialSummary.estimatedTotalAmount), icon: CircleDollarSign },
    { label: "Estimativas", value: details.operationalSummary.estimatesCount, icon: FileSpreadsheet },
    { label: "Tarefas abertas", value: details.operationalSummary.openTasksCount, icon: ListChecks },
    { label: "Membros", value: details.operationalSummary.membersCount, icon: Users },
  ]

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3"><Link to="/projects"><ArrowLeft className="size-4" />Voltar aos projetos</Link></Button>

      <Card className="border-none bg-sidebar text-sidebar-foreground shadow-sm">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2"><Badge className="bg-sidebar-primary text-sidebar-primary-foreground">PRJ-{details.project.projectCode}</Badge><Badge variant="outline" className="border-white/20 text-white">{statusLabels[details.workflow.status]}</Badge>{details.project.projectType && <Badge variant="outline" className="border-white/20 text-white">{projectTypeLabels[details.project.projectType]}</Badge>}{details.project.om && <Badge variant="outline" className="border-white/20 text-white">{details.project.om.sigla} · {details.project.om.cityName}/{details.project.om.stateUf}</Badge>}{details.project.archivedAt && <Badge variant="secondary">Arquivado</Badge>}</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">{details.project.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sidebar-foreground/70">{details.project.description || "Projeto sem descrição cadastrada."}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {canViewTasks && <Button variant="secondary" className="gap-2" onClick={() => selectTab("tasks", true)}><ListChecks className="size-4" />Tarefas</Button>}
              {canCreateTasks && <Button variant="secondary" className="gap-2" onClick={() => setCreateTaskOpen(true)}><ListChecks className="size-4" />Nova tarefa</Button>}
              {canManage && !details.project.archivedAt && <Button variant="secondary" className="gap-2" onClick={() => setEditOpen(true)}><Edit3 className="size-4" />Editar</Button>}
              {canArchive && <Button variant="secondary" className="gap-2 text-destructive hover:text-destructive" onClick={() => setArchiveDialogOpen(true)}><Archive className="size-4" />Arquivar</Button>}
              {canRestore && <Button variant="secondary" className="gap-2" onClick={() => setArchiveDialogOpen(true)}><RotateCcw className="size-4" />Restaurar</Button>}
              {canDelete && <Button variant="destructive" className="gap-2" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="size-4" />Excluir</Button>}
              <Button variant="secondary" className="gap-2" onClick={() => detailsQuery.refetch()} disabled={detailsQuery.isFetching}>
                {detailsQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProjectWorkflowProgress
        stage={details.workflow.stage}
        status={details.workflow.status}
        stageLabel={stageLabels[details.workflow.stage]}
        nextAction={details.workflow.nextAction}
        archived={Boolean(details.project.archivedAt)}
        action={primaryAction ? (() => { const ActionIcon = primaryAction.icon; return <Button onClick={primaryAction.run} className="w-full sm:w-auto"><ActionIcon className="size-4" />{primaryAction.label}</Button> })() : undefined}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => { const Icon = metric.icon; return <Card key={metric.label} className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-2 text-2xl font-semibold">{metric.value}</p></div><div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></div></CardContent></Card> })}
      </div>

      <Tabs ref={tabsSectionRef} value={activeTab} onValueChange={(value) => selectTab(value as ProjectDetailsTab)} className="scroll-mt-6">
        <TabsList className="mb-5 max-w-full overflow-x-auto">
          <TabsTrigger value="overview"><UserRound data-icon="inline-start" />Visão geral</TabsTrigger>
          <TabsTrigger value="execution"><Play data-icon="inline-start" />Execução</TabsTrigger>
          {canViewTasks && <TabsTrigger value="tasks"><ListChecks data-icon="inline-start" />Tarefas <Badge variant="outline" className="ml-1">{details.tasks.length}</Badge></TabsTrigger>}
          <TabsTrigger value="documents"><FileCheck2 data-icon="inline-start" />Documentos</TabsTrigger>
          <TabsTrigger value="evidences"><Images data-icon="inline-start" />Evidências</TabsTrigger>
          <TabsTrigger value="delivery"><FileText data-icon="inline-start" />Entrega Técnica</TabsTrigger>
          <TabsTrigger value="team"><Users data-icon="inline-start" />Equipe <Badge variant="outline" className="ml-1">{details.operationalSummary.membersCount + 1}</Badge></TabsTrigger>
          <TabsTrigger value="timeline"><CalendarDays data-icon="inline-start" />Timeline</TabsTrigger>
          {canViewAudit && <TabsTrigger value="audit"><ShieldCheck data-icon="inline-start" />Auditoria</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview">
          <ProjectOverview
            canManage={canManage}
            details={details}
            canViewTasks={canViewTasks}
            canCreateTasks={canCreateTasks}
            onCreateTask={() => setCreateTaskOpen(true)}
            onShowDocuments={() => selectTab("documents")}
            onShowTeam={() => selectTab("team")}
            onShowTasks={() => selectTab("tasks", true)}
          />
        </TabsContent>
        <TabsContent value="execution">
          <ProjectExecutionPanel details={details} actions={executionActions} />
        </TabsContent>
        {canViewTasks && (
          <TabsContent value="tasks">
            <ProjectTasksPanel
              tasks={details.tasks}
              canCreate={canCreateTasks}
              canChangeStatus={canChangeTaskStatus}
              statusPendingId={taskStatusMutation.isPending ? taskStatusMutation.variables?.taskId ?? null : null}
              onCreate={() => setCreateTaskOpen(true)}
              onStatusChange={(taskId, status) => taskStatusMutation.mutate({ taskId, status })}
            />
          </TabsContent>
        )}
        <TabsContent value="documents">
          <ProjectDocumentsPanel
            details={details}
            canCancelCommitmentNote={canCancelCommitmentNote}
            onCancelCommitmentNote={() => setCancelCommitmentNoteOpen(true)}
          />
        </TabsContent>
        <TabsContent value="evidences"><EvidencesPanel projectId={details.project.id} canManage={canManage && !details.project.archivedAt} /></TabsContent>
        <TabsContent value="delivery"><ProjectDeliveryPanel details={details} canManage={canManage} /></TabsContent>
        <TabsContent value="team"><ProjectTeamCard details={details} canManage={canManage} /></TabsContent>
        <TabsContent value="timeline"><Timeline details={details} /></TabsContent>
        {canViewAudit && details.auditTrail && (
          <TabsContent value="audit"><ProjectAuditPanel items={details.auditTrail} /></TabsContent>
        )}
      </Tabs>

      <ProjectFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        project={details.project}
        pending={updateMutation.isPending}
        onSubmit={async (payload) => { await updateMutation.mutateAsync(payload) }}
      />

      <TaskFormSheet
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        initialProjectId={details.project.id}
        initialProjectCode={details.project.projectCode}
        initialProjectTitle={details.project.title}
        lockProject
        canAssign={hasPermission("tasks.assign")}
        pending={createTaskMutation.isPending}
        onSubmit={async (payload) => { await createTaskMutation.mutateAsync(payload) }}
      />

      <ArchiveActionDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        mode={details.project.archivedAt ? "restore" : "archive"}
        entityLabel="projeto"
        entityCode={`PRJ-${details.project.projectCode}`}
        description={details.project.archivedAt
          ? "O projeto voltará à carteira ativa com seus vínculos e histórico."
          : "A ação é permitida somente antes do início da execução. Estimativas, DIEx, OS, tarefas e membros permanecerão preservados."}
        pending={archiveMutation.isPending || restoreMutation.isPending}
        onConfirm={() => details.project.archivedAt ? restoreMutation.mutate() : archiveMutation.mutate()}
      />

      <DeleteActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel="projeto"
        entityCode={`PRJ-${details.project.projectCode}`}
        description="As estimativas, DIEx, Ordens de Serviço e tarefas vinculadas também serão excluídas logicamente."
        pending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />

      {creditNoteOpen && (
        <CreditNoteDialog
          projectId={details.project.id}
          projectCode={details.project.projectCode}
          open={creditNoteOpen}
          onOpenChange={setCreditNoteOpen}
          onSaved={() => {
            invalidateProjectFlow(queryClient)
          }}
        />
      )}

      {createDiexOpen && (
        <CreateDiexDialog
          details={details}
          open={createDiexOpen}
          onOpenChange={setCreateDiexOpen}
          onCreated={(diex) => {
            invalidateProjectFlow(queryClient)
            navigate(`/diex/${diex.id}`)
          }}
        />
      )}

      {commitmentNoteOpen && (
        <CommitmentNoteDialog
          projectId={details.project.id}
          projectCode={details.project.projectCode}
          open={commitmentNoteOpen}
          onOpenChange={setCommitmentNoteOpen}
          onSaved={() => {
            invalidateProjectFlow(queryClient)
          }}
        />
      )}

      {cancelCommitmentNoteOpen && (
        <CancelCommitmentNoteDialog
          projectId={details.project.id}
          projectCode={details.project.projectCode}
          commitmentNoteNumber={details.workflow.milestones.commitmentNoteNumber}
          hasServiceOrder={Boolean(activeDocuments.serviceOrder)}
          open={cancelCommitmentNoteOpen}
          onOpenChange={setCancelCommitmentNoteOpen}
          onCancelled={() => {
            invalidateProjectFlow(queryClient)
            selectTab("timeline")
          }}
        />
      )}

      {createServiceOrderOpen && <CreateServiceOrderDialog details={details} open={createServiceOrderOpen} onOpenChange={setCreateServiceOrderOpen} onCreated={(order) => { invalidateProjectFlow(queryClient); navigate(`/service-orders/${order.id}`) }} />}

      {registerSignedServiceOrderOpen && <RegisterSignedServiceOrderDialog projectId={details.project.id} projectCode={details.project.projectCode} serviceOrderIssuedAt={activeDocuments.serviceOrder?.issuedAt ?? undefined} open={registerSignedServiceOrderOpen} onOpenChange={setRegisterSignedServiceOrderOpen} onSaved={() => { invalidateProjectFlow(queryClient); selectTab("execution") }} />}

      {startExecutionOpen && <StartExecutionDialog projectId={details.project.id} projectCode={details.project.projectCode} serviceOrderIssuedAt={activeDocuments.serviceOrder?.issuedAt ?? undefined} open={startExecutionOpen} onOpenChange={setStartExecutionOpen} onSaved={() => { invalidateProjectFlow(queryClient); selectTab("execution") }} />}

      {receiveAsBuiltOpen && <DateFlowDialog projectId={details.project.id} projectCode={details.project.projectCode} open={receiveAsBuiltOpen} onOpenChange={setReceiveAsBuiltOpen} title="Receber As-Built" description="Registre a data de recebimento para encaminhar o documento à análise técnica." fieldLabel="Data de recebimento" successMessage="Recebimento do As-Built registrado" submitLabel="Registrar recebimento" minDate={dateInputValue(details.workflow.milestones.executionStartedAt)} minDateLabel="data de início da execução" payload={(date) => ({ stage: "ANALISANDO_AS_BUILT", asBuiltReceivedAt: date })} onSaved={() => { invalidateProjectFlow(queryClient); selectTab("execution") }} />}

      {reviewAsBuiltOpen && <ReviewAsBuiltDialog projectId={details.project.id} projectCode={details.project.projectCode} receivedAt={details.workflow.milestones.asBuiltReceivedAt ?? undefined} open={reviewAsBuiltOpen} onOpenChange={setReviewAsBuiltOpen} onSaved={() => { invalidateProjectFlow(queryClient); selectTab("execution") }} />}

      {invoiceAttestationOpen && <DateFlowDialog projectId={details.project.id} projectCode={details.project.projectCode} open={invoiceAttestationOpen} onOpenChange={setInvoiceAttestationOpen} title="Atestar Nota Fiscal" description="Confirme a data do atesto da Nota Fiscal após a aprovação do As-Built." fieldLabel="Data do atesto" successMessage="Atesto da Nota Fiscal registrado" submitLabel="Registrar atesto" minDate={dateInputValue(details.workflow.milestones.asBuiltApprovedAt)} minDateLabel="data de aprovação do As-Built" payload={(date) => ({ stage: "ATESTAR_NF", invoiceAttestedAt: date })} onSaved={() => { invalidateProjectFlow(queryClient); selectTab("execution") }} />}

      {completeServiceOpen && <DateFlowDialog projectId={details.project.id} projectCode={details.project.projectCode} open={completeServiceOpen} onOpenChange={setCompleteServiceOpen} title={canFinalizeProject ? "Concluir projeto" : "Iniciar Entrega Técnica"} description={canFinalizeProject ? "O relatório de entrega foi gerado, revisado e assinado. Confirme a conclusão do workflow." : "Registre o término da execução para abrir a etapa de Entrega Técnica."} fieldLabel={canFinalizeProject ? "Data da conclusão do projeto" : "Data de término da execução"} successMessage={canFinalizeProject ? "Projeto concluído" : "Entrega Técnica iniciada"} submitLabel={canFinalizeProject ? "Concluir projeto" : "Iniciar Entrega Técnica"} minDate={dateInputValue(canFinalizeProject ? details.workflow.milestones.deliveryReportSignedAt : details.workflow.milestones.invoiceAttestedAt)} minDateLabel={canFinalizeProject ? "data da assinatura do relatório" : "data de atesto da Nota Fiscal"} warning={canFinalizeProject && details.operationalSummary.openTasksCount ? `O projeto ainda possui ${details.operationalSummary.openTasksCount} tarefa(s) aberta(s).` : undefined} confirmationLabel={canFinalizeProject && details.operationalSummary.openTasksCount ? "Confirmo que revisei as tarefas abertas e desejo concluir o projeto mesmo assim." : undefined} payload={(date) => canFinalizeProject ? ({ stage: "SERVICO_CONCLUIDO", serviceCompletedAt: details.workflow.milestones.serviceCompletedAt ?? date }) : ({ stage: "ENTREGA_TECNICA", serviceCompletedAt: date })} onSaved={() => { invalidateProjectFlow(queryClient); selectTab(canFinalizeProject ? "execution" : "delivery") }} />}
    </div>
  )
}
