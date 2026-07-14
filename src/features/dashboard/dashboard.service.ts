import { api } from "@/lib/api"
import type { DashboardOperationalResponse } from "./dashboard.types"

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
}
