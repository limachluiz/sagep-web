import { api } from "@/lib/api"
import type {
  AtaBalanceReportFilters,
  ExecutiveProjectsReportFilters,
  ConsolidatedReportType,
  ProjectDossier,
  ProjectExportFilters,
  CommitmentNoteReport,
  CommitmentNoteReportFilters,
} from "./reports.types"

function ataBalanceQuery(filters: AtaBalanceReportFilters) {
  const query = new URLSearchParams()
  if (filters.ataType) query.set("ataType", filters.ataType)
  if (filters.status && filters.status !== "ALL") query.set("status", filters.status)
  if (filters.pregaoId) query.set("pregaoId", filters.pregaoId)
  if (filters.ataId) query.set("ataId", filters.ataId)
  return query.size ? `?${query.toString()}` : ""
}

function exportQuery(filters: ProjectExportFilters) {
  const query = new URLSearchParams()
  if (filters.search) query.set("search", filters.search)
  if (filters.status) query.set("status", filters.status)
  if (filters.stage) query.set("stage", filters.stage)
  if (filters.includeArchived) query.set("includeArchived", "true")
  return query.size ? `?${query.toString()}` : ""
}

function executiveQuery(
  filters: ExecutiveProjectsReportFilters & { reportType?: ConsolidatedReportType },
) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value))
  })
  return query.size ? `?${query.toString()}` : ""
}

function commitmentNoteQuery(filters: CommitmentNoteReportFilters = {}) {
  const query = new URLSearchParams()
  if (filters.search) query.set("search", filters.search)
  if (filters.supplier) query.set("supplier", filters.supplier)
  if (filters.status) query.set("status", filters.status)
  if (filters.origin) query.set("origin", filters.origin)
  if (filters.managementUnit) query.set("managementUnit", filters.managementUnit)
  if (filters.issuedFrom) query.set("issuedFrom", filters.issuedFrom)
  if (filters.issuedTo) query.set("issuedTo", filters.issuedTo)
  if (filters.codes?.length) query.set("codes", filters.codes.join(","))
  return query.size ? `?${query.toString()}` : ""
}

export const reportsService = {
  commitmentNotes(filters: CommitmentNoteReportFilters = {}) {
    return api.get<CommitmentNoteReport>(`/reports/financial-execution/commitment-notes${commitmentNoteQuery(filters)}`)
  },

  commitmentNotesPdf(filters: CommitmentNoteReportFilters = {}) {
    return api.getBlob(`/reports/financial-execution/commitment-notes.pdf${commitmentNoteQuery(filters)}`)
  },

  commitmentNotesXlsx(filters: CommitmentNoteReportFilters = {}) {
    return api.getBlob(`/reports/financial-execution/commitment-notes.xlsx${commitmentNoteQuery(filters)}`)
  },

  ataBalancePositionPdf(filters: AtaBalanceReportFilters = {}) {
    return api.getBlob(`/reports/atas/balance-position.pdf${ataBalanceQuery(filters)}`)
  },

  exportProjects(filters: ProjectExportFilters) {
    return api.getBlob(`/exports/projects.xlsx${exportQuery(filters)}`)
  },

  projectDossier(projectId: string) {
    return api.get<ProjectDossier>(`/reports/projects/${projectId}/dossier`)
  },

  projectDossierPdf(projectId: string) {
    return api.getBlob(`/reports/projects/${projectId}/dossier.pdf`)
  },

  executiveProjectsPdf(filters: ExecutiveProjectsReportFilters = {}) {
    return api.getBlob(
      `/reports/projects/executive-summary.pdf${executiveQuery(filters)}`,
    )
  },

  consolidatedProjectsPdf(
    reportType: ConsolidatedReportType,
    filters: ExecutiveProjectsReportFilters = {},
  ) {
    return api.getBlob(
      `/reports/projects/consolidated-summary.pdf${executiveQuery({
        ...filters,
        reportType,
      })}`,
    )
  },
}
