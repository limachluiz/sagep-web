import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { systemHealthService } from "./system-health.service"

vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }))

describe("systemHealthService", () => {
  beforeEach(() => vi.mocked(api.get).mockReset())

  it("consulta o resumo sem depender da autenticacao ou do banco", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: "operational" })

    const result = await systemHealthService.getStatus()

    expect(api.get).toHaveBeenCalledWith("/health/status", { skipAuth: true })
    expect(result.snapshot).toEqual({ status: "operational" })
    expect(result.roundTripMs).toBeGreaterThanOrEqual(0)
  })

  it("solicita uma nova sonda quando o usuario executa o diagnostico", async () => {
    vi.mocked(api.get).mockResolvedValue({ status: "operational" })

    await systemHealthService.getStatus(true)
    await systemHealthService.getDetails(true)

    expect(api.get).toHaveBeenNthCalledWith(1, "/health/status?refresh=true", { skipAuth: true })
    expect(api.get).toHaveBeenNthCalledWith(2, "/health/details?refresh=true")
  })
})
