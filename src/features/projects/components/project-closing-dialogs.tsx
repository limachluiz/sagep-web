import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { CheckCircle2, FileSearch, Loader2, RotateCcw } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { projectsService } from "@/features/projects/projects.service"
import type { ProjectFlowPayload } from "@/features/projects/projects.types"

function todayInputValue() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

type DateFlowDialogProps = {
  projectId: string
  projectCode: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  title: string
  description: string
  fieldLabel: string
  successMessage: string
  submitLabel: string
  payload: (date: string) => ProjectFlowPayload
}

export function DateFlowDialog({
  projectId,
  projectCode,
  open,
  onOpenChange,
  onSaved,
  title,
  description,
  fieldLabel,
  successMessage,
  submitLabel,
  payload,
}: DateFlowDialogProps) {
  const [date, setDate] = useState(todayInputValue)
  const mutation = useMutation({
    mutationFn: () => projectsService.updateFlow(projectId, payload(date)),
    onSuccess: () => {
      toast.success(`${successMessage} no projeto PRJ-${projectCode}.`)
      onSaved()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="size-5 text-primary" />{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="workflow-date">{fieldLabel}</Label>
          <Input id="workflow-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} autoFocus />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={!date || mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}{submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ReviewAsBuiltDialogProps = {
  projectId: string
  projectCode: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function ReviewAsBuiltDialog({ projectId, projectCode, open, onOpenChange, onSaved }: ReviewAsBuiltDialogProps) {
  const [approved, setApproved] = useState(true)
  const [reviewedAt, setReviewedAt] = useState(todayInputValue)
  const [asBuiltLink, setAsBuiltLink] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const validationError = useMemo(() => {
    if (!reviewedAt) return "Informe a data da análise."
    if (!approved) return rejectionReason.trim().length >= 3 ? null : "Informe o motivo da reprovação."
    try {
      new URL(asBuiltLink.trim())
      return null
    } catch {
      return "Informe um link válido para o As-Built."
    }
  }, [approved, asBuiltLink, rejectionReason, reviewedAt])

  const mutation = useMutation({
    mutationFn: () => approved
      ? projectsService.reviewAsBuilt(projectId, { approved: true, reviewedAt, asBuiltLink: asBuiltLink.trim() })
      : projectsService.reviewAsBuilt(projectId, { approved: false, reviewedAt, rejectionReason: rejectionReason.trim() }),
    onSuccess: () => {
      toast.success(approved ? `As-Built do projeto PRJ-${projectCode} aprovado.` : `As-Built do projeto PRJ-${projectCode} devolvido para correção.`)
      onSaved()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSearch className="size-5 text-primary" />Analisar As-Built</DialogTitle>
          <DialogDescription>A aprovação libera o atesto da NF. A reprovação devolve o projeto à execução para correção.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant={approved ? "default" : "outline"} onClick={() => setApproved(true)}><CheckCircle2 className="size-4" />Aprovar</Button>
          <Button type="button" variant={!approved ? "destructive" : "outline"} onClick={() => setApproved(false)}><RotateCcw className="size-4" />Reprovar</Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="as-built-reviewed-at">Data da análise</Label>
          <Input id="as-built-reviewed-at" type="date" value={reviewedAt} onChange={(event) => setReviewedAt(event.target.value)} />
        </div>
        {approved ? (
          <div className="space-y-2">
            <Label htmlFor="as-built-link">Link do arquivo ou pasta do As-Built</Label>
            <Input id="as-built-link" type="url" value={asBuiltLink} onChange={(event) => setAsBuiltLink(event.target.value)} placeholder="https://..." autoFocus />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="as-built-rejection-reason">Motivo da reprovação</Label>
            <Textarea id="as-built-rejection-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Descreva o que deve ser corrigido..." rows={4} autoFocus />
          </div>
        )}
        {validationError && <p className="text-sm font-medium text-destructive">{validationError}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant={approved ? "default" : "destructive"} onClick={() => mutation.mutate()} disabled={Boolean(validationError) || mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}{approved ? "Aprovar As-Built" : "Reprovar e devolver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
