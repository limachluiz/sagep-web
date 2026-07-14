import { api } from "@/lib/api"
import type {
  ProjectDetailsResponse,
  ProjectsListFilters,
  ProjectsListResponse,
} from "./projects.types"

export const projectsService = {
  list(filters: ProjectsListFilters) {
    const query = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(filters.pageSize),
    })

    if (filters.search) query.set("search", filters.search)
    if (filters.status) query.set("status", filters.status)
    if (filters.stage) query.set("stage", filters.stage)
    if (filters.onlyArchived) query.set("onlyArchived", "true")

    return api.get<ProjectsListResponse>(`/projects?${query.toString()}`)
  },

  details(projectId: string, includeArchived = false) {
    const query = includeArchived ? "?includeArchived=true" : ""
    return api.get<ProjectDetailsResponse>(`/projects/${projectId}/details${query}`)
  },
}
