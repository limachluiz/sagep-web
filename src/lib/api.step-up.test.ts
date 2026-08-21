import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/auth.store"
import { registerStepUpHandler } from "@/features/auth/step-up.manager"
import { api } from "./api"

describe("api — autorização reforçada", () => {
  beforeEach(() => {
    useAuthStore.getState().setTokens({ accessToken: "access-token" })
  })

  afterEach(() => {
    registerStepUpHandler(null)
    useAuthStore.getState().logout()
    vi.unstubAllGlobals()
  })

  it("confirma a senha ao receber 428 e repete a operação com o token temporário", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: "AUTH_STEP_UP_REQUIRED" }), {
          status: 428,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ updated: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
    const handler = vi.fn().mockResolvedValue("step-up-token")
    registerStepUpHandler(handler)
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      api.put<{ updated: boolean }>("/users/user-2/status", { active: false }),
    ).resolves.toEqual({ updated: true })

    expect(handler).toHaveBeenCalledWith(false)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const retryOptions = fetchMock.mock.calls[1]?.[1]
    const retryHeaders = new Headers(retryOptions?.headers)
    expect(retryHeaders.get("Authorization")).toBe("Bearer access-token")
    expect(retryHeaders.get("X-SAGEP-Reauth")).toBe("step-up-token")
    expect(retryOptions).not.toHaveProperty("skipStepUp")
    expect(retryOptions).not.toHaveProperty("skipRefresh")
  })

  it("não abre confirmação para uma requisição que a desabilita explicitamente", async () => {
    const handler = vi.fn().mockResolvedValue("step-up-token")
    registerStepUpHandler(handler)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Senha inválida" }), {
          status: 428,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )

    await expect(
      api.post("/auth/reauthenticate", { password: "errada" }, { skipStepUp: true }),
    ).rejects.toMatchObject({ status: 428 })
    expect(handler).not.toHaveBeenCalled()
  })
})
