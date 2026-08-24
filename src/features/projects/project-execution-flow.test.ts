import { describe, expect, it } from "vitest"

import { buildProjectExecutionFlow } from "@/features/projects/project-execution-flow"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

function details(
  stage: ProjectDetailsResponse["workflow"]["stage"],
  milestones: Record<string, string | null>,
) {
  return {
    workflow: { stage, milestones },
  } as unknown as ProjectDetailsResponse
}

describe("fluxo de execução e encerramento", () => {
  it("identifica a etapa atual após o início da execução", () => {
    const flow = buildProjectExecutionFlow(
      details("SERVICO_EM_EXECUCAO", {
        executionStartedAt: "2026-07-20T00:00:00.000Z",
      }),
    )

    expect(flow.find((step) => step.key === "execution")?.completed).toBe(true)
    expect(flow.find((step) => step.current)?.key).toBe("as-built-receipt")
  })

  it("representa a devolução do As-Built como ciclo de correção", () => {
    const flow = buildProjectExecutionFlow(
      details("SERVICO_EM_EXECUCAO", {
        executionStartedAt: "2026-07-20T00:00:00.000Z",
        asBuiltReceivedAt: null,
        asBuiltApprovedAt: null,
        asBuiltRejectedAt: "2026-07-23T00:00:00.000Z",
      }),
    )

    expect(flow.find((step) => step.key === "as-built-receipt")).toMatchObject({
      current: true,
      completed: false,
      rejected: true,
    })
    expect(flow.find((step) => step.key === "as-built-review")).toMatchObject({
      completed: false,
      rejected: true,
    })
  })

  it("direciona ao encerramento depois do atesto", () => {
    const flow = buildProjectExecutionFlow(
      details("ATESTAR_NF", {
        executionStartedAt: "2026-07-20T00:00:00.000Z",
        asBuiltReceivedAt: "2026-07-22T00:00:00.000Z",
        asBuiltApprovedAt: "2026-07-23T00:00:00.000Z",
        invoiceAttestedAt: "2026-07-24T00:00:00.000Z",
      }),
    )

    expect(flow.find((step) => step.current)?.key).toBe("delivery")
    expect(flow.find((step) => step.key === "invoice")?.completed).toBe(true)
  })
})
