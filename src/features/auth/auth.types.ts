export type UserRole = "ADMIN" | "GESTOR" | "PROJETISTA" | "CONSULTA"

export type Permission =
  | "audit.view"
  | "permissions.view"
  | "projects.view_all"
  | "projects.edit_own"
  | "tasks.view_all"
  | "tasks.create"
  | "tasks.edit_own"
  | "estimates.view_all"
  | "estimates.create"
  | "estimates.edit"
  | "diex.issue"
  | "service_orders.issue"
  | "atas.manage"
  | "military_organizations.manage"
  | "sessions.manage_own"
  | "sessions.manage_all"
  | "dashboard.view_operational"
  | "dashboard.view_executive"
  | "dashboard.financial_view"
  | "reports.export"
  | "users.manage"
  | (string & {})

export type AuthUser = {
  id: string
  name?: string
  email: string
  rank?: string | null
  cpf?: string | null
  role: UserRole
  permissions: Permission[]
  access?: {
    role: UserRole
    permissions: Permission[]
    isAdmin: boolean
  }
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export type RefreshResponse = {
  accessToken: string
  refreshToken?: string
}

export type SessionStatus = "ACTIVE" | "REVOKED" | "EXPIRED"

export type AuthSession = {
  id: string
  status: SessionStatus
  statusDetail: {
    code: SessionStatus
    label: string
    reason: string | null
    reasonLabel: string | null
  }
  currentSession: boolean
  createdAt: string
  expiresAt: string | null
  revokedAt: string | null
  lastActivityAt: string | null
  securityContext: {
    ipAddress: string | null
    userAgent: string | null
  }
}

export type SessionsResponse = {
  scope: "OWN" | "ADMIN"
  permissionUsed: string
  summary: {
    total: number
    active: number
    revoked: number
    expired: number
    currentSessionId: string | null
    currentSessionDetected: boolean
  }
  sessions: AuthSession[]
}

export type SessionMutationResponse = {
  message: string
  revokedCount?: number
}
