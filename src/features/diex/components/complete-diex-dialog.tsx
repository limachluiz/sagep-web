import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { diexService } from "@/features/diex/diex.service"
import type { DiexRequest } from "@/features/diex/diex.types"

type CompleteDiexDialogProps = {
  diex: DiexRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (diex: DiexRequest) => void
}

function dateInputValue(value: string | null) { return value?.slice(0, 10) ?? "" }

export function CompleteDiexDialog({ diex, open, onOpenChange, onSaved }: CompleteDiexDialogProps) {
  const [number, setNumber] = useState(diex.diexNumber ?? "")
  const [issuedAt, setIssuedAt] = useState(() => dateInputValue(diex.issuedAt))
  const mutation = useMutation({
    mutationFn: () => diexService.update(diex.id, { diexNumber: number.trim(), issuedAt }),
    onSuccess: (updated) => { toast.success("Dados da SALC registrados no DIEx."); onSaved(updated); onOpenChange(false) },
    onError: (error) => toast.error(error.message),
  })

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Completar dados do DIEx</DialogTitle><DialogDescription>Informe o número e a data atribuídos pela SALC para liberar o documento oficial e a Nota de Empenho.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="complete-diex-number">Número do DIEx</Label><Input id="complete-diex-number" value={number} onChange={(event) => setNumber(event.target.value)} autoFocus /></div><div className="space-y-2"><Label htmlFor="complete-diex-date">Data de emissão</Label><Input id="complete-diex-date" type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={() => mutation.mutate()} disabled={!number.trim() || !issuedAt || mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Salvar dados</Button></DialogFooter></DialogContent></Dialog>
}
