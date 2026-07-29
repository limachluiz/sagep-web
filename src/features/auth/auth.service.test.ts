import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { authService } from "./auth.service"

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe("authService — administração de sessões", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
  })

  it("consulta até cem sessões próprias ou de um usuário selecionado", () => {
    authService.listSessions()
    authService.listUserSessions("user-2")

    expect(api.get).toHaveBeenNthCalledWith(1, "/auth/sessions?status=ALL&pageSize=100")
    expect(api.get).toHaveBeenNthCalledWith(2, "/auth/users/user-2/sessions?status=ALL&pageSize=100")
  })

  it("usa os endpoints administrativos para revogação e retenção", () => {
    authService.revokeUserSession("user-2", "session-3")
    authService.revokeAllUserSessions("user-2")
    authService.cleanupSessions(120, 365)

    expect(api.post).toHaveBeenNthCalledWith(1, "/auth/users/user-2/sessions/session-3/revoke")
    expect(api.post).toHaveBeenNthCalledWith(2, "/auth/users/user-2/sessions/revoke-all")
    expect(api.post).toHaveBeenNthCalledWith(3, "/auth/sessions/cleanup", {
      refreshTokenRetentionDays: 120,
      auditRetentionDays: 365,
    })
  })
})
