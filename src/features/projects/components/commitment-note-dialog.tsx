import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Landmark, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { projectsService } from "@/features/projects/projects.service"

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

export function CommitmentNoteDialog({ projectId, projectCode, open, onOpenChange, onSaved }: CommitmentNoteDialogProps) {
  const [number, setNumber] = useState("")
  const [receivedAt, setReceivedAt] = useState(todayInputValue)
  const validationError = useMemo(
    () => !number.trim() && !receivedAt ? "Informe o número ou a data de recebimento da Nota de Empenho." : null,
    [number, receivedAt],
  )

  const mutation = useMutation({
    mutationFn: () => projectsService.updateFlow(projectId, {
      stage: "AGUARDANDO_NOTA_EMPENHO",
      ...(number.trim() && { commitmentNoteNumber: number.trim() }),
      ...(receivedAt && { commitmentNoteReceivedAt: receivedAt }),
    }),
    onSuccess: () => {
      toast.success(`Nota de Empenho do projeto PRJ-${projectCode} registrada e saldo consumido.`)
      onSaved()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Landmark className="size-5 text-primary" />Registrar Nota de Empenho</DialogTitle>
          <DialogDescription>
            Confirme os dados recebidos para consumir definitivamente o saldo reservado e liberar a Ordem de Serviço do projeto PRJ-{projectCode}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="commitment-note-number">Número da Nota de Empenho</Label>
            <Input id="commitment-note-number" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="Ex.: 2026NE000456" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commitment-note-received-at">Data de recebimento</Label>
            <Input id="commitment-note-received-at" type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} />
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            Esta ação converte a reserva do DIEx em consumo efetivo dos itens da ATA. O projeto avançará para <strong>OS liberada</strong>.
          </div>
          {validationError && <p className="text-sm font-medium text-destructive">{validationError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={Boolean(validationError) || mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Registrar e liberar OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
