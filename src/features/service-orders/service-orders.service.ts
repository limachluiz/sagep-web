import { api } from "@/lib/api"
import type { ServiceOrdersGanttResponse } from "./service-orders.types"

export const serviceOrdersService = {
  gantt(filters: { projectCode?: number; from?: string; until?: string }) {
    const query = new URLSearchParams()
    if (filters.projectCode) query.set("projectCode", String(filters.projectCode))
    if (filters.from) query.set("from", filters.from)
    if (filters.until) query.set("until", filters.until)
    const suffix = query.size ? `?${query.toString()}` : ""
    return api.get<ServiceOrdersGanttResponse>(`/service-orders/gantt${suffix}`)
  },
}
