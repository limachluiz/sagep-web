import { describe, expect, it } from "vitest"

import themeCss from "@/index.css?raw"
import executiveDashboardSource from "@/features/dashboard/pages/executive-dashboard-page.tsx?raw"
import operationalDashboardSource from "@/features/dashboard/pages/operational-dashboard-page.tsx?raw"
import projectsKanbanSource from "@/features/projects/pages/projects-kanban-page.tsx?raw"
import serviceOrdersGanttSource from "@/features/service-orders/pages/service-orders-gantt-page.tsx?raw"

const themedHeroSources = [
  operationalDashboardSource,
  executiveDashboardSource,
  projectsKanbanSource,
  serviceOrdersGanttSource,
]

describe("contraste dos temas", () => {
  it("define cores semânticas e texto secundário para claro e escuro", () => {
    expect(themeCss.match(/--status-success:/g)).toHaveLength(2)
    expect(themeCss.match(/--status-warning:/g)).toHaveLength(2)
    expect(themeCss.match(/--status-danger:/g)).toHaveLength(2)
    expect(themeCss.match(/--muted-foreground:/g)).toHaveLength(2)
  })

  it("não força texto branco nos painéis que mudam de superfície", () => {
    for (const source of themedHeroSources) {
      expect(source).not.toMatch(/sagep-signal-hero[^"\n]*text-white/)
    }
  })
})
