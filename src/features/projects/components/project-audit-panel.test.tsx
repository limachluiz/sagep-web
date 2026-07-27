import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ProjectAuditPanel } from "@/features/projects/components/project-audit-panel"
import type { ProjectAuditItem } from "@/features/projects/projects.types"

const item = {
  id: "audit-1",
  at: "2026-07-27T12:00:00.000Z",
  action: "UPDATE",
  label: "Projeto atualizado",
  summary: "Projeto atualizado",
  actorName: "Usuário de teste",
  entityType: "PROJECT",
  entityId: "project-1",
  source: "AUDIT",
  context: {
    resourceCode: "PRJ-1",
    resourceLabel: "Projeto de teste",
  },
  before: { title: "Título anterior" },
  after: { title: "Título novo" },
  metadata: null,
} satisfies ProjectAuditItem

describe("auditoria do projeto", () => {
  it("exibe o registro e revela a comparação antes/depois", async () => {
    const user = userEvent.setup()
    render(<ProjectAuditPanel items={[item]} />)

    await user.click(screen.getByText("Projeto atualizado"))

    expect(screen.getByText("Título anterior")).toBeInTheDocument()
    expect(screen.getByText("Título novo")).toBeInTheDocument()
    expect(screen.getByText(/PRJ-1/)).toBeInTheDocument()
  })
})
