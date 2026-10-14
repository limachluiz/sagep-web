import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSignature,
  FileText,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { projectsService } from "../projects.service";
import type { ProjectDetailsResponse } from "../projects.types";
import { DeliveryReportBuilder } from "./delivery-report-builder";
import { openPdfPreview } from "@/lib/pdf-preview";

function formatDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function manausDateInputValue(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Manaus",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function ProjectDeliveryPanel({
  details,
  canManage,

}: {
  details: ProjectDetailsResponse;
  canManage: boolean;
  workspace?: boolean;
}) {
  const client = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "doc" | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [viewedVersion, setViewedVersion] = useState<string | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const [signedAt, setSignedAt] = useState(
    () => manausDateInputValue(),
  );
  const [signedLink, setSignedLink] = useState("");
  const [awaitingNewSignature, setAwaitingNewSignature] = useState(false);
  const draftQuery = useQuery({
    queryKey: ["delivery-report-draft", details.project.id],
    queryFn: () => projectsService.deliveryReportDraft(details.project.id),
    enabled:
      details.workflow.stage === "ENTREGA_TECNICA" ||
      details.workflow.stage === "SERVICO_CONCLUIDO",
  });
  const generatedAt = details.workflow.milestones.deliveryReportGeneratedAt;
  const registeredAt = awaitingNewSignature
    ? null
    : details.workflow.milestones.deliveryReportSignedAt;
  const generate = useMutation({
    mutationFn: () =>
      projectsService.generateDeliveryReport(details.project.id),
    onSuccess: async () => {
      setAwaitingNewSignature(true);
      setReviewConfirmed(false);
      setViewedVersion(null);
      await client.invalidateQueries({ queryKey: ["projects"] });
      toast.success(
        "Nova versão gerada. Revise o PDF aberto e confirme novamente a assinatura.",
      );
    },
  });
  const signature = useMutation({
    mutationFn: () =>
      projectsService.registerDeliveryReportSignature(details.project.id, {
        signedAt,
        ...(signedLink ? { signedLink } : {}),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["projects"] });
      setAwaitingNewSignature(false);
      toast.success("Entrega aprovada e assinatura registrada em auditoria.");
    },
    onError: (error) => toast.error(error.message),
  });
  const deliveryStage =
    details.workflow.stage === "ENTREGA_TECNICA" ||
    details.workflow.stage === "SERVICO_CONCLUIDO";
  const deliveryEditable =
    canManage &&
    !details.project.archivedAt &&
    details.workflow.stage === "ENTREGA_TECNICA";
  const readiness = draftQuery.data?.readiness;
  const reportReady = Boolean(
    readiness &&
    readiness.sectionsIncluded > 0 &&
    readiness.sectionsReviewed === readiness.sectionsIncluded &&
    readiness.itemsDocumented === readiness.totalItems,
  );
  const handleGenerate = async () => {
    try {
      await openPdfPreview(
        () => generate.mutateAsync(),
        `Relatório técnico PRJ-${details.project.projectCode}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o relatório técnico.",
      );
    }
  };
  const handleView = async () => {
    try {
      await openPdfPreview(
        () => projectsService.deliveryReportPdf(details.project.id),
        `Relatório técnico PRJ-${details.project.projectCode}`,
      );
      setViewedVersion(generatedAt);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível visualizar o relatório técnico.",
      );
    }
  };
  const handleDownload = async (format: "pdf" | "doc") => {
    setDownloading(format);
    try {
      const blob = format === "doc" ? await projectsService.deliveryReportWord(details.project.id) : await projectsService.deliveryReportPdf(details.project.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `relatorio-entrega-PRJ-${details.project.projectCode}.${format}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível baixar o relatório técnico.",
      );
    } finally { setDownloading(null); }
  };
  const finalization = (
    <div className="space-y-5">
      {deliveryStage && (
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Validação e emissão do documento</CardTitle>
            <CardDescription>
              O PDF reúne a memória técnica revisada, os itens documentados e
              somente as evidências marcadas para inclusão. Uma nova versão
              invalida a assinatura anterior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readiness &&
              !reportReady &&
              details.workflow.stage === "ENTREGA_TECNICA" && (
                <Alert>
                  <FileSignature />
                  <AlertTitle>
                    Preparação técnica ainda não concluída
                  </AlertTitle>
                  <AlertDescription>
                    Revise os{" "}
                    {readiness.sectionsIncluded - readiness.sectionsReviewed}{" "}
                    bloco(s) pendente(s) e documente{" "}
                    {readiness.totalItems - readiness.itemsDocumented} item(ns)
                    antes da emissão final.
                  </AlertDescription>
                </Alert>
              )}
            <div className="grid gap-3 md:grid-cols-2">
              <Alert>
                <FileText />
                <AlertTitle>Geração do PDF</AlertTitle>
                <AlertDescription>
                  {generatedAt
                    ? `Última geração: ${new Date(generatedAt).toLocaleString("pt-BR")}`
                    : reportReady
                      ? "Documento pronto para emissão."
                      : "Aguardando conclusão da memória técnica."}
                </AlertDescription>
              </Alert>
              <Alert>
                <FileSignature />
                <AlertTitle>Revisão e assinatura</AlertTitle>
                <AlertDescription>
                  {registeredAt
                    ? `Registrada em ${formatDateOnly(registeredAt)}`
                    : "Pendente para a versão atual."}
                </AlertDescription>
              </Alert>
            </div>
            <div className="flex flex-wrap gap-2">
              {generatedAt && (
                <>
                  <Button variant="outline" onClick={() => void handleView()}>
                    <ExternalLink />
                    Visualizar PDF emitido
                  </Button>
                  <Button
                    variant="outline"
                    disabled={downloading !== null}
                    onClick={() => void handleDownload("pdf")}
                  >
                    <Download />
                    {downloading === "pdf" ? "Preparando..." : "Baixar final (.pdf)"}
                  </Button>
                  <Button variant="outline" disabled={downloading !== null} onClick={() => void handleDownload("doc")}><Download />{downloading === "doc" ? "Preparando..." : "Baixar final (.doc)"}</Button>
                </>
              )}
              {deliveryEditable && (
                <Button
                  onClick={() => void handleGenerate()}
                  disabled={generate.isPending || !reportReady}
                >
                  <FileText />
                  {generate.isPending
                    ? "Gerando..."
                    : generatedAt
                      ? "Salvar e visualizar nova versão final"
                      : "Salvar e visualizar documento final"}
                </Button>
              )}
            </div>
            {deliveryEditable && generatedAt && !registeredAt && (
              <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data da assinatura</Label>
                  <Input
                    type="date"
                    value={signedAt}
                    min={manausDateInputValue(new Date(generatedAt))}
                    max={manausDateInputValue()}
                    onChange={(event) => setSignedAt(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link do documento assinado (opcional)</Label>
                  <Input
                    type="url"
                    value={signedLink}
                    onChange={(event) => setSignedLink(event.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <label className="flex items-start gap-3 text-sm md:col-span-2"><input type="checkbox" className="mt-1" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} /><span>Confirmo que visualizei e revisei esta versão e que a assinatura foi realizada. A aprovação será registrada em auditoria.</span></label>
                {viewedVersion !== generatedAt && <p className="text-sm text-muted-foreground md:col-span-2">Visualize o PDF emitido antes de confirmar a aprovação.</p>}
                <Button
                  className="md:col-span-2 md:w-fit"
                  onClick={() => signature.mutate()}
                  disabled={!signedAt || !reviewConfirmed || viewedVersion !== generatedAt || signature.isPending}
                >
                  <CheckCircle2 />
                  Aprovar entrega e registrar assinatura
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
  return <div className="space-y-5">
    <Card className="border-none shadow-sm">
      <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" />Entrega técnica</CardTitle><CardDescription>Prepare o documento de conclusão, confira a versão final e registre a aprovação e assinatura.</CardDescription></CardHeader>
      <CardContent className="space-y-5">
        <Alert><FileText /><AlertTitle>{registeredAt ? "Entrega aprovada e assinatura registrada" : generatedAt ? "Documento emitido: revise e aprove a versão atual" : deliveryStage ? "Próxima ação: elaborar a entrega técnica" : "Aguardando a etapa de Entrega Técnica"}</AlertTitle><AlertDescription>{deliveryStage ? "Abra o editor e avance pelos módulos laterais. As evidências já cadastradas no projeto estarão disponíveis automaticamente." : "Continue registrando as evidências durante o projeto. A elaboração será liberada após o encerramento da execução."}</AlertDescription></Alert>
        <ol className="grid list-inside list-decimal gap-3 text-sm md:grid-cols-3"><li>Elabore e salve os módulos técnicos.</li><li>Confira a prévia, selecione evidências e emita o documento final.</li><li>Visualize, assine e registre a aprovação. A confirmação fica na auditoria.</li></ol>
        {readiness && <p className="text-sm text-muted-foreground">{readiness.sectionsReviewed}/{readiness.sectionsIncluded} blocos revisados · {readiness.itemsDocumented}/{readiness.totalItems} itens documentados</p>}
        <Button disabled={!deliveryStage} onClick={() => setEditorOpen(true)}><ArrowRight />{registeredAt ? "Consultar documentação da entrega" : "Abrir editor da entrega técnica"}</Button>
      </CardContent>
    </Card>
    <Dialog open={editorOpen} onOpenChange={(open) => { if (!open && editorDirty) { toast.info("Salve a memória técnica antes de fechar o editor."); return; } setEditorOpen(open); }}>
      <DialogContent className="h-[94dvh] max-w-[96vw] overflow-y-auto sm:max-w-[96vw]" onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader><DialogTitle>Entrega técnica · PRJ-{details.project.projectCode}</DialogTitle><DialogDescription>Elabore por módulos, salve as alterações e confira a prévia antes da emissão final.</DialogDescription></DialogHeader>
        <DeliveryReportBuilder projectId={details.project.id} canManage={deliveryEditable} finalization={finalization} onDirtyChange={setEditorDirty} />
      </DialogContent>
    </Dialog>
  </div>;
}
