import { describe, expect, it } from "vitest"

import { availableDashboardViews, resolveDashboardView } from "./dashboard-view"

describe("dashboard integrado", () => {
  it("expõe somente as perspectivas autorizadas", () => {
    const permissions = new Set([
      "dashboard.view_operational",
      "dashboard.view_executive",
    ])

    expect(availableDashboardViews((permission) => permissions.has(permission))).toEqual([
      "operational",
      "executive",
    ])
  })

  it("ignora uma perspectiva solicitada sem permissão", () => {
    expect(resolveDashboardView(["operational"], "executive")).toBe("operational")
  })

  it("preserva a perspectiva solicitada quando autorizada", () => {
    expect(resolveDashboardView(["overview", "operational", "executive"], "executive")).toBe("executive")
  })
})
