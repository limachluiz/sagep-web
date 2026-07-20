import { api } from "@/lib/api"
import type { FederativeUnit, MilitaryOrganization } from "./projects.types"

type MilitaryOrganizationsResponse = {
  items: MilitaryOrganization[]
  meta: {
    totalItems: number
  }
}

export const militaryOrganizationsService = {
  list({ stateUf, cityName }: { stateUf: FederativeUnit; cityName?: string }) {
    const query = new URLSearchParams({
      page: "1",
      pageSize: "100",
      stateUf,
      active: "true",
    })

    if (cityName) query.set("cityName", cityName)

    return api.get<MilitaryOrganizationsResponse>(`/military-organizations?${query.toString()}`)
  },
}
