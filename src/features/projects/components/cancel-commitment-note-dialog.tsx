import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Textarea } from "@/components/ui/textarea"
import { projectsService } from "@/features/projects/projects.service"

const confirmationPhrase = "CANCELAR NE"

export function CancelCommitmentNoteDialog({
  projectId,
  projectCode,
  commitmentNoteNumber,
  hasServiceOrder,
  open,
  onOpenChange,
  onCancelled,
}: {
  projectId: string
  projectCode: number
  commitmentNoteNumber: string | null
  hasServiceOrder: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onCancelled: () => void
}) {
  const [reason, setReason] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const valid = reason.trim().length >= 3 && confirmation.trim().toUpperCase() === confirmationPhrase
  const mutation = useMutation({
    mutationFn: () => projectsService.cancelCommitmentNote(projectId, reason.trim()),
    onSuccess: () => {
      toast.success(`Nota de Empenho do projeto PRJ-${projectCode} cancelada e saldos estornados.`)
      onCancelled()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <RotateCcw className="size-5" />
            Cancelar Nota de Empenho
          </DialogTitle>
          <DialogDescription>
            NE {commitmentNoteNumber ?? "sem número"} · projeto PRJ-{projectCode}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Rollback documental e financeiro</AlertTitle>
          <AlertDescription>
            A estimativa e o DIEx serão cancelados{hasServiceOrder ? ", a OS também será cancelada" : ""}.
            O consumo será estornado para a ATA e o projeto retornará à etapa de estimativa.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-ne-reason">Motivo do cancelamento</Label>
            <Textarea
              id="cancel-ne-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Informe o motivo que ficará registrado na auditoria."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancel-ne-confirmation">
              Digite <strong>{confirmationPhrase}</strong> para confirmar
            </Label>
            <Input
              id="cancel-ne-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Manter Nota de Empenho
          </Button>
          <Button variant="destructive" onClick={() => mutation.mutate()} disabled={!valid || mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmar rollback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
