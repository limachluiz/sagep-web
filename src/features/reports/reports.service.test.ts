import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { reportsService } from "./reports.service"

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    getBlob: vi.fn(),
  },
}))

describe("reportsService", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.getBlob).mockReset()
  })

  it("gera o PDF executivo com o critério de projetos sem atualização", () => {
    reportsService.executiveProjectsPdf({ staleDays: 30 })

    expect(api.getBlob).toHaveBeenCalledWith(
      "/reports/projects/executive-summary.pdf?staleDays=30",
    )
  })

  it("encaminha os filtros executivos aceitos pelo backend", () => {
    reportsService.executiveProjectsPdf({
      staleDays: 15,
      periodType: "month",
      referenceDate: "2026-07-01",
      stateUf: "AM",
      projectType: "FIBRA_OPTICA_PONTO_LOGICO",
      ownerId: "user-1",
    })

    const url = vi.mocked(api.getBlob).mock.calls[0][0]
    const query = new URL(url, "https://sagep.test").searchParams

    expect(query.get("staleDays")).toBe("15")
    expect(query.get("periodType")).toBe("month")
    expect(query.get("referenceDate")).toBe("2026-07-01")
    expect(query.get("stateUf")).toBe("AM")
    expect(query.get("projectType")).toBe("FIBRA_OPTICA_PONTO_LOGICO")
    expect(query.get("ownerId")).toBe("user-1")
  })

  it("permite gerar o relatório por tipo de projeto", () => {
    reportsService.executiveProjectsPdf({
      staleDays: 15,
      projectType: "CFTV",
    })

    const url = vi.mocked(api.getBlob).mock.calls[0][0]
    expect(new URL(url, "https://sagep.test").searchParams.get("projectType")).toBe(
      "CFTV",
    )
  })

  it("gera relatório consolidado combinando finalidade e escopo", () => {
    reportsService.consolidatedProjectsPdf("financial", {
      staleDays: 30,
      projectType: "CFTV",
    })

    const url = vi.mocked(api.getBlob).mock.calls[0][0]
    const query = new URL(url, "https://sagep.test").searchParams

    expect(url).toContain("/reports/projects/consolidated-summary.pdf")
    expect(query.get("reportType")).toBe("financial")
    expect(query.get("projectType")).toBe("CFTV")
    expect(query.get("staleDays")).toBe("30")
  })
})
