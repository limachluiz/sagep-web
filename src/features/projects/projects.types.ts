import type { ProjectStage } from "@/features/dashboard/dashboard.types"

export type ProjectStatus =
  | "PLANEJAMENTO"
  | "EM_ANDAMENTO"
  | "PAUSADO"
  | "CONCLUIDO"
  | "CANCELADO"

export type ProjectType = "CFTV" | "FIBRA_OPTICA_PONTO_LOGICO"
export type FederativeUnit = "AM" | "RO" | "RR" | "AC"

export type MilitaryOrganization = {
  id: string
  omCode: number
  sigla: string
  name: string
  cityName: string
  stateUf: FederativeUnit
  isActive: boolean
}

export type ProjectListItem = {
  id: string
  projectCode: number
  title: string
  description: string | null
  projectType: ProjectType | null
  omId: string | null
  om: MilitaryOrganization | null
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

export type ProjectKanbanCard = {
  id: string
  projectCode: number
  title: string
  status: ProjectStatus
  stage: ProjectStage
  projectType: ProjectType | null
  om: Pick<MilitaryOrganization, "id" | "sigla" | "cityName" | "stateUf"> | null
  owner: {
    id: string
    name: string
    email: string
  }
  updatedAt: string
  plannedEndDate: string | null
  serviceOrder: {
    id: string
    serviceOrderNumber: string | null
    plannedEndDate: string | null
  } | null
}

export type ProjectKanbanResponse = {
  generatedAt: string
  columns: Array<{
    stage: ProjectStage
    label: string
    count: number
    cards: ProjectKanbanCard[]
  }>
}

export type ProjectMutationPayload = {
  title: string
  projectType: ProjectType
  omId: string
  description?: string
  status?: ProjectStatus
  startDate?: string
}

export type ProjectMutationResponse = {
  id: string
  projectCode: number
  title: string
  description: string | null
  projectType: ProjectType | null
  omId: string | null
  om: MilitaryOrganization | null
  status: ProjectStatus
  stage: ProjectStage
  startDate: string | null
  endDate: string | null
  updatedAt: string
}

export type ProjectFlowPayload = {
  stage: ProjectStage
  creditNoteNumber?: string
  creditNoteReceivedAt?: string
  commitmentNoteNumber?: string
  commitmentNoteReceivedAt?: string
  executionStartedAt?: string
}

export type AddProjectMemberPayload = {
  userCode: number
  role?: string
}

export type ProjectMemberMutationResponse = {
  id: string
  role: string | null
  user: ProjectPerson
}

export type ProjectPerson = {
  id: string
  userCode: number
  name: string
  email: string
  role: string
}

export type ProjectTimelineItem = {
  id: string
  at: string
  action: string
  label: string
  summary: string | null
  actorName: string | null
  entityType: string
  entityId: string
  source: string | null
  context?: Record<string, unknown>
}

export type ProjectDetailsResponse = {
  project: {
    id: string
    projectCode: number
    title: string
    description: string | null
    projectType: ProjectType | null
    omId: string | null
    om: MilitaryOrganization | null
    owner: ProjectPerson
    members: Array<{
      id: string
      role: string | null
      user: ProjectPerson
    }>
    startDate: string | null
    endDate: string | null
    createdAt: string
    updatedAt: string
    archivedAt: string | null
    deletedAt: string | null
  }
  workflow: {
    status: ProjectStatus
    stage: ProjectStage
    nextAction: {
      code: string
      label: string
      description: string
      targetStage?: ProjectStage
    }
    milestones: Record<string, string | null>
  }
  pendingActions: Array<{
    code: string
    label: string
    severity: "BLOCKER" | "WARNING" | "INFO"
    targetStage?: ProjectStage
  }>
  timeline: ProjectTimelineItem[]
  documents: {
    estimates: Array<{
      id: string
      estimateCode: number
      status: string
      destinationCityName: string
      destinationStateUf: string
      totalAmount: string
      archivedAt: string | null
      createdAt: string
    }>
    diexRequests: Array<{
      id: string
      diexCode: number
      diexNumber: string | null
      issuedAt: string | null
      documentStatus: string | null
      totalAmount: string
      supplierName: string | null
      archivedAt: string | null
      createdAt: string
      estimate: { id: string; estimateCode: number }
    }>
    serviceOrders: Array<{
      id: string
      serviceOrderCode: number
      serviceOrderNumber: string | null
      issuedAt: string | null
      documentStatus: string | null
      totalAmount: string
      contractorName: string | null
      archivedAt: string | null
      createdAt: string
      estimate: { id: string; estimateCode: number }
      diexRequest: { id: string; diexCode: number; diexNumber: string | null } | null
    }>
  }
  financialSummary: {
    estimatesCount: number
    finalizedEstimatesCount: number
    diexRequestsCount: number
    serviceOrdersCount: number
    estimatedTotalAmount: string
    finalizedEstimatedTotalAmount: string
    diexTotalAmount: string
    serviceOrderTotalAmount: string
  }
  operationalSummary: {
    membersCount: number
    tasksCount: number
    openTasksCount: number
    estimatesCount: number
    diexRequestsCount: number
    serviceOrdersCount: number
  }
}
