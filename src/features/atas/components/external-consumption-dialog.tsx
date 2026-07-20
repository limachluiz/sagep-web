import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { ArrowDownToLine, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { atasService } from "@/features/atas/atas.service"
import type { AtaItem } from "@/features/atas/atas.types"

type Props = { item: AtaItem; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }
export function ExternalConsumptionDialog({ item, open, onOpenChange, onSaved }: Props) {
  const [quantity, setQuantity] = useState(""); const [reason, setReason] = useState(""); const [reference, setReference] = useState(""); const [commitmentNumber, setCommitmentNumber] = useState(""); const [notes, setNotes] = useState("")
  const numericQuantity = Number(quantity.replace(",", ".")); const valid = numericQuantity > 0 && numericQuantity <= Number(item.balance.availableQuantity) && reason.trim().length >= 3 && reference.trim().length > 0
  const mutation = useMutation({ mutationFn: () => atasService.registerExternalConsumption(item.id, { quantity: numericQuantity, reason: reason.trim(), source: "COMPRAS_GOV", externalStatus: "CONSUMO_OFICIAL_CONFIRMADO", externalReference: reference.trim(), ...(commitmentNumber.trim() && { commitmentNumber: commitmentNumber.trim() }), ...(item.ata.externalUasg && { unit: item.ata.externalUasg }), ...(notes.trim() && { notes: notes.trim() }) }), onSuccess: (result) => { toast.success(result.message); onSaved(); onOpenChange(false) }, onError: (error) => toast.error(error.message) })
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowDownToLine className="size-5 text-primary" />Registrar consumo externo</DialogTitle><DialogDescription>Use somente após conferir um consumo oficial que não passou pelo fluxo local. Saldo disponível: {Number(item.balance.availableQuantity).toLocaleString("pt-BR")} {item.unit}.</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Quantidade consumida</Label><Input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} autoFocus /></div><div className="space-y-2"><Label>Referência externa</Label><Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Ex.: snapshot, contrato ou documento" /></div></div><div className="space-y-2"><Label>Justificativa</Label><Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} /></div><div className="space-y-2"><Label>Nota de Empenho (opcional)</Label><Input value={commitmentNumber} onChange={(event) => setCommitmentNumber(event.target.value)} /></div><div className="space-y-2"><Label>Observações (opcional)</Label><Input value={notes} onChange={(event) => setNotes(event.target.value)} /></div>{numericQuantity > Number(item.balance.availableQuantity) && <p className="text-sm font-medium text-destructive">A quantidade excede o saldo disponível.</p>}</div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Registrar consumo</Button></DialogFooter></DialogContent></Dialog>
}
