import type { UserRole } from "@/features/auth/auth.types"
import type { AdminUser } from "@/features/users/users.types"

export type PermissionCatalogItem = {
  code: string
  module: string
  group: string
  action: string
  description: string
  defaultRoles: UserRole[]
  critical: boolean
}

export type RolePermissionItem = PermissionCatalogItem & { assigned: boolean }

export type RolePermissionsResponse = {
  message?: string
  role: UserRole
  source: "database" | "fallback"
  basePermissions: string[]
  items: RolePermissionItem[]
}

export type UserPermissionItem = PermissionCatalogItem & {
  grantedByRole: boolean
  overrideEffect: "ALLOW" | "DENY" | null
  effective: boolean
}

export type UserPermissionsResponse = {
  user: AdminUser
  rolePermissionSource: "database" | "fallback"
  roleBasePermissions: string[]
  overrides: Array<{
    permission: string
    effect: "ALLOW" | "DENY"
    createdAt: string
    updatedAt: string
  }>
  effectivePermissions: string[]
  items: UserPermissionItem[]
}

export type PermissionUsersResponse = { items: AdminUser[] }

export type UserPermissionMutationResponse = {
  message: string
  summary: UserPermissionsResponse
}
