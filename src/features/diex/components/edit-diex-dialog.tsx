import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { diexService } from "@/features/diex/diex.service"
import type { DiexRequest } from "@/features/diex/diex.types"

type Props = { diex: DiexRequest; open: boolean; onOpenChange: (open: boolean) => void; onSaved: (diex: DiexRequest) => void }
const dateValue = (value: string | null) => value?.slice(0, 10) ?? ""

export function EditDiexDialog({ diex, open, onOpenChange, onSaved }: Props) {
  const [number, setNumber] = useState(diex.diexNumber ?? "")
  const [issuedAt, setIssuedAt] = useState(dateValue(diex.issuedAt))
  const [supplierCnpj, setSupplierCnpj] = useState(diex.supplierCnpj)
  const [requesterName, setRequesterName] = useState(diex.requesterName)
  const [requesterRank, setRequesterRank] = useState(diex.requesterRank)
  const [requesterCpf, setRequesterCpf] = useState(diex.requesterCpf ?? "")
  const [notes, setNotes] = useState(diex.notes ?? "")
  const invalid = supplierCnpj.trim().length < 14 || requesterName.trim().length < 3 || requesterRank.trim().length < 2
  const mutation = useMutation({
    mutationFn: () => diexService.update(diex.id, {
      diexNumber: number.trim(),
      ...(issuedAt && { issuedAt }),
      supplierCnpj: supplierCnpj.trim(),
      requesterName: requesterName.trim(),
      requesterRank: requesterRank.trim(),
      requesterCpf: requesterCpf.trim(),
      notes: notes.trim(),
    }),
    onSuccess: (updated) => { toast.success("DIEx atualizado."); onSaved(updated); onOpenChange(false) },
    onError: (error) => toast.error(error.message),
  })

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="size-5 text-primary" />Editar DIEx</DialogTitle><DialogDescription>Atualize os dados documentais e do requisitante. Os itens e valores permanecem vinculados à estimativa.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2"><Label htmlFor="edit-diex-number">Número</Label><Input id="edit-diex-number" value={number} onChange={(e) => setNumber(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-diex-date">Emissão</Label><Input id="edit-diex-date" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} /></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="edit-diex-cnpj">CNPJ do fornecedor</Label><Input id="edit-diex-cnpj" value={supplierCnpj} onChange={(e) => setSupplierCnpj(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-diex-requester">Requisitante</Label><Input id="edit-diex-requester" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-diex-rank">Posto/graduação</Label><Input id="edit-diex-rank" value={requesterRank} onChange={(e) => setRequesterRank(e.target.value)} /></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="edit-diex-cpf">CPF</Label><Input id="edit-diex-cpf" value={requesterCpf} onChange={(e) => setRequesterCpf(e.target.value)} /></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="edit-diex-notes">Observações</Label><Textarea id="edit-diex-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
  </div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={() => mutation.mutate()} disabled={invalid || mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Salvar alterações</Button></DialogFooter></DialogContent></Dialog>
}
