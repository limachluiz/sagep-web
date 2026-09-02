import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type ConfirmationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive" | "warning"
  pending?: boolean
  onConfirm: () => void
}

export function ConfirmationDialog({ open, onOpenChange, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar", variant = "default", pending = false, onConfirm }: ConfirmationDialogProps) {
  const Icon = variant === "destructive" || variant === "warning" ? AlertTriangle : CheckCircle2
  const destructive = variant === "destructive"
  return <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
    <DialogContent>
      <DialogHeader>
        <div className={`mb-2 flex size-11 items-center justify-center rounded-xl ${destructive ? "bg-destructive/10 text-destructive" : variant === "warning" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary"}`}><Icon className="size-5" /></div>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="leading-6">{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>{cancelLabel}</Button>
        <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={pending}>{pending && <Loader2 className="animate-spin" />}{confirmLabel}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
