import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Landmark, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { financialExecutionService } from "@/features/financial-execution/financial-execution.service"
import type { CommitmentPreview } from "@/features/financial-execution/financial-execution.types"

type CommitmentNoteDialogProps = {
  projectId: string
  projectCode: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

function todayInputValue() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function CommitmentNoteDialog({ projectId, projectCode, open, onOpenChange, onSaved }: CommitmentNoteDialogProps) {
  const [number, setNumber] = useState("")
  const [receivedAt, setReceivedAt] = useState(todayInputValue)
  const [preview, setPreview] = useState<CommitmentPreview | null>(null)
  const [financialImpactConfirmed, setFinancialImpactConfirmed] = useState(false)
  const [divergenceConfirmed, setDivergenceConfirmed] = useState(false)
  const normalizedNumber = number.toUpperCase().replace(/[^A-Z0-9]/g, "")
  const validationError = useMemo(() => !/^\d{4}NE\d{6}$/.test(normalizedNumber) ? "Informe a NE no formato 2026NE000534." : null, [normalizedNumber])

  const previewMutation = useMutation({
    mutationFn: () => financialExecutionService.preview({ projectId, number: normalizedNumber }),
    onSuccess: (result) => {
      setPreview(result)
      setDivergenceConfirmed(false)
      toast.success(result.validation.status === "VALIDADO" ? "NE localizada e validada no Portal da Transparência." : "NE localizada com divergências para conferência.")
    },
    onError: (error) => toast.error(error.message),
  })

  const registerMutation = useMutation({
    mutationFn: () => financialExecutionService.register({
      projectId,
      number: normalizedNumber,
      receivedAt,
      acceptDivergence: preview?.validation.status === "DIVERGENTE" && divergenceConfirmed,
    }),
    onSuccess: () => {
      toast.success(`Nota de Empenho do projeto PRJ-${projectCode} validada, registrada e vinculada ao rastreamento financeiro.`)
      onSaved()
      onOpenChange(false)
      setPreview(null)
      setFinancialImpactConfirmed(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const canRegister = Boolean(preview && receivedAt && financialImpactConfirmed && (preview.validation.status !== "DIVERGENTE" || divergenceConfirmed))

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><Landmark className="size-5 text-primary" />Validar e registrar Nota de Empenho</DialogTitle><DialogDescription>O SAGEP consultará o documento oficial, comparará fornecedor e valor e só então consumirá o saldo reservado e liberará a OS do projeto PRJ-{projectCode}.</DialogDescription></DialogHeader>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]"><div className="space-y-2"><Label htmlFor="commitment-note-number">Número da Nota de Empenho</Label><Input id="commitment-note-number" value={number} onChange={(event) => { setNumber(event.target.value.toUpperCase()); setPreview(null) }} placeholder="2026NE000534" autoFocus /></div><div className="space-y-2"><Label htmlFor="commitment-note-received-at">Data de recebimento</Label><Input id="commitment-note-received-at" type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} /></div></div>
        {!preview && <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground"><p className="font-medium text-foreground">Consulta oficial obrigatória</p><p className="mt-1">Será usado o código da UG 160016, Gestão 00001 e o número informado. O token permanece protegido no backend.</p></div>}
        {preview && <div className="space-y-4"><div className={`rounded-xl border p-4 ${preview.validation.status === "DIVERGENTE" ? "border-destructive/30 bg-destructive/5" : "border-primary/25 bg-primary/5"}`}><div className="flex items-center gap-2">{preview.validation.status === "VALIDADO" ? <CheckCircle2 className="size-5 text-primary" /> : <AlertTriangle className="size-5 text-destructive" />}<p className="font-semibold">Documento {preview.validation.status === "VALIDADO" ? "validado" : "com divergências"}</p><Badge variant={preview.validation.status === "VALIDADO" ? "default" : "destructive"}>{preview.validation.status}</Badge></div>{preview.validation.divergences.map((item) => <p key={item} className="mt-2 text-sm text-destructive">{item}</p>)}</div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Favorecido oficial</p><p className="mt-1 text-sm font-medium">{preview.snapshot.supplierName ?? "Não informado"}</p><p className="text-xs text-muted-foreground">{preview.snapshot.supplierCnpj ?? "—"}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Valor atual da NE</p><p className="mt-1 font-semibold">{money(preview.snapshot.currentAmount)}</p><p className="text-xs text-muted-foreground">Projeto: {money(preview.validation.expected.amount)}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Situação financeira</p><p className="mt-1 text-sm font-semibold">{preview.snapshot.financialStatus.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{preview.snapshot.documents.length} documento(s)</p></div></div></div>}
        {preview?.validation.status === "DIVERGENTE" && <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-destructive" checked={divergenceConfirmed} onChange={(event) => setDivergenceConfirmed(event.target.checked)} /><span>Conferi as divergências apresentadas e autorizo o vínculo desta NE ao projeto.</span></label>}
        {preview && <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={financialImpactConfirmed} onChange={(event) => setFinancialImpactConfirmed(event.target.checked)} /><span>Confirmo os dados oficiais e autorizo o consumo definitivo da reserva da ATA. O projeto avançará para <strong>OS liberada</strong>.</span></label>}
        {validationError && !preview && <p className="text-sm font-medium text-destructive">{validationError}</p>}
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={previewMutation.isPending || registerMutation.isPending}>Cancelar</Button>{!preview ? <Button onClick={() => previewMutation.mutate()} disabled={Boolean(validationError) || previewMutation.isPending}>{previewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}Consultar no Portal</Button> : <Button onClick={() => registerMutation.mutate()} disabled={!canRegister || registerMutation.isPending}>{registerMutation.isPending && <Loader2 className="size-4 animate-spin" />}Validar, registrar e liberar OS</Button>}</DialogFooter>
    </DialogContent>
  </Dialog>
}
