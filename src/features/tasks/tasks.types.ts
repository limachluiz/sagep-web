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

export type TaskActivityType = "NOTE" | "STATUS_CHANGE" | "COMPLETION" | "REOPENED"

export type TaskActivity = {
  id: string
  type: TaskActivityType
  content: string
  fromStatus: TaskStatus | null
  toStatus: TaskStatus | null
  author: TaskPerson | null
  createdAt: string
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
  completedById?: string | null
  dueDate: string | null
  completedAt?: string | null
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
  completedBy?: TaskPerson | null
  activities?: TaskActivity[]
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
  projectId: string
  title: string
  description?: string
  status?: TaskStatus
  priority?: number
  assigneeId?: string
  assigneeUserCode?: number
  dueDate?: string
}

export type UpdateTaskPayload = {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: number
  assigneeId?: string
  assigneeUserCode?: number
  clearAssignee?: boolean
  dueDate?: string
  clearDueDate?: boolean
}
