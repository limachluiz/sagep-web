import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

export function calculateProjectFinancialBalance(
  summary: ProjectDetailsResponse["financialSummary"],
) {
  return Number(summary.finalizedEstimatedTotalAmount) - Number(summary.serviceOrderTotalAmount)
}

export function projectDocumentCompletion(
  summary: ProjectDetailsResponse["financialSummary"],
) {
  const expectedSteps = 3
  const completedSteps = [
    summary.finalizedEstimatesCount > 0,
    summary.diexRequestsCount > 0,
    summary.serviceOrdersCount > 0,
  ].filter(Boolean).length

  return {
    completedSteps,
    expectedSteps,
    percentage: Math.round((completedSteps / expectedSteps) * 100),
  }
}
