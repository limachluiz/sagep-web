import { describe, expect, it } from "vitest"

import {
  calculateProjectFinancialBalance,
  projectDocumentCompletion,
} from "@/features/projects/project-financial-summary"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

const summary = {
  estimatesCount: 2,
  finalizedEstimatesCount: 1,
  diexRequestsCount: 1,
  serviceOrdersCount: 1,
  estimatedTotalAmount: "12500.00",
  finalizedEstimatedTotalAmount: "10000.00",
  diexTotalAmount: "9800.00",
  serviceOrderTotalAmount: "9500.00",
} satisfies ProjectDetailsResponse["financialSummary"]

describe("resumo financeiro do projeto", () => {
  it("calcula o saldo entre a estimativa finalizada e as ordens emitidas", () => {
    expect(calculateProjectFinancialBalance(summary)).toBe(500)
  })

  it("calcula o avanço documental sem contar rascunhos como nova etapa", () => {
    expect(projectDocumentCompletion(summary)).toEqual({
      completedSteps: 3,
      expectedSteps: 3,
      percentage: 100,
    })
  })
})
