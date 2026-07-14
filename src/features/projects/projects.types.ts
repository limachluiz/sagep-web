import type { ProjectStage } from "@/features/dashboard/dashboard.types"

export type ProjectStatus =
  | "PLANEJAMENTO"
  | "EM_ANDAMENTO"
  | "PAUSADO"
  | "CONCLUIDO"
  | "CANCELADO"

export type ProjectListItem = {
  id: string
  projectCode: number
  title: string
  description: string | null
  status: ProjectStatus
  stage: ProjectStage
  ownerId: string | null
  ownerName?: string | null
  owner: {
    id: string
    userCode: number
    name: string
    email: string
    role: string
  } | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  deletedAt: string | null
  _count: {
    members: number
    tasks: number
    estimates: number
  }
  archiveContext?: {
    archived: boolean
    archivedAt: string | null
  }
}

export type ProjectsListFilters = {
  page: number
  pageSize: number
  search?: string
  status?: ProjectStatus
  stage?: ProjectStage
  onlyArchived?: boolean
}

export type ProjectsListResponse = {
  items: ProjectListItem[]
  meta: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  filters: Record<string, unknown>
  links: {
    self: string
  }
}
