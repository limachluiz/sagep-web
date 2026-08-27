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
  pregaoId?: string | null
  pregao?: PregaoSummary | null
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
  externalPncpControlNumber?: string | null
  externalLastSyncAt?: string | null
  pncpLastSyncAt?: string | null
  pncpSnapshot?: {
    controlNumber: string
    validFrom: string | null
    validUntil: string | null
    cancelled: boolean
    allowsAdhesion: boolean | null
    managingUnit: { code: string | null; name: string | null; city: string | null; state: string | null }
    linkedContracts: { total: number; records: Array<Record<string, unknown>> }
    sourceUpdatedAt: string | null
  } | null
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
  ata: Pick<Ata, "id" | "ataCode" | "number" | "type" | "vendorName" | "isActive" | "externalUasg">
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

export type AtaItemMovement = {
  id: string
  movementType: "RESERVE" | "RELEASE" | "CONSUME" | "REVERSE_CONSUME" | "ADJUSTMENT"
  quantity: string
  unitPrice: string
  totalAmount: string
  summary: string
  actorName: string | null
  projectId: string | null
  projectCode: number | null
  estimateId: string | null
  estimateCode: number | null
  diexRequestId: string | null
  diexCode: number | null
  serviceOrderId: string | null
  serviceOrderCode: number | null
  createdAt: string
}

export type ListEnvelope<T> = {
  items: T[]
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean }
}

export type ComprasGovPreviewItem = {
  referenceCode: string
  description: string
  unit: string
  unitPrice: number
  initialQuantity: number
  externalItemId: string
  externalItemNumber: string
}

export type ComprasGovAtaFound = {
  ataNumber: string
  vendorName: string | null
  itemCount: number
  totalAmount: number | null
  validFrom: string | null
  validUntil: string | null
  sampleItems: ComprasGovPreviewItem[]
  importedAtaId?: string
  importedAt?: string
}

export type PregaoSummary = {
  id: string
  pregaoCode: number
  uasg: string
  number: string
  year: string
  modality: string
  object: string | null
  type: AtaType | null
  managingAgency: string | null
  isActive: boolean
}

export type Pregao = PregaoSummary & {
  externalSource: string | null
  externalLastSyncAt: string | null
  createdAt: string
  updatedAt: string
  atas: Array<Ata & { _count?: { items: number; estimates: number } }>
  _count: { atas: number }
}

export type ComprasGovPreview = {
  source: "COMPRAS_GOV"
  uasg: string
  numeroPregao: string
  anoPregao: string
  ata: {
    number: string
    type: AtaType | null
    vendorName: string | null
    managingAgency: string | null
    validFrom: string | null
    validUntil: string | null
  } | null
  items: ComprasGovPreviewItem[]
  atasFound: ComprasGovAtaFound[]
  selectedAta?: ComprasGovAtaFound
  warnings: string[]
}

export type ComprasGovImportPayload = {
  uasg: string
  numeroPregao: string
  anoPregao: string
  numeroAta?: string
  ataType: AtaType
  coverageGroupCode: string
  coverageGroupName: string
  coverageGroupLocalities: Array<{ cityName: string; stateUf: FederativeUnit }>
}

export type ComprasGovImportResult = {
  dryRun: false
  ata: Pick<Ata, "id" | "ataCode" | "number" | "type" | "vendorName" | "managingAgency" | "validFrom" | "validUntil">
  itemsCreated: number
  itemsUpdated: number
  warnings: string[]
  imported: { ataId: string; coverageGroupId: string; coverageGroupCode: string; createdItems: number; updatedItems: number }
}
