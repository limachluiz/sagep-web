export type UserRole = "ADMIN" | "GESTOR" | "PROJETISTA" | "CONSULTA"

export type Permission =
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
