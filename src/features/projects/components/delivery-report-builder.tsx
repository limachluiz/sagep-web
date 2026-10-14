import { useEffect, useRef, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Download, ChevronDown, ChevronRight, ChevronUp, ChevronsDownUp, ChevronsUpDown, Circle, FileSignature, FileText, Plus, Save, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { DeliveryEvidenceSelection } from "./delivery-evidence-selection"
import { invalidateProjectFlow } from "../project-flow-cache"
import { projectsService } from "../projects.service"
import type { DeliveryReportDraft, DeliveryReportSection } from "../projects.types"

const technicalPlaceholder = "Registre aplicação, capacidade, tecnologia, localização, forma de instalação e contribuição deste item para a solução entregue."

export function DeliveryReportBuilder({ projectId, canManage, finalization, onDirtyChange }: { projectId: string; canManage: boolean; finalization?: ReactNode; onDirtyChange?: (dirty: boolean) => void }) {
  const client = useQueryClient()
  const moduleScroll = useRef<HTMLDivElement>(null)
  const query = useQuery({ queryKey: ["delivery-report-draft", projectId], queryFn: () => projectsService.deliveryReportDraft(projectId) })
  const [activeModule, setActiveModule] = useState("data")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [downloadPending, setDownloadPending] = useState<"pdf" | "doc" | null>(null)
  const [previewPending, setPreviewPending] = useState(false)
  const [editedDraft, setEditedDraft] = useState<DeliveryReportDraft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const draft = editedDraft ?? query.data?.draft ?? null

  useEffect(() => { if (moduleScroll.current) moduleScroll.current.scrollTop = 0 }, [activeModule])
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])
  const preview = async () => {
    if (!draft) return
    setPreviewPending(true)
    try { setPreviewUrl(URL.createObjectURL(await projectsService.previewDeliveryReport(projectId, draft))) }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a prévia.") }
    finally { setPreviewPending(false) }
  }
  const downloadForApproval = async (format: "pdf" | "doc") => {
    if (!draft) return
    setDownloadPending(format)
    try {
      const blob = await projectsService.previewDeliveryReport(projectId, draft, format)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `para-aprovacao-PRJ-${query.data?.project.projectCode}.${format}`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível baixar a versão para aprovação.") }
    finally { setDownloadPending(null) }
  }
  const save = useMutation({
    mutationFn: () => projectsService.updateDeliveryReportDraft(projectId, draft!),
    onSuccess: async (data) => {
      setEditedDraft(data.draft)
      setDirty(false)
      client.setQueryData(["delivery-report-draft", projectId], data)
      await invalidateProjectFlow(client)
      toast.success("Memória técnica salva. Gere uma nova versão do relatório após concluir a revisão.")
    },
    onError: (error) => toast.error(error.message),
  })

  if (query.isError) return <Alert variant="destructive"><FileText /><AlertTitle>Não foi possível carregar a memória técnica</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>
  if (!draft || !query.data) return <Skeleton className="h-96" />

  const included = draft.sections.filter((section) => section.included)
  const reviewed = included.filter((section) => section.reviewed && section.content.trim()).length
  const documented = draft.itemDetails.filter((item) => item.technicalDescription.trim()).length
  const totalChecks = included.length + draft.itemDetails.length
  const progress = totalChecks ? Math.round(((reviewed + documented) / totalChecks) * 100) : 0
  const moduleIds = ["data", ...draft.sections.map((section) => section.key), "items", "evidence", "formalization", "final"]
  const moduleIndex = moduleIds.indexOf(activeModule)
  const change = (next: DeliveryReportDraft) => { setEditedDraft(next); setDirty(true) }
  const updateSection = (index: number, values: Partial<DeliveryReportSection>) => change({ ...draft, sections: draft.sections.map((section, itemIndex) => itemIndex === index ? { ...section, ...values } : section) })
  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= draft.sections.length) return
    const sections = [...draft.sections]
    ;[sections[index], sections[target]] = [sections[target]!, sections[index]!]
    change({ ...draft, sections })
  }
  const addSection = () => { const key = `custom-${Date.now()}`; change({ ...draft, sections: [...draft.sections, { key, title: "Novo bloco técnico", content: "", included: true, reviewed: false }] }); setActiveModule(key) }
  const applySuggestions = () => change({ ...draft, itemDetails: draft.itemDetails.map((detail) => ({ ...detail, technicalDescription: detail.technicalDescription.trim() || query.data.items.find((item) => item.itemId === detail.itemId)?.suggestedTechnicalDescription || "" })) })
  const toggleExpanded = (current: Set<string>, key: string, update: (next: Set<string>) => void) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); update(next) }

  return <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-none shadow-sm">
    <CardHeader className="shrink-0 gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><CardTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" />Construtor da memória técnica</CardTitle><CardDescription className="mt-2 max-w-3xl">Monte e revise cada bloco antes de gerar o documento. Alterar e salvar a memória técnica invalida o PDF e a assinatura da versão anterior.</CardDescription></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void preview()} disabled={previewPending}><FileText />{previewPending ? "Preparando prévia..." : "Visualizar prévia atual"}</Button>
        {(["doc", "pdf"] as const).map((format) => <Button key={format} variant="outline" disabled={downloadPending !== null} onClick={() => void downloadForApproval(format)}><Download />{downloadPending === format ? "Preparando..." : `Para aprovação (.${format})`}</Button>)}
      </div>
    </CardHeader>
    <CardContent className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-5 lg:grid-cols-[230px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <nav aria-label="Módulos da entrega técnica" className="flex min-h-0 gap-2 overflow-x-auto rounded-xl bg-muted/30 p-3 lg:flex-col lg:overflow-y-auto">
        {[{ id: "data", title: "Dados do projeto" }, ...draft.sections.map((section) => ({ id: section.key, title: section.title })), { id: "items", title: "Itens executados" }, { id: "evidence", title: "Evidências e anexos" }, { id: "formalization", title: "Formalização" }, { id: "final", title: "Emissão e aprovação" }].map((module) => <Button key={module.id} variant={activeModule === module.id ? "default" : "ghost"} className="h-auto shrink-0 justify-start whitespace-normal text-left" aria-current={activeModule === module.id ? "step" : undefined} onClick={() => setActiveModule(module.id)}>{module.title}</Button>)}
      </nav>
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
      <div ref={moduleScroll} role="region" aria-label="Conteúdo do módulo de entrega" tabIndex={0} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pr-2">
      {activeModule === "data" && <div className="space-y-4"><h3 className="font-semibold">Dados do projeto e preparação</h3><p className="text-sm text-muted-foreground">Avance pelos módulos laterais, revise os textos e salve ao final de cada módulo. A prévia pode ser consultada a qualquer momento, inclusive antes de salvar.</p><p className="font-medium">PRJ-{query.data.project.projectCode} · {query.data.project.title}</p><div className="grid gap-3 sm:grid-cols-3">{Object.entries(query.data.documents).map(([key, document]) => <div key={key} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{key === "estimate" ? "Estimativa" : key === "diex" ? "DIEx" : "Ordem de Serviço"}</p><p>{document?.code ?? "Em branco"}</p></div>)}</div></div>}
      {activeModule === "evidence" && <DeliveryEvidenceSelection projectId={projectId} canManage={canManage} />}
      {activeModule === "final" && <>{dirty && <Alert><AlertTitle>Alterações ainda não salvas</AlertTitle><AlertDescription>Salve a memória técnica no final deste módulo antes de emitir ou aprovar o documento.</AlertDescription></Alert>}<fieldset disabled={dirty} className={dirty ? "opacity-60" : ""}>{finalization}</fieldset></>}
      {activeModule === "data" && <>
      <div className="rounded-xl border bg-muted/20 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">Preparação do documento</p><p className="text-sm text-muted-foreground">{reviewed} de {included.length} blocos revisados · {documented} de {draft.itemDetails.length} itens documentados</p></div><Badge variant={progress === 100 ? "default" : "secondary"}>{progress}% preparado</Badge></div><Progress value={progress} className="mt-3" /></div>

      </>}
      {draft.sections.some((section) => section.key === activeModule) && <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Blocos do relatório</h3><p className="text-sm text-muted-foreground">Revise o conteúdo deste módulo e confirme a revisão antes da emissão final.</p></div><div className="flex flex-wrap gap-2">{canManage && <Button variant="outline" size="sm" onClick={addSection}><Plus />Adicionar bloco</Button>}</div></div>
        {draft.sections.map((section, index) => section.key !== activeModule ? null : <div key={section.key} className={`rounded-xl border p-4 ${section.included ? "" : "bg-muted/30 opacity-70"}`}>
          <div className="flex flex-wrap items-start gap-3"><label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={section.included} disabled={!canManage} onChange={(event) => updateSection(index, { included: event.target.checked, reviewed: event.target.checked ? section.reviewed : false })} />Incluir</label><Input className="min-w-56 flex-1 font-medium" value={section.title} disabled={!canManage} onChange={(event) => updateSection(index, { title: event.target.value, reviewed: false })} /><div className="flex gap-1">{section.reviewed && <Badge className="mr-1 gap-1"><CheckCircle2 className="size-3" />Revisado</Badge>}<Button type="button" variant="ghost" size="icon-sm" title="Mover para cima" disabled={!canManage || index === 0} onClick={() => moveSection(index, -1)}><ChevronUp /></Button><Button type="button" variant="ghost" size="icon-sm" title="Mover para baixo" disabled={!canManage || index === draft.sections.length - 1} onClick={() => moveSection(index, 1)}><ChevronDown /></Button>{section.key.startsWith("custom-") && <Button type="button" variant="ghost" size="icon-sm" title="Remover bloco" disabled={!canManage} onClick={() => { change({ ...draft, sections: draft.sections.filter((_, itemIndex) => itemIndex !== index) }); setActiveModule("data") }}><Trash2 /></Button>}</div></div>
          {section.included && <><Textarea className="mt-3 min-h-36" value={section.content} disabled={!canManage} placeholder="Redija o conteúdo técnico deste bloco em linguagem formal e objetiva." onChange={(event) => updateSection(index, { content: event.target.value, reviewed: false })} /><div className="mt-3 flex justify-end"><Button type="button" size="sm" variant={section.reviewed ? "default" : "outline"} disabled={!canManage || !section.content.trim()} onClick={() => updateSection(index, { reviewed: !section.reviewed })}>{section.reviewed ? <CheckCircle2 /> : <Circle />}{section.reviewed ? "Bloco revisado" : "Marcar como revisado"}</Button></div></>}
        </div>)}
      </div>}
      {activeModule === "items" && <div className="space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Memória técnica dos itens executados</h3><p className="text-sm text-muted-foreground">O SAGEP analisa cada item e sugere um texto inicial com as características realmente registradas. Todo conteúdo permanece editável.</p></div><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => setExpandedItems(new Set(query.data.items.map((item) => item.itemId)))}><ChevronsUpDown />Expandir itens</Button><Button variant="ghost" size="sm" onClick={() => setExpandedItems(new Set())}><ChevronsDownUp />Recolher itens</Button>{canManage && <Button type="button" variant="outline" size="sm" onClick={applySuggestions}><Sparkles />Preencher textos sugeridos</Button>}</div></div>
        {query.data.items.map((item) => { const detailIndex = draft.itemDetails.findIndex((detail) => detail.itemId === item.itemId); const detail = draft.itemDetails[detailIndex]; if (!detail) return null; const expanded = expandedItems.has(item.itemId); return <div key={item.itemId} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex max-w-4xl items-start gap-2"><Button type="button" variant="ghost" size="icon-sm" title={expanded ? "Recolher item" : "Expandir item"} onClick={() => toggleExpanded(expandedItems, item.itemId, setExpandedItems)}>{expanded ? <ChevronDown /> : <ChevronRight />}</Button><div><Badge variant="outline">Item {item.itemCode}</Badge><p className="mt-2 text-sm font-medium">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">Origem: {item.sourceQuantity} {item.sourceUnit} · Valor total: {Number(item.totalPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div></div>{detail.technicalDescription.trim() && <Badge className="gap-1"><CheckCircle2 className="size-3" />Documentado</Badge>}</div>{expanded && <div className="mt-4 grid gap-4 sm:grid-cols-[140px_160px_1fr]"><div className="space-y-2"><Label>Unidade no relatório</Label><Input value={detail.unit} disabled={!canManage} placeholder="m ou Und." onChange={(event) => change({ ...draft, itemDetails: draft.itemDetails.map((value, index) => index === detailIndex ? { ...value, unit: event.target.value } : value) })} /></div><div className="space-y-2"><Label>Quantidade executada</Label><Input value={detail.quantity} disabled={!canManage} inputMode="decimal" onChange={(event) => change({ ...draft, itemDetails: draft.itemDetails.map((value, index) => index === detailIndex ? { ...value, quantity: event.target.value } : value) })} /></div><div className="space-y-2"><div className="flex items-center justify-between gap-2"><Label>Descrição técnica aplicada</Label>{canManage && <Button type="button" variant="ghost" size="sm" onClick={() => change({ ...draft, itemDetails: draft.itemDetails.map((value, index) => index === detailIndex ? { ...value, technicalDescription: item.suggestedTechnicalDescription } : value) })}><Sparkles />Usar sugestão</Button>}</div><Textarea className="min-h-36" value={detail.technicalDescription} disabled={!canManage} placeholder={technicalPlaceholder} onChange={(event) => change({ ...draft, itemDetails: draft.itemDetails.map((value, index) => index === detailIndex ? { ...value, technicalDescription: event.target.value } : value) })} /><p className="text-xs text-muted-foreground">Sugestão produzida somente a partir da descrição, unidade e quantidade deste item.</p></div></div>}</div> })}
      </div>}
      {activeModule === "formalization" && <div className="space-y-4 rounded-xl border p-4"><div><h3 className="flex items-center gap-2 font-semibold"><FileSignature className="size-4 text-primary" />Formalização e ciência da OM</h3><p className="mt-1 text-sm text-muted-foreground">A ciência registra a disponibilização da solução, mas não substitui o recebimento provisório ou definitivo quando exigido pela legislação ou pelo contrato.</p></div><label className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4 text-sm"><input className="mt-1" type="checkbox" checked={draft.formalization.requiresOmAcknowledgement} disabled={!canManage} onChange={(event) => change({ ...draft, formalization: { ...draft.formalization, requiresOmAcknowledgement: event.target.checked } })} /><span><b>Incluir ciência da Organização Militar</b><br /><span className="text-muted-foreground">Adiciona ao documento a identificação e o campo de ciência de quem receberá a solução na OM atendida.</span></span></label>{draft.formalization.requiresOmAcknowledgement && <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Nome do recebedor</Label><Input value={draft.formalization.recipientName} disabled={!canManage} onChange={(event) => change({ ...draft, formalization: { ...draft.formalization, recipientName: event.target.value } })} /></div><div className="space-y-2"><Label>Posto ou graduação</Label><Input value={draft.formalization.recipientRank} disabled={!canManage} onChange={(event) => change({ ...draft, formalization: { ...draft.formalization, recipientRank: event.target.value } })} /></div><div className="space-y-2"><Label>Função</Label><Input value={draft.formalization.recipientRole} disabled={!canManage} placeholder="Ex.: Fiscal do contrato ou Chefe da Seção de TI" onChange={(event) => change({ ...draft, formalization: { ...draft.formalization, recipientRole: event.target.value } })} /></div><div className="space-y-2"><Label>Organização Militar</Label><Input value={draft.formalization.recipientOrganization} disabled={!canManage} onChange={(event) => change({ ...draft, formalization: { ...draft.formalization, recipientOrganization: event.target.value } })} /></div><div className="space-y-2 md:col-span-2"><Label>Observações da ciência</Label><Textarea value={draft.formalization.acknowledgementNotes} disabled={!canManage} placeholder="Ressalvas, orientações repassadas ou condições da entrega." onChange={(event) => change({ ...draft, formalization: { ...draft.formalization, acknowledgementNotes: event.target.value } })} /></div></div>}</div>
      }
      {previewUrl && <section className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-semibold">Prévia do documento em elaboração</h3><Button variant="ghost" onClick={() => setPreviewUrl(null)}>Fechar prévia</Button></div><p className="text-xs text-muted-foreground">Prévia da última atualização. Clique em “Visualizar prévia atual” após editar para conferir as alterações.</p><iframe title="Prévia da entrega técnica" src={previewUrl} className="h-[70vh] w-full rounded-xl border" /></section>}
      </div>
      <div className="shrink-0 space-y-3 bg-card pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4"><p className="text-xs text-muted-foreground">{dirty ? "Há alterações não salvas." : "Documento salvo. Continue pelo próximo módulo."}</p>{canManage && <Button onClick={() => save.mutate()} disabled={save.isPending}><Save />{save.isPending ? "Salvando..." : "Salvar memória técnica"}</Button>}</div>
      <div className="flex justify-between gap-3"><Button variant="outline" disabled={moduleIndex <= 0} onClick={() => setActiveModule(moduleIds[moduleIndex - 1])}><ChevronUp />Módulo anterior</Button><Button variant="outline" disabled={moduleIndex === moduleIds.length - 1} onClick={() => setActiveModule(moduleIds[moduleIndex + 1])}>Próximo módulo<ChevronRight /></Button></div>
      </div></div></div>

    </CardContent>
  </Card>
}
