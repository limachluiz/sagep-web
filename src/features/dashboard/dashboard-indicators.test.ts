import { describe, expect, it } from "vitest"

import { executiveIndicators, operationalIndicators, percentage } from "./dashboard-indicators"
import type { DashboardExecutiveResponse, DashboardOperationalResponse } from "./dashboard.types"

describe("dashboard indicators", () => {
  it("calcula percentuais com proteção para divisão por zero", () => {
    expect(percentage(25, 100)).toBe(25)
    expect(percentage(1, 3)).toBe(33.3)
    expect(percentage(20, 0)).toBe(0)
  })

  it("consolida conversões executivas", () => {
    const data = {
      summary: { projectsTotal: 10, projectsOpen: 6, projectsCompleted: 3, projectsCanceled: 1 },
      financial: { totalEstimatedAmount: "1000", totalWithDiex: "750", totalWithServiceOrder: "500" },
    } as DashboardExecutiveResponse

    expect(executiveIndicators(data)).toEqual({ completionRate: 30, cancellationRate: 10, diexConversionRate: 75, serviceOrderConversionRate: 50, openRate: 60 })
  })

  it("consolida a pressão operacional", () => {
    const data = {
      pendingByStage: { awaitingCreditNote: 1, awaitingDiex: 2, awaitingCommitmentNote: 3, awaitingServiceOrder: 4, awaitingExecutionStart: 5, awaitingAsBuilt: 6, awaitingInvoiceAttestation: 7 },
      alerts: { summary: { bySeverity: { CRITICAL: 2, WARNING: 3, INFO: 1 } } },
      staleProjects: [{}, {}],
      inventory: { summary: { lowStockItems: 4, insufficientItems: 2 } },
    } as DashboardOperationalResponse

    expect(operationalIndicators(data)).toEqual({ totalPending: 28, inventoryAtRisk: 6, urgentAlerts: 5, staleProjects: 2 })
  })
})
