import type { UserRole } from "@/features/auth/auth.types"

export type AdminUser = {
  id: string
  userCode: number
  name: string
  email: string
  role: UserRole
  rank: string | null
  cpf: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export type UserOption = Pick<
  AdminUser,
  "id" | "userCode" | "name" | "email" | "role" | "rank" | "active"
>

export type UserOptionsResponse = {
  items: UserOption[]
}

export type UsersListResponse = {
  items: AdminUser[]
  meta: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export type UsersListFilters = {
  page?: number
  pageSize?: number
  search?: string
  role?: UserRole
  active?: boolean
}

export type UserOptionsFilters = {
  projectId?: string
  projectCode?: number
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: Exclude<UserRole, "ADMIN">
  rank?: string
  cpf?: string
}

export type UpdateUserPayload = {
  name: string
  email: string
  rank?: string
  cpf?: string
}

export type UserFormPayload = UpdateUserPayload & {
  role: UserRole
  password?: string
}
