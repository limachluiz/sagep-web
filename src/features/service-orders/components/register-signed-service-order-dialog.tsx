import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FileSignature, Loader2 } from "lucide-react"
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

type Props = {
  projectId: string
  projectCode: number
  serviceOrderIssuedAt?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

function todayInputValue() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10)
}

export function RegisterSignedServiceOrderDialog({
  projectId,
  projectCode,
  serviceOrderIssuedAt,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [link, setLink] = useState("")
  const [receivedAt, setReceivedAt] = useState(todayInputValue)
  const [notes, setNotes] = useState("")
  const minimumDate = serviceOrderIssuedAt?.slice(0, 10)
  const maximumDate = todayInputValue()

  const validationError = useMemo(() => {
    if (!link.trim()) return "Informe o link da OS assinada."
    try {
      const url = new URL(link.trim())
      if (!["http:", "https:"].includes(url.protocol)) {
        return "Use um link iniciado por http:// ou https://."
      }
    } catch {
      return "Informe um link válido para o arquivo ou pasta em nuvem."
    }
    if (link.trim().length > 2048) return "O link informado é muito longo."
    if (!receivedAt) return "Informe a data de recebimento."
    if (minimumDate && receivedAt < minimumDate) {
      return "O recebimento não pode ser anterior à emissão da OS."
    }
    if (receivedAt > maximumDate) {
      return "A data de recebimento não pode estar no futuro."
    }
    if (notes.trim().length > 2000) return "A observação deve ter até 2.000 caracteres."
    return null
  }, [link, maximumDate, minimumDate, notes, receivedAt])

  const mutation = useMutation({
    mutationFn: () =>
      projectsService.registerSignedServiceOrder(projectId, {
        signedServiceOrderLink: link.trim(),
        signedServiceOrderReceivedAt: receivedAt,
        signedServiceOrderNotes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(`OS assinada do projeto PRJ-${projectCode} registrada.`)
      onSaved()
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="size-5 text-primary" />
            Registrar OS assinada
          </DialogTitle>
          <DialogDescription>
            Vincule a Ordem de Serviço devolvida pela contratada. Após o registro,
            o sistema liberará o início da execução.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signed-service-order-link">Link do arquivo ou pasta</Label>
            <Input
              id="signed-service-order-link"
              type="url"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="https://drive.google.com/..."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signed-service-order-received-at">Data de recebimento</Label>
            <Input
              id="signed-service-order-received-at"
              type="date"
              min={minimumDate}
              max={maximumDate}
              value={receivedAt}
              onChange={(event) => setReceivedAt(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signed-service-order-notes">Observação opcional</Label>
            <Textarea
              id="signed-service-order-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex.: recebida por e-mail após assinatura digital no GOV.BR."
              maxLength={2000}
            />
          </div>
        </div>

        {validationError && (
          <p className="text-sm font-medium text-destructive">{validationError}</p>
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
            Registrar e liberar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
