import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { financialExecutionService } from "./financial-execution.service"

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }))

describe("financialExecutionService", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.post).mockReset()
  })

  it("permite verificar uma NE individualmente", () => {
    financialExecutionService.sync("ne-1")

    expect(api.post).toHaveBeenCalledWith("/financial-execution/commitment-notes/ne-1/sync")
  })

  it("permite atualizar toda a carteira financeira", () => {
    financialExecutionService.syncAll()

    expect(api.post).toHaveBeenCalledWith("/financial-execution/sync")
  })
})
