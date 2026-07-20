import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  MapPin,
  PackageCheck,
} from "lucide-react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { estimatesService } from "@/features/estimates/estimates.service"
import type { EstimateStatus } from "@/features/estimates/estimates.types"

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
  const [documentLoading, setDocumentLoading] = useState<"html" | "pdf" | null>(null)

  const estimateQuery = useQuery({
    queryKey: ["estimates", "details", estimateId],
    queryFn: () => estimatesService.details(estimateId),
    enabled: Boolean(estimateId),
  })

  const handleDocument = async (format: "html" | "pdf") => {
    const previewWindow = format === "html" ? window.open("", "_blank") : null
    setDocumentLoading(format)

    try {
      const blob = await estimatesService.document(estimateId, format)
      const url = URL.createObjectURL(blob)

      if (format === "html" && previewWindow) {
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
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Estimativa de preço</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Criada em {formatDate(estimate.createdAt)} · atualizada em {formatDate(estimate.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => handleDocument("html")} disabled={Boolean(documentLoading)}>
              <ExternalLink className="size-4" />
              {documentLoading === "html" ? "Gerando..." : "Visualizar documento"}
            </Button>
            <Button className="gap-2" onClick={() => handleDocument("pdf")} disabled={Boolean(documentLoading)}>
              <Download className="size-4" />
              {documentLoading === "pdf" ? "Gerando..." : "Baixar PDF"}
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
                  <TableCell><p className="max-w-md">{item.description}</p>{item.notes && <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>}</TableCell>
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
    </div>
  )
}
