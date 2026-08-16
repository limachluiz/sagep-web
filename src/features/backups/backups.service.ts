import { api } from "@/lib/api"
import type { BackupsOverview, DatabaseBackup, RestoreBackupResponse, SelectiveExportModule } from "./backups.types"

export const backupsService = {
  list: () => api.get<BackupsOverview>("/backups"),
  create: () => api.post<DatabaseBackup>("/backups"),
  importArchive: (file: File) => api.upload<DatabaseBackup>("/backups/import", file, file.name),
  download: (id: string) => api.getBlob(`/backups/${id}/download`),
  remove: (id: string) => api.delete<{ message: string; id: string }>(`/backups/${id}`),
  restore: (id: string) => api.post<RestoreBackupResponse>(`/backups/${id}/restore`, { confirmation: "RESTAURAR BANCO" }),
  selectiveExport: (modules: SelectiveExportModule[]) => api.postBlob("/backups/export", { modules }),
}
