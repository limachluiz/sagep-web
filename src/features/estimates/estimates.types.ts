import type { FederativeUnit } from "@/features/projects/projects.types"

export type EstimateStatus = "RASCUNHO" | "FINALIZADA" | "CANCELADA"

export type EstimateBalance = {
  initialQuantity: string
  reservedQuantity: string
  consumedQuantity: string
  availableQuantity: string
  initialAmount: string
  reservedAmount: string
  consumedAmount: string
  availableAmount: string
  lowStock: boolean
  insufficient: boolean
  lastMovementAt: string | null
}

export type Estimate = {
  id: string
  estimateCode: number
  status: EstimateStatus
  omName: string | null
  destinationCityName: string
  destinationStateUf: FederativeUnit
  notes: string | null
  totalAmount: string
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  project: {
    id: string
    projectCode: number
    title: string
    status: string
    ownerId: string | null
  }
  ata: {
    id: string
    ataCode: number
    number: string
    type: string
    vendorName: string
    isActive: boolean
  }
  coverageGroup: {
    id: string
    code: string
    name: string
    description: string | null
    localities: Array<{
      id: string
      cityName: string
      stateUf: FederativeUnit
    }>
  }
  om: {
    id: string
    omCode: number
    sigla: string
    name: string
    cityName: string
    stateUf: FederativeUnit
    isActive: boolean
  } | null
  items: Array<{
    id: string
    estimateItemCode: number
    referenceCode: string
    description: string
    unit: string
    quantity: string
    unitPrice: string
    subtotal: string
    notes: string | null
    ataItem: {
      id: string
      ataItemCode: number
      referenceCode: string
      description: string
      unit: string
      unitPrice: string
      initialQuantity: string
      isActive: boolean
      deletedAt: string | null
      balance: EstimateBalance | null
    }
  }>
}

export type EstimatesListFilters = {
  page: number
  pageSize: number
  search?: string
  status?: EstimateStatus
  stateUf?: FederativeUnit
  includeArchived?: boolean
  onlyArchived?: boolean
}

export type EstimatesListResponse = {
  items: Estimate[]
  meta: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  filters: Record<string, unknown>
  links: { self: string }
}

export type Ata = {
  id: string
  ataCode: number
  number: string
  type: "CFTV" | "FIBRA_OPTICA"
  vendorName: string
  managingAgency: string | null
  validFrom: string | null
  validUntil: string | null
  isActive: boolean
  coverageGroups: Array<{
    id: string
    code: string
    name: string
    description: string | null
    localities: Array<{
      id: string
      cityName: string
      stateUf: FederativeUnit
    }>
  }>
}

export type AtaItem = {
  id: string
  ataItemCode: number
  referenceCode: string
  description: string
  unit: string
  unitPrice: string
  initialQuantity: string
  isActive: boolean
  coverageGroup: Ata["coverageGroups"][number]
  balance: EstimateBalance
}

export type ListEnvelope<T> = {
  items: T[]
  meta: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type CreateEstimatePayload = {
  projectId: string
  ataId: string
  coverageGroupId: string
  omId: string
  notes?: string
  items: Array<{
    ataItemId: string
    quantity: number
  }>
}

export type UpdateEstimatePayload = {
  notes?: string
  items: Array<{
    ataItemId: string
    quantity: number
  }>
}
