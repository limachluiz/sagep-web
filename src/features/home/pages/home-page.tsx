import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarClock,
  ClipboardList,
  Clock3,
  FilePlus2,
  FileText,
  FolderKanban,
  Gauge,
  House,
  Landmark,
  LayoutDashboard,
  ListTodo,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"
import { Link } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/auth.store"
import type { Permission } from "@/features/auth/auth.types"
import { dashboardService } from "@/features/dashboard/dashboard.service"
import type {
  DashboardOperationalResponse,
  ProjectStage,
} from "@/features/dashboard/dashboard.types"
import { getGreeting, selectPendingTasks } from "@/features/home/home.utils"
import {
  isTaskOverdue,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatusVariants,
} from "@/features/tasks/tasks.constants"
import { tasksService } from "@/features/tasks/tasks.service"
import type { Task } from "@/features/tasks/tasks.types"

const MANAUS_TIME_ZONE = "America/Manaus"

const stageLabels: Record<ProjectStage, string> = {
  ESTIMATIVA_PRECO: "Estimativa de preço",
  AGUARDANDO_NOTA_CREDITO: "Aguardando Nota de Crédito",
  DIEX_REQUISITORIO: "DIEx requisitório",
  AGUARDANDO_NOTA_EMPENHO: "Aguardando Nota de Empenho",
  OS_LIBERADA: "OS liberada",
  AGUARDANDO_OS_ASSINADA: "Aguardando OS assinada",
  AGUARDANDO_INICIO_EXECUCAO: "Aguardando início",
  SERVICO_EM_EXECUCAO: "Em execução",
  ANALISANDO_AS_BUILT: "Analisando As-Built",
  ATESTAR_NF: "Atestar NF",
  SERVICO_CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

const roleLabels = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  PROJETISTA: "Projetista",
  CONSULTA: "Consulta",
} as const

type QuickAction = {
  label: string
  description: string
  to: string
  icon: typeof House
  anyOf: Permission[]
}

const primaryQuickActions: QuickAction[] = [
  {
    label: "Novo projeto",
    description: "Iniciar planejamento",
    to: "/projects?new=1",
    icon: Plus,
    anyOf: ["projects.edit_all", "projects.edit_own"],
  },
  {
    label: "Nova estimativa",
    description: "Compor itens e valores",
    to: "/estimates/new",
    icon: FilePlus2,
    anyOf: ["estimates.create"],
  },
  {
    label: "DIEx",
    description: "Formalizar requisições",
    to: "/diex",
    icon: Landmark,
    anyOf: ["diex.issue", "estimates.view_all"],
  },
  {
    label: "Ordens de Serviço",
    description: "Liberar e acompanhar execução",
    to: "/service-orders",
    icon: ShieldCheck,
    anyOf: ["service_orders.issue", "projects.view_all"],
  },
]

const fallbackQuickActions: QuickAction[] = [
  {
    label: "Dashboard",
    description: "Analisar carteira e resultados",
    to: "/dashboard",
    icon: LayoutDashboard,
    anyOf: [
      "dashboard.financial_view",
      "dashboard.view_operational",
      "dashboard.view_executive",
    ],
  },
  {
    label: "Projetos",
    description: "Consultar o portfólio",
    to: "/projects",
    icon: ClipboardList,
    anyOf: ["projects.view_all", "projects.edit_own"],
  },
  {
    label: "Tarefas",
    description: "Acompanhar atividades",
    to: "/tasks",
    icon: ListTodo,
    anyOf: [
      "tasks.view_all",
      "tasks.create",
      "tasks.edit_all",
      "tasks.edit_own",
    ],
  },
  {
    label: "Kanban",
    description: "Visualizar o fluxo dos projetos",
    to: "/kanban",
    icon: FolderKanban,
    anyOf: ["projects.view_all", "projects.edit_own"],
  },
  {
    label: "Estimativas",
    description: "Consultar documentos e valores",
    to: "/estimates",
    icon: FileText,
    anyOf: ["estimates.view_all", "estimates.create", "estimates.edit"],
  },
]

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatLongDate(date: Date) {
  return titleCase(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: MANAUS_TIME_ZONE,
    }).format(date),
  )
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MANAUS_TIME_ZONE,
  }).format(new Date(value))
}

