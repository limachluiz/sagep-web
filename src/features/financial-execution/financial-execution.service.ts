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

  register(payload: { projectId: string; number: string; receivedAt: string; managementUnit?: string; management?: string; acceptDivergence?: boolean }) {
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
}
