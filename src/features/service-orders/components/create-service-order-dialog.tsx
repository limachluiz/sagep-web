import { useEffect, useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Building2, CalendarClock, ClipboardList, Contact, FileCheck2, FileText, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { FormSection } from "@/components/form-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/features/auth/auth.store"
import { serviceOrdersApi } from "@/features/service-orders/service-orders.api"
import type { CreateServiceOrderPayload, ServiceOrder } from "@/features/service-orders/service-orders.api.types"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

type Props = { details: ProjectDetailsResponse; open: boolean; onOpenChange: (open: boolean) => void; onCreated: (order: ServiceOrder) => void }
type DiexOption = ProjectDetailsResponse["documents"]["diexRequests"][number]
type ScheduleRow = { taskStep: string; scheduleText: string }
type DocumentRow = { description: string; isChecked: boolean }

function today() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) }
function originProcess(diex: DiexOption) {
  const pregao = diex.estimate.ata.pregao
  if (pregao) return `Pregão nº ${pregao.number}/${pregao.year}${pregao.managingAgency ? ` - ${pregao.managingAgency}` : ""}`
  return diex.pregaoNumber ? `Pregão nº ${diex.pregaoNumber}` : `ATA ${diex.estimate.ata.number}`
}

export function CreateServiceOrderDialog({ details, open, onOpenChange, onCreated }: Props) {
  const user = useAuthStore((state) => state.user)
  const usedEstimateIds = useMemo(() => new Set(details.documents.serviceOrders.map((order) => order.estimate.id)), [details.documents.serviceOrders])
  const eligibleDiex = details.documents.diexRequests.filter((diex) => diex.diexNumber && diex.issuedAt && !diex.archivedAt && !usedEstimateIds.has(diex.estimate.id))
  const [diexId, setDiexId] = useState(() => eligibleDiex[0]?.id ?? "")
  const selectedDiex = eligibleDiex.find((diex) => diex.id === diexId)
  const [issuedAt, setIssuedAt] = useState(today)
  const [contractorName, setContractorName] = useState("")
  const [contractorCnpj, setContractorCnpj] = useState("")
  const [requesterName, setRequesterName] = useState("")
  const [requesterRank, setRequesterRank] = useState("")
  const [requesterCpf, setRequesterCpf] = useState("")
  const [requesterRole, setRequesterRole] = useState("Fiscal do Contrato")
  const [issuingOrganization, setIssuingOrganization] = useState("")
  const [requestingArea, setRequestingArea] = useState("")
  const [projectDisplayName, setProjectDisplayName] = useState(details.project.title)
  const [projectAcronym, setProjectAcronym] = useState(details.project.om?.sigla ?? "")
  const [isEmergency, setIsEmergency] = useState(false)
  const [contractNumber, setContractNumber] = useState("")
  const [origin, setOrigin] = useState("")
  const [plannedStartDate, setPlannedStartDate] = useState("")
  const [plannedEndDate, setPlannedEndDate] = useState("")
  const [contractTotalTerm, setContractTotalTerm] = useState("")
  const [executionLocation, setExecutionLocation] = useState("")
  const [executionHours, setExecutionHours] = useState("08:00h às 16:30h, conforme o Termo de Referência.")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactExtension, setContactExtension] = useState("")
  const [representativeName, setRepresentativeName] = useState("")
  const [representativeRole, setRepresentativeRole] = useState("Responsável pela Contratada")
  const [scheduleItems, setScheduleItems] = useState<ScheduleRow[]>([])
  const [deliveredDocuments, setDeliveredDocuments] = useState<DocumentRow[]>([])
  const [notes, setNotes] = useState("")

  const applyDefaults = (diex: DiexOption) => {
    const organization = diex.issuingOrganization || "4º CTA"
    setContractorName(diex.supplierName || diex.estimate.ata.vendorName)
    setContractorCnpj(diex.supplierCnpj || "")
    setRequesterName(diex.requesterName || user?.name || "")
    setRequesterRank(diex.requesterRank || user?.rank || "")
    setRequesterCpf(diex.requesterCpf || user?.cpf || "")
    setIssuingOrganization(organization)
    setRequestingArea(`Seção de Projetos - Divisão Técnica ${organization}`)
    setProjectDisplayName(details.project.title)
    setProjectAcronym(details.project.om?.sigla ?? "")
    setExecutionLocation(`${diex.estimate.destinationCityName}/${diex.estimate.destinationStateUf}`)
    setOrigin(originProcess(diex))
  }

  useEffect(() => {
    if (open && selectedDiex) applyDefaults(selectedDiex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, diexId])

  const error = useMemo(() => {
    if (!selectedDiex) return "Selecione um DIEx emitido e ainda sem OS."
    if (!issuedAt) return "Informe a data de emissão da OS."
    if (contractorName.trim().length < 2) return "Informe o nome da contratada."
    if (contractorCnpj.replace(/\D/g, "").length !== 14) return "Informe um CNPJ válido com 14 dígitos."
    if (requesterName.trim().length < 3) return "Informe o nome do fiscal/requisitante."
    if (requesterRank.trim().length < 2) return "Informe o posto ou graduação."
    if (requesterCpf.replace(/\D/g, "").length !== 11) return "Informe um CPF válido com 11 dígitos."
    if (plannedStartDate && plannedEndDate && plannedEndDate < plannedStartDate) return "A entrega prevista não pode ocorrer antes do início."
    if (scheduleItems.some((item) => !item.taskStep.trim() || !item.scheduleText.trim())) return "Complete ou remova as linhas vazias do cronograma."
    if (deliveredDocuments.some((item) => !item.description.trim())) return "Complete ou remova os documentos sem descrição."
    return null
  }, [contractorCnpj, contractorName, deliveredDocuments, issuedAt, plannedEndDate, plannedStartDate, requesterCpf, requesterName, requesterRank, scheduleItems, selectedDiex])

  const mutation = useMutation({
    mutationFn: () => serviceOrdersApi.create({
      projectId: details.project.id, estimateId: selectedDiex!.estimate.id, diexId: selectedDiex!.id, issuedAt,
      contractorName: contractorName.trim(), contractorCnpj: contractorCnpj.trim(),
      requesterName: requesterName.trim(), requesterRank: requesterRank.trim(), requesterCpf: requesterCpf.trim(), requesterRole: requesterRole.trim(),
      issuingOrganization: issuingOrganization.trim(), requestingArea: requestingArea.trim(), projectDisplayName: projectDisplayName.trim(), projectAcronym: projectAcronym.trim(),
      isEmergency, contractNumber: contractNumber.trim() || undefined, originProcess: origin.trim() || undefined,
      plannedStartDate: plannedStartDate || undefined, plannedEndDate: plannedEndDate || undefined, contractTotalTerm: contractTotalTerm.trim() || undefined,
      executionLocation: executionLocation.trim() || undefined, executionHours: executionHours.trim() || undefined,
      contactName: contactName.trim() || undefined, contactPhone: contactPhone.trim() || undefined, contactExtension: contactExtension.trim() || undefined,
      contractorRepresentativeName: representativeName.trim() || undefined, contractorRepresentativeRole: representativeRole.trim() || undefined,
      scheduleItems: scheduleItems.map((item, index) => ({ orderIndex: index + 1, taskStep: item.taskStep.trim(), scheduleText: item.scheduleText.trim() })),
      deliveredDocuments: deliveredDocuments.map((item) => ({ description: item.description.trim(), isChecked: item.isChecked })), notes: notes.trim() || undefined,
    } satisfies CreateServiceOrderPayload),
    onSuccess: (order) => { toast.success(`Ordem de Serviço ${order.serviceOrderNumber} emitida.`); onCreated(order); onOpenChange(false) },
    onError: (mutationError) => toast.error(mutationError.message),
  })

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-5xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><FileCheck2 className="size-5 text-primary" />Emitir Ordem de Serviço</DialogTitle><DialogDescription>Revise os dados herdados do projeto, DIEx, pregão, ATA e usuário. Todos os campos documentais abaixo podem ser ajustados antes da emissão.</DialogDescription></DialogHeader><div className="space-y-5">
    <FormSection icon={ClipboardList} title="Documento e vínculos" description="Os vínculos garantem a rastreabilidade; os textos usados no documento permanecem editáveis."><div className="grid min-w-0 gap-4 md:grid-cols-2"><div className="min-w-0 space-y-2 md:col-span-2"><Label>DIEx de origem</Label><Select value={diexId} onValueChange={setDiexId}><SelectTrigger className="w-full min-w-0 [&>span]:truncate"><SelectValue placeholder="Selecione o DIEx" /></SelectTrigger><SelectContent>{eligibleDiex.map((diex) => <SelectItem key={diex.id} value={diex.id}>{diex.diexNumber} · EST-{diex.estimate.estimateCode} · {diex.supplierName}</SelectItem>)}</SelectContent></Select>{!eligibleDiex.length && <p className="text-xs text-destructive">Não há DIEx emitido disponível sem OS vinculada.</p>}</div><div className="space-y-2"><Label>Data de emissão</Label><Input type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} /></div><div className="flex items-end"><label className="flex w-full items-center justify-between gap-4 rounded-lg border p-3 text-sm"><span><strong className="block">Atendimento emergencial</strong><span className="text-xs text-muted-foreground">Identifica a prioridade no documento.</span></span><Switch checked={isEmergency} onCheckedChange={setIsEmergency} /></label></div><div className="space-y-2"><Label>Organização emissora</Label><Input value={issuingOrganization} onChange={(event) => setIssuingOrganization(event.target.value)} /></div><div className="space-y-2"><Label>Área requisitante</Label><Input value={requestingArea} onChange={(event) => setRequestingArea(event.target.value)} /></div><div className="space-y-2"><Label>Nome do projeto</Label><Input value={projectDisplayName} onChange={(event) => setProjectDisplayName(event.target.value)} /></div><div className="space-y-2"><Label>Sigla da OM/projeto</Label><Input value={projectAcronym} onChange={(event) => setProjectAcronym(event.target.value)} /></div><div className="space-y-2"><Label>Contrato nº</Label><Input value={contractNumber} onChange={(event) => setContractNumber(event.target.value)} placeholder="Quando aplicável" /></div><div className="space-y-2"><Label>Processo de origem</Label><Input value={origin} onChange={(event) => setOrigin(event.target.value)} /></div></div></FormSection>
    <FormSection icon={Building2} title="Contratada" description="Nome e CNPJ são herdados do DIEx e podem ser corrigidos antes da emissão."><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Razão social</Label><Input value={contractorName} onChange={(event) => setContractorName(event.target.value)} /></div><div className="space-y-2"><Label>CNPJ</Label><Input value={contractorCnpj} onChange={(event) => setContractorCnpj(event.target.value)} placeholder="00.000.000/0000-00" /></div><div className="space-y-2"><Label>Representante</Label><Input value={representativeName} onChange={(event) => setRepresentativeName(event.target.value)} /></div><div className="space-y-2"><Label>Função do representante</Label><Input value={representativeRole} onChange={(event) => setRepresentativeRole(event.target.value)} /></div></div></FormSection>
    <FormSection icon={Contact} title="Fiscalização e contatos"><div className="grid gap-4 md:grid-cols-3"><div className="space-y-2 md:col-span-2"><Label>Fiscal/requisitante</Label><Input value={requesterName} onChange={(event) => setRequesterName(event.target.value)} /></div><div className="space-y-2"><Label>P/G</Label><Input value={requesterRank} onChange={(event) => setRequesterRank(event.target.value)} /></div><div className="space-y-2"><Label>CPF</Label><Input value={requesterCpf} onChange={(event) => setRequesterCpf(event.target.value)} /></div><div className="space-y-2"><Label>Função</Label><Input value={requesterRole} onChange={(event) => setRequesterRole(event.target.value)} /></div><div className="space-y-2"><Label>Contato na OM</Label><Input value={contactName} onChange={(event) => setContactName(event.target.value)} /></div><div className="space-y-2"><Label>Telefone</Label><Input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} /></div><div className="space-y-2"><Label>Ramal</Label><Input value={contactExtension} onChange={(event) => setContactExtension(event.target.value)} /></div></div></FormSection>
    <FormSection icon={CalendarClock} title="Execução e prazos"><div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Início planejado</Label><Input type="date" value={plannedStartDate} onChange={(event) => setPlannedStartDate(event.target.value)} /></div><div className="space-y-2"><Label>Entrega planejada</Label><Input type="date" value={plannedEndDate} onChange={(event) => setPlannedEndDate(event.target.value)} /></div><div className="space-y-2"><Label>Prazo total/garantia</Label><Input value={contractTotalTerm} onChange={(event) => setContractTotalTerm(event.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Local de execução</Label><Input value={executionLocation} onChange={(event) => setExecutionLocation(event.target.value)} /></div><div className="space-y-2"><Label>Horário</Label><Input value={executionHours} onChange={(event) => setExecutionHours(event.target.value)} /></div></div></FormSection>
    <FormSection icon={CalendarClock} title="Cronograma" description="Adicione somente as etapas que devem aparecer no documento."><div className="space-y-3">{scheduleItems.map((item, index) => <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_auto]"><Input value={item.taskStep} placeholder="Tarefa/etapa" onChange={(event) => setScheduleItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, taskStep: event.target.value } : row))} /><Input value={item.scheduleText} placeholder="Data ou prazo" onChange={(event) => setScheduleItems((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, scheduleText: event.target.value } : row))} /><Button type="button" variant="ghost" size="icon" title="Remover etapa" onClick={() => setScheduleItems((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="size-4 text-destructive" /></Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => setScheduleItems((current) => [...current, { taskStep: "", scheduleText: "" }])}><Plus />Adicionar etapa</Button></div></FormSection>
    <FormSection icon={FileText} title="Documentos e observações"><div className="space-y-3">{deliveredDocuments.map((item, index) => <div key={index} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"><Switch checked={item.isChecked} onCheckedChange={(checked) => setDeliveredDocuments((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, isChecked: checked } : row))} /><Input className="min-w-0 flex-1" value={item.description} placeholder="Documento entregue" onChange={(event) => setDeliveredDocuments((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row))} /><Button type="button" variant="ghost" size="icon" title="Remover documento" onClick={() => setDeliveredDocuments((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="size-4 text-destructive" /></Button></div>)}<Button type="button" variant="outline" size="sm" onClick={() => setDeliveredDocuments((current) => [...current, { description: "", isChecked: false }])}><Plus />Adicionar documento</Button><div className="space-y-2 pt-2"><Label>Observações complementares</Label><Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} /></div></div></FormSection>
    {selectedDiex && <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/20 p-3 text-xs"><Badge variant="outline">PRJ-{details.project.projectCode}</Badge><Badge variant="outline">{selectedDiex.diexNumber}</Badge><Badge variant="outline">EST-{selectedDiex.estimate.estimateCode}</Badge><Badge variant="outline">ATA {selectedDiex.estimate.ata.number}</Badge><span className="self-center text-muted-foreground">Itens, quantidades, valores e Nota de Empenho permanecem vinculados automaticamente.</span></div>}
    {error && <p className="text-sm font-medium text-destructive">{error}</p>}
  </div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={() => mutation.mutate()} disabled={Boolean(error) || mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Emitir OS</Button></DialogFooter></DialogContent></Dialog>
}
