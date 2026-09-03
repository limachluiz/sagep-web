import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Building2, CalendarClock, ClipboardList, Contact, FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { FormSection } from "@/components/form-section"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { serviceOrdersApi } from "@/features/service-orders/service-orders.api"
import type { ServiceOrder, UpdateServiceOrderPayload } from "@/features/service-orders/service-orders.api.types"

type Props = { order: ServiceOrder; open: boolean; onOpenChange: (open: boolean) => void; onSaved: (order: ServiceOrder) => void }
const dateValue = (value: string | null) => value?.slice(0, 10) ?? ""

export function EditServiceOrderDialog({ order, open, onOpenChange, onSaved }: Props) {
  const [number, setNumber] = useState(order.serviceOrderNumber)
  const [issuedAt, setIssuedAt] = useState(dateValue(order.issuedAt))
  const [contractorName, setContractorName] = useState(order.contractorName)
  const [cnpj, setCnpj] = useState(order.contractorCnpj)
  const [requesterName, setRequesterName] = useState(order.requesterName)
  const [requesterRank, setRequesterRank] = useState(order.requesterRank)
  const [requesterCpf, setRequesterCpf] = useState(order.requesterCpf ?? "")
  const [requesterRole, setRequesterRole] = useState(order.requesterRole)
  const [hasProjectInspector, setHasProjectInspector] = useState(order.hasProjectInspector)
  const [projectInspectorName, setProjectInspectorName] = useState(order.projectInspectorName ?? "")
  const [projectInspectorRank, setProjectInspectorRank] = useState(order.projectInspectorRank ?? "")
  const [projectInspectorCpf, setProjectInspectorCpf] = useState(order.projectInspectorCpf ?? "")
  const [projectInspectorRole, setProjectInspectorRole] = useState(order.projectInspectorRole ?? "Fiscal do Projeto")
  const [issuingOrganization, setIssuingOrganization] = useState(order.issuingOrganization)
  const [requestingArea, setRequestingArea] = useState(order.requestingArea ?? "")
  const [projectName, setProjectName] = useState(order.projectDisplayName ?? order.project.title)
  const [projectAcronym, setProjectAcronym] = useState(order.projectAcronym ?? order.estimate.om?.sigla ?? "")
  const [isEmergency, setIsEmergency] = useState(order.isEmergency)
  const [contractNumber, setContractNumber] = useState(order.contractNumber ?? "")
  const [origin, setOrigin] = useState(order.originProcess ?? "")
  const [start, setStart] = useState(dateValue(order.plannedStartDate))
  const [end, setEnd] = useState(dateValue(order.plannedEndDate))
  const [term, setTerm] = useState(order.contractTotalTerm ?? "")
  const [location, setLocation] = useState(order.executionLocation ?? "")
  const [hours, setHours] = useState(order.executionHours ?? "")
  const [contactName, setContactName] = useState(order.contactName ?? "")
  const [contactPhone, setContactPhone] = useState(order.contactPhone ?? "")
  const [contactExtension, setContactExtension] = useState(order.contactExtension ?? "")
  const [representativeName, setRepresentativeName] = useState(order.contractorRepresentativeName ?? "")
  const [representativeRole, setRepresentativeRole] = useState(order.contractorRepresentativeRole ?? "")
  const [scheduleItems, setScheduleItems] = useState(order.scheduleItems.map((item) => ({ taskStep: item.taskStep, scheduleText: item.scheduleText })))
  const [documents, setDocuments] = useState(order.deliveredDocuments.map((item) => ({ description: item.description, isChecked: item.isChecked })))
  const [notes, setNotes] = useState(order.notes ?? "")
  const invalidInspector = hasProjectInspector && (projectInspectorName.trim().length < 3 || projectInspectorRank.trim().length < 2 || projectInspectorCpf.replace(/\D/g, "").length !== 11 || projectInspectorRole.trim().length < 2)
  const invalid = number.trim().length < 3 || !issuedAt || contractorName.trim().length < 2 || cnpj.replace(/\D/g, "").length !== 14 || requesterName.trim().length < 3 || requesterRank.trim().length < 2 || requesterCpf.replace(/\D/g, "").length !== 11 || invalidInspector || Boolean(start && end && end < start) || scheduleItems.some((item) => !item.taskStep.trim() || !item.scheduleText.trim()) || documents.some((item) => !item.description.trim())
  const mutation = useMutation({
    mutationFn: () => serviceOrdersApi.update(order.id, {
      serviceOrderNumber: number.trim(), issuedAt, contractorName: contractorName.trim(), contractorCnpj: cnpj.trim(),
      requesterName: requesterName.trim(), requesterRank: requesterRank.trim(), requesterCpf: requesterCpf.trim(), requesterRole: requesterRole.trim(),
      hasProjectInspector, projectInspectorName: hasProjectInspector ? projectInspectorName.trim() : undefined,
      projectInspectorRank: hasProjectInspector ? projectInspectorRank.trim() : undefined,
      projectInspectorCpf: hasProjectInspector ? projectInspectorCpf.trim() : undefined,
      projectInspectorRole: hasProjectInspector ? projectInspectorRole.trim() : undefined,
      issuingOrganization: issuingOrganization.trim(), requestingArea: requestingArea.trim(), projectDisplayName: projectName.trim(), projectAcronym: projectAcronym.trim(), isEmergency,
      contractNumber: contractNumber.trim(), originProcess: origin.trim(), plannedStartDate: start || undefined, plannedEndDate: end || undefined, contractTotalTerm: term.trim(),
      executionLocation: location.trim(), executionHours: hours.trim(), contactName: contactName.trim(), contactPhone: contactPhone.trim(), contactExtension: contactExtension.trim(),
      contractorRepresentativeName: representativeName.trim(), contractorRepresentativeRole: representativeRole.trim(), notes: notes.trim(),
      scheduleItems: scheduleItems.map((item, index) => ({ orderIndex: index + 1, taskStep: item.taskStep.trim(), scheduleText: item.scheduleText.trim() })),
      deliveredDocuments: documents.map((item) => ({ description: item.description.trim(), isChecked: item.isChecked })),
    } satisfies UpdateServiceOrderPayload),
    onSuccess: (updated) => { toast.success("Ordem de Serviço atualizada."); onSaved(updated); onOpenChange(false) },
    onError: (error) => toast.error(error.message),
  })

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-5xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Pencil className="size-5 text-primary" />Editar Ordem de Serviço</DialogTitle><DialogDescription>Revise todos os campos documentais. Os vínculos, itens, quantidades e valores permanecem protegidos.</DialogDescription></DialogHeader><div className="space-y-5">
    <FormSection icon={ClipboardList} title="Documento e identificação"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Número da OS</Label><Input value={number} onChange={(event) => setNumber(event.target.value)} /></div><div className="space-y-2"><Label>Emissão</Label><Input type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} /></div><div className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm font-medium">Atendimento emergencial</span><Switch checked={isEmergency} onCheckedChange={setIsEmergency} /></div><div className="space-y-2"><Label>Organização emissora</Label><Input value={issuingOrganization} onChange={(event) => setIssuingOrganization(event.target.value)} /></div><div className="space-y-2"><Label>Área requisitante</Label><Input value={requestingArea} onChange={(event) => setRequestingArea(event.target.value)} /></div><div className="space-y-2"><Label>Nome do projeto</Label><Input value={projectName} onChange={(event) => setProjectName(event.target.value)} /></div><div className="space-y-2"><Label>Sigla da OM/projeto</Label><Input value={projectAcronym} onChange={(event) => setProjectAcronym(event.target.value)} /></div><div className="space-y-2"><Label>Contrato nº</Label><Input value={contractNumber} onChange={(event) => setContractNumber(event.target.value)} /></div><div className="space-y-2"><Label>Processo de origem</Label><Input value={origin} onChange={(event) => setOrigin(event.target.value)} /></div></div></FormSection>
    <FormSection icon={Building2} title="Contratada"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Razão social</Label><Input value={contractorName} onChange={(event) => setContractorName(event.target.value)} /></div><div className="space-y-2"><Label>CNPJ</Label><Input value={cnpj} onChange={(event) => setCnpj(event.target.value)} /></div><div className="space-y-2"><Label>Representante</Label><Input value={representativeName} onChange={(event) => setRepresentativeName(event.target.value)} /></div><div className="space-y-2"><Label>Função do representante</Label><Input value={representativeRole} onChange={(event) => setRepresentativeRole(event.target.value)} /></div></div></FormSection>
    <FormSection icon={Contact} title="Fiscalização e contatos"><div className="grid gap-4 md:grid-cols-3"><div className="space-y-2 md:col-span-2"><Label>Requisitante</Label><Input value={requesterName} onChange={(event) => setRequesterName(event.target.value)} /></div><div className="space-y-2"><Label>P/G</Label><Input value={requesterRank} onChange={(event) => setRequesterRank(event.target.value)} /></div><div className="space-y-2"><Label>CPF</Label><Input value={requesterCpf} onChange={(event) => setRequesterCpf(event.target.value)} /></div><div className="space-y-2"><Label>Função</Label><Input value={requesterRole} onChange={(event) => setRequesterRole(event.target.value)} /></div><div className="space-y-2"><Label>Contato</Label><Input value={contactName} onChange={(event) => setContactName(event.target.value)} /></div><div className="space-y-2"><Label>Telefone</Label><Input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} /></div><div className="space-y-2"><Label>Ramal</Label><Input value={contactExtension} onChange={(event) => setContactExtension(event.target.value)} /></div><label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm md:col-span-3"><span><strong className="block">Incluir fiscal do projeto</strong><span className="text-xs text-muted-foreground">Adiciona o fiscal como signatário da contratante na Ordem de Serviço.</span></span><Switch checked={hasProjectInspector} onCheckedChange={setHasProjectInspector} /></label>{hasProjectInspector && <><div className="space-y-2 md:col-span-2"><Label>Nome do fiscal</Label><Input value={projectInspectorName} onChange={(event) => setProjectInspectorName(event.target.value)} /></div><div className="space-y-2"><Label>P/G</Label><Input value={projectInspectorRank} onChange={(event) => setProjectInspectorRank(event.target.value)} /></div><div className="space-y-2"><Label>CPF</Label><Input value={projectInspectorCpf} onChange={(event) => setProjectInspectorCpf(event.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Função</Label><Input value={projectInspectorRole} onChange={(event) => setProjectInspectorRole(event.target.value)} /></div></>}</div></FormSection>
    <FormSection icon={CalendarClock} title="Execução e prazos"><div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Início planejado</Label><Input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></div><div className="space-y-2"><Label>Entrega planejada</Label><Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></div><div className="space-y-2"><Label>Prazo/garantia</Label><Input value={term} onChange={(event) => setTerm(event.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Local de execução</Label><Input value={location} onChange={(event) => setLocation(event.target.value)} /></div><div className="space-y-2"><Label>Horário</Label><Input value={hours} onChange={(event) => setHours(event.target.value)} /></div></div></FormSection>
    <FormSection icon={CalendarClock} title="Cronograma"><div className="space-y-3">{scheduleItems.map((item, index) => <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_auto]"><Input value={item.taskStep} onChange={(event) => setScheduleItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, taskStep: event.target.value } : row))} /><Input value={item.scheduleText} onChange={(event) => setScheduleItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, scheduleText: event.target.value } : row))} /><Button type="button" variant="ghost" size="icon" onClick={() => setScheduleItems((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="size-4 text-destructive" /></Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => setScheduleItems((current) => [...current, { taskStep: "", scheduleText: "" }])}><Plus />Adicionar etapa</Button></div></FormSection>
    <FormSection icon={FileText} title="Documentos e observações"><div className="space-y-3">{documents.map((item, index) => <div key={index} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"><Switch checked={item.isChecked} onCheckedChange={(checked) => setDocuments((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, isChecked: checked } : row))} /><Input className="min-w-0 flex-1" value={item.description} onChange={(event) => setDocuments((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row))} /><Button type="button" variant="ghost" size="icon" onClick={() => setDocuments((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="size-4 text-destructive" /></Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => setDocuments((current) => [...current, { description: "", isChecked: false }])}><Plus />Adicionar documento</Button><div className="space-y-2 pt-2"><Label>Observações</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} /></div></div></FormSection>
  </div>{start && end && end < start && <p className="text-sm text-destructive">A entrega planejada não pode ocorrer antes do início.</p>}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={() => mutation.mutate()} disabled={invalid || mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Salvar alterações</Button></DialogFooter></DialogContent></Dialog>
}
