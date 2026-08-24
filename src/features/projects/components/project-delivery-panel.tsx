import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

function save(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url) }

export function ProjectDeliveryPanel({ details, canManage }: { details: ProjectDetailsResponse; canManage: boolean }) {
  const client = useQueryClient(); const [signedAt, setSignedAt] = useState(new Date().toISOString().slice(0, 10)); const [signedLink, setSignedLink] = useState("")
  const generatedAt = details.workflow.milestones.deliveryReportGeneratedAt; const registeredAt = details.workflow.milestones.deliveryReportSignedAt
  const generate = useMutation({ mutationFn: () => projectsService.generateDeliveryReport(details.project.id), onSuccess: (blob) => { save(blob, `relatorio-entrega-PRJ-${details.project.projectCode}.pdf`); toast.success("Relatório gerado com as evidências selecionadas."); client.invalidateQueries({ queryKey: ["projects"] }) }, onError: (error) => toast.error(error.message) })
  const signature = useMutation({ mutationFn: () => projectsService.registerDeliveryReportSignature(details.project.id, { signedAt, ...(signedLink ? { signedLink } : {}) }), onSuccess: () => { toast.success("Revisão e assinatura registradas."); client.invalidateQueries({ queryKey: ["projects"] }) }, onError: (error) => toast.error(error.message) })
  const deliveryStage = details.workflow.stage === "ENTREGA_TECNICA" || details.workflow.stage === "SERVICO_CONCLUIDO"
  return <div className="space-y-5">
    {deliveryStage && <Card className="border-none shadow-sm"><CardHeader><CardTitle>Relatório Técnico de Conclusão e Entrega</CardTitle><CardDescription>O PDF reúne os dados do projeto e somente as evidências marcadas para inclusão.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Alert><Download /><AlertTitle>Geração do PDF</AlertTitle><AlertDescription>{generatedAt ? `Última geração: ${new Date(generatedAt).toLocaleString("pt-BR")}` : "Ainda não gerado."}</AlertDescription></Alert><Alert><FileSignature /><AlertTitle>Revisão e assinatura</AlertTitle><AlertDescription>{registeredAt ? `Registrada em ${new Date(registeredAt).toLocaleDateString("pt-BR")}` : "Pendente após a geração."}</AlertDescription></Alert></div>{canManage && <div className="flex flex-wrap gap-2"><Button onClick={() => generate.mutate()} disabled={generate.isPending}><Download />{generate.isPending ? "Gerando..." : generatedAt ? "Gerar nova versão" : "Gerar relatório PDF"}</Button></div>}{canManage && generatedAt && !registeredAt && <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-2"><div className="space-y-2"><Label>Data da assinatura</Label><Input type="date" value={signedAt} onChange={(event) => setSignedAt(event.target.value)} /></div><div className="space-y-2"><Label>Link do documento assinado (opcional)</Label><Input type="url" value={signedLink} onChange={(event) => setSignedLink(event.target.value)} placeholder="https://..." /></div><Button className="md:col-span-2 md:w-fit" onClick={() => signature.mutate()} disabled={!signedAt || signature.isPending}><CheckCircle2 />Confirmar revisão e assinatura</Button></div>}</CardContent></Card>}
    {!deliveryStage && <Alert><FileSignature /><AlertTitle>Preparação contínua</AlertTitle><AlertDescription>As evidências podem ser cadastradas durante todo o projeto. A geração do relatório será liberada na etapa de Entrega Técnica.</AlertDescription></Alert>}
    <EvidencesPanel projectId={details.project.id} canManage={canManage && !details.project.archivedAt} />
  </div>
}
