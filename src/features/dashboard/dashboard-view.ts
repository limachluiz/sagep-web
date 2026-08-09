import type { Permission } from "@/features/auth/auth.types"

export type DashboardView = "overview" | "operational" | "executive"

const viewPermissions: Record<DashboardView, Permission> = {
  overview: "dashboard.financial_view",
  operational: "dashboard.view_operational",
  executive: "dashboard.view_executive",
}

const dashboardViewOrder: DashboardView[] = ["overview", "operational", "executive"]

export function availableDashboardViews(
  hasPermission: (permission: Permission) => boolean,
) {
  return dashboardViewOrder.filter((view) => hasPermission(viewPermissions[view]))
}

export function resolveDashboardView(
  availableViews: DashboardView[],
  requestedView: string | null,
) {
  if (requestedView && availableViews.includes(requestedView as DashboardView)) {
    return requestedView as DashboardView
  }

  return availableViews[0]
}
