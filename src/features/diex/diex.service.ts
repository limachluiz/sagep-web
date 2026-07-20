import { api } from "@/lib/api"
import type { CreateDiexPayload, DiexListResponse, DiexRequest } from "./diex.types"

export const diexService = {
  list(filters: { page: number; pageSize: number; search?: string }) {
    const query = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(filters.pageSize),
    })
    if (filters.search) query.set("search", filters.search)
    return api.get<DiexListResponse>(`/diex?${query.toString()}`)
  },

  details(diexId: string) {
    return api.get<DiexRequest>(`/diex/${diexId}`)
  },

  create(payload: CreateDiexPayload) {
    return api.post<DiexRequest>("/diex", payload)
  },

  document(diexId: string, format: "html" | "pdf") {
    return api.getBlob(`/diex/${diexId}/document/${format}`)
  },
}
