import { api } from "@/lib/api"
import type {
  AddProjectMemberPayload,
  AsBuiltReviewPayload,
  ProjectDetailsResponse,
  ProjectFlowPayload,
  CancelCommitmentNoteResponse,
  ProjectMemberMutationResponse,
  ProjectKanbanResponse,
  ProjectMutationPayload,
  ProjectMutationResponse,
  ProjectsListFilters,
  ProjectsListResponse,
  FederativeUnit,
  SignedServiceOrderPayload,
  ProjectType,
  DeliveryReportSignaturePayload,
  DeliveryReportDraft,
  DeliveryReportDraftResponse,
} from "./projects.types"

export const projectsService = {
  kanban(filters: {
    search?: string
    onlyMine?: boolean
    stage?: string
    projectType?: ProjectType
    omId?: string
    stateUf?: FederativeUnit
    ownerId?: string
  }) {
    const query = new URLSearchParams()
    if (filters.search) query.set("search", filters.search)
    if (filters.onlyMine) query.set("onlyMine", "true")
    if (filters.stage) query.set("stage", filters.stage)
    if (filters.projectType) query.set("projectType", filters.projectType)
    if (filters.omId) query.set("omId", filters.omId)
    if (filters.stateUf) query.set("stateUf", filters.stateUf)
    if (filters.ownerId) query.set("ownerId", filters.ownerId)
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

  archive(projectId: string) {
    return api.delete<{ message: string; project: ProjectMutationResponse }>(`/projects/${projectId}`)
  },

  restore(projectId: string) {
    return api.post<{ message: string; project: ProjectMutationResponse }>(`/projects/${projectId}/restore`, {})
  },

  softDelete(projectId: string) {
    return api.delete<{ message: string; deletedAt: string }>(`/projects/${projectId}/permanent`)
  },

  updateFlow(projectId: string, payload: ProjectFlowPayload) {
    return api.patch<ProjectMutationResponse>(`/projects/${projectId}/flow`, payload)
  },

  generateDeliveryReport(projectId: string) { return api.postBlob(`/reports/projects/${projectId}/delivery.pdf`) },
  deliveryReportPdf(projectId: string) { return api.getBlob(`/reports/projects/${projectId}/delivery.pdf`) },
  deliveryReportDraft(projectId: string) { return api.get<DeliveryReportDraftResponse>(`/projects/${projectId}/delivery-report/draft`) },
  updateDeliveryReportDraft(projectId: string, payload: DeliveryReportDraft) { return api.put<DeliveryReportDraftResponse>(`/projects/${projectId}/delivery-report/draft`, payload) },
  registerDeliveryReportSignature(projectId: string, payload: DeliveryReportSignaturePayload) { return api.patch<ProjectMutationResponse>(`/projects/${projectId}/delivery-report/signature`, payload) },

  cancelCommitmentNote(projectId: string, reason: string) {
    return api.post<CancelCommitmentNoteResponse>(
      `/projects/${projectId}/commitment-note/cancel`,
      { reason },
    )
  },

  reviewAsBuilt(projectId: string, payload: AsBuiltReviewPayload) {
    return api.patch<ProjectMutationResponse>(`/projects/${projectId}/as-built/review`, payload)
  },

  registerSignedServiceOrder(projectId: string, payload: SignedServiceOrderPayload) {
    return api.patch<ProjectMutationResponse>(
      `/projects/${projectId}/service-order/signature`,
      payload,
    )
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
