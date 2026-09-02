import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Archive, ArrowLeft, Building2, ExternalLink, FileSignature, FileText, Pencil, RotateCcw, Trash2, UserRound } from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArchiveActionDialog } from "@/components/archive-action-dialog"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentItemsTable } from "@/components/document-items-table"
import { Skeleton } from "@/components/ui/skeleton"
import { diexService } from "@/features/diex/diex.service"
import { CompleteDiexDialog } from "@/features/diex/components/complete-diex-dialog"
import { EditDiexDialog } from "@/features/diex/components/edit-diex-dialog"
import { useAuthStore } from "@/features/auth/auth.store"
import { invalidateProjectFlow } from "@/features/projects/project-flow-cache"
import { openPdfPreview } from "@/lib/pdf-preview"

function formatCurrency(value: string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value)) }
function formatQuantity(value: string) { return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(value)) }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value)) : "Não informado" }

export function DiexDetailsPage() {
  const { diexId = "" } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const includeArchived = searchParams.get("includeArchived") === "true"
  const queryClient = useQueryClient()
  const canIssue = useAuthStore((state) => state.hasPermission("diex.issue"))
  const canCancel = useAuthStore((state) => state.hasPermission("diex.cancel"))
  const canRestore = useAuthStore((state) => state.hasPermission("diex.restore"))
  const canDelete = useAuthStore((state) => state.hasPermission("diex.delete"))
  const [documentLoading, setDocumentLoading] = useState<"html" | "pdf" | null>(null)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const query = useQuery({ queryKey: ["diex", "details", diexId, includeArchived], queryFn: () => diexService.details(diexId, includeArchived), enabled: Boolean(diexId) })
  const archiveMutation = useMutation({
    mutationFn: () => diexService.archive(diexId),
    onSuccess: () => {
      toast.success("DIEx arquivado e saldo reservado liberado.")
      queryClient.invalidateQueries({ queryKey: ["diex"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["atas"] })
      navigate("/diex")
    },
    onError: (error) => toast.error(error.message),
  })
  const restoreMutation = useMutation({
    mutationFn: () => diexService.restore(diexId),
    onSuccess: () => {
      toast.success("DIEx restaurado com sucesso.")
      queryClient.invalidateQueries({ queryKey: ["diex"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["atas"] })
      navigate(`/diex/${diexId}`)
    },
    onError: (error) => toast.error(error.message),
  })
  const deleteMutation = useMutation({
    mutationFn: () => diexService.softDelete(diexId),
    onSuccess: () => {
      toast.success("DIEx excluído com sucesso.")
      queryClient.invalidateQueries({ queryKey: ["diex"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["atas"] })
      navigate("/diex")
    },
    onError: (error) => toast.error(error.message),
  })

  const handleDocument = async (format: "html" | "pdf") => {
    setDocumentLoading(format)
    let previewWindow: Window | null = null
    try {
      if (format === "pdf") {
        await openPdfPreview(
          () => diexService.document(diexId, "pdf"),
          `DIEx ${query.data?.diexNumber ?? query.data?.diexCode ?? diexId}`,
        )
        return
      }

      previewWindow = window.open("", "_blank")
      const blob = await diexService.document(diexId, format)
      const url = URL.createObjectURL(blob)
      if (previewWindow) previewWindow.location.href = url
      else { const anchor = document.createElement("a"); anchor.href = url; anchor.download = `diex-${query.data?.diexNumber ?? query.data?.diexCode}.${format}`; anchor.click() }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) { previewWindow?.close(); toast.error(error instanceof Error ? error.message : "Não foi possível gerar o documento.") }
    finally { setDocumentLoading(null) }
  }

  if (query.isLoading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>
  if (query.isError || !query.data) return <div className="space-y-4"><Button asChild variant="ghost"><Link to="/diex"><ArrowLeft className="size-4" />Voltar</Link></Button><Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar o DIEx</AlertTitle><AlertDescription>{query.error?.message}</AlertDescription></Alert></div>
  const diex = query.data
  const documentReady = Boolean(diex.diexNumber && diex.issuedAt)

  return <div className="space-y-6">
    <div><Button asChild variant="ghost" className="mb-3 -ml-3"><Link to="/diex"><ArrowLeft className="size-4" />Voltar aos DIEx</Link></Button><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-3 flex gap-2"><Badge>DIEX-{diex.diexCode}</Badge><Badge variant={documentReady ? "default" : "secondary"}>{documentReady ? "Documento disponível" : "Aguardando SALC"}</Badge>{diex.archivedAt && <Badge variant="outline">Arquivado</Badge>}</div><h1 className="text-3xl font-semibold">{diex.diexNumber ?? "DIEx requisitório"}</h1><p className="mt-2 text-sm text-muted-foreground">Emissão: {formatDate(diex.issuedAt)}</p></div><div className="flex flex-wrap gap-2">{canIssue && !diex.archivedAt && <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="size-4" />Editar</Button>}{canIssue && !documentReady && !diex.archivedAt && <Button variant="outline" onClick={() => setCompleteOpen(true)}>Preencher dados da SALC</Button>}{canCancel && !diex.archivedAt && <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setArchiveDialogOpen(true)}><Archive className="size-4" />Arquivar</Button>}{canRestore && diex.archivedAt && <Button variant="outline" onClick={() => setArchiveDialogOpen(true)}><RotateCcw className="size-4" />Restaurar</Button>}{canDelete && diex.archivedAt && <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="size-4" />Excluir</Button>}<Button variant="outline" disabled={!documentReady || Boolean(documentLoading) || Boolean(diex.archivedAt)} onClick={() => handleDocument("html")}><ExternalLink className="size-4" />Visualizar</Button><Button disabled={!documentReady || Boolean(documentLoading) || Boolean(diex.archivedAt)} onClick={() => handleDocument("pdf")}><FileText className="size-4" />Visualizar PDF</Button></div></div></div>

    {!documentReady && <Alert><AlertTriangle /><AlertTitle>Documento ainda indisponível</AlertTitle><AlertDescription>O número e a data de emissão precisam ser preenchidos pela SALC antes da geração oficial.</AlertDescription></Alert>}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card className="border-none shadow-sm"><CardContent className="p-5"><FileSignature className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Valor requisitado</p><p className="mt-1 text-xl font-semibold">{formatCurrency(diex.totalAmount)}</p></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="p-5"><Building2 className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Fornecedor</p><p className="mt-1 font-semibold">{diex.supplierName}</p><p className="text-xs text-muted-foreground">{diex.supplierCnpj}</p></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="p-5"><UserRound className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Requisitante</p><p className="mt-1 font-semibold">{diex.requesterRank} {diex.requesterName}</p></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="p-5"><p className="text-xs text-muted-foreground">Vínculos</p><Button asChild variant="link" className="mt-1 h-auto p-0"><Link to={`/projects/${diex.project.id}`}>PRJ-{diex.project.projectCode}</Link></Button><p className="text-sm">EST-{diex.estimate.estimateCode} · {diex.estimate.om?.sigla ?? diex.estimate.omName}</p></CardContent></Card></div>

    <Card className="border-none shadow-sm"><CardHeader><CardTitle>Itens requisitados</CardTitle></CardHeader><CardContent><DocumentItemsTable containerLabel="Itens requisitados do DIEx" items={diex.items.map((item) => ({ id: item.id, code: item.itemCode, description: item.description, unit: item.supplyUnit, quantity: formatQuantity(item.quantityRequested), unitPrice: formatCurrency(item.unitPrice), totalPrice: formatCurrency(item.totalPrice) }))} /></CardContent></Card>
    {completeOpen && <CompleteDiexDialog diex={diex} open={completeOpen} onOpenChange={setCompleteOpen} onSaved={(updated) => { queryClient.setQueryData(["diex", "details", diexId], updated); invalidateProjectFlow(queryClient) }} />}
    {editOpen && <EditDiexDialog diex={diex} open={editOpen} onOpenChange={setEditOpen} onSaved={(updated) => { queryClient.setQueryData(["diex", "details", diexId, includeArchived], updated); invalidateProjectFlow(queryClient) }} />}
    <ArchiveActionDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen} mode={diex.archivedAt ? "restore" : "archive"} entityLabel="DIEx" entityCode={diex.diexNumber ?? `DIEX-${diex.diexCode}`} description={diex.archivedAt ? "O documento voltará ao fluxo ativo do projeto." : "A reserva de saldo será liberada e o projeto retornará à etapa documental anterior. A ação é bloqueada quando existe OS ativa vinculada."} pending={archiveMutation.isPending || restoreMutation.isPending} onConfirm={() => diex.archivedAt ? restoreMutation.mutate() : archiveMutation.mutate()} />
    <DeleteActionDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} entityLabel="DIEx" entityCode={diex.diexNumber ?? `DIEX-${diex.diexCode}`} description="Ordens de Serviço dependentes também serão excluídas logicamente." pending={deleteMutation.isPending} onConfirm={() => deleteMutation.mutate()} />
  </div>
}
