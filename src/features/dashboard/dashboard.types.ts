export type ProjectStage =
  | "ESTIMATIVA_PRECO"
  | "AGUARDANDO_NOTA_CREDITO"
  | "DIEX_REQUISITORIO"
  | "AGUARDANDO_NOTA_EMPENHO"
  | "OS_LIBERADA"
  | "SERVICO_EM_EXECUCAO"
  | "ANALISANDO_AS_BUILT"
  | "ATESTAR_NF"
  | "SERVICO_CONCLUIDO"
  | "CANCELADO"

export type WorkflowAction = {
  code: string
  label: string
  description: string
  targetStage?: ProjectStage
}

export type DashboardProject = {
  id: string
  projectCode: number
  title: string
  status: string
  stage: ProjectStage
  updatedAt: string
  owner: {
    id: string
    name: string
    email: string
  }
}

export type OperationalAlert = {
  id: string
  category: string
  severity: "CRITICAL" | "WARNING" | "INFO"
  title: string
  description: string
  project: DashboardProject
  nextAction: WorkflowAction
  detailsPath: string
  daysSinceUpdate?: number
}

export type InventoryBalance = {
  initialQuantity: string
  reservedQuantity: string
  consumedQuantity: string
  availableQuantity: string
  initialAmount: string
  reservedAmount: string
  consumedAmount: string
  availableAmount: string
  lowStock: boolean
  insufficient: boolean
  lastMovementAt: string | null
}

export type CriticalInventoryItem = {
  id: string
  ataItemCode: number
  referenceCode: string
  description: string
  ata: {
    ataCode: number
    number: string
    type: string
    vendorName: string
  }
  balance: InventoryBalance
}

export type OperationalQueueItem = DashboardProject & {
  nextAction: WorkflowAction
  detailsPath: string
}

export type DashboardOperationalResponse = {
  generatedAt: string
  filters: {
    staleDays: number
    limit: number
  }
  alerts: {
    summary: {
      total: number
      bySeverity: {
        CRITICAL: number
        WARNING: number
        INFO: number
      }
      byCategory: Record<string, number>
    }
    bySeverity: Record<string, OperationalAlert[]>
    byCategory: Record<string, OperationalAlert[]>
    items: OperationalAlert[]
  }
  staleProjects: OperationalAlert[]
  pendingByStage: {
    awaitingCreditNote: number
    awaitingDiex: number
    awaitingCommitmentNote: number
    awaitingServiceOrder: number
    awaitingExecutionStart: number
    awaitingAsBuilt: number
    awaitingInvoiceAttestation: number
  }
  inventory: {
    summary: {
      totalItems: number
      lowStockItems: number
      insufficientItems: number
      itemsWithActiveReserve: number
      itemsWithActiveConsumption: number
      recentReversals: number
      staleReservations: number
      totalReservedAmount: string
      totalConsumedAmount: string
      totalAvailableAmount: string
    }
    criticalItems: CriticalInventoryItem[]
    staleReservations: unknown[]
    recentReversals: unknown[]
  }
  operationalQueue: OperationalQueueItem[]
  frequentNextActions: Array<{ label: string; count: number }>
  latestMovements: Array<{
    id: string
    entityType: string
    entityId: string
    action: string
    summary: string
    actorName: string | null
    at: string
  }>
}
