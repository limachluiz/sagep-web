import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Banknote, CheckCircle2, CircleDollarSign, FileCheck2, Landmark, Loader2, RefreshCw, Search } from "lucide-react"
import { Link, useSearchParams } from "react-router"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/features/auth/auth.store"
import { CreateInvoiceDialog } from "../components/create-invoice-dialog"
import { LookupCommitmentNoteDialog } from "../components/lookup-commitment-note-dialog"
import { financialExecutionService } from "../financial-execution.service"
import type { CommitmentFinancialStatus, CommitmentNote } from "../financial-execution.types"

const financialLabels: Record<CommitmentFinancialStatus, string> = {
  NAO_LIQUIDADA: "Não liquidada",
  PARCIALMENTE_LIQUIDADA: "Parcialmente liquidada",
  LIQUIDADA: "Liquidada",
  PARCIALMENTE_PAGA: "Parcialmente paga",
  PAGA: "Paga",
  PARCIALMENTE_ANULADA: "Parcialmente anulada",
  ANULADA: "Anulada",
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function dateTime(value?: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—"
}

function synchronizationFreshness(value?: string | null) {
  if (!value) return { label: "Nunca consultada", stale: true }
  const elapsedHours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000))
  if (elapsedHours < 1) return { label: "Atualizada há menos de 1h", stale: false }
  if (elapsedHours < 24) return { label: `Atualizada há ${elapsedHours}h`, stale: false }
  const elapsedDays = Math.floor(elapsedHours / 24)
  return { label: `Atualizada há ${elapsedDays} dia(s)`, stale: elapsedHours >= 26 }
}

function statusBadge(note: CommitmentNote) {
  if (note.syncStatus === "ERRO") return <Badge variant="destructive">Erro de consulta</Badge>
  if (note.syncStatus === "DIVERGENTE") return <Badge variant="destructive">Divergência</Badge>
  if (note.syncStatus === "NAO_VALIDADO") return <Badge variant="outline">Não validada</Badge>
  return <Badge variant={note.financialStatus === "PAGA" ? "default" : "outline"}>{financialLabels[note.financialStatus]}</Badge>
}

