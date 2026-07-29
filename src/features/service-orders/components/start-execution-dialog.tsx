import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Play } from "lucide-react"
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

type StartExecutionDialogProps = {
  projectId: string
  projectCode: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  serviceOrderIssuedAt?: string
}

function todayInputValue() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}

export function StartExecutionDialog({
  projectId,
  projectCode,
  open,
  onOpenChange,
  onSaved,
  serviceOrderIssuedAt,
}: StartExecutionDialogProps) {
  const [startedAt, setStartedAt] = useState(todayInputValue)
  const [maximumDate] = useState(todayInputValue)
  const minimumDate = serviceOrderIssuedAt?.slice(0, 10)
  const validationError = useMemo(() => {
    if (!startedAt) return "Informe a data de início."
    if (startedAt > maximumDate) {
      return "A data de início não pode estar no futuro."
    }
    if (minimumDate && startedAt < minimumDate) {
      return "O início não pode ser anterior à emissão da Ordem de Serviço."
    }
    return null
  }, [maximumDate, minimumDate, startedAt])

  const mutation = useMutation({
    mutationFn: () =>
      projectsService.updateFlow(projectId, {
        stage: "SERVICO_EM_EXECUCAO",
        executionStartedAt: startedAt,
      }),
    onSuccess: () => {
      toast.success(`Execução do projeto PRJ-${projectCode} iniciada.`)
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
            <Play className="size-5 text-primary" />
            Iniciar execução
          </DialogTitle>
          <DialogDescription>
            Registre o início efetivo dos serviços. O projeto avançará para
            Serviço em execução e o Gantt será atualizado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="execution-started-at">
            Data de início da execução
          </Label>
          <Input
            id="execution-started-at"
            type="date"
            min={minimumDate}
            max={maximumDate}
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
            aria-invalid={Boolean(validationError)}
          />
        </div>
        {validationError && (
          <p className="text-sm font-medium text-destructive">
            {validationError}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={Boolean(validationError) || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmar início
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
