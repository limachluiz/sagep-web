import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Columns3,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/auth.store"
import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import { projectsService } from "@/features/projects/projects.service"
import type { ProjectKanbanCard, ProjectType } from "@/features/projects/projects.types"

const nextStage: Partial<Record<ProjectStage, ProjectStage>> = {
  ESTIMATIVA_PRECO: "AGUARDANDO_NOTA_CREDITO",
  AGUARDANDO_NOTA_CREDITO: "DIEX_REQUISITORIO",
  DIEX_REQUISITORIO: "AGUARDANDO_NOTA_EMPENHO",
  AGUARDANDO_NOTA_EMPENHO: "OS_LIBERADA",
  OS_LIBERADA: "SERVICO_EM_EXECUCAO",
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
  onDragStart,
}: {
  card: ProjectKanbanCard
  stageLabels: Partial<Record<ProjectStage, string>>
  canMove: boolean
  moving: boolean
  onMove: (stage: ProjectStage) => void
  onDragStart: () => void
}) {
  const targetStage = nextStage[card.stage]

  return (
    <Card
      draggable={canMove && Boolean(targetStage)}
      onDragStart={onDragStart}
      className="cursor-default border bg-card shadow-xs transition hover:-translate-y-0.5 hover:shadow-md data-[draggable=true]:cursor-grab"
      data-draggable={canMove && Boolean(targetStage)}
    >
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">PRJ-{card.projectCode}</p>
            <Link to={`/projects/${card.id}`} className="mt-1 block font-semibold leading-5 hover:text-primary">
              {card.title}
            </Link>
          </div>
          <CircleDot className="mt-1 size-4 shrink-0 text-primary" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {card.projectType && <Badge variant="secondary">{typeLabels[card.projectType]}</Badge>}
          {card.om && <Badge variant="outline">{card.om.sigla} · {card.om.stateUf}</Badge>}
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-2"><UserRound className="size-3.5" />{card.owner.name}</p>
          <p className="flex items-center gap-2"><CalendarClock className="size-3.5" />{formatDate(card.plannedEndDate)}</p>
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

export function ProjectsKanbanPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [scope, setScope] = useState<"accessible" | "mine">("accessible")
  const [emptyColumns, setEmptyColumns] = useState<"show" | "hide">("show")
  const [draggedCard, setDraggedCard] = useState<ProjectKanbanCard | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(timeout)
  }, [search])

  const kanbanQuery = useQuery({
    queryKey: ["projects", "kanban", debouncedSearch, scope],
    queryFn: () => projectsService.kanban({
      search: debouncedSearch || undefined,
      onlyMine: scope === "mine",
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

  const canMoveCard = (card: ProjectKanbanCard) =>
    hasPermission("projects.edit_all") || (hasPermission("projects.edit_own") && card.owner.id === user?.id)

  const moveCard = (card: ProjectKanbanCard, target: ProjectStage) => {
    if (nextStage[card.stage] !== target) {
      toast.warning("O projeto só pode avançar para a próxima etapa do workflow.")
      return
    }
    moveMutation.mutate({ projectId: card.id, stage: target })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <Badge className="mb-3">Fluxo operacional</Badge>
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight"><Columns3 className="size-7 text-primary" />Kanban de projetos</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Acompanhe o portfólio por etapa e avance projetos conforme os requisitos documentais do workflow.
          </p>
        </div>
        <Button variant="outline" onClick={() => kanbanQuery.refetch()} disabled={kanbanQuery.isFetching}>
          <RefreshCw className={kanbanQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(260px,1fr)_190px_190px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar projeto..." />
          </div>
          <Select value={scope} onValueChange={(value) => setScope(value as "accessible" | "mine")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="accessible">Todos acessíveis</SelectItem><SelectItem value="mine">Sob minha responsabilidade</SelectItem></SelectContent>
          </Select>
          <Select value={emptyColumns} onValueChange={(value) => setEmptyColumns(value as "show" | "hide")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="show">Exibir etapas vazias</SelectItem><SelectItem value="hide">Ocultar etapas vazias</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      {kanbanQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar o Kanban</AlertTitle><AlertDescription>{kanbanQuery.error.message}</AlertDescription></Alert>}

      {kanbanQuery.isLoading ? (
        <div className="flex gap-4 overflow-hidden">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-[480px] min-w-80" />)}</div>
      ) : (
        <div className="flex items-start gap-4 overflow-x-auto pb-5">
          {columns.map((column) => (
            <section
              key={column.stage}
              className="min-h-64 w-[340px] shrink-0 rounded-2xl border bg-muted/35 p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedCard) moveCard(draggedCard, column.stage)
                setDraggedCard(null)
              }}
            >
              <header className="mb-3 flex items-center justify-between gap-2 px-1 py-2">
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <Badge variant="outline" className="bg-background">{column.count}</Badge>
              </header>
              <div className="space-y-3">
                {column.cards.map((card) => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    stageLabels={stageLabels}
                    canMove={canMoveCard(card)}
                    moving={moveMutation.isPending && moveMutation.variables?.projectId === card.id}
                    onMove={(stage) => moveCard(card, stage)}
                    onDragStart={() => setDraggedCard(card)}
                  />
                ))}
                {!column.cards.length && <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 text-center"><CheckCircle2 className="size-6 text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">Nenhum projeto nesta etapa</p></div>}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
