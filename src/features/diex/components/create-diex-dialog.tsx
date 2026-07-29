import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FileSignature, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/features/auth/auth.store"
import { diexService } from "@/features/diex/diex.service"
import type { CreateDiexPayload, DiexRequest } from "@/features/diex/diex.types"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

type CreateDiexDialogProps = {
  details: ProjectDetailsResponse
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (diex: DiexRequest) => void
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

export function CreateDiexDialog({ details, open, onOpenChange, onCreated }: CreateDiexDialogProps) {
  const user = useAuthStore((state) => state.user)
  const existingEstimateIds = useMemo(
    () => new Set(details.documents.diexRequests.map((diex) => diex.estimate.id)),
    [details.documents.diexRequests],
  )
  const eligibleEstimates = details.documents.estimates.filter(
    (estimate) => estimate.status === "FINALIZADA" && !estimate.archivedAt && !existingEstimateIds.has(estimate.id),
  )
  const [estimateId, setEstimateId] = useState(() => eligibleEstimates[0]?.id ?? "")
  const [supplierCnpj, setSupplierCnpj] = useState("")
  const [requesterName, setRequesterName] = useState(() => user?.name ?? "")
  const [requesterRank, setRequesterRank] = useState(() => user?.rank ?? "")
  const [requesterCpf, setRequesterCpf] = useState(() => user?.cpf ?? "")
  const [diexNumber, setDiexNumber] = useState("")
  const [issuedAt, setIssuedAt] = useState("")
  const [notes, setNotes] = useState("")

  const validationError = useMemo(() => {
    if (!estimateId) return "Selecione uma estimativa finalizada."
    if (supplierCnpj.trim().length < 14) return "Informe o CNPJ do fornecedor."
    if (requesterName.trim().length < 3) return "Informe o nome do requisitante."
    if (requesterRank.trim().length < 2) return "Informe o posto ou graduação do requisitante."
    if (requesterCpf.replace(/\D/g, "").length !== 11) return "Informe um CPF válido com 11 dígitos."
    if (Boolean(diexNumber.trim()) !== Boolean(issuedAt)) return "Para liberar o documento, informe juntos o número e a data do DIEx, ou deixe ambos em branco."
    return null
  }, [diexNumber, estimateId, issuedAt, requesterCpf, requesterName, requesterRank, supplierCnpj])

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CreateDiexPayload = {
        projectId: details.project.id,
        estimateId,
        supplierCnpj: supplierCnpj.trim(),
        requesterName: requesterName.trim(),
        requesterRank: requesterRank.trim(),
        requesterCpf: requesterCpf.trim(),
      }
      if (diexNumber.trim()) payload.diexNumber = diexNumber.trim()
      if (issuedAt) payload.issuedAt = issuedAt
      if (notes.trim()) payload.notes = notes.trim()
      return diexService.create(payload)
    },
    onSuccess: (diex) => {
      toast.success(`DIEx ${diex.diexNumber ?? `DIEX-${diex.diexCode}`} criado com sucesso.`)
      onCreated(diex)
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileSignature className="size-5 text-primary" />Emitir DIEx requisitório</DialogTitle>
          <DialogDescription>
            O fornecedor, os itens e os valores serão copiados da estimativa selecionada do projeto PRJ-{details.project.projectCode}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Alert>
            <FileSignature />
            <AlertTitle>Reserva financeira</AlertTitle>
            <AlertDescription>
              A criação do DIEx reserva na ATA as quantidades da estimativa selecionada. O consumo definitivo ocorrerá somente após o registro da Nota de Empenho.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Estimativa finalizada</Label>
            <Select value={estimateId} onValueChange={setEstimateId}>
              <SelectTrigger><SelectValue placeholder="Selecione a estimativa" /></SelectTrigger>
              <SelectContent>
                {eligibleEstimates.map((estimate) => (
                  <SelectItem key={estimate.id} value={estimate.id}>
                    EST-{estimate.estimateCode} · {estimate.destinationCityName}/{estimate.destinationStateUf} · {formatCurrency(estimate.totalAmount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!eligibleEstimates.length && <p className="text-xs text-destructive">Não há estimativa finalizada disponível sem DIEx vinculado.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-cnpj">CNPJ do fornecedor</Label>
            <Input id="supplier-cnpj" value={supplierCnpj} onChange={(event) => setSupplierCnpj(event.target.value)} placeholder="00.000.000/0000-00" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="requester-name">Nome do requisitante</Label>
              <Input id="requester-name" value={requesterName} onChange={(event) => setRequesterName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requester-rank">Posto/graduação</Label>
              <Input id="requester-rank" value={requesterRank} onChange={(event) => setRequesterRank(event.target.value)} placeholder="Ex.: 1º Ten" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requester-cpf">CPF</Label>
              <Input id="requester-cpf" value={requesterCpf} onChange={(event) => setRequesterCpf(event.target.value)} placeholder="000.000.000-00" />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium">Dados preenchidos pela SALC</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="diex-number">Número do DIEx</Label>
                <Input id="diex-number" value={diexNumber} onChange={(event) => setDiexNumber(event.target.value)} placeholder="Pode ser preenchido depois" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diex-issued-at">Data de emissão</Label>
                <Input id="diex-issued-at" type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">O HTML e o PDF oficiais só ficam disponíveis quando número e data estiverem preenchidos.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diex-notes">Observações</Label>
            <Textarea id="diex-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          {validationError && <p className="text-sm font-medium text-destructive">{validationError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={Boolean(validationError) || mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Criar DIEx
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
