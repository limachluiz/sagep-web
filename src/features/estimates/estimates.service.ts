import { api } from "@/lib/api"
import type {
  Ata,
  AtaItem,
  CreateEstimatePayload,
  Estimate,
  EstimatesListFilters,
  EstimatesListResponse,
  ListEnvelope,
  UpdateEstimatePayload,
} from "./estimates.types"

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

  create(payload: CreateEstimatePayload) {
    return api.post<Estimate>("/estimates", payload)
  },

  update(estimateId: string, payload: UpdateEstimatePayload) {
    return api.patch<Estimate>(`/estimates/${estimateId}`, payload)
  },

  updateStatus(estimateId: string, status: "FINALIZADA" | "CANCELADA") {
    return api.patch<Estimate>(`/estimates/${estimateId}/status`, { status })
  },

  listAtas(type: Ata["type"]) {
    const query = new URLSearchParams({
      page: "1",
      pageSize: "100",
      active: "true",
      type,
    })
    return api.get<ListEnvelope<Ata>>(`/atas?${query.toString()}`)
  },

  listAtaItems(ataId: string, groupCode: string) {
    const query = new URLSearchParams({
      page: "1",
      pageSize: "100",
      active: "true",
      groupCode,
    })
    return api.get<ListEnvelope<AtaItem>>(`/atas/${ataId}/items?${query.toString()}`)
  },

  document(estimateId: string, format: "html" | "pdf") {
    return api.getBlob(`/estimates/${estimateId}/document/${format}`)
  },
}
