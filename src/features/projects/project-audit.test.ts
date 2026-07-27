import { describe, expect, it } from "vitest"

import { projectAuditChanges } from "@/features/projects/project-audit"
import type { ProjectAuditItem } from "@/features/projects/projects.types"

const event = {
  id: "audit-1",
  at: "2026-07-27T12:00:00.000Z",
  action: "UPDATE",
  label: "Projeto atualizado",
  summary: "Projeto atualizado",
  actorName: "Usuário de teste",
  entityType: "PROJECT",
  entityId: "project-1",
  source: "AUDIT",
  context: {},
  before: { title: "Título anterior", status: "PLANEJAMENTO" },
  after: { title: "Título novo", status: "PLANEJAMENTO" },
  metadata: null,
} satisfies ProjectAuditItem

describe("alterações de auditoria do projeto", () => {
  it("lista somente campos realmente alterados", () => {
    expect(projectAuditChanges(event)).toEqual([
      {
        field: "title",
        before: "Título anterior",
        after: "Título novo",
      },
    ])
  })
})
