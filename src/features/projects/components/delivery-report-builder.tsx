import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, ChevronDown, ChevronUp, Circle, FileText, Plus, Save, Trash2 } from "lucide-react"
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
import { invalidateProjectFlow } from "../project-flow-cache"
import { projectsService } from "../projects.service"
import type { DeliveryReportDraft, DeliveryReportSection } from "../projects.types"

const technicalPlaceholder = "Registre aplicação, capacidade, tecnologia, localização, forma de instalação e contribuição deste item para a solução entregue."

export function DeliveryReportBuilder({ projectId, canManage }: { projectId: string; canManage: boolean }) {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ["delivery-report-draft", projectId], queryFn: () => projectsService.deliveryReportDraft(projectId) })
  const [editedDraft, setEditedDraft] = useState<DeliveryReportDraft | null>(null)
  const [dirty, setDirty] = useState(false)
  const draft = editedDraft ?? query.data?.draft ?? null

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
  const change = (next: DeliveryReportDraft) => { setEditedDraft(next); setDirty(true) }
  const updateSection = (index: number, values: Partial<DeliveryReportSection>) => change({ ...draft, sections: draft.sections.map((section, itemIndex) => itemIndex === index ? { ...section, ...values } : section) })
  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= draft.sections.length) return
    const sections = [...draft.sections]
    ;[sections[index], sections[target]] = [sections[target]!, sections[index]!]
    change({ ...draft, sections })
  }
  const addSection = () => change({ ...draft, sections: [...draft.sections, { key: `custom-${Date.now()}`, title: "Novo bloco técnico", content: "", included: true, reviewed: false }] })

  return <Card className="border-none shadow-sm">
    <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><CardTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" />Construtor da memória técnica</CardTitle><CardDescription className="mt-2 max-w-3xl">Monte e revise cada bloco antes de gerar o documento. Alterar e salvar a memória técnica invalida o PDF e a assinatura da versão anterior.</CardDescription></div>
      {canManage && <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}><Save />{save.isPending ? "Salvando..." : "Salvar memória técnica"}</Button>}
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="rounded-xl border bg-muted/20 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">Preparação do documento</p><p className="text-sm text-muted-foreground">{reviewed} de {included.length} blocos revisados · {documented} de {draft.itemDetails.length} itens documentados</p></div><Badge variant={progress === 100 ? "default" : "secondary"}>{progress}% preparado</Badge></div><Progress value={progress} className="mt-3" /></div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Blocos do relatório</h3><p className="text-sm text-muted-foreground">Edite o título, organize a ordem e marque o bloco após revisar o conteúdo.</p></div>{canManage && <Button variant="outline" size="sm" onClick={addSection}><Plus />Adicionar bloco</Button>}</div>
        {draft.sections.map((section, index) => <div key={section.key} className={`rounded-xl border p-4 ${section.included ? "" : "bg-muted/30 opacity-70"}`}>
          <div className="flex flex-wrap items-start gap-3"><label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={section.included} disabled={!canManage} onChange={(event) => updateSection(index, { included: event.target.checked, reviewed: event.target.checked ? section.reviewed : false })} />Incluir</label><Input className="min-w-56 flex-1 font-medium" value={section.title} disabled={!canManage} onChange={(event) => updateSection(index, { title: event.target.value, reviewed: false })} /><div className="flex gap-1"><Button type="button" variant="ghost" size="icon-sm" title="Mover para cima" disabled={!canManage || index === 0} onClick={() => moveSection(index, -1)}><ChevronUp /></Button><Button type="button" variant="ghost" size="icon-sm" title="Mover para baixo" disabled={!canManage || index === draft.sections.length - 1} onClick={() => moveSection(index, 1)}><ChevronDown /></Button>{section.key.startsWith("custom-") && <Button type="button" variant="ghost" size="icon-sm" title="Remover bloco" disabled={!canManage} onClick={() => change({ ...draft, sections: draft.sections.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 /></Button>}</div></div>
          {section.included && <><Textarea className="mt-3 min-h-36" value={section.content} disabled={!canManage} placeholder="Redija o conteúdo técnico deste bloco em linguagem formal e objetiva." onChange={(event) => updateSection(index, { content: event.target.value, reviewed: false })} /><div className="mt-3 flex justify-end"><Button type="button" size="sm" variant={section.reviewed ? "default" : "outline"} disabled={!canManage || !section.content.trim()} onClick={() => updateSection(index, { reviewed: !section.reviewed })}>{section.reviewed ? <CheckCircle2 /> : <Circle />}{section.reviewed ? "Bloco revisado" : "Marcar como revisado"}</Button></div></>}
        </div>)}
      </div>

      <div className="space-y-3"><div><h3 className="font-semibold">Memória técnica dos itens executados</h3><p className="text-sm text-muted-foreground">A unidade e a quantidade abaixo serão usadas no PDF no lugar da classificação genérica “SERVIÇO”.</p></div>
        {query.data.items.map((item) => { const detailIndex = draft.itemDetails.findIndex((detail) => detail.itemId === item.itemId); const detail = draft.itemDetails[detailIndex]; if (!detail) return null; return <div key={item.itemId} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="max-w-4xl"><Badge variant="outline">Item {item.itemCode}</Badge><p className="mt-2 text-sm font-medium">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">Origem: {item.sourceQuantity} {item.sourceUnit} · Valor total: {Number(item.totalPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>{detail.technicalDescription.trim() && <Badge className="gap-1"><CheckCircle2 className="size-3" />Documentado</Badge>}</div><div className="mt-4 grid gap-4 sm:grid-cols-[140px_160px_1fr]"><div className="space-y-2"><Label>Unidade no relatório</Label><Input value={detail.unit} disabled={!canManage} placeholder="m ou Und." onChange={(event) => change({ ...draft, itemDetails: draft.itemDetails.map((value, index) => index === detailIndex ? { ...value, unit: event.target.value } : value) })} /></div><div className="space-y-2"><Label>Quantidade executada</Label><Input value={detail.quantity} disabled={!canManage} inputMode="decimal" onChange={(event) => change({ ...draft, itemDetails: draft.itemDetails.map((value, index) => index === detailIndex ? { ...value, quantity: event.target.value } : value) })} /></div><div className="space-y-2"><Label>Descrição técnica aplicada</Label><Textarea className="min-h-28" value={detail.technicalDescription} disabled={!canManage} placeholder={technicalPlaceholder} onChange={(event) => change({ ...draft, itemDetails: draft.itemDetails.map((value, index) => index === detailIndex ? { ...value, technicalDescription: event.target.value } : value) })} /></div></div></div> })}
      </div>
    </CardContent>
  </Card>
}
