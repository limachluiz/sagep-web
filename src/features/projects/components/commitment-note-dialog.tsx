import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, FilePenLine, Landmark, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { financialExecutionService } from "@/features/financial-execution/financial-execution.service"
import { systemSettingsService } from "@/features/system-settings/system-settings.service"
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
  const [manualMode, setManualMode] = useState(false)
  const [manualReason, setManualReason] = useState("")
  const [manualConfirmed, setManualConfirmed] = useState(false)
  const [balanceImpactMode, setBalanceImpactMode] = useState<"CONSUME" | "ALREADY_INCLUDED">("CONSUME")
  const [balanceImpactReason, setBalanceImpactReason] = useState("")
  const settingsQuery = useQuery({ queryKey: ["system-settings"], queryFn: systemSettingsService.get, enabled: open })
  const implantationActive = Boolean(settingsQuery.data?.implantationModeActive)
  const normalizedNumber = number.toUpperCase().replace(/[^A-Z0-9]/g, "")
  const validationError = useMemo(() => !/^\d{4}NE\d{6}$/.test(normalizedNumber) ? "Informe a NE no formato 2026NE000534." : null, [normalizedNumber])

  const previewMutation = useMutation({
    mutationFn: () => financialExecutionService.preview({ projectId, number: normalizedNumber }),
    onSuccess: (result) => {
      setPreview(result)
      setManualMode(false)
      setDivergenceConfirmed(false)
      toast.success(result.validation.status === "VALIDADO" ? "NE localizada e validada no Portal da Transparência." : "NE localizada com divergências para conferência.")
    },
    onError: (error) => toast.error(error.message),
  })

  const registerMutation = useMutation({
    mutationFn: (registrationMode: "PORTAL" | "MANUAL") => financialExecutionService.register({
      projectId,
      number: normalizedNumber,
      receivedAt,
      registrationMode,
      manualReason: registrationMode === "MANUAL" ? manualReason.trim() : undefined,
      confirmManualRegistration: registrationMode === "MANUAL" ? manualConfirmed : undefined,
      acceptDivergence: preview?.validation.status === "DIVERGENTE" && divergenceConfirmed,
      balanceImpactMode: implantationActive ? balanceImpactMode : "CONSUME",
      balanceImpactReason: balanceImpactMode === "ALREADY_INCLUDED" ? balanceImpactReason.trim() : undefined,
    }),
    onSuccess: (_result, registrationMode) => {
      toast.success(registrationMode === "MANUAL"
        ? `Nota de Empenho do projeto PRJ-${projectCode} registrada manualmente como não validada.`
        : `Nota de Empenho do projeto PRJ-${projectCode} validada, registrada e vinculada ao rastreamento financeiro.`)
      onSaved()
      onOpenChange(false)
      setPreview(null)
      setFinancialImpactConfirmed(false)
      setManualMode(false)
      setManualReason("")
      setManualConfirmed(false)
      setBalanceImpactMode("CONSUME")
      setBalanceImpactReason("")
    },
    onError: (error) => toast.error(error.message),
  })

  const balanceImpactValid = balanceImpactMode === "CONSUME" || balanceImpactReason.trim().length >= 10
  const canRegister = Boolean(preview && receivedAt && financialImpactConfirmed && balanceImpactValid && (preview.validation.status !== "DIVERGENTE" || divergenceConfirmed))
  const canRegisterManual = !validationError && Boolean(receivedAt) && manualReason.trim().length >= 10 && manualConfirmed && financialImpactConfirmed && balanceImpactValid

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] sm:!max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><Landmark className="size-5 text-primary" />Registrar Nota de Empenho</DialogTitle><DialogDescription>Valide no Portal ou faça um registro manual auditável. O impacto no saldo será definido antes de liberar a OS do projeto PRJ-{projectCode}.</DialogDescription></DialogHeader>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]"><div className="space-y-2"><Label htmlFor="commitment-note-number">Número da Nota de Empenho</Label><Input id="commitment-note-number" value={number} onChange={(event) => { setNumber(event.target.value.toUpperCase()); setPreview(null) }} placeholder="2026NE000534" autoFocus /></div><div className="space-y-2"><Label htmlFor="commitment-note-received-at">Data de recebimento</Label><Input id="commitment-note-received-at" type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} /></div></div>
        {!preview && !manualMode && <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground"><p className="font-medium text-foreground">Escolha a forma de registro</p><p className="mt-1">A consulta oficial é recomendada. Se o Portal estiver indisponível ou o token não estiver configurado, você pode registrar manualmente com justificativa.</p></div>}
        {manualMode && <div className="space-y-4 rounded-xl border border-status-warning/30 bg-status-warning/10 p-4"><div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-status-warning" /><div><p className="font-semibold">Registro sem validação no Portal</p><p className="mt-1 text-sm text-muted-foreground">A NE ficará marcada como não validada e poderá ser conferida posteriormente. O impacto no saldo seguirá a opção selecionada abaixo e a OS será liberada.</p></div></div><div className="space-y-2"><Label htmlFor="commitment-note-manual-reason">Justificativa do registro manual</Label><Textarea id="commitment-note-manual-reason" value={manualReason} onChange={(event) => setManualReason(event.target.value)} placeholder="Ex.: Portal da Transparência indisponível durante o registro" maxLength={500} /></div><label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={manualConfirmed} onChange={(event) => setManualConfirmed(event.target.checked)} /><span>Confirmo que conferi o número e a data da NE e autorizo o registro manual sem validação oficial.</span></label></div>}
        {preview && <div className="space-y-4"><div className={`rounded-xl border p-4 ${preview.validation.status === "DIVERGENTE" ? "border-destructive/30 bg-destructive/5" : "border-primary/25 bg-primary/5"}`}><div className="flex items-center gap-2">{preview.validation.status === "VALIDADO" ? <CheckCircle2 className="size-5 text-primary" /> : <AlertTriangle className="size-5 text-destructive" />}<p className="font-semibold">Documento {preview.validation.status === "VALIDADO" ? "validado" : "com divergências"}</p><Badge variant={preview.validation.status === "VALIDADO" ? "default" : "destructive"}>{preview.validation.status}</Badge></div>{preview.validation.divergences.map((item) => <p key={item} className="mt-2 text-sm text-destructive">{item}</p>)}</div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Favorecido oficial</p><p className="mt-1 text-sm font-medium">{preview.snapshot.supplierName ?? "Não informado"}</p><p className="text-xs text-muted-foreground">{preview.snapshot.supplierCnpj ?? "—"}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Valor atual da NE</p><p className="mt-1 font-semibold">{money(preview.snapshot.currentAmount)}</p><p className="text-xs text-muted-foreground">Projeto: {money(preview.validation.expected.amount)}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Situação financeira</p><p className="mt-1 text-sm font-semibold">{preview.snapshot.financialStatus.replaceAll("_", " ")}</p><p className="text-xs text-muted-foreground">{preview.snapshot.documents.length} documento(s)</p></div></div></div>}
        {preview?.validation.status === "DIVERGENTE" && <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-destructive" checked={divergenceConfirmed} onChange={(event) => setDivergenceConfirmed(event.target.checked)} /><span>Conferi as divergências apresentadas e autorizo o vínculo desta NE ao projeto.</span></label>}
        {implantationActive && <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><div><p className="font-semibold text-amber-700 dark:text-amber-300">Modo de implantação ativo</p><p className="mt-1 text-sm text-muted-foreground">Informe se esta NE pertence ao funcionamento normal ou se já estava contemplada no saldo de abertura.</p></div><label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 text-sm"><input type="radio" name="balance-impact" className="mt-0.5 size-4 accent-primary" checked={balanceImpactMode === "CONSUME"} onChange={() => { setBalanceImpactMode("CONSUME"); setBalanceImpactReason("") }} /><span><strong>Consumir saldo do SAGEP</strong><br /><span className="text-muted-foreground">Use para projetos novos. A reserva do DIEx será convertida em consumo.</span></span></label><label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 text-sm"><input type="radio" name="balance-impact" className="mt-0.5 size-4 accent-amber-600" checked={balanceImpactMode === "ALREADY_INCLUDED"} onChange={() => setBalanceImpactMode("ALREADY_INCLUDED")} /><span><strong>Não consumir novamente</strong><br /><span className="text-muted-foreground">Use para NE histórica já contemplada no saldo de abertura importado.</span></span></label>{balanceImpactMode === "ALREADY_INCLUDED" && <div className="space-y-2"><Label htmlFor="balance-impact-reason">Justificativa obrigatória</Label><Textarea id="balance-impact-reason" value={balanceImpactReason} onChange={(event) => setBalanceImpactReason(event.target.value)} placeholder="Ex.: NE anterior à implantação, já incluída no saldo oficial aplicado em 08/09/2026" maxLength={500} /></div>}</div>}
        {(preview || manualMode) && <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={financialImpactConfirmed} onChange={(event) => setFinancialImpactConfirmed(event.target.checked)} /><span>{balanceImpactMode === "ALREADY_INCLUDED" ? "Confirmo que esta NE já está contemplada no saldo de abertura e autorizo encerrar a reserva sem nova baixa." : "Confirmo os dados e autorizo converter a reserva da ATA em consumo definitivo."} O projeto avançará para <strong>OS liberada</strong>.</span></label>}
        {validationError && !preview && <p className="text-sm font-medium text-destructive">{validationError}</p>}
      </div>
      <DialogFooter className="flex-wrap"><Button variant="outline" onClick={() => onOpenChange(false)} disabled={previewMutation.isPending || registerMutation.isPending}>Cancelar</Button>{!preview && !manualMode && <><Button variant="outline" onClick={() => setManualMode(true)} disabled={Boolean(validationError)}><FilePenLine className="size-4" />Registrar manualmente</Button><Button onClick={() => previewMutation.mutate()} disabled={Boolean(validationError) || previewMutation.isPending}>{previewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}Consultar e validar no Portal</Button></>}{manualMode && <><Button variant="outline" onClick={() => { setManualMode(false); setManualConfirmed(false) }} disabled={registerMutation.isPending}>Voltar</Button><Button onClick={() => registerMutation.mutate("MANUAL")} disabled={!canRegisterManual || registerMutation.isPending}>{registerMutation.isPending && <Loader2 className="size-4 animate-spin" />}Registrar sem validação e liberar OS</Button></>}{preview && <Button onClick={() => registerMutation.mutate("PORTAL")} disabled={!canRegister || registerMutation.isPending}>{registerMutation.isPending && <Loader2 className="size-4 animate-spin" />}Validar, registrar e liberar OS</Button>}</DialogFooter>
    </DialogContent>
  </Dialog>
}
