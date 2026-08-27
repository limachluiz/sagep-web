import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Download, FileSignature } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EvidencesPanel } from "@/features/evidences/components/evidences-panel"
import { projectsService } from "../projects.service"
import type { ProjectDetailsResponse } from "../projects.types"
import { DeliveryReportBuilder } from "./delivery-report-builder"

function save(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url) }
function formatDateOnly(value: string) { const [year, month, day] = value.slice(0, 10).split("-"); return year && month && day ? `${day}/${month}/${year}` : value }

export function ProjectDeliveryPanel({ details, canManage }: { details: ProjectDetailsResponse; canManage: boolean }) {
  const client = useQueryClient(); const [signedAt, setSignedAt] = useState(new Date().toISOString().slice(0, 10)); const [signedLink, setSignedLink] = useState(""); const [awaitingNewSignature, setAwaitingNewSignature] = useState(false)
  const draftQuery = useQuery({ queryKey: ["delivery-report-draft", details.project.id], queryFn: () => projectsService.deliveryReportDraft(details.project.id), enabled: details.workflow.stage === "ENTREGA_TECNICA" || details.workflow.stage === "SERVICO_CONCLUIDO" })
  const generatedAt = details.workflow.milestones.deliveryReportGeneratedAt; const registeredAt = awaitingNewSignature ? null : details.workflow.milestones.deliveryReportSignedAt
  const generate = useMutation({ mutationFn: () => projectsService.generateDeliveryReport(details.project.id), onSuccess: async (blob) => { setAwaitingNewSignature(true); save(blob, `relatorio-entrega-PRJ-${details.project.projectCode}.pdf`); await client.invalidateQueries({ queryKey: ["projects"] }); toast.success("Nova versão gerada. Revise e confirme novamente a assinatura.") }, onError: (error) => toast.error(error.message) })
  const signature = useMutation({ mutationFn: () => projectsService.registerDeliveryReportSignature(details.project.id, { signedAt, ...(signedLink ? { signedLink } : {}) }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["projects"] }); setAwaitingNewSignature(false); toast.success("Revisão e assinatura registradas.") }, onError: (error) => toast.error(error.message) })
  const deliveryStage = details.workflow.stage === "ENTREGA_TECNICA" || details.workflow.stage === "SERVICO_CONCLUIDO"
  const deliveryEditable = canManage && !details.project.archivedAt && details.workflow.stage === "ENTREGA_TECNICA"
  const readiness = draftQuery.data?.readiness
  const reportReady = Boolean(readiness && readiness.sectionsIncluded > 0 && readiness.sectionsReviewed === readiness.sectionsIncluded && readiness.itemsDocumented === readiness.totalItems)
  return <div className="space-y-5">
    {deliveryStage && <DeliveryReportBuilder projectId={details.project.id} canManage={deliveryEditable} />}
    {deliveryStage && <Card className="border-none shadow-sm"><CardHeader><CardTitle>Validação e emissão do documento</CardTitle><CardDescription>O PDF reúne a memória técnica revisada, os itens documentados e somente as evidências marcadas para inclusão. Uma nova versão invalida a assinatura anterior.</CardDescription></CardHeader><CardContent className="space-y-4">{readiness && !reportReady && details.workflow.stage === "ENTREGA_TECNICA" && <Alert><FileSignature /><AlertTitle>Preparação técnica ainda não concluída</AlertTitle><AlertDescription>Revise os {readiness.sectionsIncluded - readiness.sectionsReviewed} bloco(s) pendente(s) e documente {readiness.totalItems - readiness.itemsDocumented} item(ns) antes da emissão final.</AlertDescription></Alert>}<div className="grid gap-3 md:grid-cols-2"><Alert><Download /><AlertTitle>Geração do PDF</AlertTitle><AlertDescription>{generatedAt ? `Última geração: ${new Date(generatedAt).toLocaleString("pt-BR")}` : reportReady ? "Documento pronto para emissão." : "Aguardando conclusão da memória técnica."}</AlertDescription></Alert><Alert><FileSignature /><AlertTitle>Revisão e assinatura</AlertTitle><AlertDescription>{registeredAt ? `Registrada em ${formatDateOnly(registeredAt)}` : "Pendente para a versão atual."}</AlertDescription></Alert></div>{deliveryEditable && <div className="flex flex-wrap gap-2"><Button onClick={() => generate.mutate()} disabled={generate.isPending || !reportReady}><Download />{generate.isPending ? "Gerando..." : generatedAt ? "Gerar nova versão" : "Gerar documento para validação"}</Button></div>}{deliveryEditable && generatedAt && !registeredAt && <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-2"><div className="space-y-2"><Label>Data da assinatura</Label><Input type="date" value={signedAt} onChange={(event) => setSignedAt(event.target.value)} /></div><div className="space-y-2"><Label>Link do documento assinado (opcional)</Label><Input type="url" value={signedLink} onChange={(event) => setSignedLink(event.target.value)} placeholder="https://..." /></div><Button className="md:col-span-2 md:w-fit" onClick={() => signature.mutate()} disabled={!signedAt || signature.isPending}><CheckCircle2 />Confirmar revisão e assinatura desta versão</Button></div>}</CardContent></Card>}
    {!deliveryStage && <Alert><FileSignature /><AlertTitle>Preparação contínua</AlertTitle><AlertDescription>As evidências podem ser cadastradas durante todo o projeto. A geração do relatório será liberada na etapa de Entrega Técnica.</AlertDescription></Alert>}
    <EvidencesPanel projectId={details.project.id} canManage={canManage && !details.project.archivedAt} />
  </div>
}