function formatTaskDueDate(value: string | null) {
  if (!value) return "Sem prazo definido"

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: MANAUS_TIME_ZONE,
  }).format(new Date(value))
}

function pendingFlowTotal(data?: DashboardOperationalResponse) {
  if (!data) return 0
  return Object.values(data.pendingByStage).reduce((total, value) => total + value, 0)
}

function HomeMetricSkeletons() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Carregando página inicial</span>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-44 rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-28 rounded-lg" key={index} />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-24 rounded-lg" key={index} />
        ))}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "primary",
}: {
  label: string
  value: number
  description: string
  icon: typeof Gauge
  tone?: "primary" | "warning" | "danger"
}) {
  const toneClasses = {
    primary: "border-primary/15 bg-primary/[.07] text-primary",
    warning: "border-status-warning/20 bg-status-warning/8 text-status-warning",
    danger: "border-destructive/20 bg-destructive/8 text-destructive",
  }

  return (
    <Card size="sm" className="gap-3 py-4">
      <CardHeader className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div>
          <CardDescription className="text-[10px] font-semibold uppercase tracking-[.14em]">
            {label}
          </CardDescription>
          <CardTitle className="mt-1.5 text-3xl tracking-tight">{value}</CardTitle>
        </div>
        <span className={`flex size-9 items-center justify-center rounded-lg border ${toneClasses[tone]}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{description}</CardContent>
    </Card>
  )
}

function HomeContent({
  data,
  tasks,
  tasksLoading,
  tasksError,
  onRetryTasks,
}: {
  data: DashboardOperationalResponse
  tasks: Task[]
  tasksLoading: boolean
  tasksError: boolean
  onRetryTasks: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const now = new Date()
  const firstName = user?.name?.trim().split(/\s+/)[0] || "usuário"
  const role = user?.role ? roleLabels[user.role] : "Usuário"
  const ownerQueue = data.operationalQueue.filter(
    (project) => project.owner.id === user?.id,
  )
  const queue = ownerQueue.length > 0 ? ownerQueue : data.operationalQueue
  const priorities = queue.slice(0, 5)
  const activities = data.latestMovements.slice(0, 5)
  const pendingTasks = selectPendingTasks(tasks)
  const pendingTaskCount = tasks.filter(
    (task) => task.status !== "CONCLUIDA" && task.status !== "CANCELADA",
  ).length
  const inventoryRisk =
    data.inventory.summary.lowStockItems +
    data.inventory.summary.insufficientItems

  const quickActions = useMemo(() => {
    const primary = primaryQuickActions.filter((action) =>
      hasAnyPermission(action.anyOf),
    )
    const fallback = fallbackQuickActions.filter(
      (action) =>
        hasAnyPermission(action.anyOf) &&
        !primary.some((primaryAction) => primaryAction.to === action.to),
    )
    return [...primary, ...fallback].slice(0, 4)
  }, [hasAnyPermission])

  return (
    <div className="space-y-6">
      <section className="sagep-signal-hero relative overflow-hidden rounded-xl px-5 py-5 sm:px-7 sm:py-6">
        <div className="sagep-signal-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <Badge className="mb-3">
              <House data-icon="inline-start" />
              Início
            </Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {getGreeting(now)}, {firstName}.
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {formatLongDate(now)} · {user?.rank ? `${user.rank} · ` : ""}
              {role} · 4º CTA
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/80">
              Acompanhe as prioridades do fluxo documental e acesse rapidamente
              as rotinas da Seção de Projetos.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full gap-2 bg-card/65 sm:w-auto">
            <Link to="/dashboard">
              Abrir Dashboard
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="home-summary-title">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">
              Situação atual
            </p>
            <h2 id="home-summary-title" className="mt-1 text-xl font-semibold">
              Resumo operacional
            </h2>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Atualizado às {formatActivityDate(data.generatedAt).split(" ")[1]}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Projetos sob responsabilidade"
            value={ownerQueue.length}
            description={`${data.operationalQueue.length} projeto(s) na fila operacional`}
            icon={ClipboardList}
          />
          <MetricCard
            label="Pendências no fluxo"
            value={pendingFlowTotal(data)}
            description="Documentos e etapas aguardando ação"
            icon={Clock3}
            tone="warning"
          />
          <MetricCard
            label="Alertas críticos"
            value={data.alerts.summary.bySeverity.CRITICAL}
            description={`${data.alerts.summary.bySeverity.WARNING} alerta(s) em atenção`}
            icon={AlertTriangle}
            tone="danger"
          />
          <MetricCard
            label="Itens de ATA em risco"
            value={inventoryRisk}
            description={`${data.inventory.summary.insufficientItems} item(ns) com saldo insuficiente`}
            icon={Boxes}
            tone="warning"
          />
        </div>
      </section>

      <section aria-labelledby="home-my-tasks-title">
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="border-b bg-primary/[.035] py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">
                Sua fila de trabalho
              </p>
              <CardTitle id="home-my-tasks-title" className="mt-1 flex items-center gap-2 text-lg">
                <ListTodo className="size-4 text-primary" />
                Minhas tarefas pendentes
              </CardTitle>
              <CardDescription className="mt-0.5">
                Atividades atribuídas diretamente a você, priorizadas por atraso,
                criticidade e prazo.
              </CardDescription>
            </div>
            <CardAction className="flex items-center gap-2">
              {!tasksLoading && !tasksError && (
                <Badge variant="secondary">{pendingTaskCount} pendente(s)</Badge>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/tasks">Ver tarefas</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {tasksLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton className="h-16 rounded-lg" key={index} />
                ))}
              </div>
            ) : tasksError ? (
              <div className="flex flex-col items-center px-5 py-8 text-center">
                <AlertTriangle className="size-7 text-status-warning" />
                <p className="mt-3 text-sm font-medium">Não foi possível carregar suas tarefas</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={onRetryTasks}>
                  <RefreshCw className="size-4" />
                  Tentar novamente
                </Button>
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <ShieldCheck className="mx-auto size-8 text-primary" />
                <p className="mt-3 text-sm font-medium">Você não possui tarefas pendentes</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  As atividades atribuídas a você estão em dia.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {pendingTasks.map((task) => {
                  const overdue = isTaskOverdue(task)
                  return (
                    <Link
                      className="group grid min-w-0 gap-3 bg-card px-5 py-4 transition hover:bg-muted/45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:grid-cols-[minmax(280px,1.35fr)_minmax(180px,.7fr)_minmax(180px,.65fr)_auto]"
                      key={task.id}
                      to={`/tasks/${task.id}`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-[.13em] text-primary">
                          TSK-{task.taskCode} · PRJ-{task.project.projectCode}
                        </span>
                        <span className="mt-1 block truncate text-sm font-semibold leading-5">
                          {task.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {task.project.title}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2 sm:justify-end lg:justify-start">
                        <Badge variant={taskStatusVariants[task.status]}>
                          {taskStatusLabels[task.status]}
                        </Badge>
                        <Badge variant={task.priority >= 5 ? "destructive" : "outline"}>
                          {taskPriorityLabels[task.priority] ?? `Prioridade ${task.priority}`}
                        </Badge>
                      </span>
                      <span
                        className={`flex items-center gap-1.5 text-xs sm:col-span-2 lg:col-span-1 ${
                          overdue ? "font-medium text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        <CalendarClock className="size-3.5" />
                        {overdue ? "Em atraso · " : "Prazo · "}
                        {formatTaskDueDate(task.dueDate)}
                      </span>
                      <span className="hidden size-8 items-center justify-center rounded-md border border-border/75 text-muted-foreground transition group-hover:border-primary/30 group-hover:bg-primary/[.07] group-hover:text-primary lg:flex">
                        <ArrowUpRight className="size-4" />
                        <span className="sr-only">Abrir tarefa {task.taskCode}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {quickActions.length > 0 && (
        <section aria-labelledby="home-shortcuts-title">
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">
              Rotinas
            </p>
            <h2 id="home-shortcuts-title" className="mt-1 text-xl font-semibold">
              Acesso rápido
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  className="group flex min-h-24 items-center gap-4 rounded-lg border border-border/75 bg-card/94 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                  key={`${action.label}-${action.to}`}
                  to={action.to}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/[.07] text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-base font-semibold tracking-wide">
                      {action.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-status-warning" />
              Prioridades do fluxo
            </CardTitle>
            <CardDescription>
              {ownerQueue.length > 0
                ? "Projetos sob sua responsabilidade que exigem acompanhamento."
                : "Projetos que exigem acompanhamento da equipe."}
            </CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard?view=operational">Ver painel</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {priorities.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <ShieldCheck className="mx-auto size-8 text-primary" />
                <p className="mt-3 text-sm font-medium">Nenhuma prioridade pendente</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  A fila operacional está em dia.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {priorities.map((project) => (
                  <Link
                    className="group grid gap-3 px-5 py-4 transition hover:bg-muted/45 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    key={project.id}
                    to={project.detailsPath}
                  >
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          PRJ-{project.projectCode} · {project.title}
                        </span>
                        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {project.nextAction.label}
                      </span>
                    </span>
                    <Badge variant="outline" className="justify-self-start sm:justify-self-end">
                      {stageLabels[project.stage]}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Atividade recente
            </CardTitle>
            <CardDescription>Últimas movimentações registradas no SAGEP.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {activities.length === 0 ? (
              <div className="px-5 py-10 text-center text-xs text-muted-foreground">
                Nenhuma atividade recente.
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {activities.map((activity) => (
                  <div className="flex gap-3 px-5 py-3.5" key={activity.id}>
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/10" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs leading-5 text-foreground/90">
                        {activity.summary}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {activity.actorName ?? "Sistema"} · {formatActivityDate(activity.at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function HomePage() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const user = useAuthStore((state) => state.user)
  const canViewOperational = hasPermission("dashboard.view_operational")
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "operational", 15],
    queryFn: () => dashboardService.operational(15),
    enabled: canViewOperational,
    staleTime: 30_000,
  })
  const tasksQuery = useQuery({
    queryKey: ["tasks", "home", "mine", user?.userCode],
    queryFn: () =>
      tasksService.list({
        page: 1,
        pageSize: 100,
        assigneeCode: user?.userCode,
      }),
    enabled: canViewOperational && Boolean(user?.userCode),
    staleTime: 30_000,
  })

  if (!canViewOperational) {
    return (
      <Alert>
        <House />
        <AlertTitle>Bem-vindo ao SAGEP</AlertTitle>
        <AlertDescription>
          Seu perfil não possui acesso ao resumo operacional. Utilize o menu para
          acessar os módulos autorizados.
        </AlertDescription>
      </Alert>
    )
  }

  if (dashboardQuery.isLoading) return <HomeMetricSkeletons />

  if (dashboardQuery.isError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar a página inicial</AlertTitle>
          <AlertDescription>{dashboardQuery.error.message}</AlertDescription>
        </Alert>
        <Button variant="outline" className="gap-2" onClick={() => dashboardQuery.refetch()}>
          <RefreshCw className="size-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return dashboardQuery.data ? (
    <HomeContent
      data={dashboardQuery.data}
      tasks={tasksQuery.data?.items ?? []}
      tasksLoading={tasksQuery.isLoading}
      tasksError={tasksQuery.isError}
      onRetryTasks={() => tasksQuery.refetch()}
    />
  ) : null
}
