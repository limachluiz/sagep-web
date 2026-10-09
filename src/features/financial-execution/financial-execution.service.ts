import { api } from "@/lib/api"
import type { CommitmentNote, CommitmentNotesResponse, CommitmentPreview, StandaloneCommitmentLookup } from "./financial-execution.types"

export const financialExecutionService = {
  lookup(payload: { number: string; managementUnit?: string; management?: string }) {
    return api.post<StandaloneCommitmentLookup>("/financial-execution/commitment-notes/lookup", payload)
  },

  list(params: { page?: number; pageSize?: number; search?: string; financialStatus?: string; syncStatus?: string } = {}) {
    const query = new URLSearchParams({ page: String(params.page ?? 1), pageSize: String(params.pageSize ?? 50) })
    if (params.search) query.set("search", params.search)
    if (params.financialStatus) query.set("financialStatus", params.financialStatus)
    if (params.syncStatus) query.set("syncStatus", params.syncStatus)
    return api.get<CommitmentNotesResponse>(`/financial-execution/commitment-notes?${query.toString()}`)
  },

  preview(payload: { projectId: string; number: string; managementUnit?: string; management?: string }) {
    return api.post<CommitmentPreview>("/financial-execution/commitment-notes/preview", payload)
  },

  register(payload: { projectId: string; number: string; receivedAt: string; managementUnit?: string; management?: string; registrationMode?: "PORTAL" | "MANUAL"; manualReason?: string; confirmManualRegistration?: boolean; acceptDivergence?: boolean; balanceImpactMode?: "CONSUME" | "ALREADY_INCLUDED"; balanceImpactReason?: string }) {
    return api.post<{ commitmentNote: CommitmentNote }>("/financial-execution/commitment-notes", payload)
  },

  details(id: string) {
    return api.get<CommitmentNote>(`/financial-execution/commitment-notes/${id}`)
  },

  sync(id: string) {
    return api.post<CommitmentNote>(`/financial-execution/commitment-notes/${id}/sync`)
  },

  syncAll() {
    return api.post<{ total: number; synchronized: number; failed: number }>("/financial-execution/sync")
  },

  createInvoice(payload: {
    projectId: string
    commitmentNoteId?: string
    number: string
    series?: string
    accessKey?: string
    supplierCnpj: string
    issuedAt: string
    grossAmount: number
    attestedAmount?: number
    attestedAt?: string
    documentLink?: string
    notes?: string
  }) {
    return api.post<{ invoice: unknown; warnings: string[] }>("/financial-execution/invoices", payload)
  },

  previewInvoiceXml(payload: { projectId: string; commitmentNoteId: string; xmlBase64: string; notes?: string }) {
    return api.post<NfeXmlPreview>("/financial-execution/invoices/xml/preview", payload)
  },

  importInvoiceXml(payload: { projectId: string; commitmentNoteId: string; xmlBase64: string; attestedAt?: string; documentLink?: string; notes?: string }) {
    return api.post<NfeXmlPreview & { invoice: unknown }>("/financial-execution/invoices/xml/import", payload)
  },
}

export type NfeXmlPreview = {
  summary: { number: string; series: string | null; accessKey: string; supplierCnpj: string; issuerName: string | null; recipientCnpj: string | null; issuedAt: string; grossAmount: number; itemCount: number; authorizationStatus: string | null; authorizationProtocol: string | null; hasXmlSignature: boolean; xmlChecksumSha256: string }
  conferenceStatus: "CONFERRED" | "DIVERGENT"
  divergences: string[]
  warnings: string[]
  duplicate: { id: string; invoiceCode: number; projectId: string; accessKey: string | null } | null
}
