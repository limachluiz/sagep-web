import { api } from "@/lib/api"
import type { ProjectDossier, ProjectExportFilters } from "./reports.types"

function exportQuery(filters: ProjectExportFilters) {
  const query = new URLSearchParams()
  if (filters.search) query.set("search", filters.search)
  if (filters.status) query.set("status", filters.status)
  if (filters.stage) query.set("stage", filters.stage)
  if (filters.includeArchived) query.set("includeArchived", "true")
  return query.size ? `?${query.toString()}` : ""
}

export const reportsService = {
  exportProjects(filters: ProjectExportFilters) {
    return api.getBlob(`/exports/projects.xlsx${exportQuery(filters)}`)
  },

  projectDossier(projectId: string) {
    return api.get<ProjectDossier>(`/reports/projects/${projectId}/dossier`)
  },

  projectDossierPdf(projectId: string) {
    return api.getBlob(`/reports/projects/${projectId}/dossier.pdf`)
  },
}
