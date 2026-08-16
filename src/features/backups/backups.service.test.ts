import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { backupsService } from "./backups.service"

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    postBlob: vi.fn(),
    getBlob: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
  },
}))

describe("backupsService", () => {
  beforeEach(() => vi.clearAllMocks())

  it("envia a confirmação literal exigida na restauração", async () => {
    vi.mocked(api.post).mockResolvedValue({ message: "ok" })

    await backupsService.restore("backup-id")

    expect(api.post).toHaveBeenCalledWith("/backups/backup-id/restore", { confirmation: "RESTAURAR BANCO" })
  })

  it("envia o arquivo importado como binário e preserva o nome", async () => {
    const file = new File(["PGDMP"], "sagep.dump", { type: "application/octet-stream" })
    vi.mocked(api.upload).mockResolvedValue({ id: "backup-id" })

    await backupsService.importArchive(file)

    expect(api.upload).toHaveBeenCalledWith("/backups/import", file, "sagep.dump")
  })

  it("solicita exportação seletiva como arquivo", async () => {
    vi.mocked(api.postBlob).mockResolvedValue(new Blob())

    await backupsService.selectiveExport(["PROJECTS", "ATAS"])

    expect(api.postBlob).toHaveBeenCalledWith("/backups/export", { modules: ["PROJECTS", "ATAS"] })
  })
})
