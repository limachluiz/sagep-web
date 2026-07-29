import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

export type ProjectExecutionStepKey =
  | "execution"
  | "as-built-receipt"
  | "as-built-review"
  | "invoice"
  | "completion"

export type ProjectExecutionStep = {
  key: ProjectExecutionStepKey
  label: string
  description: string
  date: string | null
  completed: boolean
  current: boolean
  rejected: boolean
}

export function dateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : undefined
}

export function buildProjectExecutionFlow(
  details: ProjectDetailsResponse,
): ProjectExecutionStep[] {
  const milestones = details.workflow.milestones
  const rejected = Boolean(
    milestones.asBuiltRejectedAt && !milestones.asBuiltApprovedAt,
  )
  const steps: Array<Omit<ProjectExecutionStep, "current">> = [
    {
      key: "execution",
      label: "Início da execução",
      description: "Serviço iniciado a partir da Ordem de Serviço.",
      date: milestones.executionStartedAt,
      completed: Boolean(milestones.executionStartedAt),
      rejected: false,
    },
    {
      key: "as-built-receipt",
      label: "Recebimento do As-Built",
      description: rejected
        ? "Documento devolvido; aguarda nova entrega da contratada."
        : "Documentação executiva recebida para análise técnica.",
      date: milestones.asBuiltReceivedAt,
      completed: Boolean(milestones.asBuiltReceivedAt),
      rejected,
    },
    {
      key: "as-built-review",
      label: "Análise técnica",
      description: milestones.asBuiltApprovedAt
        ? "As-Built aprovado e vinculado ao projeto."
        : rejected
          ? "As-Built reprovado e devolvido para correção."
          : "Conferência técnica e decisão sobre o As-Built.",
      date:
        milestones.asBuiltApprovedAt ??
        milestones.asBuiltRejectedAt ??
        milestones.asBuiltReviewedAt,
      completed: Boolean(milestones.asBuiltApprovedAt),
      rejected,
    },
    {
      key: "invoice",
      label: "Atesto da Nota Fiscal",
      description: "Recebimento definitivo e atesto financeiro registrados.",
      date: milestones.invoiceAttestedAt,
      completed: Boolean(milestones.invoiceAttestedAt),
      rejected: false,
    },
    {
      key: "completion",
      label: "Conclusão do projeto",
      description: "Workflow encerrado e resultado consolidado.",
      date: milestones.serviceCompletedAt,
      completed: Boolean(milestones.serviceCompletedAt),
      rejected: false,
    },
  ]

  const currentKey: ProjectExecutionStepKey | null =
    details.workflow.stage === "OS_LIBERADA" ||
    details.workflow.stage === "AGUARDANDO_OS_ASSINADA" ||
    details.workflow.stage === "AGUARDANDO_INICIO_EXECUCAO"
      ? "execution"
      : details.workflow.stage === "SERVICO_EM_EXECUCAO"
        ? "as-built-receipt"
        : details.workflow.stage === "ANALISANDO_AS_BUILT"
          ? "as-built-review"
          : details.workflow.stage === "ATESTAR_NF"
            ? milestones.invoiceAttestedAt
              ? "completion"
              : "invoice"
            : null

  return steps.map((step) => ({
    ...step,
    current: step.key === currentKey,
  }))
}
