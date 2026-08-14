import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { CheckCircle2, ExternalLink, FileSearch, Landmark, Loader2, Search } from "lucide-react"
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

function date(value?: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—"
}

export function LookupCommitmentNoteDialog({ open, onOpenChange }: Props) {
  const [number, setNumber] = useState("")
  const [managementUnit, setManagementUnit] = useState("160016")
  const [management, setManagement] = useState("00001")
  const normalizedNumber = number.toUpperCase().replace(/[^A-Z0-9]/g, "")
  const valid = /^\d{4}NE\d{6}$/.test(normalizedNumber) && /^\d{6}$/.test(managementUnit) && /^\d{5}$/.test(management)

  const mutation = useMutation({
    mutationFn: () => financialExecutionService.lookup({ number: normalizedNumber, managementUnit, management }),
    onError: (error) => toast.error(error.message),
  })
  const result = mutation.data
  const snapshot = result?.snapshot
  const financialProgress = useMemo(() => snapshot?.currentAmount ? Math.min(100, (snapshot.paidAmount / snapshot.currentAmount) * 100) : 0, [snapshot])

  const changeOpen = (nextOpen: boolean) => {
    if (!nextOpen) {
      mutation.reset()
      setNumber("")
    }
    onOpenChange(nextOpen)
  }

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><FileSearch className="size-5 text-primary" />Consultar Nota de Empenho avulsa</DialogTitle>
        <DialogDescription>Consulte uma NE diretamente na fonte oficial sem cadastrá-la, vinculá-la a projeto ou movimentar saldo e workflow.</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_150px_130px]">
          <div className="space-y-2"><Label htmlFor="standalone-ne-number">Número da NE</Label><Input id="standalone-ne-number" value={number} onChange={(event) => { setNumber(event.target.value.toUpperCase()); mutation.reset() }} placeholder="2026NE000534" autoFocus /></div>
          <div className="space-y-2"><Label htmlFor="standalone-ne-ug">UG emitente</Label><Input id="standalone-ne-ug" value={managementUnit} onChange={(event) => { setManagementUnit(event.target.value.replace(/\D/g, "").slice(0, 6)); mutation.reset() }} inputMode="numeric" /></div>
          <div className="space-y-2"><Label htmlFor="standalone-ne-management">Gestão</Label><Input id="standalone-ne-management" value={management} onChange={(event) => { setManagement(event.target.value.replace(/\D/g, "").slice(0, 5)); mutation.reset() }} inputMode="numeric" /></div>
        </div>

        {!result && <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground"><p className="font-medium text-foreground">Consulta somente para conferência</p><p className="mt-1">A operação não salva a NE. Para vinculá-la, informe o documento na etapa correspondente do projeto.</p></div>}

        {snapshot && <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3"><CheckCircle2 className="size-5 text-primary" /><div><p className="font-semibold">NE {snapshot.number} localizada</p><p className="text-xs text-muted-foreground">Consulta realizada em {date(snapshot.fetchedAt)} · código {snapshot.externalCode}</p></div></div>
            <Badge variant={snapshot.financialStatus === "PAGA" ? "default" : "outline"}>{statusLabels[snapshot.financialStatus]}</Badge>
          </div>

          {result.registered && <div className="flex flex-col justify-between gap-3 rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 sm:flex-row sm:items-center"><div><p className="font-semibold">Esta NE já está no SAGEP</p><p className="text-sm text-muted-foreground">Vinculada ao PRJ-{result.registered.project.projectCode} · {result.registered.project.title}</p></div><Button variant="outline" size="sm" asChild><Link to={`/projects/${result.registered.project.id}`} onClick={() => changeOpen(false)}>Abrir projeto<ExternalLink className="size-4" /></Link></Button></div>}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-4 sm:col-span-2"><p className="text-xs text-muted-foreground">Favorecido</p><p className="mt-1 font-semibold">{snapshot.supplierName ?? "Não informado"}</p><p className="text-xs text-muted-foreground">{snapshot.supplierCnpj ?? "CNPJ não informado"}</p></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Emissão</p><p className="mt-1 font-semibold">{date(snapshot.issuedAt)}</p><p className="text-xs text-muted-foreground">UG {snapshot.managementUnit} · Gestão {snapshot.management}</p></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Valor original</p><p className="mt-1 font-semibold">{money(snapshot.originalAmount)}</p><p className="text-xs text-muted-foreground">Atual: {money(snapshot.currentAmount)}</p></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Liquidado</p><p className="mt-1 text-lg font-semibold">{money(snapshot.liquidatedAmount)}</p></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Pago</p><p className="mt-1 text-lg font-semibold">{money(snapshot.paidAmount)}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${financialProgress}%` }} /></div></div>
            <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Anulado</p><p className="mt-1 text-lg font-semibold">{money(snapshot.cancelledAmount)}</p></div>
          </div>

          <div><h3 className="mb-3 flex items-center gap-2 font-semibold"><Landmark className="size-4 text-primary" />Documentos relacionados</h3>{snapshot.documents.length ? <div className="space-y-2">{snapshot.documents.map((document) => <div key={document.externalCode} className="flex flex-col justify-between gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"><div><p className="font-medium">{document.number}</p><p className="text-xs text-muted-foreground">{document.phase.replaceAll("_", " ")} · {document.species ?? "Documento financeiro"}</p></div><div className="sm:text-right"><p className="font-medium">{money(document.amount)}</p><p className="text-xs text-muted-foreground">{date(document.issuedAt)}</p></div></div>)}</div> : <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Nenhum documento relacionado foi localizado.</p>}</div>
        </div>}
      </div>

      <DialogFooter><Button variant="outline" onClick={() => changeOpen(false)}>Fechar</Button><Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>{mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}{result ? "Consultar novamente" : "Consultar NE"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
