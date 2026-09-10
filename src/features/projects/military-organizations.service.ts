import { api } from "@/lib/api"
import type { FederativeUnit, MilitaryOrganization } from "./projects.types"

export type MilitaryOrganizationsResponse = {
  items: MilitaryOrganization[]
  meta: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type MilitaryOrganizationsFilters = {
  page?: number
  pageSize?: number
  stateUf?: FederativeUnit
  cityName?: string
  search?: string
  active?: boolean
  archived?: "active" | "archived" | "all"
}

export type MilitaryOrganizationBulkAction = "INACTIVATE" | "ARCHIVE" | "DELETE"

export type MilitaryOrganizationPayload = {
  sigla: string
  name: string
  cityName: string
  stateUf: FederativeUnit
}

export type MilitaryOrganizationImportMode = "CREATE_ONLY" | "UPSERT"
export type MilitaryOrganizationImportAction = "CREATE" | "UPDATE" | "UNCHANGED" | "SKIP" | "INVALID"
export type MilitaryOrganizationImportPreview = {
  mode: MilitaryOrganizationImportMode
  rows: Array<{
    line: number
    sigla: string
    name: string
    cityName: string
    stateUf: string
    isActive: boolean
    issues: string[]
    action: MilitaryOrganizationImportAction
    existingId: string | null
  }>
  summary: { total: number; valid: number; create: number; update: number; unchanged: number; skipped: number; invalid: number }
}

export const militaryOrganizationsService = {
  list({ page = 1, pageSize = 100, stateUf, cityName, search, active, archived }: MilitaryOrganizationsFilters = {}) {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })

    if (stateUf) query.set("stateUf", stateUf)
    if (cityName) query.set("cityName", cityName)
    if (search) query.set("search", search)
    if (active !== undefined) query.set("active", String(active))
    if (archived) query.set("archived", archived)

    return api.get<MilitaryOrganizationsResponse>(`/military-organizations?${query.toString()}`)
  },

  create(payload: MilitaryOrganizationPayload) {
    return api.post<MilitaryOrganization>("/military-organizations", payload)
  },

  update(id: string, payload: Partial<MilitaryOrganizationPayload> & { isActive?: boolean }) {
    return api.patch<MilitaryOrganization>(`/military-organizations/${id}`, payload)
  },

  remove(id: string) {
    return api.delete<{ message: string }>(`/military-organizations/${id}`)
  },

  bulkAction(payload: { action: MilitaryOrganizationBulkAction; ids?: string[]; allMatching: boolean; filters?: Omit<MilitaryOrganizationsFilters, "page" | "pageSize"> }, stepUpToken: string) {
    return api.post<{ action: MilitaryOrganizationBulkAction; requested: number; succeeded: number; failed: number; succeededIds: string[]; failures: Array<{ id: string; sigla: string; reason: string }> }>("/military-organizations/bulk-action", payload, { headers: { "X-SAGEP-Reauth": stepUpToken }, skipStepUp: true })
  },

  template: () => api.getBlob("/military-organizations/import/template"),

  previewImport: (content: string, mode: MilitaryOrganizationImportMode) =>
    api.post<MilitaryOrganizationImportPreview>("/military-organizations/import/preview", { content, mode }),

  importCsv: (content: string, mode: MilitaryOrganizationImportMode) =>
    api.post<{ message: string; imported: number; create: number; update: number }>("/military-organizations/import", { content, mode }),
}
