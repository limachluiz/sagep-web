import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Banknote, Building2, CheckSquare2, Download, Eye, FileSpreadsheet, Search, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { financialStatusLabel } from "@/features/financial-execution/portfolio-presentation"
import { openPdfPreview } from "@/lib/pdf-preview"
import { cn } from "@/lib/utils"
import { reportsService } from "../reports.service"
import type { CommitmentNoteReportFilters } from "../reports.types"

type Mode = "all" | "supplier" | "status" | "individual" | "selected"

const modes: Array<{ value: Mode; title: string; description: string; icon: typeof Banknote }> = [
  { value: "all", title: "Todas as NEs", description: "Posição completa da carteira financeira", icon: Banknote },
  { value: "supplier", title: "Por empresa", description: "Extrato financeiro de um fornecedor", icon: Building2 },
  { value: "status", title: "Por situação", description: "Pagas, liquidadas ou a conferir", icon: ShieldCheck },
  { value: "individual", title: "NE única", description: "Ficha financeira com documentos", icon: Search },
  { value: "selected", title: "Selecionadas", description: "Monte um recorte personalizado", icon: CheckSquare2 },
]

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function CommitmentNoteReportsPanel() {
  const [mode, setMode] = useState<Mode>("all")
  const [supplier, setSupplier] = useState("")
  const [status, setStatus] = useState("")
  const [origin, setOrigin] = useState("")
  const [managementUnit, setManagementUnit] = useState("")
  const [issuedFrom, setIssuedFrom] = useState("")
  const [issuedTo, setIssuedTo] = useState("")
  const [individual, setIndividual] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [selectionSearch, setSelectionSearch] = useState("")

  const indexQuery = useQuery({
    queryKey: ["reports", "commitment-notes", "index"],
    queryFn: () => reportsService.commitmentNotes(),
  })
  const allRows = indexQuery.data?.rows ?? []
  const suppliers = [...new Set(allRows.map((row) => row.supplierName))].sort((a, b) => a.localeCompare(b, "pt-BR"))
  const statuses = [...new Set(allRows.map((row) => row.status))].sort((a, b) => financialStatusLabel(a).localeCompare(financialStatusLabel(b), "pt-BR"))
  const units = [...new Set(allRows.map((row) => row.managementUnit).filter(Boolean))].sort()

  const filters = useMemo<CommitmentNoteReportFilters>(() => ({
    supplier: mode === "supplier" ? supplier || undefined : undefined,
    status: mode === "status" ? status || undefined : undefined,
    codes: mode === "individual" ? (individual ? [individual] : undefined) : mode === "selected" ? selected : undefined,
    origin: origin && origin !== "all" ? origin as CommitmentNoteReportFilters["origin"] : undefined,
    managementUnit: managementUnit && managementUnit !== "all" ? managementUnit : undefined,
    issuedFrom: issuedFrom || undefined,
    issuedTo: issuedTo || undefined,
  }), [individual, issuedFrom, issuedTo, managementUnit, mode, origin, selected, status, supplier])

  const valid = mode === "supplier" ? Boolean(supplier) : mode === "status" ? Boolean(status) : mode === "individual" ? Boolean(individual) : mode === "selected" ? selected.length > 0 : true
  const previewQuery = useQuery({
    queryKey: ["reports", "commitment-notes", "preview", filters],
    queryFn: () => reportsService.commitmentNotes(filters),
    enabled: valid,
    placeholderData: (previous) => previous,
  })
  const pdfPreview = useMutation({
    mutationFn: () => openPdfPreview(() => reportsService.commitmentNotesPdf(filters), "Relatório Financeiro de Notas de Empenho"),
    onError: (error) => toast.error(error.message),
  })
  const pdfDownload = useMutation({
    mutationFn: () => reportsService.commitmentNotesPdf(filters),
    onSuccess: (blob) => { download(blob, `relatorio-notas-empenho-${new Date().toISOString().slice(0, 10)}.pdf`); toast.success("Relatório de NEs gerado com sucesso.") },
    onError: (error) => toast.error(error.message),
  })
  const xlsxDownload = useMutation({
    mutationFn: () => reportsService.commitmentNotesXlsx(filters),
    onSuccess: (blob) => { download(blob, `notas-empenho-sagep-${new Date().toISOString().slice(0, 10)}.xlsx`); toast.success("Planilha financeira gerada com sucesso.") },
    onError: (error) => toast.error(error.message),
  })
  const busy = pdfPreview.isPending || pdfDownload.isPending || xlsxDownload.isPending
  const selectableRows = allRows.filter((row) => `${row.number} ${row.supplierName} ${row.managementUnit}`.toLocaleLowerCase("pt-BR").includes(selectionSearch.toLocaleLowerCase("pt-BR")))

  return <Card className="overflow-hidden border-primary/20 shadow-sm">
    <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div><Badge variant="outline" className="mb-3 border-primary/30 bg-background/70">Execução orçamentária e financeira</Badge><CardTitle className="flex items-center gap-2 text-xl"><Banknote className="size-5 text-primary" />Relatórios de Notas de Empenho</CardTitle><CardDescription className="mt-2 max-w-3xl leading-6">Emita a posição completa, o extrato por empresa ou a ficha auditável de uma NE usando a mesma conciliação da carteira financeira.</CardDescription></div>
        <div className="rounded-xl border bg-background/70 px-4 py-3"><p className="text-xs font-semibold">Snapshot interno do SAGEP</p><p className="text-[11px] text-muted-foreground">Sem nova consulta ao Portal na emissão</p></div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6 p-6">
      <div><p className="text-xs font-semibold tracking-[.14em] text-muted-foreground uppercase">1 · Escolha o relatório</p><div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-5">{modes.map((option) => { const Icon = option.icon; const active = mode === option.value; return <button type="button" key={option.value} onClick={() => setMode(option.value)} className={cn("rounded-xl border p-4 text-left transition hover:border-primary/40", active ? "border-primary bg-primary/8 ring-1 ring-primary/20" : "bg-card")}><Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} /><strong className="mt-3 block text-sm">{option.title}</strong><span className="mt-1 block text-xs leading-4 text-muted-foreground">{option.description}</span></button> })}</div></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-[.14em] text-muted-foreground uppercase">2 · Defina o recorte</p>
          {mode === "supplier" && <div><label className="text-sm font-medium">Empresa</label><Select value={supplier} onValueChange={setSupplier}><SelectTrigger className="mt-2"><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger><SelectContent>{suppliers.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></div>}
          {mode === "status" && <div><label className="text-sm font-medium">Situação financeira</label><Select value={status} onValueChange={setStatus}><SelectTrigger className="mt-2"><SelectValue placeholder="Selecione a situação" /></SelectTrigger><SelectContent>{statuses.map((value) => <SelectItem key={value} value={value}>{financialStatusLabel(value)}</SelectItem>)}</SelectContent></Select></div>}
          {mode === "individual" && <div><label className="text-sm font-medium">Nota de Empenho</label><Select value={individual} onValueChange={setIndividual}><SelectTrigger className="mt-2"><SelectValue placeholder="Selecione uma NE" /></SelectTrigger><SelectContent>{allRows.map((row) => <SelectItem key={row.externalCode} value={row.externalCode}>{row.number} · {row.supplierName}</SelectItem>)}</SelectContent></Select></div>}
          {mode === "selected" && <div className="rounded-xl border p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="font-medium">Selecione até 100 NEs</p><p className="text-xs text-muted-foreground">{selected.length} registro(s) escolhido(s)</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setSelected(selectableRows.slice(0, 100).map((row) => row.externalCode))}>Selecionar filtro</Button><Button size="sm" variant="outline" onClick={() => setSelected([])}>Limpar</Button></div></div><Input className="mt-3" value={selectionSearch} onChange={(event) => setSelectionSearch(event.target.value)} placeholder="Buscar NE, empresa ou UG" /><div className="mt-3 max-h-64 space-y-1 overflow-auto pr-2">{selectableRows.map((row) => <label key={row.externalCode} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm hover:bg-muted/40"><input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={selected.includes(row.externalCode)} onChange={(event) => setSelected((current) => event.target.checked ? current.length < 100 ? [...current, row.externalCode] : current : current.filter((code) => code !== row.externalCode))} /><span><strong>{row.number}</strong> · {row.supplierName}<small className="mt-1 block text-muted-foreground">UG {row.managementUnit} · {financialStatusLabel(row.status)}</small></span></label>)}</div></div>}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div><label className="text-sm font-medium">Origem</label><Select value={origin || "all"} onValueChange={setOrigin}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="PROJECT">Projetos</SelectItem><SelectItem value="IMPORTED">Importadas</SelectItem><SelectItem value="STANDALONE">Avulsas</SelectItem></SelectContent></Select></div><div><label className="text-sm font-medium">UG</label><Select value={managementUnit || "all"} onValueChange={setManagementUnit}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem>{units.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select></div><div><label className="text-sm font-medium" htmlFor="ne-issued-from">Emissão inicial</label><Input id="ne-issued-from" className="mt-2" type="date" value={issuedFrom} onChange={(event) => setIssuedFrom(event.target.value)} /></div><div><label className="text-sm font-medium" htmlFor="ne-issued-to">Emissão final</label><Input id="ne-issued-to" className="mt-2" type="date" value={issuedTo} min={issuedFrom || undefined} onChange={(event) => setIssuedTo(event.target.value)} /></div></div>
        </div>
        <div className="rounded-xl border bg-muted/15 p-5"><p className="text-xs font-semibold tracking-[.14em] text-muted-foreground uppercase">3 · Confira e emita</p>{!valid ? <div className="py-12 text-center"><Search className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Complete a seleção do relatório</p></div> : previewQuery.isLoading ? <div className="mt-5 space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : previewQuery.isError ? <Alert variant="destructive" className="mt-5"><AlertTitle>Falha ao montar a prévia</AlertTitle><AlertDescription>{previewQuery.error.message}</AlertDescription></Alert> : previewQuery.data && <><div className="mt-5 grid grid-cols-2 gap-2">{[["NEs", String(previewQuery.data.summary.total)], ["A conferir", String(previewQuery.data.summary.pending)], ["Empenhado", money(previewQuery.data.summary.committed)], ["Liquidado", money(previewQuery.data.summary.liquidated)], ["Pago", money(previewQuery.data.summary.paid)]].map(([label, value], index) => <div key={label} className={cn("rounded-lg border bg-background p-3", index > 1 && "col-span-2")}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}</div><p className="mt-3 text-xs text-muted-foreground">{previewQuery.data.scopeLabel} · posição de {new Date(previewQuery.data.generatedAt).toLocaleString("pt-BR")}</p></>}
          <div className="mt-5 grid gap-2"><Button variant="outline" disabled={!valid || busy || !previewQuery.data?.summary.total} onClick={() => pdfPreview.mutate()}><Eye className="size-4" />{pdfPreview.isPending ? "Abrindo..." : "Visualizar PDF"}</Button><Button disabled={!valid || busy || !previewQuery.data?.summary.total} onClick={() => pdfDownload.mutate()}><Download className="size-4" />{pdfDownload.isPending ? "Gerando..." : "Baixar PDF"}</Button><Button variant="secondary" disabled={!valid || busy || !previewQuery.data?.summary.total} onClick={() => xlsxDownload.mutate()}><FileSpreadsheet className="size-4" />{xlsxDownload.isPending ? "Gerando..." : "Exportar Excel"}</Button></div>
        </div>
      </div>
      <Alert className="border-primary/20 bg-primary/5"><ShieldCheck /><AlertTitle>Mesma regra da carteira financeira</AlertTitle><AlertDescription>O relatório preserva a deduplicação das NEs, a composição OB + DR/DF, os estornos e as pendências de conferência. A emissão não altera saldos nem atualiza dados externos.</AlertDescription></Alert>
    </CardContent>
  </Card>
}
