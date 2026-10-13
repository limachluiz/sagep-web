import { describe, expect, it } from "vitest"

import { projectMilestonePresentation, visibleProjectMilestones } from "@/features/projects/project-milestones"

describe("marcos do projeto", () => {
  it("mantém a reprovação no painel após aprovação sem ocorrência", () => {
    const milestones = {
      asBuiltApprovedAt: "2026-08-31T00:00:00.000Z",
      asBuiltRejectedAt: null,
      asBuiltRejectionReason: null,
    }
    const entries = visibleProjectMilestones(milestones)
    const presentation = projectMilestonePresentation("asBuiltRejectedAt", null, milestones)

    expect(entries.map(([key]) => key)).toEqual(["asBuiltApprovedAt", "asBuiltRejectedAt"])
    expect(presentation).toEqual({ completed: true, value: "As-Built não foi reprovado", isDate: false })
  })

  it("preserva a reprovação no histórico mesmo após a aprovação", () => {
    const entries = visibleProjectMilestones({
      asBuiltApprovedAt: "2026-09-02T00:00:00.000Z",
      asBuiltRejectedAt: "2026-08-31T00:00:00.000Z",
      asBuiltRejectionReason: "Ajustar identificação das fibras.",
    })

    expect(entries.map(([key]) => key)).toEqual([
      "asBuiltApprovedAt",
      "asBuiltRejectedAt",
      "asBuiltRejectionReason",
    ])
  })
})
