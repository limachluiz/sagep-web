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
    avatarDataUrl?: string | null
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
  includeArchived?: boolean
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
    avatarDataUrl?: string | null
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
  asBuiltReceivedAt?: string
  invoiceAttestedAt?: string
  serviceCompletedAt?: string
}

export type DeliveryReportSignaturePayload = { signedAt: string; signedLink?: string }

export type DeliveryReportSection = {
  key: string
  title: string
  content: string
  included: boolean
  reviewed: boolean
}

export type DeliveryReportItemDetail = {
  itemId: string
  unit: string
  quantity: string
  technicalDescription: string
}

export type DeliveryReportFormalization = {
  requiresOmAcknowledgement: boolean
  recipientName: string
  recipientRank: string
  recipientRole: string
  recipientOrganization: string
  acknowledgementNotes: string
}

export type DeliveryReportDraft = {
  version: 2
  sections: DeliveryReportSection[]
  itemDetails: DeliveryReportItemDetail[]
  formalization: DeliveryReportFormalization
}

export type DeliveryReportDraftResponse = {
  project: { id: string; projectCode: number; title: string; projectType: ProjectType | null }
  draft: DeliveryReportDraft
  items: Array<{
    itemId: string
    itemCode: string
    description: string
    sourceUnit: string
    sourceQuantity: string
    totalPrice: string
    suggestedTechnicalDescription: string
  }>
  documents: {
    estimate: { id: string; code: string; ataNumber: string; supplierName: string; totalAmount: string } | null
    diex: { id: string; code: string; issuedAt: string | null; totalAmount: string } | null
    serviceOrder: { id: string; code: string; issuedAt: string | null; totalAmount: string } | null
  }
  readiness: {
    sectionsIncluded: number
    sectionsReviewed: number
    itemsDocumented: number
    totalItems: number
  }
}

export type CancelCommitmentNoteResponse = {
  message: string
  project: ProjectMutationResponse
  rollback: {
    estimateId: string
    diexRequestId: string
    serviceOrderId: string | null
    reason: string
  }
}

export type AsBuiltReviewPayload =
  | { approved: true; reviewedAt: string; asBuiltLink: string }
  | { approved: false; reviewedAt: string; rejectionReason: string }

export type SignedServiceOrderPayload = {
  signedServiceOrderLink: string
  signedServiceOrderReceivedAt: string
  signedServiceOrderNotes?: string
}

export type AddProjectMemberPayload = {
  userId: string
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
  avatarDataUrl?: string | null
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

export type ProjectAuditItem = ProjectTimelineItem & {
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

export type ProjectTaskItem = {
  id: string
  taskCode: number
  title: string
  status: "PENDENTE" | "EM_ANDAMENTO" | "REVISAO" | "CONCLUIDA" | "CANCELADA"
  priority: number
  dueDate: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  assignee: ProjectPerson | null
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
    serviceOrderSignature: {
      required: boolean
      link: string | null
      receivedAt: string | null
      notes: string | null
      registeredBy: ProjectPerson | null
    }
  }
  pendingActions: Array<{
    code: string
    label: string
    severity: "BLOCKER" | "WARNING" | "INFO"
    targetStage?: ProjectStage
  }>
  timeline: ProjectTimelineItem[]
  auditTrail: ProjectAuditItem[] | null
  tasks: ProjectTaskItem[]
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
      ata: {
        number: string
        vendorName: string
        vendorCnpj: string | null
      }
    }>
    diexRequests: Array<{
      id: string
      diexCode: number
      diexNumber: string | null
      issuedAt: string | null
      documentStatus: string | null
      totalAmount: string
      supplierName: string | null
      supplierCnpj: string
      requesterName: string
      requesterRank: string
      requesterCpf: string | null
      issuingOrganization: string
      pregaoNumber: string
      uasg: string
      archivedAt: string | null
      createdAt: string
      estimate: {
        id: string
        estimateCode: number
        destinationCityName: string
        destinationStateUf: string
        ata: {
          number: string
          vendorName: string
          pregao: { number: string; year: string; managingAgency: string | null } | null
        }
      }
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
