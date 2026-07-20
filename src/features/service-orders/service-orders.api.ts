import { api } from "@/lib/api"
import type { CreateServiceOrderPayload, ServiceOrder, ServiceOrdersListResponse } from "./service-orders.api.types"

export const serviceOrdersApi = {
  list(filters: { page: number; pageSize: number; search?: string }) {
    const query = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) })
    if (filters.search) query.set("search", filters.search)
    return api.get<ServiceOrdersListResponse>(`/service-orders?${query.toString()}`)
  },
  details(id: string) { return api.get<ServiceOrder>(`/service-orders/${id}`) },
  create(payload: CreateServiceOrderPayload) { return api.post<ServiceOrder>("/service-orders", payload) },
  document(id: string, format: "html" | "pdf") { return api.getBlob(`/service-orders/${id}/document/${format}`) },
}
