export type AuditEntityType =
  | "PROJECT"
  | "ESTIMATE"
  | "DIEX_REQUEST"
  | "SERVICE_ORDER"
  | "TASK"
  | "USER"
  | "AUTH"

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ARCHIVE"
  | "RESTORE"
  | "STATUS_CHANGE"
  | "STAGE_CHANGE"
  | "ISSUE"
  | "FINALIZE"
  | "CANCEL"
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "TOKEN_REFRESH"
  | "SESSION_REVOKE"
  | "SESSION_REVOKE_ALL"
  | "SESSION_EXPIRE"
  | "SESSION_CLEANUP"

export type AuditLog = {
  id: string
  entityType: AuditEntityType
  entityId: string
  action: AuditAction
  actorUserId: string | null
  actorName: string | null
  summary: string
  createdAt: string
  metadata: Record<string, unknown> | null
}

export type AuditListFilters = {
  page?: number
  limit?: number
  search?: string
  actor?: string
  entityType?: AuditEntityType
  action?: AuditAction
  startDate?: string
  endDate?: string
}

export type AuditListResponse = {
  items: AuditLog[]
  meta: {
    page: number
    pageSize: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
