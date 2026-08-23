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

  it("envia a senha apenas no corpo da exportação da autoridade", async () => {
    vi.mocked(api.postBlob).mockResolvedValue(new Blob())
    await backupsService.exportAuthority("senha extensa e exclusiva da autoridade")
    expect(api.postBlob).toHaveBeenCalledWith("/deployment/certificate/authority/export", {
      passphrase: "senha extensa e exclusiva da autoridade",
      passphraseConfirmation: "senha extensa e exclusiva da autoridade",
    })
  })

  it("envia o arquivo codificado e a confirmação literal na restauração da autoridade", async () => {
    vi.mocked(api.post).mockResolvedValue({ configured: true })
    await backupsService.restoreAuthority("U0FHRVA=", "senha extensa e exclusiva da autoridade")
    expect(api.post).toHaveBeenCalledWith("/deployment/certificate/authority/restore", {
      archiveBase64: "U0FHRVA=",
      passphrase: "senha extensa e exclusiva da autoridade",
      confirmation: "RESTAURAR AUTORIDADE",
    })
  })
})
