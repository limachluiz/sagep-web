export type ServiceOrder = {
  id: string
  serviceOrderCode: number
  projectId: string
  estimateId: string
  diexRequestId: string | null
  serviceOrderNumber: string
  issuedAt: string
  contractorName: string
  contractorCnpj: string
  commitmentNoteNumber: string
  requesterName: string
  requesterRank: string
  requesterCpf: string | null
  requesterRole: string
  issuingOrganization: string
  isEmergency: boolean
  plannedStartDate: string | null
  plannedEndDate: string | null
  requestingArea: string | null
  projectDisplayName: string | null
  projectAcronym: string | null
  contractNumber: string | null
  executionLocation: string | null
  executionHours: string | null
  contactName: string | null
  contactPhone: string | null
  contactExtension: string | null
  contractTotalTerm: string | null
  originProcess: string | null
  contractorRepresentativeName: string | null
  contractorRepresentativeRole: string | null
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
    serviceOrderSignatureRequired: boolean
    signedServiceOrderLink: string | null
    signedServiceOrderReceivedAt: string | null
    signedServiceOrderNotes: string | null
    signedServiceOrderRegisteredBy: {
      id: string
      userCode: number
      name: string
      email: string
      role: string
    } | null
  }
  estimate: {
    id: string
    estimateCode: number
    status: string
    omName: string | null
    destinationCityName: string
    destinationStateUf: string
    totalAmount: string
    om: { id: string; omCode: number; sigla: string; name: string; cityName: string; stateUf: string } | null
    ata: { id: string; ataCode: number; number: string; type: string; vendorName: string }
  }
  diexRequest: { id: string; diexCode: number; diexNumber: string | null; issuedAt: string | null } | null
  items: Array<{ id: string; serviceOrderItemCode: number; itemCode: string; description: string; supplyUnit: string; quantityOrdered: string; unitPrice: string; totalPrice: string; notes: string | null }>
  scheduleItems: Array<{ id: string; orderIndex: number; taskStep: string; scheduleText: string }>
  deliveredDocuments: Array<{ id: string; description: string; isChecked: boolean }>
}

export type ServiceOrdersListResponse = {
  items: ServiceOrder[]
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean }
}

export type CreateServiceOrderPayload = {
  projectId: string
  estimateId: string
  diexId: string
  issuedAt: string
  contractorCnpj: string
  requesterName: string
  requesterRank: string
  requesterCpf: string
  plannedStartDate?: string
  plannedEndDate?: string
  executionLocation?: string
  contactName?: string
  contactPhone?: string
  contractorRepresentativeName?: string
  notes?: string
}

export type UpdateServiceOrderPayload = {
  serviceOrderNumber?: string
  issuedAt?: string
  contractorCnpj?: string
  requesterName?: string
  requesterRank?: string
  requesterCpf?: string
  plannedStartDate?: string
  plannedEndDate?: string
  executionLocation?: string
  contactName?: string
  contactPhone?: string
  contractorRepresentativeName?: string
  notes?: string
}
