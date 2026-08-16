import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { militaryOrganizationsService } from "./military-organizations.service"

vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), getBlob: vi.fn(), post: vi.fn(), patch: vi.fn() } }))

describe("militaryOrganizationsService CSV", () => {
  beforeEach(() => vi.clearAllMocks())

  it("solicita prévia sem gravar informações", async () => {
    vi.mocked(api.post).mockResolvedValue({ rows: [], summary: {} })

    await militaryOrganizationsService.previewImport("sigla;nome;cidade;uf", "CREATE_ONLY")

    expect(api.post).toHaveBeenCalledWith("/military-organizations/import/preview", {
      content: "sigla;nome;cidade;uf",
      mode: "CREATE_ONLY",
    })
  })

  it("confirma a importação com a mesma estratégia escolhida", async () => {
    vi.mocked(api.post).mockResolvedValue({ imported: 1 })

    await militaryOrganizationsService.importCsv("csv", "UPSERT")

    expect(api.post).toHaveBeenCalledWith("/military-organizations/import", { content: "csv", mode: "UPSERT" })
  })

  it("baixa o modelo oficial", async () => {
    vi.mocked(api.getBlob).mockResolvedValue(new Blob())

    await militaryOrganizationsService.template()

    expect(api.getBlob).toHaveBeenCalledWith("/military-organizations/import/template")
  })
})
