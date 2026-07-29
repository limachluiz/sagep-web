import { api } from "@/lib/api"
import type {
  CreateTaskPayload,
  Task,
  TasksListFilters,
  TasksListResponse,
  TaskStatus,
  UpdateTaskPayload,
} from "./tasks.types"

export const tasksService = {
  list(filters: TasksListFilters) {
    const query = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(filters.pageSize),
    })

    if (filters.search) query.set("search", filters.search)
    if (filters.projectCode) query.set("projectCode", String(filters.projectCode))
    if (filters.assigneeCode) query.set("assigneeCode", String(filters.assigneeCode))
    if (filters.status) query.set("status", filters.status)
    if (filters.onlyArchived) query.set("onlyArchived", "true")

    return api.get<TasksListResponse>(`/tasks?${query.toString()}`)
  },

  details(taskId: string, includeArchived = false) {
    const suffix = includeArchived ? "?includeArchived=true" : ""
    return api.get<Task>(`/tasks/${taskId}${suffix}`)
  },

  create(payload: CreateTaskPayload) {
    return api.post<Task>("/tasks", payload)
  },

  update(taskId: string, payload: UpdateTaskPayload) {
    return api.patch<Task>(`/tasks/${taskId}`, payload)
  },

  updateStatus(taskId: string, status: TaskStatus) {
    return api.patch<Task>(`/tasks/${taskId}/status`, { status })
  },

  archive(taskId: string) {
    return api.delete<{ message: string; task: Task }>(`/tasks/${taskId}`)
  },

  restore(taskId: string) {
    return api.post<{ message: string; task: Task }>(`/tasks/${taskId}/restore`, {})
  },

  softDelete(taskId: string) {
    return api.delete<{ message: string; deletedAt: string }>(`/tasks/${taskId}/permanent`)
  },
}

