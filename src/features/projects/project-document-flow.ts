import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

export type ProjectDocumentFlowStep = {
  key: "estimate" | "credit-note" | "diex" | "commitment-note" | "service-order"
  label: string
  code: string | null
  description: string
  completed: boolean
  current: boolean
  href: string | null
  amount: string | null
}

export function getActiveWorkflowDocuments(details: ProjectDetailsResponse) {
  const estimate = details.documents.estimates.find(
    (item) => item.status === "FINALIZADA" && !item.archivedAt,
  ) ?? null
  const diex = details.documents.diexRequests.find((item) => !item.archivedAt) ?? null
  const serviceOrder = details.documents.serviceOrders.find((item) => !item.archivedAt) ?? null

  return { estimate, diex, serviceOrder }
}

export function isDiexReadyForCommitmentNote(details: ProjectDetailsResponse) {
  const { diex } = getActiveWorkflowDocuments(details)
  return Boolean(diex?.diexNumber && diex.issuedAt)
}

export function buildProjectDocumentFlow(details: ProjectDetailsResponse): ProjectDocumentFlowStep[] {
  const { estimate, diex, serviceOrder } = getActiveWorkflowDocuments(details)
  const milestones = details.workflow.milestones
  const requiredCredit = Number(details.workflow.creditFunding.requiredAmount)
  const receivedCredit = Number(details.workflow.creditFunding.receivedAmount)
  const creditNoteCount = details.workflow.creditFunding.notes.length
  const creditNoteReady = requiredCredit > 0 && receivedCredit >= requiredCredit
  const diexReady = Boolean(diex?.diexNumber && diex.issuedAt)
  const commitmentNoteReady = Boolean(
    milestones.commitmentNoteNumber || milestones.commitmentNoteReceivedAt,
  )
  const serviceOrderReady = Boolean(serviceOrder?.serviceOrderNumber && serviceOrder.issuedAt)
  const signedServiceOrderReady = Boolean(details.workflow.serviceOrderSignature?.link)

  const steps = [
    {
      key: "estimate" as const,
      label: "Estimativa",
      code: estimate ? `EST-${estimate.estimateCode}` : null,
      description: estimate ? "Finalizada e apta ao fluxo" : "Finalize uma estimativa",
      completed: Boolean(estimate),
      href: estimate ? `/estimates/${estimate.id}` : null,
      amount: estimate?.totalAmount ?? null,
    },
    {
      key: "credit-note" as const,
      label: "Nota de Crédito",
      code: details.workflow.creditFunding.notes.map((note) => note.number).join(" + ") || milestones.creditNoteNumber,
      description: creditNoteReady
        ? `${creditNoteCount} ${creditNoteCount === 1 ? "NC" : "NCs"} · crédito integral`
        : receivedCredit > 0
          ? `Crédito parcial · faltam ${(requiredCredit - receivedCredit).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
          : "Aguardando descentralização",
      completed: creditNoteReady,
      href: null,
      amount: receivedCredit > 0 ? receivedCredit.toFixed(2) : null,
    },
    {
      key: "diex" as const,
      label: "DIEx",
      code: diex?.diexNumber ?? (diex ? `DIEX-${diex.diexCode}` : null),
      description: diexReady
        ? "Emitido e saldo reservado"
        : diex
          ? "Aguardando número e emissão"
          : "Aguardando emissão",
      completed: diexReady,
      href: diex ? `/diex/${diex.id}` : null,
      amount: diex?.totalAmount ?? null,
    },
    {
      key: "commitment-note" as const,
      label: "Nota de Empenho",
      code: milestones.commitmentNoteNumber,
      description: commitmentNoteReady ? "Empenho registrado e saldo consumido" : "Aguardando empenho",
      completed: commitmentNoteReady,
      href: null,
      amount: null,
    },
    {
      key: "service-order" as const,
      label: "Ordem de Serviço",
      code: serviceOrder?.serviceOrderNumber ?? (serviceOrder ? `OS-${serviceOrder.serviceOrderCode}` : null),
      description: !serviceOrderReady
        ? "Aguardando emissão"
        : signedServiceOrderReady
          ? "Assinada e pronta para início"
          : details.workflow.serviceOrderSignature?.required
            ? "Emitida, aguardando assinatura"
            : "Emitida — registro legado",
      completed: serviceOrderReady,
      href: serviceOrder ? `/service-orders/${serviceOrder.id}` : null,
      amount: serviceOrder?.totalAmount ?? null,
    },
  ]

  const firstIncomplete = steps.findIndex((step) => !step.completed)
  return steps.map((step, index) => ({
    ...step,
    current: firstIncomplete === index,
  }))
}
