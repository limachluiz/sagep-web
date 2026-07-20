import type { FederativeUnit } from "@/features/projects/projects.types"

export type AtaType = "CFTV" | "FIBRA_OPTICA"

export type AtaCoverageLocality = {
  id?: string
  cityName: string
  stateUf: FederativeUnit
  createdAt?: string
}

export type AtaCoverageGroup = {
  id: string
  code: string
  name: string
  description: string | null
  localities: AtaCoverageLocality[]
  createdAt?: string
}

export type Ata = {
  id: string
  ataCode: number
  number: string
  type: AtaType
  vendorName: string
  managingAgency: string | null
  validFrom: string | null
  validUntil: string | null
  notes: string | null
  isActive: boolean
  externalSource?: string | null
  externalUasg?: string | null
  externalLastSyncAt?: string | null
  coverageGroups: AtaCoverageGroup[]
  createdAt?: string
  updatedAt?: string
}

export type AtaPayload = {
  number: string
  type: AtaType
  vendorName: string
  managingAgency?: string
  validFrom?: string
  validUntil?: string
  notes?: string
  coverageGroups: Array<{
    code: string
    name: string
    description?: string
    localities: Array<{ cityName: string; stateUf: FederativeUnit }>
  }>
}

export type AtaUpdatePayload = Omit<Partial<AtaPayload>, "coverageGroups"> & { isActive?: boolean }

export type AtaBalance = {
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

export type AtaItem = {
  id: string
  ataItemCode: number
  ataId: string
  coverageGroupId: string
  referenceCode: string
  description: string
  unit: string
  unitPrice: string
  initialQuantity: string
  notes: string | null
  isActive: boolean
  deletedAt: string | null
  balance: AtaBalance
  createdAt: string
  updatedAt: string
  ata: Pick<Ata, "id" | "ataCode" | "number" | "type" | "vendorName" | "isActive">
  coverageGroup: AtaCoverageGroup
}

export type AtaItemPayload = {
  coverageGroupCode: string
  referenceCode: string
  description: string
  unit: string
  unitPrice: number
  initialQuantity: number
  notes?: string
}

export type ListEnvelope<T> = {
  items: T[]
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean }
}
