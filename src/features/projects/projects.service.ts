import { api } from "@/lib/api"
import type {
  AddProjectMemberPayload,
  AsBuiltReviewPayload,
  ProjectDetailsResponse,
  ProjectFlowPayload,
  ProjectMemberMutationResponse,
  ProjectKanbanResponse,
  ProjectMutationPayload,
  ProjectMutationResponse,
  ProjectsListFilters,
  ProjectsListResponse,
} from "./projects.types"

export const projectsService = {
  kanban(filters: { search?: string; onlyMine?: boolean }) {
    const query = new URLSearchParams()
    if (filters.search) query.set("search", filters.search)
    if (filters.onlyMine) query.set("onlyMine", "true")
    const suffix = query.size ? `?${query.toString()}` : ""
    return api.get<ProjectKanbanResponse>(`/projects/kanban${suffix}`)
  },

  create(payload: ProjectMutationPayload) {
    return api.post<ProjectMutationResponse>("/projects", payload)
  },

  list(filters: ProjectsListFilters) {
    const query = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(filters.pageSize),
    })

    if (filters.search) query.set("search", filters.search)
    if (filters.status) query.set("status", filters.status)
    if (filters.stage) query.set("stage", filters.stage)
    if (filters.onlyArchived) query.set("onlyArchived", "true")
    if (filters.includeArchived) query.set("includeArchived", "true")

    return api.get<ProjectsListResponse>(`/projects?${query.toString()}`)
  },

  details(projectId: string, includeArchived = false) {
    const query = includeArchived ? "?includeArchived=true" : ""
    return api.get<ProjectDetailsResponse>(`/projects/${projectId}/details${query}`)
  },

  update(projectId: string, payload: ProjectMutationPayload) {
    return api.patch<ProjectMutationResponse>(`/projects/${projectId}`, payload)
  },

  updateFlow(projectId: string, payload: ProjectFlowPayload) {
    return api.patch<ProjectMutationResponse>(`/projects/${projectId}/flow`, payload)
  },

  reviewAsBuilt(projectId: string, payload: AsBuiltReviewPayload) {
    return api.patch<ProjectMutationResponse>(`/projects/${projectId}/as-built/review`, payload)
  },

  moveKanban(projectId: string, stage: string) {
    return api.patch(`/projects/${projectId}/kanban/move`, { stage })
  },

  addMember(projectId: string, payload: AddProjectMemberPayload) {
    return api.post<ProjectMemberMutationResponse>(`/projects/${projectId}/members`, payload)
  },

  removeMember(projectId: string, memberId: string) {
    return api.delete<{ message: string }>(`/projects/${projectId}/members/${memberId}`)
  },
}
