import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { systemSettingsService } from "./system-settings.service"

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

describe("proteção do token do Portal da Transparência", () => {
  beforeEach(() => {
    vi.mocked(api.put).mockReset()
    vi.mocked(api.delete).mockReset()
  })

  it("envia o token somente ao endpoint write-only", () => {
    systemSettingsService.savePortalApiToken("token-secreto")

    expect(api.put).toHaveBeenCalledWith("/system-settings/portal-api-token", {
      token: "token-secreto",
    })
  })

  it("remove o segredo pelo endpoint protegido", () => {
    systemSettingsService.removePortalApiToken()

    expect(api.delete).toHaveBeenCalledWith("/system-settings/portal-api-token")
  })
})
