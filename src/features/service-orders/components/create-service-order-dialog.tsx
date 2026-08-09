import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FileCheck2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/features/auth/auth.store"
import { serviceOrdersApi } from "@/features/service-orders/service-orders.api"
import type { CreateServiceOrderPayload, ServiceOrder } from "@/features/service-orders/service-orders.api.types"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

type Props = { details: ProjectDetailsResponse; open: boolean; onOpenChange: (open: boolean) => void; onCreated: (order: ServiceOrder) => void }
function today() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) }

export function CreateServiceOrderDialog({ details, open, onOpenChange, onCreated }: Props) {
  const user = useAuthStore((state) => state.user)
  const usedEstimateIds = useMemo(() => new Set(details.documents.serviceOrders.map((order) => order.estimate.id)), [details.documents.serviceOrders])
  const eligibleDiex = details.documents.diexRequests.filter((diex) => diex.diexNumber && diex.issuedAt && !diex.archivedAt && !usedEstimateIds.has(diex.estimate.id))
  const [diexId, setDiexId] = useState(() => eligibleDiex[0]?.id ?? "")
  const selectedDiex = eligibleDiex.find((diex) => diex.id === diexId)
  const [issuedAt, setIssuedAt] = useState(today)
  const [contractorCnpj, setContractorCnpj] = useState("")
  const [requesterName, setRequesterName] = useState(() => user?.name ?? "")
  const [requesterRank, setRequesterRank] = useState(() => user?.rank ?? "")
  const [requesterCpf, setRequesterCpf] = useState(() => user?.cpf ?? "")
  const [plannedStartDate, setPlannedStartDate] = useState("")
  const [plannedEndDate, setPlannedEndDate] = useState("")
  const [executionLocation, setExecutionLocation] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [representativeName, setRepresentativeName] = useState("")
  const [notes, setNotes] = useState("")

  const error = useMemo(() => {
    if (!selectedDiex) return "Selecione um DIEx emitido e ainda sem OS."
    if (!issuedAt) return "Informe a data de emissão da OS."
    if (contractorCnpj.trim().length < 14) return "Informe o CNPJ da contratada."
    if (requesterName.trim().length < 3) return "Informe o nome do fiscal/requisitante."
    if (requesterRank.trim().length < 2) return "Informe o posto ou graduação."
    if (requesterCpf.replace(/\D/g, "").length !== 11) return "Informe um CPF válido com 11 dígitos."
    if (plannedStartDate && plannedEndDate && plannedEndDate < plannedStartDate) return "A entrega prevista não pode ocorrer antes do início."
    return null
  }, [contractorCnpj, issuedAt, plannedEndDate, plannedStartDate, requesterCpf, requesterName, requesterRank, selectedDiex])

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CreateServiceOrderPayload = {
        projectId: details.project.id,
        estimateId: selectedDiex!.estimate.id,
        diexId: selectedDiex!.id,
        issuedAt,
        contractorCnpj: contractorCnpj.trim(),
        requesterName: requesterName.trim(),
        requesterRank: requesterRank.trim(),
        requesterCpf: requesterCpf.trim(),
      }
      if (plannedStartDate) payload.plannedStartDate = plannedStartDate
      if (plannedEndDate) payload.plannedEndDate = plannedEndDate
      if (executionLocation.trim()) payload.executionLocation = executionLocation.trim()
      if (contactName.trim()) payload.contactName = contactName.trim()
      if (contactPhone.trim()) payload.contactPhone = contactPhone.trim()
      if (representativeName.trim()) payload.contractorRepresentativeName = representativeName.trim()
      if (notes.trim()) payload.notes = notes.trim()
      return serviceOrdersApi.create(payload)
    },
    onSuccess: (order) => { toast.success(`Ordem de Serviço ${order.serviceOrderNumber} emitida.`); onCreated(order); onOpenChange(false) },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><FileCheck2 className="size-5 text-primary" />Emitir Ordem de Serviço</DialogTitle><DialogDescription>A numeração da OS será gerada automaticamente. Os itens, valores e a contratada são vinculados à estimativa do DIEx.</DialogDescription></DialogHeader><div className="space-y-5">
    <div className="space-y-2"><Label>DIEx de origem</Label><Select value={diexId} onValueChange={setDiexId}><SelectTrigger><SelectValue placeholder="Selecione o DIEx" /></SelectTrigger><SelectContent>{eligibleDiex.map((diex) => <SelectItem key={diex.id} value={diex.id}>{diex.diexNumber} · EST-{diex.estimate.estimateCode} · {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(diex.totalAmount))}</SelectItem>)}</SelectContent></Select>{!eligibleDiex.length && <p className="text-xs text-destructive">Não há DIEx emitido disponível sem OS vinculada.</p>}</div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="os-issued">Data de emissão</Label><Input id="os-issued" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="os-cnpj">CNPJ da contratada</Label><Input id="os-cnpj" value={contractorCnpj} onChange={(e) => setContractorCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="os-requester">Fiscal/requisitante</Label><Input id="os-requester" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="os-rank">P/G</Label><Input id="os-rank" value={requesterRank} onChange={(e) => setRequesterRank(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="os-cpf">CPF</Label><Input id="os-cpf" value={requesterCpf} onChange={(e) => setRequesterCpf(e.target.value)} /></div></div>
    <div className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="os-start">Início planejado</Label><Input id="os-start" type="date" value={plannedStartDate} onChange={(e) => setPlannedStartDate(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="os-end">Entrega planejada</Label><Input id="os-end" type="date" value={plannedEndDate} onChange={(e) => setPlannedEndDate(e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="os-location">Local de execução</Label><Input id="os-location" value={executionLocation} onChange={(e) => setExecutionLocation(e.target.value)} placeholder="Padrão: cidade/UF da estimativa" /></div></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="os-contact">Contato na OM</Label><Input id="os-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="os-phone">Telefone</Label><Input id="os-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="os-representative">Representante da contratada</Label><Input id="os-representative" value={representativeName} onChange={(e) => setRepresentativeName(e.target.value)} /></div></div>
    <div className="space-y-2"><Label htmlFor="os-notes">Observações</Label><Textarea id="os-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>{error && <p className="text-sm font-medium text-destructive">{error}</p>}
  </div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={() => mutation.mutate()} disabled={Boolean(error) || mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Emitir OS</Button></DialogFooter></DialogContent></Dialog>
}
