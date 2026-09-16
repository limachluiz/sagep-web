import { api, ApiError } from "@/lib/api"
import { useAuthStore } from "@/features/auth/auth.store"
import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2, ExternalLink, FileSearch, Landmark, Loader2, Search } from "lucide-react"
import { Link } from "react-router"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { financialExecutionService } from "../financial-execution.service"
import type { CommitmentFinancialStatus } from "../financial-execution.types"

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const statusLabels: Record<CommitmentFinancialStatus, string> = {
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

function documentDate(value?: string | null) {
  if (!value) return "—"
  const parsed = new Date(value)
  const dateOnly = /T00:00:00(?:\.000)?Z$/.test(value)
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", ...(dateOnly ? { timeZone: "UTC" } : {}) }).format(parsed)
}

const phaseLabels = { EMPENHO: "Empenho", LIQUIDACAO: "Liquidação", PAGAMENTO: "Pagamento", ANULACAO: "Anulação", OUTRO: "Outro" } as const
const phasePaths = { EMPENHO: "empenho", LIQUIDACAO: "liquidacao", PAGAMENTO: "pagamento", ANULACAO: "empenho", OUTRO: "empenho" } as const

export function LookupCommitmentNoteDialog({ open, onOpenChange }: Props) {
  const client = useQueryClient()
  const canManage = useAuthStore(s => s.hasPermission("financial_execution.manage"))
  const [duplicate, setDuplicate] = useState<{ code: string; origin: string } | null>(null)
  const save = useMutation({ mutationFn: (input: { code: string; replaceOrigin?: string }) => api.post(`/financial-execution/discovery/archive/${input.code}`, { origin: "STANDALONE", replaceOrigin: input.replaceOrigin }), onSuccess: () => { setDuplicate(null); client.invalidateQueries({ queryKey: ["ne-archive"] }); client.invalidateQueries({ queryKey: ["financial-execution"] }); toast.success("NE avulsa salva na carteira sem consumir saldo de ATA.") }, onError: error => {
    const details = error instanceof ApiError ? error.details as { details?: { existingOrigin?: string; externalCode?: string } } : undefined
    if (details?.details?.existingOrigin && details.details.externalCode) setDuplicate({ code: details.details.externalCode, origin: details.details.existingOrigin })
    else toast.error(error.message)
  } })
  const [number, setNumber] = useState("")
  const [managementUnit, setManagementUnit] = useState("")
  const [management, setManagement] = useState("")
  const normalizedNumber = number.toUpperCase().replace(/[^A-Z0-9]/g, "")
  const valid = /^\d{4}NE\d{6}$/.test(normalizedNumber) && (!managementUnit || /^\d{6}$/.test(managementUnit)) && (!management || /^\d{5}$/.test(management))

  const mutation = useMutation({
    mutationFn: () => financialExecutionService.lookup({ number: normalizedNumber, managementUnit: managementUnit || undefined, management: management || undefined }),
    onError: (error) => toast.error(error.message),
  })
  const result = mutation.data
  const snapshot = result?.snapshot
  const financialProgress = useMemo(() => snapshot?.financialStatus === "PAGA" ? 100 : snapshot?.currentAmount ? Math.min(100, (snapshot.paidAmount / snapshot.currentAmount) * 100) : 0, [snapshot])

  const changeOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDuplicate(null)
      mutation.reset()
      setNumber("")
    }
    onOpenChange(nextOpen)
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogContent className="max-h-[92vh] sm:!max-w-5xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><FileSearch className="size-5 text-primary" />Consultar Nota de Empenho avulsa</DialogTitle>
        <DialogDescription>Consulte uma NE na fonte oficial e, se desejar, salve como avulsa na carteira, sem consumir saldo de ATA.</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[minmax(260px,1fr)_180px_160px]">
          <div className="space-y-2"><Label htmlFor="standalone-ne-number">Número da NE</Label><Input id="standalone-ne-number" value={number} onChange={(event) => { setNumber(event.target.value.toUpperCase()); mutation.reset(); setDuplicate(null) }} placeholder="2026NE000534" autoFocus /></div>
          <div className="space-y-2"><Label htmlFor="standalone-ne-ug">UG emitente</Label><Input id="standalone-ne-ug" value={managementUnit} onChange={(event) => { setManagementUnit(event.target.value.replace(/\D/g, "").slice(0, 6)); mutation.reset(); setDuplicate(null) }} inputMode="numeric" placeholder="Padrão da OM" /></div>
          <div className="space-y-2"><Label htmlFor="standalone-ne-management">Gestão</Label><Input id="standalone-ne-management" value={management} onChange={(event) => { setManagement(event.target.value.replace(/\D/g, "").slice(0, 5)); mutation.reset(); setDuplicate(null) }} inputMode="numeric" placeholder="Padrão da OM" /></div>
        </div>

        {!result && <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground"><p className="font-medium text-foreground">Consulta somente para conferência</p><p className="mt-1">A consulta não grava dados automaticamente. Após consultar, use Salvar avulsa para incluir na carteira. O vínculo a projeto permanece na etapa correspondente.</p></div>}

        {mutation.isError && <div role="alert" className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0" /><div><p className="font-semibold">Não foi possível localizar a Nota de Empenho</p><p className="mt-1">{mutation.error.message}</p></div></div>}

        {snapshot && canManage && <Button disabled={save.isPending} onClick={() => save.mutate({ code: snapshot.externalCode })}>{save.isPending ? "Salvando…" : "Salvar / atualizar avulsa na carteira"}</Button>}
        {result?.archived && <p className="rounded border p-3 text-sm">Esta NE já consta na base como {result.archived.origin === "IMPORTED" ? "importada" : "avulsa"}. O código será contabilizado uma única vez na carteira.</p>}
        {duplicate && <div role="alert" className="space-y-3 rounded border border-amber-400 p-4"><p>Duplicidade: já existe uma NE importada com o mesmo código. Escolha a cópia que deseja manter.</p><Button variant="outline" onClick={() => setDuplicate(null)}>Manter importada e descartar nova avulsa</Button><Button disabled={save.isPending} onClick={() => save.mutate({ code: duplicate.code, replaceOrigin: duplicate.origin })}>Excluir cópia importada e manter avulsa</Button></div>}
        {snapshot && <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3"><CheckCircle2 className="size-5 shrink-0 text-primary" /><div className="min-w-0"><p className="font-semibold">NE {snapshot.number} localizada</p><p className="break-all text-xs text-muted-foreground">Consulta realizada em {dateTime(snapshot.fetchedAt)} · código {snapshot.externalCode}</p></div></div>
            <Badge variant={snapshot.financialStatus === "PAGA" ? "default" : "outline"}>{statusLabels[snapshot.financialStatus]}</Badge>
          </div>

          {result.registered && <div className="flex flex-col justify-between gap-3 rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 sm:flex-row sm:items-center"><div><p className="font-semibold">Esta NE já está no SAGEP</p><p className="text-sm text-muted-foreground">Vinculada ao PRJ-{result.registered.project.projectCode} · {result.registered.project.title}</p></div><Button variant="outline" size="sm" asChild><Link to={`/projects/${result.registered.project.id}`} onClick={() => changeOpen(false)}>Abrir projeto<ExternalLink className="size-4" /></Link></Button></div>}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-4 sm:col-span-2"><p className="text-xs text-muted-foreground">Favorecido</p><p className="mt-1 font-semibold">{snapshot.supplierName ?? "Não informado"}</p><p className="text-xs text-muted-foreground">{snapshot.supplierCnpj ?? "CNPJ não informado"}</p></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Emissão</p><p className="mt-1 font-semibold">{documentDate(snapshot.issuedAt)}</p><p className="text-xs text-muted-foreground">UG {snapshot.managementUnit} · Gestão {snapshot.management}</p></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Valor original</p><p className="mt-1 font-semibold">{money(snapshot.originalAmount)}</p><p className="text-xs text-muted-foreground">Atual: {money(snapshot.currentAmount)}</p></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Liquidado</p><p className="mt-1 text-lg font-semibold">{money(snapshot.liquidatedAmount)}</p></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Pago</p><p className="mt-1 text-lg font-semibold">{money(snapshot.paidAmount)}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${financialProgress}%` }} /></div></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Anulado</p><p className="mt-1 text-lg font-semibold">{money(snapshot.cancelledAmount)}</p></div>
          </div>

          <div><h3 className="mb-3 flex items-center gap-2 font-semibold"><Landmark className="size-4 text-primary" />Linha financeira oficial</h3>{snapshot.documents.length ? <div className="space-y-2">{snapshot.documents.map((document) => <div key={document.externalCode} className="flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{document.number}</p><Badge variant="outline">{phaseLabels[document.phase]}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{document.species ?? "Documento financeiro oficial"}</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><div className="sm:text-right"><p className="font-medium">{document.amount > 0 ? money(document.amount) : "Valor não informado"}</p><p className="text-xs text-muted-foreground">{documentDate(document.issuedAt)}</p></div>{/^\d{6}\d{5}\d{4}(?:NE|NS|OB)\d{6}$/i.test(document.externalCode) && <Button variant="ghost" size="icon-sm" asChild><a href={`https://portaldatransparencia.gov.br/despesas/${phasePaths[document.phase]}/${document.externalCode}`} target="_blank" rel="noreferrer" aria-label={`Abrir ${document.number} no Portal da Transparência`}><ExternalLink className="size-4" /></a></Button>}</div></div>)}</div> : <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Nenhum documento relacionado foi localizado.</p>}</div>
        </div>}
      </div>

      <DialogFooter><Button variant="outline" onClick={() => changeOpen(false)}>Fechar</Button><Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>{mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}{result ? "Consultar novamente" : "Consultar NE"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
