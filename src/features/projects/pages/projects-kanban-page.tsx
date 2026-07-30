import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Columns3,
  GripVertical,
  Loader2,
  RefreshCw,
  UserRound,
  Target,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FilterToolbar, SearchField } from "@/components/filter-toolbar"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/auth.store"
import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import { projectsService } from "@/features/projects/projects.service"
import { kanbanIndicators } from "@/features/dashboard/planning-indicators"
import { militaryOrganizationsService } from "@/features/projects/military-organizations.service"
import type { FederativeUnit, ProjectKanbanCard, ProjectType } from "@/features/projects/projects.types"
import { usersService } from "@/features/users/users.service"

const nextStage: Partial<Record<ProjectStage, ProjectStage>> = {
  ESTIMATIVA_PRECO: "AGUARDANDO_NOTA_CREDITO",
  AGUARDANDO_NOTA_CREDITO: "DIEX_REQUISITORIO",
  DIEX_REQUISITORIO: "AGUARDANDO_NOTA_EMPENHO",
  AGUARDANDO_NOTA_EMPENHO: "OS_LIBERADA",
  OS_LIBERADA: "AGUARDANDO_OS_ASSINADA",
  AGUARDANDO_OS_ASSINADA: "AGUARDANDO_INICIO_EXECUCAO",
  AGUARDANDO_INICIO_EXECUCAO: "SERVICO_EM_EXECUCAO",
  SERVICO_EM_EXECUCAO: "ANALISANDO_AS_BUILT",
  ANALISANDO_AS_BUILT: "ATESTAR_NF",
  ATESTAR_NF: "SERVICO_CONCLUIDO",
}

const typeLabels: Record<ProjectType, string> = {
  CFTV: "CFTV",
  FIBRA_OPTICA_PONTO_LOGICO: "Fibra / Ponto Lógico",
}

function formatDate(value: string | null) {
  if (!value) return "Sem prazo"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
}

