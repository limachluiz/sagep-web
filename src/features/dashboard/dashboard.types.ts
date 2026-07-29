export type ProjectStage =
  | "ESTIMATIVA_PRECO"
  | "AGUARDANDO_NOTA_CREDITO"
  | "DIEX_REQUISITORIO"
  | "AGUARDANDO_NOTA_EMPENHO"
  | "OS_LIBERADA"
  | "AGUARDANDO_OS_ASSINADA"
  | "AGUARDANDO_INICIO_EXECUCAO"
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
    awaitingSignedServiceOrder: number
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

export type AmountBreakdown = {
  label: string
  count: number
  totalAmount: string
  percentage: number
}

export type CountBreakdown = {
  label: string
  count: number
  percentage: number
}

export type DashboardExecutiveFilters = {
  periodType?: "month" | "quarter" | "semester" | "year"
  referenceDate?: string
  startDate?: string
  endDate?: string
  asOfDate?: string
  stateUf?: "AM" | "RO" | "RR" | "AC"
  omId?: string
  projectType?: "CFTV" | "FIBRA_OPTICA_PONTO_LOGICO"
  ownerId?: string
}

export type DashboardOverviewFilters = DashboardExecutiveFilters

export type DashboardOverviewResponse = {
  generatedAt: string
  filter: {
    mode: "all" | "interval" | "as_of"
    label: string
    periodType: DashboardOverviewFilters["periodType"] | null
    referenceDate: string | null
    startDate: string | null
    endDate: string | null
    asOfDate: string | null
  }
  summary: {
    projectsOpen: number
    projectsCompleted: number
    projectsCanceled: number
    estimatesFinalized: number
    diexIssued: number
    serviceOrdersIssued: number
    totalEstimatedAmount: string
    projectsNeedingAttention: number
  }
  totals: {
    users: {
      total: number
      active: number
      inactive: number
    }
    projects: number
    tasks: number
    estimates: number
    diex: number
    serviceOrders: number
    atas: number
    ataItems: number
  }
  documents: {
    diex: {
      total: number
      withNumber: number
      draft: number
    }
    serviceOrders: {
      total: number
      emergency: number
      scheduled: number
    }
  }
  pendingActions: {
    awaitingCreditNote: number
    awaitingDiexFormalization: number
    awaitingCommitmentNote: number
    awaitingServiceOrder: number
    awaitingSignedServiceOrder: number
    awaitingExecutionStart: number
    awaitingAsBuiltAnalysis: number
    awaitingInvoiceAttestation: number
  }
  financial: {
    totalEstimatedAmount: string
    totalWithDiex: string
    totalWithServiceOrder: string
    totalCompletedProjectsAmount: string
    byEstimateStatus: AmountBreakdown[]
    byAtaType: AmountBreakdown[]
  }
  pipeline: {
    projectsByStage: Array<{
      stage: ProjectStage
      count: number
      percentage: number
      totalEstimatedAmount: string
    }>
    projectsByStatus: CountBreakdown[]
    tasksByStatus: CountBreakdown[]
    estimatesByStatus: CountBreakdown[]
  }
  attention: Array<{
    id: string
    projectCode: number
    title: string
    status: string
    stage: ProjectStage
    updatedAt: string
    totalEstimatedAmount: string
    reason: string
  }>
  openProjects: {
    total: number
    recent: Array<{
      id: string
      projectCode: number
      title: string
      status: string
      stage: ProjectStage
      updatedAt: string
    }>
  }
}

export type DashboardExecutiveResponse = {
  generatedAt: string
  filter: {
    mode: "all" | "interval" | "as_of"
    label: string
    periodType: DashboardExecutiveFilters["periodType"] | null
    referenceDate: string | null
    startDate: string | null
    endDate: string | null
    asOfDate: string | null
    stateUf: DashboardExecutiveFilters["stateUf"] | null
    omId: string | null
    projectType: DashboardExecutiveFilters["projectType"] | null
    ownerId: string | null
  }
  summary: {
    projectsTotal: number
    projectsOpen: number
    projectsCompleted: number
    projectsCanceled: number
    estimatesTotal: number
    estimatesFinalized: number
    diexIssued: number
    serviceOrdersIssued: number
    totalEstimatedAmount: string
    totalFinalizedEstimatedAmount: string
    totalCommittedAmount: string
    totalCompletedProjectsAmount: string
    totalWithDiex: string
    totalWithServiceOrder: string
    ataItemsAtRisk: number
    ataItemsInsufficient: number
  }
  projects: {
    byStatus: CountBreakdown[]
    byStage: CountBreakdown[]
  }
  financial: {
    totalEstimatedAmount: string
    totalCommittedAmount: string
    totalCompletedProjectsAmount: string
    totalWithDiex: string
    totalWithServiceOrder: string
    inventoryCurrentReservedAmount: string
    inventoryCurrentConsumedAmount: string
    inventoryCurrentAvailableAmount: string
    inventoryReversedAmountInPeriod: string
    byEstimateStatus: AmountBreakdown[]
    byAtaType: AmountBreakdown[]
    inventoryByAtaType: AmountBreakdown[]
    inventoryByVendor: AmountBreakdown[]
  }
  distribution: {
    byRegion: AmountBreakdown[]
    byCity: AmountBreakdown[]
    byOm: AmountBreakdown[]
    byAtaType: AmountBreakdown[]
  }
  periodIndicators: {
    projectsCreated: number
    estimatesCreated: number
    diexIssued: number
    serviceOrdersIssued: number
    averageEstimatedAmount: string
  }
  inventory: {
    snapshot: {
      itemsAtRisk: number
      itemsInsufficient: number
      itemsWithActiveReserve: number
      itemsWithActiveConsumption: number
      totalReservedAmount: string
      totalConsumedAmount: string
      totalAvailableAmount: string
    }
    periodActivity: {
      totalReservedAmount: string
      totalConsumedAmount: string
      totalReversedAmount: string
      totalReleasedAmount: string
      reserveMovements: number
      consumeMovements: number
      reverseMovements: number
    }
    distribution: {
      byAtaType: AmountBreakdown[]
      byVendor: AmountBreakdown[]
    }
    criticalItems: CriticalInventoryItem[]
  }
}
