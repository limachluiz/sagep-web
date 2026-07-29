import { api } from "@/lib/api"
import type {
  DashboardExecutiveFilters,
  DashboardExecutiveResponse,
  DashboardOperationalResponse,
} from "./dashboard.types"

export const dashboardService = {
  operational(staleDays: number) {
    const query = new URLSearchParams({
      staleDays: String(staleDays),
      limit: "100",
    })

    return api.get<DashboardOperationalResponse>(
      `/dashboard/operational?${query.toString()}`,
    )
  },

  executive(filters: DashboardExecutiveFilters) {
    const query = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })

    const suffix = query.size ? `?${query.toString()}` : ""
    return api.get<DashboardExecutiveResponse>(`/dashboard/executive${suffix}`)
  },
}
