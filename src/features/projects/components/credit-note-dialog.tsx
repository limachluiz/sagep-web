import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { CircleDollarSign, Loader2 } from "lucide-react"
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

type CreditNoteDialogProps = {
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

export function CreditNoteDialog({ projectId, projectCode, open, onOpenChange, onSaved }: CreditNoteDialogProps) {
  const [number, setNumber] = useState("")
  const [receivedAt, setReceivedAt] = useState(todayInputValue)
  const validationError = useMemo(
    () => !number.trim() && !receivedAt ? "Informe o número ou a data de recebimento da Nota de Crédito." : null,
    [number, receivedAt],
  )

  const mutation = useMutation({
    mutationFn: () => projectsService.updateFlow(projectId, {
      stage: "DIEX_REQUISITORIO",
      ...(number.trim() && { creditNoteNumber: number.trim() }),
      ...(receivedAt && { creditNoteReceivedAt: receivedAt }),
    }),
    onSuccess: () => {
      toast.success(`Nota de Crédito do projeto PRJ-${projectCode} registrada.`)
      onSaved()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleDollarSign className="size-5 text-primary" />
            Registrar Nota de Crédito
          </DialogTitle>
          <DialogDescription>
            Informe os dados recebidos para avançar o projeto PRJ-{projectCode} à etapa de DIEx requisitório.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="credit-note-number">Número da Nota de Crédito</Label>
            <Input
              id="credit-note-number"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              placeholder="Ex.: 2026NC000123"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credit-note-received-at">Data de recebimento</Label>
            <Input
              id="credit-note-received-at"
              type="date"
              value={receivedAt}
              onChange={(event) => setReceivedAt(event.target.value)}
            />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            É obrigatório informar ao menos um dos campos. Após o registro, o projeto ficará pronto para a emissão do DIEx.
          </p>
          {validationError && <p className="text-sm font-medium text-destructive">{validationError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={Boolean(validationError) || mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Registrar e avançar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
