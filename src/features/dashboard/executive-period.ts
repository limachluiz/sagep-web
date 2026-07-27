import type { DashboardExecutiveFilters } from "./dashboard.types"

export type ExecutiveFilterMode = "all" | "month" | "quarter" | "semester" | "year" | "interval" | "as_of"

function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function previousPeriodFilters(
  mode: ExecutiveFilterMode,
  filters: DashboardExecutiveFilters,
): DashboardExecutiveFilters | null {
  if (mode === "all" || mode === "as_of") return null
  const portfolioFilters: DashboardExecutiveFilters = {}
  if (filters.stateUf) portfolioFilters.stateUf = filters.stateUf
  if (filters.omId) portfolioFilters.omId = filters.omId
  if (filters.projectType) portfolioFilters.projectType = filters.projectType
  if (filters.ownerId) portfolioFilters.ownerId = filters.ownerId

  if (mode === "interval" && filters.startDate && filters.endDate) {
    const start = new Date(`${filters.startDate}T12:00:00`)
    const end = new Date(`${filters.endDate}T12:00:00`)
    const duration = end.getTime() - start.getTime()
    const previousEnd = new Date(start)
    previousEnd.setDate(previousEnd.getDate() - 1)
    const previousStart = new Date(previousEnd.getTime() - duration)
    return { ...portfolioFilters, startDate: toDateInput(previousStart), endDate: toDateInput(previousEnd) }
  }

  if (filters.periodType && filters.referenceDate) {
    const reference = new Date(`${filters.referenceDate}T12:00:00`)
    if (filters.periodType === "month") reference.setMonth(reference.getMonth() - 1)
    if (filters.periodType === "quarter") reference.setMonth(reference.getMonth() - 3)
    if (filters.periodType === "semester") reference.setMonth(reference.getMonth() - 6)
    if (filters.periodType === "year") reference.setFullYear(reference.getFullYear() - 1)
    return { ...portfolioFilters, periodType: filters.periodType, referenceDate: toDateInput(reference) }
  }

  return null
}