export function FinancialExecutionPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [selected, setSelected] = useState<CommitmentNote | null>(null)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [lookupOpen, setLookupOpen] = useState(false)
  const canSync = useAuthStore((state) => state.hasPermission("financial_execution.sync"))
  const canManage = useAuthStore((state) => state.hasPermission("financial_execution.manage"))

  const query = useQuery({
    queryKey: ["financial-execution", search, status],
    queryFn: () => financialExecutionService.list({ search: search || undefined, financialStatus: status || undefined }),
  })
  const noteFromUrl = searchParams.get("note")
  const selectedNoteId = selected?.id ?? noteFromUrl
  const detailQuery = useQuery({
    queryKey: ["financial-execution", "note", selectedNoteId],
    queryFn: () => financialExecutionService.details(selectedNoteId!),
    enabled: Boolean(selectedNoteId),
  })
  const activeNote = detailQuery.data ?? selected ?? null

  const syncAll = useMutation({
    mutationFn: financialExecutionService.syncAll,
    onSuccess: (result) => {
      toast.success(`${result.synchronized} NE(s) sincronizada(s)${result.failed ? `; ${result.failed} falha(s)` : ""}.`)
      queryClient.invalidateQueries({ queryKey: ["financial-execution"] })
      queryClient.invalidateQueries({ queryKey: ["header", "operational-alerts"] })
    },
    onError: (error) => toast.error(error.message),
  })

  const syncOne = useMutation({
    mutationFn: financialExecutionService.sync,
    onSuccess: async (note) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financial-execution"] }),
        queryClient.invalidateQueries({ queryKey: ["header", "operational-alerts"] }),
      ])
      toast.success(`NE ${note.number} atualizada. Situação: ${financialLabels[note.financialStatus]}.`)
    },
    onError: (error) => toast.error(error.message),
  })

  const totals = query.data?.summary.totals
  const cards = useMemo(() => [
    { label: "Empenhado atual", value: money(totals?.committed ?? 0), icon: Landmark, helper: `${query.data?.summary.total ?? 0} NE(s) ativa(s)` },
    { label: "Liquidado", value: money(totals?.liquidated ?? 0), icon: FileCheck2, helper: `${money(totals?.toLiquidate ?? 0)} a liquidar` },
    { label: "Pago", value: money(totals?.paid ?? 0), icon: CheckCircle2, helper: `${money(totals?.toPay ?? 0)} liquidado a pagar` },
    { label: "Pendências", value: String((query.data?.summary.bySyncStatus.DIVERGENTE ?? 0) + (query.data?.summary.bySyncStatus.NAO_VALIDADO ?? 0) + (query.data?.summary.bySyncStatus.ERRO ?? 0)), icon: AlertTriangle, helper: "Não validadas, divergências ou falhas" },
  ], [query.data, totals])

  const closeDetails = () => {
    setSelected(null)
    if (noteFromUrl) setSearchParams({}, { replace: true })
  }

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-2xl bg-sidebar p-6 text-sidebar-foreground shadow-lg">
      <div className="absolute -right-16 -top-24 size-72 rounded-full bg-sidebar-primary/15 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[.22em] text-sidebar-primary">Execução orçamentária e financeira</p><h1 className="mt-2 text-3xl font-semibold">Rastreamento de Notas de Empenho</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-sidebar-foreground/70">Validação oficial, liquidação, pagamento e conferência de NFe conectados ao andamento real de cada projeto. A carteira é atualizada ao iniciar o SAGEP e, depois, a cada 24 horas.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" className="border-sidebar-foreground/20 bg-sidebar-foreground/5 text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground" onClick={() => setLookupOpen(true)}><Search className="size-4" />Consultar NE avulsa</Button>{canSync && <Button className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" onClick={() => syncAll.mutate()} disabled={syncAll.isPending}>{syncAll.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Sincronizar carteira</Button>}</div>
      </div>
    </section>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, helper }) => <Card key={label}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle><Icon className="size-4 text-primary" /></CardHeader><CardContent><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p></CardContent></Card>)}</div>

    <Card>
      <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>Carteira de empenhos</CardTitle><p className="mt-1 text-sm text-muted-foreground">A etapa do projeto é exibida ao lado da situação financeira, sem movimentação automática do workflow.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9 sm:w-72" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="NE, fornecedor, CNPJ ou projeto" /></div><select className="h-9 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todas as situações</option>{Object.entries(financialLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></CardHeader>
      <CardContent className="p-0">
        {query.isLoading && <div className="p-10 text-center text-sm text-muted-foreground">Carregando execução financeira...</div>}
        {query.isError && <div className="m-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{query.error.message}</div>}
        {!query.isLoading && !query.isError && !query.data?.items.length && <div className="p-12 text-center"><Banknote className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-medium">Nenhuma NE rastreada</p><p className="mt-1 text-sm text-muted-foreground">As NEs validadas na etapa do projeto aparecerão aqui.</p></div>}
        {query.data?.items.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>NE / Projeto</TableHead><TableHead>Fornecedor</TableHead><TableHead className="text-right">Empenhado</TableHead><TableHead className="text-right">Liquidado</TableHead><TableHead className="text-right">Pago</TableHead><TableHead>Situação</TableHead><TableHead>Última consulta</TableHead></TableRow></TableHeader><TableBody>{query.data.items.map((note) => {
          const paidPercent = note.currentAmount > 0 ? Math.min(100, (note.paidAmount / note.currentAmount) * 100) : 0
          return <TableRow key={note.id} className="cursor-pointer" onClick={() => setSelected(note)}><TableCell><p className="font-semibold">{note.number}</p><Link to={`/projects/${note.project.id}`} className="text-xs text-primary hover:underline" onClick={(event) => event.stopPropagation()}>PRJ-{note.project.projectCode} · {note.project.title}</Link><p className="mt-1 text-[11px] uppercase text-muted-foreground">{note.project.stage.replaceAll("_", " ")}{note.project.om ? ` · ${note.project.om.sigla}/${note.project.om.stateUf}` : ""}</p></TableCell><TableCell><p className="max-w-56 truncate">{note.supplierName ?? "Não informado"}</p><p className="text-xs text-muted-foreground">{note.supplierCnpj ?? "—"}</p></TableCell><TableCell className="text-right font-medium">{money(note.currentAmount)}</TableCell><TableCell className="text-right">{money(note.liquidatedAmount)}</TableCell><TableCell className="min-w-32 text-right"><p>{money(note.paidAmount)}</p><Progress value={paidPercent} className="mt-2 h-1.5" /></TableCell><TableCell>{statusBadge(note)}</TableCell><TableCell className="text-xs text-muted-foreground">{dateTime(note.lastSyncAt)}</TableCell></TableRow>
        })}</TableBody></Table></div> : null}
      </CardContent>
    </Card>

    <Dialog open={Boolean(activeNote)} onOpenChange={(open) => !open && closeDetails()}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><div className="flex flex-col justify-between gap-3 pr-7 sm:flex-row sm:items-start"><div><DialogTitle className="flex items-center gap-2"><CircleDollarSign className="size-5 text-primary" />NE {activeNote?.number}</DialogTitle><DialogDescription>{activeNote ? `Projeto PRJ-${activeNote.project.projectCode} · consulta oficial em ${dateTime(activeNote.lastSyncAt)}` : "Carregando..."}</DialogDescription></div>{activeNote && canSync && <Button variant="outline" size="sm" onClick={() => syncOne.mutate(activeNote.id)} disabled={syncOne.isPending}>{syncOne.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Verificar agora</Button>}</div></DialogHeader>{activeNote && <div className="space-y-5"><div className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm ${synchronizationFreshness(activeNote.lastSyncAt).stale ? "border-status-warning/30 bg-status-warning/10" : "border-primary/20 bg-primary/5"}`}><span>{synchronizationFreshness(activeNote.lastSyncAt).label}</span><Badge variant={synchronizationFreshness(activeNote.lastSyncAt).stale ? "outline" : "default"}>{activeNote.syncStatus === "VALIDADO" ? "Dados oficiais" : activeNote.syncStatus}</Badge></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Empenhado atual</p><p className="mt-1 text-lg font-semibold">{money(activeNote.currentAmount)}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Liquidado</p><p className="mt-1 text-lg font-semibold">{money(activeNote.liquidatedAmount)}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Pago</p><p className="mt-1 text-lg font-semibold">{money(activeNote.paidAmount)}</p></div></div>{activeNote.divergenceReason && <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive"><strong>Divergência:</strong> {activeNote.divergenceReason}</div>}<div><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Documentos relacionados</h3>{canManage && <Button size="sm" onClick={() => setInvoiceOpen(true)}><FileCheck2 className="size-4" />Registrar NFe</Button>}</div>{activeNote.documents?.length ? <div className="space-y-2">{activeNote.documents.map((document) => <div key={document.externalCode} className="flex flex-col justify-between gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"><div><p className="font-medium">{document.number}</p><p className="text-xs text-muted-foreground">{document.phase} · {document.species ?? "Documento financeiro"}</p></div><div className="text-right"><p className="font-medium">{money(document.amount)}</p><p className="text-xs text-muted-foreground">{document.issuedAt ? dateTime(document.issuedAt) : "Data não informada"}</p></div></div>)}</div> : <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Nenhum documento de liquidação ou pagamento foi localizado na última consulta.</p>}</div></div>}</DialogContent></Dialog>
    <CreateInvoiceDialog key={`${activeNote?.id ?? "none"}-${invoiceOpen}`} note={activeNote} open={invoiceOpen} onOpenChange={setInvoiceOpen} onSaved={() => { queryClient.invalidateQueries({ queryKey: ["financial-execution"] }); setSelected(null) }} />
    <LookupCommitmentNoteDialog open={lookupOpen} onOpenChange={setLookupOpen} />
  </div>
}
