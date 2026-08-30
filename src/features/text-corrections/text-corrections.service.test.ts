import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { textCorrectionsService } from "./text-corrections.service"

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

describe("textCorrectionsService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("usa os endpoints administrativos do dicionário", () => {
    const input = { damagedText: "ALVAR�ES", correctedText: "ALVARÃES", isActive: true }
    textCorrectionsService.list()
    textCorrectionsService.create(input)
    textCorrectionsService.update("rule-1", input)
    textCorrectionsService.remove("rule-1")
    textCorrectionsService.applyCatalog()
    textCorrectionsService.reviewItem("item-1", "Descrição revisada", { damagedText: "CAB�", correctedText: "CABO" })

    expect(api.get).toHaveBeenCalledWith("/text-corrections")
    expect(api.post).toHaveBeenCalledWith("/text-corrections", input)
    expect(api.put).toHaveBeenCalledWith("/text-corrections/rule-1", input)
    expect(api.delete).toHaveBeenCalledWith("/text-corrections/rule-1")
    expect(api.post).toHaveBeenCalledWith("/text-corrections/apply", { scope: "CATALOG" })
    expect(api.patch).toHaveBeenCalledWith("/text-corrections/review/item-1", { description: "Descrição revisada", learnRule: { damagedText: "CAB�", correctedText: "CABO" } })
  })

  it("envia uma regra provisória durante o teste", () => {
    const input = { text: "ALVAR�ES-AM", damagedText: "ALVAR�ES", correctedText: "ALVARÃES" }
    textCorrectionsService.test(input)
    expect(api.post).toHaveBeenCalledWith("/text-corrections/test", input)
  })
})
