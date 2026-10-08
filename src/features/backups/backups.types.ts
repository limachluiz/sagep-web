export type BackupKind = "MANUAL" | "AUTOMATIC" | "IMPORTED" | "SAFETY"

export type DatabaseBackup = {
  manifestVersion?: number
  id: string
  kind: BackupKind
  filename: string
  originalFilename: string | null
  createdAt: string
  createdBy: string | null
  sizeBytes: number
  checksumSha256: string
  databaseName: string
  format: "POSTGRES_CUSTOM"
  verified: boolean
  coverage?: "FULL_DATABASE"
  schemaVersion?: string | null
  tableCount?: number
}

export type BackupsOverview = {
  items: DatabaseBackup[]
  summary: {
    total: number
    totalSizeBytes: number
    latestAt: string | null
    automatic: number
    imported: number
  }
  policy: {
    retentionDays: number
    maxFiles: number
    scheduleHours: number
    runOnStartup: boolean
    maxUploadMb: number
  }
  coverage: {
    database: { included: true; mode: "FULL_DATABASE"; currentTableCount: number; detail: string }
    evidenceFiles: { included: false; detail: string }
    certificateAuthority: { included: false; detail: string }
    runtimeSecrets: { included: false; detail: string }
  }
  operationRunning: boolean
}

export type SelectiveExportModule = "PROJECTS" | "ATAS" | "USERS" | "SETTINGS" | "AUDIT"

export type RestoreBackupResponse = {
  message: string
  restoredAt: string
  restoredBackup: DatabaseBackup
  safetyBackup: DatabaseBackup
}

export type RestoreAuthorityResponse = {
  configured: boolean
  status: "NOT_CONFIGURED" | "VALID" | "EXPIRING" | "EXPIRED" | "INVALID"
  rootFingerprintSha256?: string
  fingerprintSha256?: string
  proxyRestartRequired: boolean
  trustRedistributionRequired: boolean
  recoveryFilename: string | null
}
