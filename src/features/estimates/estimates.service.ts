import { api } from "@/lib/api"
import type { Estimate, EstimatesListFilters, EstimatesListResponse } from "./estimates.types"

export const estimatesService = {
  list(filters: EstimatesListFilters) {
    const query = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(filters.pageSize),
    })

    if (filters.search) query.set("search", filters.search)
    if (filters.status) query.set("status", filters.status)
    if (filters.stateUf) query.set("stateUf", filters.stateUf)

    return api.get<EstimatesListResponse>(`/estimates?${query.toString()}`)
  },

  details(estimateId: string) {
    return api.get<Estimate>(`/estimates/${estimateId}`)
  },

  document(estimateId: string, format: "html" | "pdf") {
    return api.getBlob(`/estimates/${estimateId}/document/${format}`)
  },
}
