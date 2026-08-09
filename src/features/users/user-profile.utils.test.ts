import { describe, expect, it } from "vitest"

import type { AuthUser } from "@/features/auth/auth.types"
import {
  formatProfileDate,
  getAccessGroups,
  getUserDisplayName,
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

  it("presents posto/graduação with nome de guerra and keeps safe fallbacks", () => {
    expect(getUserDisplayName({
      ...user,
      name: "Luiz Henrique Chagas de Lima",
      rank: "3º Sgt",
      warName: "Lima",
    })).toBe("3º Sgt Lima")
    expect(getUserDisplayName({ ...user, name: "Luiz Lima" })).toBe("Luiz Lima")
    expect(getUserDisplayName(null)).toBe("Usuário")
  })
})
