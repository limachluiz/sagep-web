import { api } from "@/lib/api"
import type { BackupsOverview, DatabaseBackup, RestoreAuthorityResponse, RestoreBackupResponse, SelectiveExportModule } from "./backups.types"

export const backupsService = {
  list: () => api.get<BackupsOverview>("/backups"),
  create: () => api.post<DatabaseBackup>("/backups"),
  importArchive: (file: File) => api.upload<DatabaseBackup>("/backups/import", file, file.name),
  download: (id: string) => api.getBlob(`/backups/${id}/download`),
  remove: (id: string) => api.delete<{ message: string; id: string }>(`/backups/${id}`),
  restore: (id: string) => api.post<RestoreBackupResponse>(`/backups/${id}/restore`, { confirmation: "RESTAURAR BANCO" }),
  selectiveExport: (modules: SelectiveExportModule[]) => api.postBlob("/backups/export", { modules }),
  exportAuthority: (passphrase: string) => api.postBlob("/deployment/certificate/authority/export", { passphrase, passphraseConfirmation: passphrase }),
  restoreAuthority: (archiveBase64: string, passphrase: string) => api.post<RestoreAuthorityResponse>("/deployment/certificate/authority/restore", {
    archiveBase64,
    passphrase,
    confirmation: "RESTAURAR AUTORIDADE",
  }),
}
