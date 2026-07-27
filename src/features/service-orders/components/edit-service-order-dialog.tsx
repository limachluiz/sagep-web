import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { serviceOrdersApi } from "@/features/service-orders/service-orders.api"
import type { ServiceOrder } from "@/features/service-orders/service-orders.api.types"

type Props = { order: ServiceOrder; open: boolean; onOpenChange: (open: boolean) => void; onSaved: (order: ServiceOrder) => void }
const dateValue = (value: string | null) => value?.slice(0, 10) ?? ""

export function EditServiceOrderDialog({ order, open, onOpenChange, onSaved }: Props) {
  const [number, setNumber] = useState(order.serviceOrderNumber)
  const [issuedAt, setIssuedAt] = useState(dateValue(order.issuedAt))
  const [cnpj, setCnpj] = useState(order.contractorCnpj)
  const [requesterName, setRequesterName] = useState(order.requesterName)
  const [requesterRank, setRequesterRank] = useState(order.requesterRank)
  const [start, setStart] = useState(dateValue(order.plannedStartDate))
  const [end, setEnd] = useState(dateValue(order.plannedEndDate))
  const [location, setLocation] = useState(order.executionLocation ?? "")
  const [contactName, setContactName] = useState(order.contactName ?? "")
  const [contactPhone, setContactPhone] = useState(order.contactPhone ?? "")
  const [notes, setNotes] = useState(order.notes ?? "")
  const invalid = number.trim().length < 3 || !issuedAt || cnpj.trim().length < 14 || requesterName.trim().length < 3 || requesterRank.trim().length < 2 || Boolean(start && end && end < start)
  const mutation = useMutation({
    mutationFn: () => serviceOrdersApi.update(order.id, {
      serviceOrderNumber: number.trim(), issuedAt, contractorCnpj: cnpj.trim(),
      requesterName: requesterName.trim(), requesterRank: requesterRank.trim(),
      plannedStartDate: start || undefined, plannedEndDate: end || undefined,
      executionLocation: location.trim(), contactName: contactName.trim(),
      contactPhone: contactPhone.trim(), notes: notes.trim(),
    }),
    onSuccess: (updated) => { toast.success("Ordem de Serviço atualizada."); onSaved(updated); onOpenChange(false) },
    onError: (error) => toast.error(error.message),
  })

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="size-5 text-primary" />Editar Ordem de Serviço</DialogTitle><DialogDescription>Atualize os dados documentais e de execução planejada. Itens e valores não são alterados nesta tela.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2">
    <div className="space-y-2"><Label htmlFor="edit-os-number">Número da OS</Label><Input id="edit-os-number" value={number} onChange={(e) => setNumber(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-os-date">Emissão</Label><Input id="edit-os-date" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} /></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="edit-os-cnpj">CNPJ da contratada</Label><Input id="edit-os-cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-os-requester">Fiscal/requisitante</Label><Input id="edit-os-requester" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-os-rank">Posto/graduação</Label><Input id="edit-os-rank" value={requesterRank} onChange={(e) => setRequesterRank(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-os-start">Início planejado</Label><Input id="edit-os-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-os-end">Entrega planejada</Label><Input id="edit-os-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="edit-os-location">Local de execução</Label><Input id="edit-os-location" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-os-contact">Contato</Label><Input id="edit-os-contact" value={contactName} onChange={(e) => setContactName(e.target.value)} /></div>
    <div className="space-y-2"><Label htmlFor="edit-os-phone">Telefone</Label><Input id="edit-os-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
    <div className="space-y-2 sm:col-span-2"><Label htmlFor="edit-os-notes">Observações</Label><Textarea id="edit-os-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
  </div>{start && end && end < start && <p className="text-sm text-destructive">A entrega planejada não pode ocorrer antes do início.</p>}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={() => mutation.mutate()} disabled={invalid || mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Salvar alterações</Button></DialogFooter></DialogContent></Dialog>
}
