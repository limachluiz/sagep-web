export type TaskStatus =
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "REVISAO"
  | "CONCLUIDA"
  | "CANCELADA"

export type TaskPerson = {
  id: string
  userCode: number
  name: string
  email: string
  role: string
  active?: boolean
}

export type Task = {
  id: string
  taskCode: number
  title: string
  description: string | null
  status: TaskStatus
  priority: number
  projectId: string
  assigneeId: string | null
  dueDate: string | null
  archivedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  project: {
    id: string
    projectCode: number
    title: string
    status: string
    ownerId?: string
    owner?: TaskPerson
  }
  assignee: TaskPerson | null
  archiveContext?: {
    archivedAt: string
    summary: string | null
    actorName: string | null
  } | null
}

export type TasksListResponse = {
  items: Task[]
  meta: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type TasksListFilters = {
  page: number
  pageSize: number
  search?: string
  projectCode?: number
  assigneeCode?: number
  status?: TaskStatus
  onlyArchived?: boolean
}

export type CreateTaskPayload = {
  projectCode: number
  title: string
  description?: string
  status?: TaskStatus
  priority?: number
  assigneeUserCode?: number
  dueDate?: string
}

export type UpdateTaskPayload = {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: number
  assigneeUserCode?: number
  clearAssignee?: boolean
  dueDate?: string
  clearDueDate?: boolean
}
