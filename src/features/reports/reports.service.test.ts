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

  it("gera a posição das ATAs com filtros de natureza e situação", () => {
    reportsService.ataBalancePositionPdf({ ataType: "FIBRA_OPTICA", status: "ACTIVE" })

    const url = vi.mocked(api.getBlob).mock.calls[0][0]
    const query = new URL(url, "https://sagep.test").searchParams

    expect(url).toContain("/reports/atas/balance-position.pdf")
    expect(query.get("ataType")).toBe("FIBRA_OPTICA")
    expect(query.get("status")).toBe("ACTIVE")
  })

  it("omite filtros neutros da posição das ATAs", () => {
    reportsService.ataBalancePositionPdf({ status: "ALL" })

    expect(api.getBlob).toHaveBeenCalledWith("/reports/atas/balance-position.pdf")
  })

  it("gera relatório de NEs com recorte por fornecedor e período", () => {
    reportsService.commitmentNotesPdf({
      supplier: "FORNECEDOR ALFA LTDA",
      origin: "IMPORTED",
      managementUnit: "160016",
      issuedFrom: "2026-01-01",
      issuedTo: "2026-12-31",
    })

    const url = vi.mocked(api.getBlob).mock.calls[0][0]
    const query = new URL(url, "https://sagep.test").searchParams
    expect(url).toContain("/reports/financial-execution/commitment-notes.pdf")
    expect(query.get("supplier")).toBe("FORNECEDOR ALFA LTDA")
    expect(query.get("origin")).toBe("IMPORTED")
    expect(query.get("managementUnit")).toBe("160016")
    expect(query.get("issuedFrom")).toBe("2026-01-01")
    expect(query.get("issuedTo")).toBe("2026-12-31")
  })

  it("envia a seleção de NEs para PDF e Excel", () => {
    const codes = ["160016000012026NE000021", "160016000012026NE000023"]
    reportsService.commitmentNotesPdf({ codes })
    reportsService.commitmentNotesXlsx({ codes })

    expect(vi.mocked(api.getBlob).mock.calls[0][0]).toContain(`codes=${codes.join("%2C")}`)
    expect(vi.mocked(api.getBlob).mock.calls[1][0]).toContain("/reports/financial-execution/commitment-notes.xlsx")
  })

})
