import { api } from "@/lib/api"
import type { FederativeUnit } from "@/features/projects/projects.types"
import type { Ata, AtaItem, AtaItemPayload, AtaPayload, AtaType, AtaUpdatePayload, ListEnvelope } from "./atas.types"

export const atasService = {
  list(filters: { page?: number; pageSize?: number; search?: string; type?: AtaType; stateUf?: FederativeUnit; active?: boolean } = {}) {
    const query = new URLSearchParams({ page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 10) })
    if (filters.search) query.set("search", filters.search)
    if (filters.type) query.set("type", filters.type)
    if (filters.stateUf) query.set("stateUf", filters.stateUf)
    if (filters.active !== undefined) query.set("active", String(filters.active))
    return api.get<ListEnvelope<Ata>>(`/atas?${query.toString()}`)
  },

  details(ataId: string) { return api.get<Ata>(`/atas/${ataId}`) },
  create(payload: AtaPayload) { return api.post<Ata>("/atas", payload) },
  update(ataId: string, payload: AtaUpdatePayload) { return api.patch<Ata>(`/atas/${ataId}`, payload) },

  listItems(ataId: string, filters: { page?: number; pageSize?: number; search?: string; active?: boolean } = {}) {
    const query = new URLSearchParams({ page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 25) })
    if (filters.search) query.set("search", filters.search)
    if (filters.active !== undefined) query.set("active", String(filters.active))
    return api.get<ListEnvelope<AtaItem>>(`/atas/${ataId}/items?${query.toString()}`)
  },

  createItem(ataId: string, payload: AtaItemPayload) { return api.post<AtaItem>(`/atas/${ataId}/items`, payload) },
  updateItem(itemId: string, payload: Partial<AtaItemPayload> & { isActive?: boolean }) { return api.patch<AtaItem>(`/ata-items/${itemId}`, payload) },
}
