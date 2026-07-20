import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import type { ProjectStatus } from "@/features/projects/projects.types"

export type GanttServiceOrder = {
  id: string
  serviceOrderCode: number
  serviceOrderNumber: string | null
  project: {
    id: string
    projectCode: number
    title: string
    stage: ProjectStage
    status: ProjectStatus
  }
  plannedStartDate: string | null
  plannedEndDate: string | null
  progressPercent: number
  isDelayed: boolean
  tasks: Array<{
    id: string
    orderIndex: number
    taskStep: string
    scheduleText: string
  }>
}

export type ServiceOrdersGanttResponse = {
  range: { start: string | null; end: string | null }
  serviceOrders: GanttServiceOrder[]
}
