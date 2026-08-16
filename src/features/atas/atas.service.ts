import { api } from "@/lib/api"
import type { FederativeUnit } from "@/features/projects/projects.types"
import type { Ata, AtaExternalBalance, AtaItem, AtaItemMovement, AtaItemPayload, AtaPayload, AtaType, AtaUpdatePayload, ComprasGovImportPayload, ComprasGovImportResult, ComprasGovPreview, ExternalBalanceComparisonItem, ExternalConsumptionPayload, ExternalConsumptionResponse, ListEnvelope } from "./atas.types"

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
  remove(ataId: string) { return api.delete<{ message: string }>(`/atas/${ataId}`) },
  externalBalance(ataId: string) { return api.get<AtaExternalBalance>(`/atas/${ataId}/external-balance`) },
  syncExternalBalance(ataId: string) { return api.post<AtaExternalBalance>(`/atas/${ataId}/sync-external-balance`) },

  listItems(ataId: string, filters: { page?: number; pageSize?: number; search?: string; active?: boolean } = {}) {
    const query = new URLSearchParams({ page: String(filters.page ?? 1), pageSize: String(filters.pageSize ?? 25) })
    if (filters.search) query.set("search", filters.search)
    if (filters.active !== undefined) query.set("active", String(filters.active))
    return api.get<ListEnvelope<AtaItem>>(`/atas/${ataId}/items?${query.toString()}`)
  },

  createItem(ataId: string, payload: AtaItemPayload) { return api.post<AtaItem>(`/atas/${ataId}/items`, payload) },
  updateItem(itemId: string, payload: Partial<AtaItemPayload> & { isActive?: boolean }) { return api.patch<AtaItem>(`/ata-items/${itemId}`, payload) },
  listItemMovements(itemId: string) { return api.get<AtaItemMovement[]>(`/ata-items/${itemId}/movements`) },
  registerExternalConsumption(itemId: string, payload: ExternalConsumptionPayload) { return api.post<ExternalConsumptionResponse>(`/ata-items/${itemId}/register-external-consumption`, payload) },
  itemBalanceComparison(itemId: string) { return api.get<ExternalBalanceComparisonItem>(`/ata-items/${itemId}/balance-comparison`) },
  syncItemExternalBalance(itemId: string) { return api.post<ExternalBalanceComparisonItem>(`/ata-items/${itemId}/sync-external-balance`) },

  previewComprasGov(filters: { uasg: string; numeroPregao: string; anoPregao: string; numeroAta?: string }) {
    const query = new URLSearchParams({ uasg: filters.uasg, numeroPregao: filters.numeroPregao, anoPregao: filters.anoPregao })
    if (filters.numeroAta) query.set("numeroAta", filters.numeroAta)
    return api.get<ComprasGovPreview>(`/integrations/compras-gov/atas/preview?${query.toString()}`)
  },

  importComprasGov(payload: ComprasGovImportPayload) {
    return api.post<ComprasGovImportResult>("/integrations/compras-gov/atas/import", payload)
  },
}
