import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import type { DashboardExecutiveFilters } from "@/features/dashboard/dashboard.types"
import type { ProjectDetailsResponse, ProjectStatus } from "@/features/projects/projects.types"

export type ProjectExportFilters = {
  search?: string
  status?: ProjectStatus
  stage?: ProjectStage
  includeArchived?: boolean
}

export type ExecutiveProjectsReportFilters = DashboardExecutiveFilters & {
  staleDays?: number
}

export type ConsolidatedReportType = "executive" | "operational" | "financial"

export type AtaBalanceReportFilters = {
  ataType?: "CFTV" | "FIBRA_OPTICA"
  status?: "ALL" | "ACTIVE" | "EXPIRED" | "INACTIVE"
}

export type ProjectDossier = {
  generatedAt: string
  project: ProjectDetailsResponse["project"]
  workflow: ProjectDetailsResponse["workflow"]
  pendingActions: ProjectDetailsResponse["pendingActions"]
  documents: ProjectDetailsResponse["documents"]
  financialSummary: ProjectDetailsResponse["financialSummary"]
  operationalSummary: ProjectDetailsResponse["operationalSummary"]
  timelineSummary: Array<{
    id: string
    at: string
    action: string
    label: string
    summary: string
    actorName: string | null
    source: "AUDIT" | "FALLBACK"
  }>
}

export type CommitmentNoteReportFilters = {
  search?: string
  supplier?: string
  status?: string
  origin?: "PROJECT" | "IMPORTED" | "STANDALONE"
  managementUnit?: string
  issuedFrom?: string
  issuedTo?: string
  codes?: string[]
}

export type CommitmentNoteReportRow = {
  noteId: string | null
  managementUnit: string
  externalCode: string
  number: string
  origin: "PROJECT" | "IMPORTED" | "STANDALONE"
  updatedAt: string
  issuedAt: string | null
  supplierName: string
  supplierCnpj: string | null
  current: number | null
  liquidated: number | null
  paid: number | null
  paidNet?: number | null
  deductions?: number | null
  status: string
  inconsistent: boolean
  incomplete: boolean
  project: { id: string; projectCode: number; title: string } | null
}

export type CommitmentNoteReport = {
  generatedAt: string
  generatedBy: string
  scopeLabel: string
  filters: CommitmentNoteReportFilters & { codes: string[] }
  summary: {
    total: number
    committed: number
    liquidated: number
    paid: number
    pending: number
    coverage: { committed: number; liquidated: number; paid: number }
  }
  charts: {
    byStatus: Array<{ label: string; value: number; amount: number }>
    bySupplier: Array<{ label: string; value: number; amount: number }>
    byOrigin: Array<{ label: string; value: number; amount: number }>
  }
  rows: CommitmentNoteReportRow[]
}
