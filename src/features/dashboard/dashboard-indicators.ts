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
