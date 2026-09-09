import { api } from "@/lib/api"
import type {
  AtaBalanceReportFilters,
  ExecutiveProjectsReportFilters,
  ConsolidatedReportType,
  ProjectDossier,
  ProjectExportFilters,
} from "./reports.types"

function ataBalanceQuery(filters: AtaBalanceReportFilters) {
  const query = new URLSearchParams()
  if (filters.ataType) query.set("ataType", filters.ataType)
  if (filters.status && filters.status !== "ALL") query.set("status", filters.status)
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

export const reportsService = {
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
