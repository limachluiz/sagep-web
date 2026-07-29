import type { DashboardExecutiveResponse, DashboardOperationalResponse } from "./dashboard.types"

export function percentage(part: number, total: number) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0
  return Math.round((part / total) * 1000) / 10
}

export function executiveIndicators(data: DashboardExecutiveResponse) {
  const estimated = Number(data.financial.totalEstimatedAmount)
  const withDiex = Number(data.financial.totalWithDiex)
  const withServiceOrder = Number(data.financial.totalWithServiceOrder)

  return {
    completionRate: percentage(data.summary.projectsCompleted, data.summary.projectsTotal),
    cancellationRate: percentage(data.summary.projectsCanceled, data.summary.projectsTotal),
    diexConversionRate: percentage(withDiex, estimated),
    serviceOrderConversionRate: percentage(withServiceOrder, estimated),
    openRate: percentage(data.summary.projectsOpen, data.summary.projectsTotal),
  }
}

export function operationalIndicators(data: DashboardOperationalResponse) {
  const pending = data.pendingByStage
  return {
    totalPending: Object.values(pending).reduce((total, value) => total + value, 0),
    inventoryAtRisk: data.inventory.summary.lowStockItems + data.inventory.summary.insufficientItems,
    urgentAlerts: data.alerts.summary.bySeverity.CRITICAL + data.alerts.summary.bySeverity.WARNING,
    staleProjects: data.staleProjects.length,
  }
}

export function buildOperationalWorkflow(data: DashboardOperationalResponse) {
  const pending = data.pendingByStage

  return [
    { label: "Estimativa", shortLabel: "EST", count: pending.awaitingCreditNote },
    { label: "Nota de Crédito", shortLabel: "NC", count: pending.awaitingDiex },
    { label: "DIEx", shortLabel: "DIEx", count: pending.awaitingCommitmentNote },
    { label: "Nota de Empenho", shortLabel: "NE", count: pending.awaitingServiceOrder },
    { label: "Ordem de Serviço", shortLabel: "OS", count: pending.awaitingSignedServiceOrder },
    { label: "Início da execução", shortLabel: "Início", count: pending.awaitingExecutionStart },
    { label: "Execução", shortLabel: "EXEC", count: pending.awaitingAsBuilt },
    { label: "As-Built / Atesto", shortLabel: "FINAL", count: pending.awaitingInvoiceAttestation },
  ]
}
