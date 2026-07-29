import { describe, expect, it } from "vitest"

import {
  buildProjectDocumentFlow,
  isDiexReadyForCommitmentNote,
} from "@/features/projects/project-document-flow"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

function makeDetails(diexIssued = false) {
  return {
    workflow: {
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
