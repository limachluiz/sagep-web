import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FileCheck2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { financialExecutionService } from "../financial-execution.service"
import type { CommitmentNote } from "../financial-execution.types"

type Props = { note: CommitmentNote | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }

export function CreateInvoiceDialog({ note, open, onOpenChange, onSaved }: Props) {
  const [number, setNumber] = useState("")
  const [accessKey, setAccessKey] = useState("")
  const [supplierCnpj, setSupplierCnpj] = useState(note?.supplierCnpj ?? "")
  const [issuedAt, setIssuedAt] = useState("")
  const [grossAmount, setGrossAmount] = useState(String(note ? Math.max(0, note.currentAmount - note.paidAmount) || note.currentAmount : ""))
  const [attestedAt, setAttestedAt] = useState("")
  const [documentLink, setDocumentLink] = useState("")
  const [notes, setNotes] = useState("")

  const mutation = useMutation({
    mutationFn: () => financialExecutionService.createInvoice({
      projectId: note!.project.id,
      commitmentNoteId: note!.id,
      number: number.trim(),
      ...(accessKey.trim() && { accessKey: accessKey.replace(/\D/g, "") }),
      supplierCnpj,
      issuedAt,
      grossAmount: Number(grossAmount),
      ...(attestedAt && { attestedAt, attestedAmount: Number(grossAmount) }),
      ...(documentLink.trim() && { documentLink: documentLink.trim() }),
      ...(notes.trim() && { notes: notes.trim() }),
    }),
    onSuccess: (result) => {
      toast.success(result.warnings.length ? `NFe registrada com ${result.warnings.length} alerta(s).` : "NFe registrada e conferida com a NE.")
      onSaved()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const valid = Boolean(note && number.trim() && supplierCnpj.replace(/\D/g, "").length === 14 && issuedAt && Number(grossAmount) > 0 && (!accessKey || accessKey.replace(/\D/g, "").length === 44))

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:!max-w-2xl">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><FileCheck2 className="size-5 text-primary" />Registrar Nota Fiscal</DialogTitle><DialogDescription>Vincule a NFe à NE {note?.number}. O SAGEP confrontará fornecedor, valor, liquidação e pagamento.</DialogDescription></DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Número da NFe</Label><Input value={number} onChange={(event) => setNumber(event.target.value)} autoFocus /></div>
        <div className="space-y-2"><Label>Data de emissão</Label><Input type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} /></div>
        <div className="space-y-2"><Label>CNPJ do fornecedor</Label><Input value={supplierCnpj} onChange={(event) => setSupplierCnpj(event.target.value)} /></div>
        <div className="space-y-2"><Label>Valor bruto</Label><Input inputMode="decimal" value={grossAmount} onChange={(event) => setGrossAmount(event.target.value.replace(",", "."))} /></div>
        <div className="space-y-2 sm:col-span-2"><Label>Chave de acesso (opcional)</Label><Input value={accessKey} onChange={(event) => setAccessKey(event.target.value)} maxLength={44} placeholder="44 dígitos" /></div>
        <div className="space-y-2"><Label>Data do atesto (opcional)</Label><Input type="date" value={attestedAt} onChange={(event) => setAttestedAt(event.target.value)} /></div>
        <div className="space-y-2"><Label>Link do documento (opcional)</Label><Input value={documentLink} onChange={(event) => setDocumentLink(event.target.value)} placeholder="https://..." /></div>
        <div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Registrar NFe</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
