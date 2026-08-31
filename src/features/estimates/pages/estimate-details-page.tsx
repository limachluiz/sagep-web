import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Building2,
  FileText,
  ExternalLink,
  FileSpreadsheet,
  MapPin,
  PackageCheck,
  Ban,
  CircleCheck,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArchiveActionDialog } from "@/components/archive-action-dialog"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { ItemDescription } from "@/components/item-description"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { estimatesService } from "@/features/estimates/estimates.service"
import type { EstimateStatus } from "@/features/estimates/estimates.types"
import { EstimateEditDialog } from "@/features/estimates/components/estimate-edit-dialog"
import { useAuthStore } from "@/features/auth/auth.store"
import { openPdfPreview } from "@/lib/pdf-preview"

const statusLabels: Record<EstimateStatus, string> = {
  RASCUNHO: "Rascunho",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
}

const statusVariants: Record<EstimateStatus, "default" | "secondary" | "destructive"> = {
  RASCUNHO: "secondary",
  FINALIZADA: "default",
  CANCELADA: "destructive",
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

function formatQuantity(value: string) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function EstimateDetailsPage() {
  const { estimateId = "" } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const includeArchived = searchParams.get("includeArchived") === "true"
  const queryClient = useQueryClient()
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [documentLoading, setDocumentLoading] = useState<"html" | "pdf" | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [statusConfirmation, setStatusConfirmation] = useState<"FINALIZADA" | "CANCELADA" | null>(null)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const estimateQuery = useQuery({
    queryKey: ["estimates", "details", estimateId, includeArchived],
    queryFn: () => estimatesService.details(estimateId, includeArchived),
    enabled: Boolean(estimateId),
  })

  const statusMutation = useMutation({
    mutationFn: (status: "FINALIZADA" | "CANCELADA") => estimatesService.updateStatus(estimateId, status),
    onSuccess: (estimate) => {
      toast.success(
        estimate.status === "FINALIZADA"
          ? `Estimativa EST-${estimate.estimateCode} finalizada e fluxo do projeto atualizado.`
          : `Estimativa EST-${estimate.estimateCode} cancelada.`,
      )
      queryClient.setQueryData(["estimates", "details", estimateId], estimate)
      queryClient.invalidateQueries({ queryKey: ["estimates", "list"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setStatusConfirmation(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const archiveMutation = useMutation({
    mutationFn: () => estimatesService.archive(estimateId),
    onSuccess: () => {
      toast.success("Estimativa arquivada com sucesso.")
      queryClient.invalidateQueries({ queryKey: ["estimates"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate("/estimates")
    },
    onError: (error) => toast.error(error.message),
  })

  const restoreMutation = useMutation({
    mutationFn: () => estimatesService.restore(estimateId),
    onSuccess: () => {
      toast.success("Estimativa restaurada com sucesso.")
      queryClient.invalidateQueries({ queryKey: ["estimates"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      navigate(`/estimates/${estimateId}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => estimatesService.softDelete(estimateId),
    onSuccess: () => {
      toast.success("Estimativa excluída com sucesso.")
      queryClient.invalidateQueries({ queryKey: ["estimates"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      navigate("/estimates")
    },
    onError: (error) => toast.error(error.message),
  })

  const handleDocument = async (format: "html" | "pdf") => {
    setDocumentLoading(format)
    let previewWindow: Window | null = null

    try {
      if (format === "pdf") {
        await openPdfPreview(
          () => estimatesService.document(estimateId, "pdf"),
          `Estimativa EST-${estimateQuery.data?.estimateCode ?? estimateId}`,
        )
        return
      }

      previewWindow = window.open("", "_blank")
      const blob = await estimatesService.document(estimateId, format)
      const url = URL.createObjectURL(blob)

      if (previewWindow) {
        previewWindow.location.href = url
      } else {
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = `estimativa-${estimateQuery.data?.estimateCode ?? estimateId}.${format}`
        anchor.click()
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      previewWindow?.close()
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o documento.")
    } finally {
      setDocumentLoading(null)
    }
  }

  if (estimateQuery.isLoading) {
    return <div className="space-y-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>
  }

  if (estimateQuery.isError || !estimateQuery.data) {
    return (
      <div className="space-y-5">
        <Button asChild variant="ghost"><Link to="/estimates"><ArrowLeft className="size-4" />Voltar</Link></Button>
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar a estimativa</AlertTitle>
          <AlertDescription>{estimateQuery.error?.message ?? "Estimativa não encontrada."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const estimate = estimateQuery.data
  const isDraft = estimate.status === "RASCUNHO"
  const canEdit = isDraft && !estimate.archivedAt && hasPermission("estimates.edit")
  const canFinalize = isDraft && !estimate.archivedAt && hasPermission("estimates.finalize")
  const canArchive = !estimate.archivedAt && hasPermission("estimates.archive")
  const canRestore = Boolean(estimate.archivedAt) && hasPermission("estimates.restore")
  const canDelete = Boolean(estimate.archivedAt) && hasPermission("estimates.delete")

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="mb-3 -ml-3 gap-2">
          <Link to="/estimates"><ArrowLeft className="size-4" />Voltar para estimativas</Link>
        </Button>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge>EST-{estimate.estimateCode}</Badge>
              <Badge variant={statusVariants[estimate.status]}>{statusLabels[estimate.status]}</Badge>
              {estimate.archivedAt && <Badge variant="outline">Arquivada</Badge>}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Estimativa de preço</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Criada em {formatDate(estimate.createdAt)} · atualizada em {formatDate(estimate.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />Editar
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => setStatusConfirmation("CANCELADA")}>
                <Ban className="size-4" />Cancelar estimativa
              </Button>
            )}
            {canFinalize && (
              <Button className="gap-2" onClick={() => setStatusConfirmation("FINALIZADA")}>
                <CircleCheck className="size-4" />Finalizar
              </Button>
            )}
            {canArchive && (
              <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => setArchiveDialogOpen(true)}>
                <Archive className="size-4" />Arquivar
              </Button>
            )}
            {canRestore && (
              <Button variant="outline" className="gap-2" onClick={() => setArchiveDialogOpen(true)}>
                <RotateCcw className="size-4" />Restaurar
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" className="gap-2" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="size-4" />Excluir
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={() => handleDocument("html")} disabled={Boolean(documentLoading)}>
              <ExternalLink className="size-4" />
              {documentLoading === "html" ? "Gerando..." : "Visualizar documento"}
            </Button>
            <Button className="gap-2" onClick={() => handleDocument("pdf")} disabled={Boolean(documentLoading)}>
              <FileText className="size-4" />
              {documentLoading === "pdf" ? "Gerando..." : "Visualizar PDF"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <FileSpreadsheet className="mt-0.5 size-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Valor total</p><p className="mt-1 text-xl font-semibold">{formatCurrency(estimate.totalAmount)}</p></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <PackageCheck className="mt-0.5 size-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Itens selecionados</p><p className="mt-1 text-xl font-semibold">{estimate.items.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <Building2 className="mt-0.5 size-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Organização Militar</p><p className="mt-1 font-semibold">{estimate.om?.sigla ?? estimate.omName ?? "Não informada"}</p></div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-start gap-3 p-5">
            <MapPin className="mt-0.5 size-5 text-primary" />
            <div><p className="text-xs text-muted-foreground">Destino</p><p className="mt-1 font-semibold">{estimate.destinationCityName}/{estimate.destinationStateUf}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-none shadow-sm xl:col-span-2">
          <CardHeader><CardTitle>Vínculos da estimativa</CardTitle></CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projeto</p>
              <Button asChild variant="link" className="h-auto p-0 text-base">
                <Link to={`/projects/${estimate.project.id}`}>PRJ-{estimate.project.projectCode} · {estimate.project.title}</Link>
              </Button>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ata de Registro de Preços</p>
              <p className="mt-1 font-medium">{estimate.ata.number} · {estimate.ata.vendorName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Grupo de cobertura</p>
              <p className="mt-1 font-medium">{estimate.coverageGroup.code} · {estimate.coverageGroup.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">OM de destino</p>
              <p className="mt-1 font-medium">{estimate.om ? `${estimate.om.sigla} · ${estimate.om.name}` : estimate.omName ?? "Não informada"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader><CardTitle>Observações</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{estimate.notes || "Nenhuma observação registrada."}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Itens da estimativa</CardTitle>
          <Badge variant="outline">{estimate.items.length} item(ns)</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referência</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Saldo da ATA</TableHead>
                <TableHead>Valor unitário</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estimate.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.referenceCode}</TableCell>
                  <TableCell className="min-w-72 max-w-xl"><ItemDescription>{item.description}</ItemDescription>{item.notes && <ItemDescription className="mt-1 text-xs text-muted-foreground">{item.notes}</ItemDescription>}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{formatQuantity(item.quantity)}</TableCell>
                  <TableCell>
                    {item.ataItem.balance ? (
                      <div>
                        <p>{formatQuantity(item.ataItem.balance.availableQuantity)} {item.unit}</p>
                        {(item.ataItem.balance.lowStock || item.ataItem.balance.insufficient) && (
                          <Badge className="mt-1" variant="destructive">Saldo baixo</Badge>
                        )}
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-5 flex justify-end border-t pt-5">
            <div className="text-right"><p className="text-sm text-muted-foreground">Total da estimativa</p><p className="text-2xl font-semibold">{formatCurrency(estimate.totalAmount)}</p></div>
          </div>
        </CardContent>
      </Card>

      {editOpen && (
        <EstimateEditDialog
          estimate={estimate}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={(updatedEstimate) => {
            queryClient.setQueryData(["estimates", "details", estimateId], updatedEstimate)
            queryClient.invalidateQueries({ queryKey: ["estimates", "list"] })
          }}
        />
      )}

      <Dialog open={Boolean(statusConfirmation)} onOpenChange={(open) => !open && setStatusConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusConfirmation === "FINALIZADA" ? "Finalizar estimativa?" : "Cancelar estimativa?"}
            </DialogTitle>
            <DialogDescription>
              {statusConfirmation === "FINALIZADA"
                ? "O saldo dos itens será validado novamente e o projeto avançará para a Nota de Crédito. A finalização ainda não reserva saldo; a reserva ocorre somente na criação do DIEx."
                : "A estimativa será marcada como cancelada e deixará de permitir edição pela interface."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusConfirmation(null)} disabled={statusMutation.isPending}>Voltar</Button>
            <Button
              variant={statusConfirmation === "CANCELADA" ? "destructive" : "default"}
              disabled={!statusConfirmation || statusMutation.isPending}
              onClick={() => statusConfirmation && statusMutation.mutate(statusConfirmation)}
            >
              {statusMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              {statusConfirmation === "FINALIZADA" ? "Confirmar finalização" : "Confirmar cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ArchiveActionDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        mode={estimate.archivedAt ? "restore" : "archive"}
        entityLabel="estimativa"
        entityCode={`EST-${estimate.estimateCode}`}
        description={estimate.archivedAt
          ? "A estimativa voltará a ficar disponível no projeto."
          : "O registro sairá das consultas ativas, mas continuará disponível no histórico. A operação será bloqueada se houver DIEx ou OS vinculados."}
        pending={archiveMutation.isPending || restoreMutation.isPending}
        onConfirm={() => estimate.archivedAt ? restoreMutation.mutate() : archiveMutation.mutate()}
      />
      <DeleteActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel="estimativa"
        entityCode={`EST-${estimate.estimateCode}`}
        description="DIEx e Ordens de Serviço dependentes também serão excluídos logicamente."
        pending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}
