import { describe, expect, it } from "vitest"

import {
  buildProjectDocumentFlow,
  isDiexReadyForCommitmentNote,
} from "@/features/projects/project-document-flow"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

function makeDetails(diexIssued = false) {
  return {
    workflow: {
      creditFunding: {
        mode: "SINGLE",
        notes: [{
          id: "credit-note-1",
          projectId: "project-1",
          number: "2026NC000123",
          receivedAt: "2026-07-20T12:00:00.000Z",
          amount: "1500.00",
          cancelledAmount: "0.00",
          status: "ACTIVE",
          issuingManagementUnit: null,
          fundingSource: null,
          ptres: null,
          expenseNature: null,
          internalPlan: null,
          documentLink: null,
          notes: null,
          cancellationReason: null,
          cancelledAt: null,
          createdAt: "2026-07-20T12:00:00.000Z",
          updatedAt: "2026-07-20T12:00:00.000Z",
        }],
        requiredAmount: "1500.00",
        receivedAmount: "1500.00",
        overflowJustification: null,
      },
      milestones: {
        creditNoteNumber: "2026NC000123",
        creditNoteReceivedAt: "2026-07-20T12:00:00.000Z",
        commitmentNoteNumber: null,
        commitmentNoteReceivedAt: null,
      },
    },
    documents: {
      estimates: [{
        id: "estimate-1",
        estimateCode: 10,
        status: "FINALIZADA",
        totalAmount: "1500.00",
        archivedAt: null,
      }],
      diexRequests: [{
        id: "diex-1",
        diexCode: 20,
        diexNumber: diexIssued ? "001/2026" : null,
        issuedAt: diexIssued ? "2026-07-21T12:00:00.000Z" : null,
        totalAmount: "1500.00",
        archivedAt: null,
      }],
      serviceOrders: [],
    },
  } as unknown as ProjectDetailsResponse
}

describe("cadeia documental do projeto", () => {
  it("mantém o DIEx pendente enquanto a soma das NCs não cobre o projeto", () => {
    const details = makeDetails(false)
    details.workflow.creditFunding.notes[0].amount = "600.00"
    details.workflow.creditFunding.receivedAmount = "600.00"
    details.workflow.milestones.creditNoteNumber = null
    details.workflow.milestones.creditNoteReceivedAt = null

    const creditStep = buildProjectDocumentFlow(details).find((step) => step.key === "credit-note")

    expect(creditStep).toMatchObject({
      completed: false,
      current: true,
      code: "2026NC000123",
      amount: "600.00",
    })
    expect(creditStep?.description).toMatch(/faltam R\$\s900,00/)
  })

  it("mantém o DIEx como etapa atual enquanto os dados da SALC estiverem incompletos", () => {
    const details = makeDetails(false)
    const flow = buildProjectDocumentFlow(details)

    expect(isDiexReadyForCommitmentNote(details)).toBe(false)
    expect(flow.find((step) => step.key === "diex")).toMatchObject({
      completed: false,
      current: true,
      code: "DIEX-20",
    })
    expect(flow.find((step) => step.key === "commitment-note")?.current).toBe(false)
  })

  it("libera a Nota de Empenho somente após número e emissão do DIEx", () => {
    const details = makeDetails(true)
    const flow = buildProjectDocumentFlow(details)

    expect(isDiexReadyForCommitmentNote(details)).toBe(true)
    expect(flow.find((step) => step.key === "diex")?.completed).toBe(true)
    expect(flow.find((step) => step.key === "commitment-note")?.current).toBe(true)
  })
})
