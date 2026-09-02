import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, CheckCircle2, Download, ExternalLink, FileSignature, FileText } from "lucide-react"
import { Link } from "react-router"
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
import { openPdfPreview } from "@/lib/pdf-preview"

function formatDateOnly(value: string) { const [year, month, day] = value.slice(0, 10).split("-"); return year && month && day ? `${day}/${month}/${year}` : value }

export function ProjectDeliveryPanel({ details, canManage, workspace = false }: { details: ProjectDetailsResponse; canManage: boolean; workspace?: boolean }) {
  const client = useQueryClient(); const [signedAt, setSignedAt] = useState(new Date().toISOString().slice(0, 10)); const [signedLink, setSignedLink] = useState(""); const [awaitingNewSignature, setAwaitingNewSignature] = useState(false)
  const draftQuery = useQuery({ queryKey: ["delivery-report-draft", details.project.id], queryFn: () => projectsService.deliveryReportDraft(details.project.id), enabled: details.workflow.stage === "ENTREGA_TECNICA" || details.workflow.stage === "SERVICO_CONCLUIDO" })
  const generatedAt = details.workflow.milestones.deliveryReportGeneratedAt; const registeredAt = awaitingNewSignature ? null : details.workflow.milestones.deliveryReportSignedAt
  const generate = useMutation({ mutationFn: () => projectsService.generateDeliveryReport(details.project.id), onSuccess: async () => { setAwaitingNewSignature(true); await client.invalidateQueries({ queryKey: ["projects"] }); toast.success("Nova versão gerada. Revise o PDF aberto e confirme novamente a assinatura.") } })
  const signature = useMutation({ mutationFn: () => projectsService.registerDeliveryReportSignature(details.project.id, { signedAt, ...(signedLink ? { signedLink } : {}) }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["projects"] }); setAwaitingNewSignature(false); toast.success("Revisão e assinatura registradas.") }, onError: (error) => toast.error(error.message) })
  const deliveryStage = details.workflow.stage === "ENTREGA_TECNICA" || details.workflow.stage === "SERVICO_CONCLUIDO"
  const deliveryEditable = canManage && !details.project.archivedAt && details.workflow.stage === "ENTREGA_TECNICA"
  const readiness = draftQuery.data?.readiness
  const reportReady = Boolean(readiness && readiness.sectionsIncluded > 0 && readiness.sectionsReviewed === readiness.sectionsIncluded && readiness.itemsDocumented === readiness.totalItems)
  const handleGenerate = async () => {
    try {
      await openPdfPreview(
        () => generate.mutateAsync(),
        `Relatório técnico PRJ-${details.project.projectCode}`,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o relatório técnico.")
    }
  }
  const handleView = async () => {
    try {
      await openPdfPreview(() => projectsService.deliveryReportPdf(details.project.id), `Relatório técnico PRJ-${details.project.projectCode}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível visualizar o relatório técnico.")
    }
  }
  const handleDownload = async () => {
    try {
      const blob = await projectsService.deliveryReportPdf(details.project.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `relatorio-entrega-PRJ-${details.project.projectCode}.pdf`
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível baixar o relatório técnico.")
    }
  }
  if (!workspace) return <div className="space-y-5"><Card className="border-none shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" />Relatório Técnico de Conclusão e Entrega</CardTitle><CardDescription>Abra o ambiente de elaboração para revisar os dados do projeto, gerar textos técnicos a partir dos itens, selecionar evidências e definir a ciência da OM.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{registeredAt ? "Documento assinado" : generatedAt ? "Versão gerada, aguardando assinatura" : reportReady ? "Pronto para emissão" : "Preparação pendente"}</p>{readiness && <p className="mt-1 text-sm text-muted-foreground">{readiness.sectionsReviewed}/{readiness.sectionsIncluded} blocos revisados · {readiness.itemsDocumented}/{readiness.totalItems} itens documentados</p>}</div>{deliveryStage ? <Button asChild><Link to={`/projects/${details.project.id}/delivery-report`}>Abrir Entrega Técnica<ArrowRight /></Link></Button> : <Button disabled>Disponível na Entrega Técnica</Button>}</CardContent></Card><EvidencesPanel projectId={details.project.id} canManage={canManage && !details.project.archivedAt} /></div>
  return <div className="space-y-5">
    {deliveryStage && <DeliveryReportBuilder projectId={details.project.id} canManage={deliveryEditable} />}
    {deliveryStage && <Card className="border-none shadow-sm"><CardHeader><CardTitle>Validação e emissão do documento</CardTitle><CardDescription>O PDF reúne a memória técnica revisada, os itens documentados e somente as evidências marcadas para inclusão. Uma nova versão invalida a assinatura anterior.</CardDescription></CardHeader><CardContent className="space-y-4">{readiness && !reportReady && details.workflow.stage === "ENTREGA_TECNICA" && <Alert><FileSignature /><AlertTitle>Preparação técnica ainda não concluída</AlertTitle><AlertDescription>Revise os {readiness.sectionsIncluded - readiness.sectionsReviewed} bloco(s) pendente(s) e documente {readiness.totalItems - readiness.itemsDocumented} item(ns) antes da emissão final.</AlertDescription></Alert>}<div className="grid gap-3 md:grid-cols-2"><Alert><FileText /><AlertTitle>Geração do PDF</AlertTitle><AlertDescription>{generatedAt ? `Última geração: ${new Date(generatedAt).toLocaleString("pt-BR")}` : reportReady ? "Documento pronto para emissão." : "Aguardando conclusão da memória técnica."}</AlertDescription></Alert><Alert><FileSignature /><AlertTitle>Revisão e assinatura</AlertTitle><AlertDescription>{registeredAt ? `Registrada em ${formatDateOnly(registeredAt)}` : "Pendente para a versão atual."}</AlertDescription></Alert></div><div className="flex flex-wrap gap-2">{generatedAt && <><Button variant="outline" onClick={() => void handleView()}><ExternalLink />Visualizar PDF emitido</Button><Button variant="outline" onClick={() => void handleDownload()}><Download />Baixar PDF</Button></>}{deliveryEditable && <Button onClick={() => void handleGenerate()} disabled={generate.isPending || !reportReady}><FileText />{generate.isPending ? "Gerando..." : generatedAt ? "Gerar e visualizar nova versão" : "Gerar e visualizar PDF"}</Button>}</div>{deliveryEditable && generatedAt && !registeredAt && <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-2"><div className="space-y-2"><Label>Data da assinatura</Label><Input type="date" value={signedAt} onChange={(event) => setSignedAt(event.target.value)} /></div><div className="space-y-2"><Label>Link do documento assinado (opcional)</Label><Input type="url" value={signedLink} onChange={(event) => setSignedLink(event.target.value)} placeholder="https://..." /></div><Button className="md:col-span-2 md:w-fit" onClick={() => signature.mutate()} disabled={!signedAt || signature.isPending}><CheckCircle2 />Confirmar revisão e assinatura desta versão</Button></div>}</CardContent></Card>}
    {!deliveryStage && <Alert><FileSignature /><AlertTitle>Preparação contínua</AlertTitle><AlertDescription>As evidências podem ser cadastradas durante todo o projeto. A geração do relatório será liberada na etapa de Entrega Técnica.</AlertDescription></Alert>}
    <EvidencesPanel projectId={details.project.id} canManage={canManage && !details.project.archivedAt} />
  </div>
}
