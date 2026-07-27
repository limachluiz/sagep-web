import { api } from "@/lib/api"
import type { CreateDiexPayload, DiexListResponse, DiexRequest, UpdateDiexPayload } from "./diex.types"

export const diexService = {
  list(filters: { page: number; pageSize: number; search?: string; includeArchived?: boolean; onlyArchived?: boolean }) {
    const query = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(filters.pageSize),
    })
    if (filters.search) query.set("search", filters.search)
    if (filters.includeArchived) query.set("includeArchived", "true")
    if (filters.onlyArchived) query.set("onlyArchived", "true")
    return api.get<DiexListResponse>(`/diex?${query.toString()}`)
  },

  details(diexId: string, includeArchived = false) {
    const suffix = includeArchived ? "?includeArchived=true" : ""
    return api.get<DiexRequest>(`/diex/${diexId}${suffix}`)
  },

  create(payload: CreateDiexPayload) {
    return api.post<DiexRequest>("/diex", payload)
  },

  update(diexId: string, payload: UpdateDiexPayload) {
    return api.patch<DiexRequest>(`/diex/${diexId}`, payload)
  },

  archive(diexId: string) {
    return api.delete<{ message: string }>(`/diex/${diexId}`)
  },

  restore(diexId: string) {
    return api.post<{ message: string; diex: DiexRequest }>(`/diex/${diexId}/restore`, {})
  },

  document(diexId: string, format: "html" | "pdf") {
    return api.getBlob(`/diex/${diexId}/document/${format}`)
  },
}
