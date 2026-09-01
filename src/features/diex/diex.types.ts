export type DiexRequest = {
  id: string
  diexCode: number
  projectId: string
  estimateId: string
  diexNumber: string | null
  issuedAt: string | null
  issuingOrganization: string
  commandName: string
  pregaoNumber: string
  uasg: string
  supplierName: string
  supplierCnpj: string
  requesterName: string
  requesterRank: string
  requesterCpf: string | null
  requesterRole: string
  notes: string | null
  documentStatus: "EMITIDO" | "ARQUIVADO" | "CANCELADO"
  totalAmount: string
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  project: {
    id: string
    projectCode: number
    title: string
    stage: string
    status: string
  }
  estimate: {
    id: string
    estimateCode: number
    status: string
    omName: string | null
    destinationCityName: string
    destinationStateUf: string
    totalAmount: string
    om: {
      id: string
      omCode: number
      sigla: string
      name: string
      cityName: string
      stateUf: string
    } | null
    ata: {
      id: string
      ataCode: number
      number: string
      type: string
      vendorName: string
    }
  }
  items: Array<{
    id: string
    diexItemCode: number
    itemCode: string
    description: string
    supplyUnit: string
    quantityRequested: string
    unitPrice: string
    totalPrice: string
    notes: string | null
    estimateItem: {
      id: string
      estimateItemCode: number
    }
  }>
}

export type DiexListResponse = {
  items: DiexRequest[]
  meta: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type CreateDiexPayload = {
  projectId: string
  estimateId: string
  supplierCnpj?: string
  requesterName: string
  requesterRank: string
  requesterCpf: string
  requesterRole?: string
  diexNumber?: string
  issuedAt?: string
  notes?: string
}

export type UpdateDiexPayload = {
  diexNumber?: string
  issuedAt?: string
  supplierCnpj?: string
  requesterName?: string
  requesterRank?: string
  requesterCpf?: string
  requesterRole?: string
  notes?: string
}
