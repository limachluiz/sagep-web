import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, ArrowLeft, Building2, Download, ExternalLink, FileSignature, UserRound } from "lucide-react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { diexService } from "@/features/diex/diex.service"

function formatCurrency(value: string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value)) }
function formatQuantity(value: string) { return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(value)) }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value)) : "Não informado" }

export function DiexDetailsPage() {
  const { diexId = "" } = useParams()
  const [documentLoading, setDocumentLoading] = useState<"html" | "pdf" | null>(null)
  const query = useQuery({ queryKey: ["diex", "details", diexId], queryFn: () => diexService.details(diexId), enabled: Boolean(diexId) })

  const handleDocument = async (format: "html" | "pdf") => {
    const previewWindow = format === "html" ? window.open("", "_blank") : null
    setDocumentLoading(format)
    try {
      const blob = await diexService.document(diexId, format)
      const url = URL.createObjectURL(blob)
      if (format === "html" && previewWindow) previewWindow.location.href = url
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
    <div><Button asChild variant="ghost" className="mb-3 -ml-3"><Link to="/diex"><ArrowLeft className="size-4" />Voltar aos DIEx</Link></Button><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-3 flex gap-2"><Badge>DIEX-{diex.diexCode}</Badge><Badge variant={documentReady ? "default" : "secondary"}>{documentReady ? "Documento disponível" : "Aguardando SALC"}</Badge></div><h1 className="text-3xl font-semibold">{diex.diexNumber ?? "DIEx requisitório"}</h1><p className="mt-2 text-sm text-muted-foreground">Emissão: {formatDate(diex.issuedAt)}</p></div><div className="flex gap-2"><Button variant="outline" disabled={!documentReady || Boolean(documentLoading)} onClick={() => handleDocument("html")}><ExternalLink className="size-4" />Visualizar</Button><Button disabled={!documentReady || Boolean(documentLoading)} onClick={() => handleDocument("pdf")}><Download className="size-4" />Baixar PDF</Button></div></div></div>

    {!documentReady && <Alert><AlertTriangle /><AlertTitle>Documento ainda indisponível</AlertTitle><AlertDescription>O número e a data de emissão precisam ser preenchidos pela SALC antes da geração oficial.</AlertDescription></Alert>}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Card className="border-none shadow-sm"><CardContent className="p-5"><FileSignature className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Valor requisitado</p><p className="mt-1 text-xl font-semibold">{formatCurrency(diex.totalAmount)}</p></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="p-5"><Building2 className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Fornecedor</p><p className="mt-1 font-semibold">{diex.supplierName}</p><p className="text-xs text-muted-foreground">{diex.supplierCnpj}</p></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="p-5"><UserRound className="size-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Requisitante</p><p className="mt-1 font-semibold">{diex.requesterRank} {diex.requesterName}</p></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="p-5"><p className="text-xs text-muted-foreground">Vínculos</p><Button asChild variant="link" className="mt-1 h-auto p-0"><Link to={`/projects/${diex.project.id}`}>PRJ-{diex.project.projectCode}</Link></Button><p className="text-sm">EST-{diex.estimate.estimateCode} · {diex.estimate.om?.sigla ?? diex.estimate.omName}</p></CardContent></Card></div>

    <Card className="border-none shadow-sm"><CardHeader><CardTitle>Itens requisitados</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descrição</TableHead><TableHead>Unidade</TableHead><TableHead>Quantidade</TableHead><TableHead>Valor unitário</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{diex.items.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.itemCode}</TableCell><TableCell>{item.description}</TableCell><TableCell>{item.supplyUnit}</TableCell><TableCell>{formatQuantity(item.quantityRequested)}</TableCell><TableCell>{formatCurrency(item.unitPrice)}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(item.totalPrice)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>
}
