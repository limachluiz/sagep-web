import { api } from "@/lib/api"
import type { GlobalSearchResponse, OperationalAlertsResponse } from "./header.types"

export const headerService = {
  search(query: string) {
    const params = new URLSearchParams({ q: query, limit: "6" })
    return api.get<GlobalSearchResponse>(`/search?${params.toString()}`)
  },

  alerts() {
    return api.get<OperationalAlertsResponse>("/operational-alerts?staleDays=15&limit=50")
  },
}
