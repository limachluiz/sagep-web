import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileSpreadsheet,
  ListChecks,
  Loader2,
  RefreshCw,
  Route,
  UserRound,
  Users,
} from "lucide-react"
import { Link, useParams, useSearchParams } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import { projectsService } from "@/features/projects/projects.service"
import type {
  ProjectDetailsResponse,
  ProjectStatus,
} from "@/features/projects/projects.types"

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

const milestoneLabels: Record<string, string> = {
  creditNoteNumber: "Número da Nota de Crédito",
  creditNoteReceivedAt: "Recebimento da Nota de Crédito",
  diexNumber: "Número do DIEx",
  diexIssuedAt: "Emissão do DIEx",
  commitmentNoteNumber: "Número da Nota de Empenho",
  commitmentNoteReceivedAt: "Recebimento da Nota de Empenho",
  serviceOrderNumber: "Número da Ordem de Serviço",
  serviceOrderIssuedAt: "Emissão da Ordem de Serviço",
  executionStartedAt: "Início da execução",
  asBuiltReceivedAt: "Recebimento do As-Built",
  asBuiltReviewedAt: "Análise do As-Built",
  asBuiltApprovedAt: "Aprovação do As-Built",
  asBuiltRejectedAt: "Reprovação do As-Built",
  asBuiltRejectionReason: "Motivo da reprovação",
  invoiceAttestedAt: "Atesto da Nota Fiscal",
  serviceCompletedAt: "Conclusão do serviço",
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string | null, withTime = false) {
  if (!value) return "Não informado"
  return new Intl.DateTimeFormat("pt-BR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }).format(new Date(value))
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function ProjectOverview({ details }: { details: ProjectDetailsResponse }) {
  const milestoneEntries = Object.entries(details.workflow.milestones).filter(
    ([key]) => key !== "asBuiltRejectionReason" || details.workflow.milestones[key],
  )

  return (
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
          <CardHeader><CardTitle>Pendências do projeto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {details.pendingActions.length ? details.pendingActions.map((action) => (
              <div key={action.code} className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={action.severity === "BLOCKER" ? "size-5 text-destructive" : "size-5 text-amber-600"} />
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
        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Equipe</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Responsável</p>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                <Avatar><AvatarFallback>{initials(details.project.owner.name)}</AvatarFallback></Avatar>
                <div><p className="font-medium">{details.project.owner.name}</p><p className="text-xs text-muted-foreground">{details.project.owner.email}</p></div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Membros</p>
              {details.project.members.length ? (
                <div className="space-y-2">
                  {details.project.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-xl border p-3">
                      <Avatar className="size-8"><AvatarFallback className="text-xs">{initials(member.user.name)}</AvatarFallback></Avatar>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{member.user.name}</p><p className="truncate text-xs text-muted-foreground">{member.user.email}</p></div>
                      <Badge variant="outline">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">Nenhum membro adicional.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Datas do projeto</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Início previsto</span><span className="font-medium">{formatDate(details.project.startDate)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Término previsto</span><span className="font-medium">{formatDate(details.project.endDate)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Criado em</span><span className="font-medium">{formatDate(details.project.createdAt)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Última atualização</span><span className="font-medium">{formatDate(details.project.updatedAt, true)}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Documents({ details }: { details: ProjectDetailsResponse }) {
  const groups = [
    {
      title: "Estimativas",
      icon: FileSpreadsheet,
      items: details.documents.estimates.map((item) => ({
        id: item.id,
        code: `EST-${item.estimateCode}`,
        status: item.status,
        description: `${item.destinationCityName}/${item.destinationStateUf}`,
        amount: item.totalAmount,
        date: item.createdAt,
      })),
    },
    {
      title: "DIEx requisitórios",
      icon: ClipboardCheck,
      items: details.documents.diexRequests.map((item) => ({
        id: item.id,
        code: item.diexNumber ?? `DIEX-${item.diexCode}`,
        status: item.documentStatus ?? "RASCUNHO",
        description: item.supplierName ?? "Fornecedor não informado",
        amount: item.totalAmount,
        date: item.issuedAt ?? item.createdAt,
      })),
    },
    {
      title: "Ordens de Serviço",
      icon: FileCheck2,
      items: details.documents.serviceOrders.map((item) => ({
        id: item.id,
        code: item.serviceOrderNumber ?? `OS-${item.serviceOrderCode}`,
        status: item.documentStatus ?? "RASCUNHO",
        description: item.contractorName ?? "Contratada não informada",
        amount: item.totalAmount,
        date: item.issuedAt ?? item.createdAt,
      })),
    },
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {groups.map((group) => {
        const Icon = group.icon
        return (
          <Card key={group.title} className="border-none shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Icon className="size-5 text-primary" />{group.title}<Badge variant="outline" className="ml-auto">{group.items.length}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {group.items.length ? group.items.map((item) => (
                <div key={item.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3"><p className="font-medium">{item.code}</p><Badge variant="secondary">{item.status}</Badge></div>
                  <p className="mt-2 truncate text-xs text-muted-foreground">{item.description}</p>
                  <div className="mt-3 flex items-center justify-between text-sm"><span className="font-medium">{formatCurrency(item.amount)}</span><span className="text-xs text-muted-foreground">{formatDate(item.date)}</span></div>
                </div>
              )) : <p className="py-10 text-center text-sm text-muted-foreground">Nenhum documento.</p>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function Timeline({ details }: { details: ProjectDetailsResponse }) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader><CardTitle>Histórico unificado</CardTitle></CardHeader>
      <CardContent>
        {details.timeline.length ? (
          <div className="relative space-y-0 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-border">
            {details.timeline.map((item) => (
              <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                <div className="z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-primary"><Clock3 className="size-4" /></div>
                <div className="min-w-0 flex-1 rounded-xl border p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div><p className="font-medium">{item.label}</p>{item.summary && <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>}</div>
                    <Badge variant="outline">{item.entityType}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{item.actorName ?? "Sistema"} · {formatDate(item.at, true)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="py-12 text-center text-sm text-muted-foreground">Nenhum evento registrado.</p>}
      </CardContent>
    </Card>
  )
}

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const includeArchived = searchParams.get("includeArchived") === "true"
  const detailsQuery = useQuery({
    queryKey: ["projects", "details", projectId, includeArchived],
    queryFn: () => projectsService.details(projectId!, includeArchived),
    enabled: Boolean(projectId),
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
              <div className="flex flex-wrap items-center gap-2"><Badge className="bg-sidebar-primary text-sidebar-primary-foreground">PRJ-{details.project.projectCode}</Badge><Badge variant="outline" className="border-white/20 text-white">{statusLabels[details.workflow.status]}</Badge>{details.project.archivedAt && <Badge variant="secondary">Arquivado</Badge>}</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">{details.project.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sidebar-foreground/70">{details.project.description || "Projeto sem descrição cadastrada."}</p>
            </div>
            <Button variant="secondary" className="gap-2" onClick={() => detailsQuery.refetch()} disabled={detailsQuery.isFetching}>
              {detailsQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Atualizar
            </Button>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex items-start gap-3"><Route className="mt-0.5 size-5 text-sidebar-primary" /><div><p className="text-xs text-sidebar-foreground/60">Etapa atual</p><p className="mt-1 font-semibold">{stageLabels[details.workflow.stage]}</p></div></div>
              <div className="md:max-w-md md:text-right"><p className="text-xs text-sidebar-foreground/60">Próxima ação</p><p className="mt-1 font-semibold text-sidebar-primary">{details.workflow.nextAction.label}</p><p className="mt-1 text-xs text-sidebar-foreground/60">{details.workflow.nextAction.description}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => { const Icon = metric.icon; return <Card key={metric.label} className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-2 text-2xl font-semibold">{metric.value}</p></div><div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></div></CardContent></Card> })}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-5">
          <TabsTrigger value="overview"><UserRound data-icon="inline-start" />Visão geral</TabsTrigger>
          <TabsTrigger value="documents"><FileCheck2 data-icon="inline-start" />Documentos</TabsTrigger>
          <TabsTrigger value="timeline"><CalendarDays data-icon="inline-start" />Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><ProjectOverview details={details} /></TabsContent>
        <TabsContent value="documents"><Documents details={details} /></TabsContent>
        <TabsContent value="timeline"><Timeline details={details} /></TabsContent>
      </Tabs>
    </div>
  )
}
