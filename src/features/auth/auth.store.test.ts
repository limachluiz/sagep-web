import { beforeEach, describe, expect, it } from "vitest"

import { useAuthStore } from "./auth.store"
import type { AuthUser, Permission } from "./auth.types"

function user(role: AuthUser["role"], permissions: Permission[]): AuthUser {
  return {
    id: `user-${role.toLowerCase()}`,
    name: role,
    email: `${role.toLowerCase()}@sagep.test`,
    role,
    permissions,
  }
}

describe("auth.store permissions", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().logout()
  })

  it("nega permissões sem usuário autenticado", () => {
    expect(useAuthStore.getState().hasPermission("projects.view_all")).toBe(false)
    expect(useAuthStore.getState().hasAnyPermission(["projects.view_all", "projects.edit_own"])).toBe(false)
  })

  it("usa somente as permissões efetivas entregues pela API", () => {
    useAuthStore.getState().setAuth({
      user: user("GESTOR", ["projects.view_all", "estimates.view_all"]),
      accessToken: "access-token",
    })

    expect(useAuthStore.getState().hasPermission("projects.view_all")).toBe(true)
    expect(useAuthStore.getState().hasPermission("users.manage")).toBe(false)
    expect(useAuthStore.getState().hasAnyPermission(["users.manage", "estimates.view_all"])).toBe(true)
  })

  it("respeita uma remoção efetiva de permissão até para ADMIN", () => {
    useAuthStore.getState().setAuth({
      user: user("ADMIN", ["dashboard.view_operational"]),
      accessToken: "access-token",
    })

    expect(useAuthStore.getState().hasPermission("dashboard.view_operational")).toBe(true)
    expect(useAuthStore.getState().hasPermission("military_organizations.manage")).toBe(false)
  })
})
