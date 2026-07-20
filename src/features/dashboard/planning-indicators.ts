import type { ProjectKanbanResponse } from "@/features/projects/projects.types"
import type { GanttServiceOrder } from "@/features/service-orders/service-orders.types"
import { percentage } from "./dashboard-indicators"

export function kanbanIndicators(data: ProjectKanbanResponse) {
  const totalProjects = data.columns.reduce((total, column) => total + column.count, 0)
  const activeColumns = data.columns.filter((column) => column.count > 0).length
  const bottleneck = data.columns.reduce<(typeof data.columns)[number] | null>(
    (current, column) => !current || column.count > current.count ? column : current,
    null,
  )
  const completed = data.columns.find((column) => column.stage === "SERVICO_CONCLUIDO")?.count ?? 0

  return { totalProjects, activeColumns, bottleneck, completed }
}

export function ganttIndicators(items: GanttServiceOrder[]) {
  const scheduled = items.filter((item) => item.plannedStartDate || item.plannedEndDate)
  const unscheduled = items.length - scheduled.length
  const delayed = scheduled.filter((item) => item.isDelayed).length
  const completed = scheduled.filter((item) => item.progressPercent >= 100).length
  const averageProgress = scheduled.length
    ? Math.round(scheduled.reduce((total, item) => total + item.progressPercent, 0) / scheduled.length)
    : 0

  return {
    total: items.length,
    scheduled: scheduled.length,
    unscheduled,
    delayed,
    completed,
    onTrack: scheduled.length - delayed,
    planningCoverage: percentage(scheduled.length, items.length),
    delayedRate: percentage(delayed, scheduled.length),
    averageProgress,
  }
}
