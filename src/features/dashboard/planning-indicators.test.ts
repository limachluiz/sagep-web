import { describe, expect, it } from "vitest"

import { ganttIndicators, kanbanIndicators } from "./planning-indicators"
import type { ProjectKanbanResponse } from "@/features/projects/projects.types"
import type { GanttServiceOrder } from "@/features/service-orders/service-orders.types"

describe("planning indicators", () => {
  it("identifica volume e gargalo do Kanban", () => {
    const data = { generatedAt: "2026-07-20T00:00:00.000Z", columns: [
      { stage: "ESTIMATIVA_PRECO", label: "Estimativa", count: 2, cards: [] },
      { stage: "DIEX_REQUISITORIO", label: "DIEx", count: 5, cards: [] },
      { stage: "SERVICO_CONCLUIDO", label: "Concluído", count: 1, cards: [] },
    ] } as ProjectKanbanResponse

    expect(kanbanIndicators(data)).toMatchObject({ totalProjects: 8, activeColumns: 3, completed: 1, bottleneck: { label: "DIEx", count: 5 } })
  })

  it("consolida cobertura, atraso e progresso do Gantt", () => {
    const items = [
      { plannedStartDate: "2026-01-01", plannedEndDate: "2026-01-10", isDelayed: true, progressPercent: 50 },
      { plannedStartDate: "2026-01-01", plannedEndDate: "2026-01-05", isDelayed: false, progressPercent: 100 },
      { plannedStartDate: null, plannedEndDate: null, isDelayed: false, progressPercent: 0 },
    ] as GanttServiceOrder[]

    expect(ganttIndicators(items)).toEqual({ total: 3, scheduled: 2, unscheduled: 1, delayed: 1, completed: 1, onTrack: 1, planningCoverage: 66.7, delayedRate: 50, averageProgress: 75 })
  })
})
