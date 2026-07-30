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
