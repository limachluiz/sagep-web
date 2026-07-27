import { Archive, Loader2, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ArchiveActionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "archive" | "restore"
  entityLabel: string
  entityCode: string
  description: string
  pending?: boolean
  onConfirm: () => void
}

export function ArchiveActionDialog({
  open,
  onOpenChange,
  mode,
  entityLabel,
  entityCode,
  description,
  pending = false,
  onConfirm,
}: ArchiveActionDialogProps) {
  const restoring = mode === "restore"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {restoring ? <RotateCcw className="size-5 text-primary" /> : <Archive className="size-5 text-destructive" />}
            {restoring ? `Restaurar ${entityLabel}?` : `Arquivar ${entityLabel}?`}
          </DialogTitle>
          <DialogDescription>
            {entityCode}: {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Voltar
          </Button>
          <Button variant={restoring ? "default" : "destructive"} onClick={onConfirm} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : restoring ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
            {restoring ? "Confirmar restauração" : "Confirmar arquivamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
