import { api } from "@/lib/api"
import type { UserRole } from "@/features/auth/auth.types"
import type { AdminUser, CreateUserPayload, UpdateUserPayload, UsersListFilters, UsersListResponse } from "./users.types"

export const usersService = {
  list({ page = 1, pageSize = 10, search, role, active }: UsersListFilters = {}) {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (search) query.set("search", search)
    if (role) query.set("role", role)
    if (active !== undefined) query.set("active", String(active))
    return api.get<UsersListResponse>(`/users?${query.toString()}`)
  },

  create(payload: CreateUserPayload) {
    return api.post<AdminUser>("/users", payload)
  },

  update(userId: string, payload: UpdateUserPayload) {
    return api.patch<AdminUser>(`/users/${userId}`, payload)
  },

  updateRole(userId: string, role: UserRole) {
    return api.patch<AdminUser>(`/users/${userId}/role`, { role })
  },

  updateStatus(userId: string, active: boolean) {
    return api.patch<AdminUser>(`/users/${userId}/status`, { active })
  },
}
