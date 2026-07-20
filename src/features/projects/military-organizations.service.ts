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
}

export type MilitaryOrganizationPayload = {
  sigla: string
  name: string
  cityName: string
  stateUf: FederativeUnit
}

export const militaryOrganizationsService = {
  list({ page = 1, pageSize = 100, stateUf, cityName, search, active }: MilitaryOrganizationsFilters = {}) {
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })

    if (stateUf) query.set("stateUf", stateUf)
    if (cityName) query.set("cityName", cityName)
    if (search) query.set("search", search)
    if (active !== undefined) query.set("active", String(active))

    return api.get<MilitaryOrganizationsResponse>(`/military-organizations?${query.toString()}`)
  },

  create(payload: MilitaryOrganizationPayload) {
    return api.post<MilitaryOrganization>("/military-organizations", payload)
  },

  update(id: string, payload: Partial<MilitaryOrganizationPayload> & { isActive?: boolean }) {
    return api.patch<MilitaryOrganization>(`/military-organizations/${id}`, payload)
  },
}
