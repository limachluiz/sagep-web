export type UserRole = "ADMIN" | "GESTOR" | "PROJETISTA" | "CONSULTA"

export type AuthUser = {
  id: string
  name?: string
  email: string
  role: UserRole
  permissions: string[]
  access?: {
    role: UserRole
    permissions: string[]
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