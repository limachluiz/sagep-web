import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileSignature,
  FileCheck2,
  FileSearch,
  PackageCheck,
  Play,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  buildProjectExecutionFlow,
  type ProjectExecutionStepKey,
} from "@/features/projects/project-execution-flow"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

const stepIcons = {
  execution: Play,
  "as-built-receipt": PackageCheck,
  "as-built-review": FileSearch,
  invoice: ReceiptText,
  delivery: FileCheck2,
  completion: ShieldCheck,
} satisfies Record<ProjectExecutionStepKey, typeof Play>

function formatDate(value: string | null) {
  if (!value) return "Pendente"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    new Date(value),
  )
}

export type ProjectExecutionActions = {
  registerSignedServiceOrder?: () => void
  startExecution?: () => void
  receiveAsBuilt?: () => void
  reviewAsBuilt?: () => void
  attestInvoice?: () => void
  completeService?: () => void
}

export function ProjectExecutionPanel({
  details,
  actions = {},
}: {
  details: ProjectDetailsResponse
  actions?: ProjectExecutionActions
}) {
  const steps = buildProjectExecutionFlow(details)
  const milestones = details.workflow.milestones
  const rejected = Boolean(
    milestones.asBuiltRejectedAt && !milestones.asBuiltApprovedAt,
  )
  const currentAction =
    actions.completeService ??
    actions.attestInvoice ??
    actions.reviewAsBuilt ??
    actions.receiveAsBuilt ??
    actions.registerSignedServiceOrder ??
    actions.startExecution
  const currentActionLabel = actions.completeService
    ? "Concluir projeto"
    : actions.attestInvoice
      ? "Atestar Nota Fiscal"
      : actions.reviewAsBuilt
        ? "Analisar As-Built"
        : actions.receiveAsBuilt
          ? rejected
            ? "Registrar nova entrega do As-Built"
            : "Receber As-Built"
          : actions.startExecution
            ? "Iniciar execução"
            : actions.registerSignedServiceOrder
              ? "Registrar OS assinada"
            : null

  return (
    <div className="space-y-6">
      {rejected && (
        <Alert variant="destructive">
          <RotateCcw />
          <AlertTitle>As-Built devolvido para correção</AlertTitle>
          <AlertDescription>
            {milestones.asBuiltRejectionReason ||
              "A contratada deve corrigir a documentação e realizar uma nova entrega."}
          </AlertDescription>
        </Alert>
      )}

      {details.operationalSummary.openTasksCount > 0 &&
        details.workflow.stage !== "SERVICO_CONCLUIDO" && (
          <Alert>
            <AlertTriangle />
            <AlertTitle>
              {details.operationalSummary.openTasksCount} tarefa(s) ainda aberta(s)
            </AlertTitle>
            <AlertDescription>
              Revise as atividades operacionais antes da conclusão definitiva do
              projeto.
            </AlertDescription>
          </Alert>
        )}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Controle da execução e encerramento</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Marcos técnicos e financeiros posteriores à emissão da Ordem de
              Serviço.
            </p>
          </div>
          {details.workflow.stage === "SERVICO_CONCLUIDO" && (
            <Badge className="shrink-0">
              <CheckCircle2 className="size-3.5" />
              Encerrado
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <ol
            className="grid gap-3 lg:grid-cols-5"
            aria-label="Etapas de execução e encerramento"
          >
            {steps.map((step, index) => {
              const Icon = stepIcons[step.key]
              return (
                <li
                  key={step.key}
                  aria-current={step.current ? "step" : undefined}
                  className={`rounded-xl border p-4 ${
                    step.rejected
                      ? "border-destructive/40 bg-destructive/5"
                      : step.current
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : step.completed
                          ? "border-primary/20"
                          : "bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-xl ${
                        step.rejected
                          ? "bg-destructive text-destructive-foreground"
                          : step.completed
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.rejected ? (
                        <RotateCcw className="size-4" />
                      ) : step.completed ? (
                        <CheckCircle2 className="size-4" />
                      ) : step.current ? (
                        <Icon className="size-4" />
                      ) : (
                        <Circle className="size-4" />
                      )}
                    </span>
                    <Badge
                      variant={
                        step.rejected
                          ? "destructive"
                          : step.completed
                            ? "default"
                            : step.current
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {step.rejected
                        ? "Correção"
                        : step.completed
                          ? "Concluído"
                          : step.current
                            ? "Atual"
                            : "Pendente"}
                    </Badge>
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {index + 1}. {step.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(step.date)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              )
            })}
          </ol>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {details.workflow.nextAction.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {details.workflow.nextAction.description}
              </p>
            </div>
            {currentAction && currentActionLabel && (
              <Button onClick={currentAction} className="shrink-0">
                {currentActionLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="size-5 text-primary" />
              Ordem de Serviço assinada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {details.workflow.serviceOrderSignature.link ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-medium">Documento recebido e vinculado</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recebido em {formatDate(details.workflow.serviceOrderSignature.receivedAt)}
                  {details.workflow.serviceOrderSignature.registeredBy
                    ? ` · registrado por ${details.workflow.serviceOrderSignature.registeredBy.name}`
                    : ""}
                </p>
                {details.workflow.serviceOrderSignature.notes && (
                  <p className="mt-3 text-sm">
                    {details.workflow.serviceOrderSignature.notes}
                  </p>
                )}
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <a
                    href={details.workflow.serviceOrderSignature.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir OS assinada
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <FileSignature className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">OS assinada pendente</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  O início da execução será liberado após o vínculo da versão assinada.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="size-5 text-primary" />
              Evidência As-Built
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestones.asBuiltLink ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="font-medium">Documento aprovado e vinculado</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  A evidência permanece disponível no histórico do projeto.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <a
                    href={milestones.asBuiltLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir As-Built
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <FileSearch className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  Nenhum As-Built aprovado
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  O link será registrado durante a aprovação técnica.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="size-5 text-primary" />
              Fechamento operacional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 rounded-xl border p-3">
              <span className="text-muted-foreground">Tarefas abertas</span>
              <span className="font-semibold">
                {details.operationalSummary.openTasksCount}
              </span>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border p-3">
              <span className="text-muted-foreground">Atesto da NF</span>
              <span className="text-right font-semibold">
                {formatDate(milestones.invoiceAttestedAt)}
              </span>
            </div>
            <div className="flex justify-between gap-4 rounded-xl border p-3">
              <span className="text-muted-foreground">Conclusão</span>
              <span className="text-right font-semibold">
                {formatDate(milestones.serviceCompletedAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
