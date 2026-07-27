import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import type { FederativeUnit, ProjectStatus, ProjectType } from "@/features/projects/projects.types"

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
    projectType: ProjectType | null
    owner: {
      id: string
      name: string
    }
    om: {
      id: string
      sigla: string
      cityName: string
      stateUf: FederativeUnit
    } | null
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
