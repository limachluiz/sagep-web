import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { auditService } from "./audit.service"

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}))

describe("auditService", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
  })

  it("envia todos os filtros técnicos aceitos pelo backend", () => {
    auditService.list({
      page: 2,
      limit: 50,
      search: "projeto",
      actor: "Gestor",
      entityType: "PROJECT",
      action: "UPDATE",
      startDate: "2026-07-01T00:00:00.000Z",
      endDate: "2026-07-31T23:59:59.999Z",
    })

    expect(api.get).toHaveBeenCalledOnce()
    const url = vi.mocked(api.get).mock.calls[0][0]
    const query = new URL(url, "https://sagep.test").searchParams

    expect(query.get("page")).toBe("2")
    expect(query.get("limit")).toBe("50")
    expect(query.get("search")).toBe("projeto")
    expect(query.get("actor")).toBe("Gestor")
    expect(query.get("entityType")).toBe("PROJECT")
    expect(query.get("action")).toBe("UPDATE")
    expect(query.get("startDate")).toBe("2026-07-01T00:00:00.000Z")
    expect(query.get("endDate")).toBe("2026-07-31T23:59:59.999Z")
  })

  it("não inclui filtros vazios na consulta", () => {
    auditService.list()

    expect(api.get).toHaveBeenCalledWith("/audits?page=1&limit=25")
  })
})
