export type GlobalSearchItem = {
  type: "PROJECT" | "ESTIMATE" | "DIEX_REQUEST" | "SERVICE_ORDER"
  id: string
  code: string
  title: string | null
  status?: string
  documentStatus?: string | null
  projectCode?: number
  project?: { id: string; projectCode: number; title: string }
}

export type GlobalSearchResponse = {
  query: string
  limit: number
  groups: {
    projects: GlobalSearchItem[]
    estimates: GlobalSearchItem[]
    diexRequests: GlobalSearchItem[]
    serviceOrders: GlobalSearchItem[]
  }
  total: number
}

export type HeaderAlert = {
  id: string
  sourceUpdatedAt?: string
  category: string
  severity: "CRITICAL" | "WARNING" | "INFO"
  title: string
  description: string
  detailsPath: string
  project?: { id: string; projectCode: number; title: string }
  nextAction?: { code: string; label: string; description: string }
}

export type DismissAlertsResponse = {
  dismissed: number
}

export type OperationalAlertsResponse = {
  generatedAt: string
  summary: {
    total: number
    bySeverity: { CRITICAL: number; WARNING: number; INFO: number }
    byCategory: Record<string, number>
  }
  alerts: HeaderAlert[]
  inventoryAlerts: {
    lowStock: Array<{
      ataItemId: string
      ataItemCode: number
      referenceCode: string
      description: string
    }>
    insufficient: Array<{ ataItemId: string }>
  }
}
