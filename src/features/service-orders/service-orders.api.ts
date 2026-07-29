import { api } from "@/lib/api"
import type { CreateServiceOrderPayload, ServiceOrder, ServiceOrdersListResponse, UpdateServiceOrderPayload } from "./service-orders.api.types"

export const serviceOrdersApi = {
  list(filters: { page: number; pageSize: number; search?: string; includeArchived?: boolean; onlyArchived?: boolean }) {
    const query = new URLSearchParams({ page: String(filters.page), pageSize: String(filters.pageSize) })
    if (filters.search) query.set("search", filters.search)
    if (filters.includeArchived) query.set("includeArchived", "true")
    if (filters.onlyArchived) query.set("onlyArchived", "true")
    return api.get<ServiceOrdersListResponse>(`/service-orders?${query.toString()}`)
  },
  details(id: string, includeArchived = false) {
    const suffix = includeArchived ? "?includeArchived=true" : ""
    return api.get<ServiceOrder>(`/service-orders/${id}${suffix}`)
  },
  create(payload: CreateServiceOrderPayload) { return api.post<ServiceOrder>("/service-orders", payload) },
  update(id: string, payload: UpdateServiceOrderPayload) { return api.patch<ServiceOrder>(`/service-orders/${id}`, payload) },
  archive(id: string) { return api.delete<{ message: string }>(`/service-orders/${id}`) },
  restore(id: string) { return api.post<{ message: string; serviceOrder: ServiceOrder }>(`/service-orders/${id}/restore`, {}) },
  softDelete(id: string) { return api.delete<{ message: string; deletedAt: string }>(`/service-orders/${id}/permanent`) },
  document(id: string, format: "html" | "pdf") { return api.getBlob(`/service-orders/${id}/document/${format}`) },
}
