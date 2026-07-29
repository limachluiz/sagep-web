import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"

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

type DeleteActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityLabel: string
  entityCode: string
  description: string
  pending?: boolean
  onConfirm: () => void
}

export function DeleteActionDialog({
  open,
  onOpenChange,
  entityLabel,
  entityCode,
  description,
  pending = false,
  onConfirm,
}: DeleteActionDialogProps) {
  const [confirmation, setConfirmation] = useState("")

  const confirmed = confirmation.trim() === entityCode
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setConfirmation("")
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            Excluir {entityLabel}?
          </DialogTitle>
          <DialogDescription>
            {description} O registro deixará de aparecer inclusive entre os arquivados, mas a
            auditoria será preservada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-confirmation">
            Digite <span className="font-semibold text-foreground">{entityCode}</span> para confirmar
          </Label>
          <Input
            id="delete-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            disabled={pending}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={!confirmed || pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Confirmar exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
