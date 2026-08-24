export type IntegrationProvider = "DATABASE" | "PORTAL_TRANSPARENCIA" | "COMPRAS_GOV" | "PNCP"
export type ConnectionStatus = "OPERATIONAL" | "DEGRADED" | "UNAVAILABLE" | "NOT_CONFIGURED"

export type ConnectionCheck = {
  id: string
  provider: IntegrationProvider
  status: ConnectionStatus
  latencyMs: number | null
  httpStatus: number | null
  message: string
  checkedAt: string
}

export type SystemSettings = {
  id: string
  organizationName: string
  organizationAcronym: string
  uasg: string
  management: string
  timeZone: string
  commandName: string
  portalTransparenciaBaseUrl: string
  portalSyncIntervalMinutes: number
  portalSyncOnStartup: boolean
  comprasGovBaseUrl: string
  pncpBaseUrl: string
  defaultBiddingNumber: string | null
  defaultBiddingYear: number | null
  defaultImmediateCommitment: boolean
  defaultEstimateGroup: string
  portalApiToken: {
    configured: boolean
    source: "DATABASE" | "ENVIRONMENT" | null
    updatedAt: string | null
    encryption: "DEDICATED" | "DERIVED" | null
  }
  connections: Partial<Record<IntegrationProvider, ConnectionCheck>>
}

export type UpdateSystemSettings = Omit<SystemSettings, "id" | "portalApiToken" | "connections">
