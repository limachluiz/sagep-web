import { describe, expect, it } from "vitest"

import type { AuthUser } from "@/features/auth/auth.types"
import {
  formatProfileDate,
  getAccessGroups,
  maskCpf,
  roleLabels,
} from "./user-profile.utils"

const user: AuthUser = {
  id: "user-1",
  email: "usuario@sagep.mil.br",
  role: "PROJETISTA",
  permissions: ["projects.edit_own", "tasks.create"],
}

describe("user profile utilities", () => {
  it("groups effective permissions when the backend catalog is unavailable", () => {
    expect(getAccessGroups(user)).toEqual([
      expect.objectContaining({ name: "Projetos" }),
      expect.objectContaining({ name: "Tarefas" }),
    ])
  })

  it("prefers permission groups returned by the backend", () => {
    const groups = [{
      name: "Fluxo documental",
      permissions: [{
        code: "diex.issue",
        module: "diex",
        action: "issue",
        description: "Emitir DIEx",
        critical: false,
      }],
    }]

    expect(getAccessGroups({
      ...user,
      access: {
        role: user.role,
        permissions: user.permissions,
        isAdmin: false,
        groups,
      },
    })).toBe(groups)
  })

  it("masks CPF and formats profile labels safely", () => {
    expect(maskCpf("123.456.789-09")).toBe("***.456.789-**")
    expect(maskCpf(null)).toBe("Não informado")
    expect(roleLabels.PROJETISTA).toBe("Projetista")
    expect(formatProfileDate("invalid")).toBe("Não informado")
  })
})
