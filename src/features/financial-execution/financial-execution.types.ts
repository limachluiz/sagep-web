export type CommitmentFinancialStatus =
  | "NAO_LIQUIDADA"
  | "PARCIALMENTE_LIQUIDADA"
  | "LIQUIDADA"
  | "PARCIALMENTE_PAGA"
  | "PAGA"
  | "PARCIALMENTE_ANULADA"
  | "ANULADA"

export type CommitmentSyncStatus = "VALIDADO" | "DIVERGENTE" | "ERRO"

export type FinancialDocument = {
  id?: string
  externalCode: string
  number: string
  phase: "EMPENHO" | "LIQUIDACAO" | "PAGAMENTO" | "ANULACAO" | "OUTRO"
  species: string | null
  issuedAt: string | null
  amount: number
}

export type CommitmentNote = {
  id: string
  commitmentNoteCode: number
  projectId: string
  number: string
  externalCode: string
  managementUnit: string
  management: string
  supplierName: string | null
  supplierCnpj: string | null
  issuedAt: string | null
  originalAmount: number
  currentAmount: number
  liquidatedAmount: number
  paidAmount: number
  cancelledAmount: number
  financialStatus: CommitmentFinancialStatus
  syncStatus: CommitmentSyncStatus
  divergenceReason: string | null
  lastSyncAt: string
  lastSyncError: string | null
  updatedAt: string
  project: {
    id: string
    projectCode: number
    title: string
    stage: string
    status: string
    om?: { sigla: string; stateUf: string } | null
  }
  documents?: FinancialDocument[]
  invoices?: Array<{
    id: string
    invoiceCode: number
    number: string
    grossAmount: number
    attestedAmount: number | null
    attestedAt: string | null
  }>
  _count?: { documents: number; invoices: number }
}

export type PortalCommitmentSnapshot = {
  source: string
  externalCode: string
  number: string
  managementUnit: string
  management: string
  supplierName: string | null
  supplierCnpj: string | null
  issuedAt: string | null
  originalAmount: number
  currentAmount: number
  liquidatedAmount: number
  paidAmount: number
  cancelledAmount: number
  financialStatus: CommitmentFinancialStatus
  fetchedAt: string
  documents: FinancialDocument[]
}

export type CommitmentPreview = {
  snapshot: PortalCommitmentSnapshot
  validation: {
    status: "VALIDADO" | "DIVERGENTE"
    divergences: string[]
    expected: { supplierName: string | null; supplierCnpj: string | null; amount: number }
  }
  project: { id: string; projectCode: number; title: string; stage: string }
}

export type StandaloneCommitmentLookup = {
  snapshot: PortalCommitmentSnapshot
  registered: null | {
    id: string
    active: boolean
    financialStatus: CommitmentFinancialStatus
    syncStatus: CommitmentSyncStatus
    lastSyncAt: string
    project: { id: string; projectCode: number; title: string; stage: string; status: string }
  }
}

export type FinancialSummary = {
  total: number
  totals: { committed: number; liquidated: number; paid: number; toLiquidate: number; toPay: number }
  byStatus: Record<string, number>
  bySyncStatus: Record<string, number>
}

export type CommitmentNotesResponse = {
  items: CommitmentNote[]
  summary: FinancialSummary
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number }
}
