import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ClipboardCheck, FileSignature, FileText, FolderKanban, ShieldCheck } from "lucide-react"
import { Link, useParams } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/auth.store"
import { ProjectDeliveryPanel } from "@/features/projects/components/project-delivery-panel"
import { projectsService } from "@/features/projects/projects.service"

const money = (value: string) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function ProjectDeliveryReportPage() {
  const { projectId = "" } = useParams()
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const detailsQuery = useQuery({ queryKey: ["projects", "details", projectId, false], queryFn: () => projectsService.details(projectId), enabled: Boolean(projectId) })
  const draftQuery = useQuery({ queryKey: ["delivery-report-draft", projectId], queryFn: () => projectsService.deliveryReportDraft(projectId), enabled: Boolean(projectId) })

  if (detailsQuery.isLoading || draftQuery.isLoading) return <div className="space-y-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>
  if (detailsQuery.isError || !detailsQuery.data || draftQuery.isError || !draftQuery.data) return <Alert variant="destructive"><FileText /><AlertTitle>Não foi possível abrir a Entrega Técnica</AlertTitle><AlertDescription>{detailsQuery.error?.message ?? draftQuery.error?.message ?? "Projeto não encontrado."}</AlertDescription></Alert>

  const details = detailsQuery.data
  const data = draftQuery.data
  const canManage = hasPermission("projects.edit_all") || (hasPermission("projects.edit_own") && details.project.owner.id === user?.id)
  const editable = canManage && !details.project.archivedAt && details.workflow.stage === "ENTREGA_TECNICA"
  const documents = [
    data.documents.estimate && { label: "Estimativa", value: data.documents.estimate.code, detail: `${data.documents.estimate.ataNumber} · ${money(data.documents.estimate.totalAmount)}`, href: `/estimates/${data.documents.estimate.id}` },
    data.documents.diex && { label: "DIEx requisitório", value: data.documents.diex.code, detail: money(data.documents.diex.totalAmount), href: `/diex/${data.documents.diex.id}` },
    data.documents.serviceOrder && { label: "Ordem de Serviço", value: data.documents.serviceOrder.code, detail: money(data.documents.serviceOrder.totalAmount), href: `/service-orders/${data.documents.serviceOrder.id}` },
  ].filter(Boolean) as Array<{ label: string; value: string; detail: string; href: string }>

  return <div className="space-y-6">
    <div><Button asChild variant="ghost" className="mb-3 -ml-3"><Link to={`/projects/${projectId}?tab=evidences`}><ArrowLeft />Voltar ao projeto</Link></Button><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-3 flex flex-wrap gap-2"><Badge>PRJ-{details.project.projectCode}</Badge><Badge variant={editable ? "default" : "secondary"}>{editable ? "Em elaboração" : "Somente leitura"}</Badge></div><h1 className="text-3xl font-semibold tracking-tight">Entrega Técnica</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Construa, revise e formalize o Relatório Técnico de Conclusão e Entrega do projeto {details.project.title}.</p></div></div></div>

    <div className="grid gap-3 md:grid-cols-4"><Card className="border-none shadow-sm"><CardContent className="flex gap-3 p-4"><FolderKanban className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">1. Referências</p><p className="font-medium">{documents.length} documento(s)</p></div></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="flex gap-3 p-4"><ClipboardCheck className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">2. Memória técnica</p><p className="font-medium">{data.readiness.sectionsReviewed}/{data.readiness.sectionsIncluded} blocos</p></div></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="flex gap-3 p-4"><ShieldCheck className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">3. Itens</p><p className="font-medium">{data.readiness.itemsDocumented}/{data.readiness.totalItems} documentados</p></div></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="flex gap-3 p-4"><FileSignature className="size-5 text-primary" /><div><p className="text-xs text-muted-foreground">4. Formalização</p><p className="font-medium">{data.draft.formalization.requiresOmAcknowledgement ? "Ciência da OM" : "Assinatura do projetista"}</p></div></CardContent></Card></div>

    <Card className="border-none shadow-sm"><CardHeader><CardTitle>Documentos e dados vinculados</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{documents.map((document) => <Button key={document.label} asChild variant="outline" className="h-auto justify-start p-4 text-left"><Link to={document.href}><div><p className="text-xs font-normal text-muted-foreground">{document.label}</p><p className="font-semibold">{document.value}</p><p className="text-xs font-normal text-muted-foreground">{document.detail}</p></div></Link></Button>)}</CardContent></Card>

    <ProjectDeliveryPanel details={details} canManage={canManage} workspace />
  </div>
}