function KanbanCard({
  card,
  stageLabels,
  canMove,
  moving,
  onMove,
  overlay = false,
}: {
  card: ProjectKanbanCard
  stageLabels: Partial<Record<ProjectStage, string>>
  canMove: boolean
  moving: boolean
  onMove: (stage: ProjectStage) => void
  overlay?: boolean
}) {
  const targetStage = nextStage[card.stage]
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: `project:${card.id}`,
    data: { card },
    disabled: !canMove || !targetStage || moving || overlay,
  })
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-default border bg-card shadow-xs transition hover:-translate-y-0.5 hover:shadow-md data-[dragging=true]:opacity-35 data-[overlay=true]:rotate-1 data-[overlay=true]:border-primary/40 data-[overlay=true]:shadow-xl"
      data-dragging={isDragging}
      data-overlay={overlay}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">PRJ-{card.projectCode}</p>
            <Link to={`/projects/${card.id}`} className="mt-1 block font-semibold leading-5 hover:text-primary">
              {card.title}
            </Link>
          </div>
          {canMove && targetStage && !overlay ? (
            <button
              type="button"
              className="mt-0.5 flex size-8 shrink-0 touch-none items-center justify-center rounded-md border border-transparent text-muted-foreground outline-none transition hover:border-border hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
              aria-label={`Mover PRJ-${card.projectCode}: ${card.title}`}
              {...listeners}
              {...attributes}
            >
              <GripVertical className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <CircleDot className="mt-1 size-4 shrink-0 text-primary" />
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {card.projectType && <Badge variant="secondary">{typeLabels[card.projectType]}</Badge>}
          {card.om && <Badge variant="outline">{card.om.sigla} · {card.om.stateUf}</Badge>}
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-2"><UserRound className="size-3.5" />{card.owner.name}</p>
          <p className="flex items-center gap-2"><CalendarClock className="size-3.5" />{card.plannedEndDate ? `Prazo: ${formatDate(card.plannedEndDate)}` : `Atualizado: ${formatDate(card.updatedAt)}`}</p>
        </div>

        {canMove && targetStage && (
          <Button size="sm" variant="outline" className="w-full justify-between" disabled={moving} onClick={() => onMove(targetStage)}>
            <span className="truncate">{stageLabels[targetStage] ?? "Próxima etapa"}</span>
            {moving ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function KanbanColumn({
  column,
  activeCard,
  children,
}: {
  column: {
    stage: ProjectStage
    label: string
    count: number
  }
  activeCard: ProjectKanbanCard | null
  children: React.ReactNode
}) {
  const expectedStage = activeCard ? nextStage[activeCard.stage] : null
  const isEligible = expectedStage === column.stage
  const { isOver, setNodeRef } = useDroppable({
    id: `stage:${column.stage}`,
    data: { stage: column.stage, label: column.label },
    disabled: Boolean(activeCard) && !isEligible,
  })

  return (
    <section
      ref={setNodeRef}
      className="min-h-64 w-[min(86vw,340px)] shrink-0 snap-start rounded-2xl border bg-muted/35 p-3 transition-colors data-[eligible=true]:border-primary/35 data-[eligible=true]:bg-primary/5 data-[over=true]:border-primary data-[over=true]:bg-primary/10 data-[over=true]:ring-2 data-[over=true]:ring-primary/20"
      data-eligible={isEligible}
      data-over={isOver}
    >
      <header className="mb-3 flex items-center justify-between gap-2 px-1 py-2">
        <div>
          <h2 className="text-sm font-semibold">{column.label}</h2>
          {isEligible && activeCard && (
            <p className="mt-1 text-[11px] font-medium text-primary">Solte aqui para avançar</p>
          )}
        </div>
        <Badge variant="outline" className="bg-background">{column.count}</Badge>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function ProjectsKanbanPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [scope, setScope] = useState<"accessible" | "mine">("accessible")
  const [emptyColumns, setEmptyColumns] = useState<"show" | "hide">("show")
  const [stage, setStage] = useState<ProjectStage | "all">("all")
  const [projectType, setProjectType] = useState<ProjectType | "all">("all")
  const [stateUf, setStateUf] = useState<FederativeUnit | "all">("all")
  const [omId, setOmId] = useState("all")
  const [ownerId, setOwnerId] = useState("all")
  const [activeCard, setActiveCard] = useState<ProjectKanbanCard | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(timeout)
  }, [search])

  const organizationsQuery = useQuery({
    queryKey: ["military-organizations", "kanban-filters"],
    queryFn: () => militaryOrganizationsService.list({ page: 1, pageSize: 100, active: true }),
    staleTime: 1000 * 60 * 10,
  })
  const ownersQuery = useQuery({
    queryKey: ["users", "kanban-filter-options"],
    queryFn: () => usersService.options(),
    staleTime: 1000 * 60 * 10,
  })
  const organizationOptions = (organizationsQuery.data?.items ?? []).filter(
    (organization) => stateUf === "all" || organization.stateUf === stateUf,
  )

  const kanbanQuery = useQuery({
    queryKey: ["projects", "kanban", debouncedSearch, scope, stage, projectType, stateUf, omId, ownerId],
    queryFn: () => projectsService.kanban({
      search: debouncedSearch || undefined,
      onlyMine: scope === "mine",
      stage: stage === "all" ? undefined : stage,
      projectType: projectType === "all" ? undefined : projectType,
      stateUf: stateUf === "all" ? undefined : stateUf,
      omId: omId === "all" ? undefined : omId,
      ownerId: scope === "mine" || ownerId === "all" ? undefined : ownerId,
    }),
  })

  const moveMutation = useMutation({
    mutationFn: ({ projectId, stage }: { projectId: string; stage: ProjectStage }) => projectsService.moveKanban(projectId, stage),
    onSuccess: () => {
      toast.success("Projeto avançado para a próxima etapa.")
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
    onError: (error) => toast.error(error.message),
  })

  const columns = useMemo(() => {
    const all = kanbanQuery.data?.columns ?? []
    return emptyColumns === "hide" ? all.filter((column) => column.count > 0) : all
  }, [emptyColumns, kanbanQuery.data])

  const stageLabels = useMemo(
    () => Object.fromEntries((kanbanQuery.data?.columns ?? []).map((column) => [column.stage, column.label])) as Partial<Record<ProjectStage, string>>,
    [kanbanQuery.data],
  )
  const indicators = kanbanQuery.data ? kanbanIndicators(kanbanQuery.data) : null

  const canMoveCard = (card: ProjectKanbanCard) =>
    hasPermission("projects.edit_all") || (hasPermission("projects.edit_own") && card.owner.id === user?.id)

  const moveCard = (card: ProjectKanbanCard, target: ProjectStage) => {
    if (nextStage[card.stage] !== target) {
      toast.warning("O projeto só pode avançar para a próxima etapa do workflow.")
      return
    }
    moveMutation.mutate({ projectId: card.id, stage: target })
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveCard(active.data.current?.card as ProjectKanbanCard | null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const card = active.data.current?.card as ProjectKanbanCard | undefined
    const target = over?.data.current?.stage as ProjectStage | undefined
    setActiveCard(null)

    if (card && target) moveCard(card, target)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fluxo operacional"
        title="Kanban de projetos"
        description="Acompanhe o portfólio por etapa e avance projetos conforme os requisitos documentais do workflow."
        icon={Columns3}
        meta={kanbanQuery.data ? `Posição atualizada em ${formatDate(kanbanQuery.data.generatedAt)}` : undefined}
        actions={<Button variant="outline" onClick={() => kanbanQuery.refetch()} disabled={kanbanQuery.isFetching}>
          <RefreshCw className={kanbanQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar
        </Button>}
      />

      <FilterToolbar className="xl:grid-cols-4">
          <SearchField value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar projeto..." aria-label="Buscar no Kanban" />
          <Select value={scope} onValueChange={(value) => setScope(value as "accessible" | "mine")}>
            <SelectTrigger className="w-full" aria-label="Escopo do Kanban"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="accessible">Todos acessíveis</SelectItem><SelectItem value="mine">Sob minha responsabilidade</SelectItem></SelectContent>
          </Select>
          <Select value={emptyColumns} onValueChange={(value) => setEmptyColumns(value as "show" | "hide")}>
            <SelectTrigger className="w-full" aria-label="Visibilidade das etapas vazias"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="show">Exibir etapas vazias</SelectItem><SelectItem value="hide">Ocultar etapas vazias</SelectItem></SelectContent>
          </Select>
          <Select value={stage} onValueChange={(value) => setStage(value as ProjectStage | "all")}>
            <SelectTrigger className="w-full" aria-label="Filtrar Kanban por etapa"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas as etapas</SelectItem>{(kanbanQuery.data?.columns ?? []).map((column) => <SelectItem key={column.stage} value={column.stage}>{column.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={projectType} onValueChange={(value) => setProjectType(value as ProjectType | "all")}>
            <SelectTrigger className="w-full" aria-label="Filtrar Kanban por tipo"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos os tipos</SelectItem>{Object.entries(typeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={stateUf} onValueChange={(value) => { setStateUf(value as FederativeUnit | "all"); setOmId("all") }}>
            <SelectTrigger className="w-full" aria-label="Filtrar Kanban por UF"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas as UFs</SelectItem>{(["AM", "RO", "RR", "AC"] as FederativeUnit[]).map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={omId} onValueChange={setOmId}>
            <SelectTrigger className="w-full" aria-label="Filtrar Kanban por OM"><SelectValue placeholder="Todas as OMs" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas as OMs</SelectItem>{organizationOptions.map((organization) => <SelectItem key={organization.id} value={organization.id}>{organization.sigla} · {organization.cityName}/{organization.stateUf}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={ownerId} onValueChange={setOwnerId} disabled={scope === "mine"}>
            <SelectTrigger className="w-full" aria-label="Filtrar Kanban por responsável"><SelectValue placeholder="Todos os responsáveis" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos os responsáveis</SelectItem>{(ownersQuery.data?.items ?? []).filter((owner) => owner.active).map((owner) => <SelectItem key={owner.id} value={owner.id}>{owner.rank ? `${owner.rank} ` : ""}{owner.name}</SelectItem>)}</SelectContent>
          </Select>
          {(search || scope !== "accessible" || emptyColumns !== "show" || stage !== "all" || projectType !== "all" || stateUf !== "all" || omId !== "all" || ownerId !== "all") && (
            <Button variant="ghost" onClick={() => { setSearch(""); setDebouncedSearch(""); setScope("accessible"); setEmptyColumns("show"); setStage("all"); setProjectType("all"); setStateUf("all"); setOmId("all"); setOwnerId("all") }}>Limpar filtros</Button>
          )}
      </FilterToolbar>

      {kanbanQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar o Kanban</AlertTitle><AlertDescription>{kanbanQuery.error.message}</AlertDescription></Alert>}

      {indicators && <Card className="sagep-signal-hero overflow-hidden"><CardContent className="flex flex-col justify-between gap-6 p-6 lg:flex-row lg:items-center"><div className="max-w-xl"><Badge>Leitura do fluxo</Badge><h2 className="mt-3 text-2xl font-semibold">Distribuição e gargalo do portfólio</h2><p className="mt-2 text-sm text-muted-foreground">Identifique rapidamente onde os projetos estão concentrados e qual etapa exige maior capacidade de resposta.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]"><div className="sagep-metric-tile p-3"><p className="text-xs text-muted-foreground uppercase">Projetos</p><p className="mt-1 text-2xl font-semibold">{indicators.totalProjects}</p></div><div className="sagep-metric-tile p-3"><p className="text-xs text-muted-foreground uppercase">Etapas ativas</p><p className="mt-1 text-2xl font-semibold">{indicators.activeColumns}</p></div><button type="button" className="sagep-metric-tile p-3 text-left transition hover:border-primary/60" onClick={() => setStage("SERVICO_CONCLUIDO")}><span className="block text-xs text-muted-foreground uppercase">Concluídos</span><span className="mt-1 block text-2xl font-semibold text-primary">{indicators.completed}</span></button><button type="button" className="sagep-metric-tile p-3 text-left transition hover:border-primary/60" disabled={!indicators.bottleneck?.count} onClick={() => indicators.bottleneck && setStage(indicators.bottleneck.stage)}><span className="flex items-center gap-1 text-xs text-muted-foreground uppercase"><Target className="size-3" />Gargalo</span><span className="mt-1 block truncate text-sm font-semibold" title={indicators.bottleneck?.label}>{indicators.bottleneck?.label ?? "Sem dados"}</span><span className="mt-1 block text-xs text-muted-foreground">{indicators.bottleneck?.count ?? 0} projeto(s)</span></button></div></CardContent></Card>}

      {kanbanQuery.isLoading ? (
        <div className="flex gap-4 overflow-hidden" role="status" aria-label="Carregando quadro Kanban">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[480px] min-w-80" />)}</div>
      ) : columns.length === 0 ? (
        <Card className="border-dashed bg-muted/15 shadow-none">
          <CardContent className="py-14 text-center">
            <Columns3 className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 font-medium">Nenhuma etapa corresponde aos filtros</p>
            <p className="mt-1 text-sm text-muted-foreground">Limpe ou ajuste os filtros para voltar a exibir o quadro.</p>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragCancel={() => setActiveCard(null)}
          onDragEnd={handleDragEnd}
          accessibility={{
            screenReaderInstructions: {
              draggable: "Para mover um projeto, pressione Espaço. Use as setas para escolher a próxima etapa e pressione Espaço novamente para confirmar. Pressione Escape para cancelar.",
            },
            announcements: {
              onDragStart: ({ active }) => {
                const card = active.data.current?.card as ProjectKanbanCard | undefined
                return card ? `Projeto PRJ-${card.projectCode}, ${card.title}, selecionado.` : "Projeto selecionado."
              },
              onDragOver: ({ over }) => {
                const label = over?.data.current?.label as string | undefined
                return label ? `Destino selecionado: ${label}.` : "Fora de uma etapa permitida."
              },
              onDragEnd: ({ active, over }) => {
                const card = active.data.current?.card as ProjectKanbanCard | undefined
                const label = over?.data.current?.label as string | undefined
                return card && label
                  ? `Projeto PRJ-${card.projectCode} movido para ${label}.`
                  : "Movimentação cancelada."
              },
              onDragCancel: () => "Movimentação cancelada.",
            },
          }}
        >
          <div className="flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-5" aria-label="Quadro Kanban por etapa" tabIndex={0}>
            {columns.map((column) => (
              <KanbanColumn key={column.stage} column={column} activeCard={activeCard}>
                {column.cards.map((card) => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    stageLabels={stageLabels}
                    canMove={canMoveCard(card)}
                    moving={moveMutation.isPending && moveMutation.variables?.projectId === card.id}
                    onMove={(stage) => moveCard(card, stage)}
                  />
                ))}
                {!column.cards.length && <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 text-center"><CheckCircle2 className="size-6 text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">Nenhum projeto nesta etapa</p></div>}
              </KanbanColumn>
            ))}
          </div>
          <DragOverlay>
            {activeCard ? (
              <div className="w-[min(86vw,340px)]">
                <KanbanCard
                  card={activeCard}
                  stageLabels={stageLabels}
                  canMove={false}
                  moving={false}
                  onMove={() => undefined}
                  overlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
