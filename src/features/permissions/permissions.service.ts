import { api } from "@/lib/api"
import type { UserRole } from "@/features/auth/auth.types"
import type {
  PermissionUsersResponse,
  RolePermissionsResponse,
  UserPermissionMutationResponse,
  UserPermissionsResponse,
} from "./permissions.types"

export const permissionsService = {
  listUsers() {
    return api.get<PermissionUsersResponse>("/permissions/users")
  },

  getRole(role: UserRole) {
    return api.get<RolePermissionsResponse>(`/permissions/roles/${role}`)
  },

  updateRole(role: UserRole, permissions: string[]) {
    return api.put<RolePermissionsResponse>(`/permissions/roles/${role}`, { permissions })
  },

  getUser(userId: string) {
    return api.get<UserPermissionsResponse>(`/permissions/users/${userId}`)
  },

  setUserOverride(userId: string, permissionCode: string, effect: "ALLOW" | "DENY") {
    return api.post<UserPermissionMutationResponse>(
      `/permissions/users/${userId}/overrides/${effect.toLowerCase()}`,
      { permissionCode },
    )
  },

  removeUserOverride(userId: string, permissionCode: string) {
    return api.delete<UserPermissionMutationResponse>(
      `/permissions/users/${userId}/overrides/${encodeURIComponent(permissionCode)}`,
    )
  },
}
