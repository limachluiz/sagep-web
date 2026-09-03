import { describe, expect, it } from "vitest"

import { visibleProjectMilestones } from "@/features/projects/project-milestones"

describe("marcos do projeto", () => {
  it("oculta a reprovação quando o As-Built foi aprovado sem reprovação anterior", () => {
    const entries = visibleProjectMilestones({
      asBuiltApprovedAt: "2026-08-31T00:00:00.000Z",
      asBuiltRejectedAt: null,
      asBuiltRejectionReason: null,
    })

    expect(entries.map(([key]) => key)).toEqual(["asBuiltApprovedAt"])
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
