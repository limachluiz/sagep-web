import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ProjectExecutionPanel } from "@/features/projects/components/project-execution-panel"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

function details(
  stage: ProjectDetailsResponse["workflow"]["stage"],
  milestones: Record<string, string | null>,
  openTasksCount = 0,
) {
  return {
    workflow: {
      stage,
      milestones,
      nextAction: {
        code: "TEST",
        label: "Próxima ação de teste",
        description: "Descrição operacional.",
      },
    },
    operationalSummary: { openTasksCount },
  } as unknown as ProjectDetailsResponse
}

describe("painel de execução do projeto", () => {
  it("expõe a ação válida para a etapa atual", async () => {
    const user = userEvent.setup()
    const receiveAsBuilt = vi.fn()

    render(
      <ProjectExecutionPanel
        details={details("SERVICO_EM_EXECUCAO", {
          executionStartedAt: "2026-07-20T00:00:00.000Z",
        })}
        actions={{ receiveAsBuilt }}
      />,
    )

    await user.click(
      screen.getByRole("button", {
        name: "Receber As-Built",
      }),
    )
    expect(receiveAsBuilt).toHaveBeenCalledOnce()
  })

  it("destaca correção do As-Built e tarefas abertas", () => {
    render(
      <ProjectExecutionPanel
        details={details(
          "SERVICO_EM_EXECUCAO",
          {
            executionStartedAt: "2026-07-20T00:00:00.000Z",
            asBuiltRejectedAt: "2026-07-23T00:00:00.000Z",
            asBuiltRejectionReason: "Corrigir a identificação das fibras.",
          },
          2,
        )}
      />,
    )

    expect(
      screen.getByText("As-Built devolvido para correção"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Corrigir a identificação das fibras."),
    ).toBeInTheDocument()
    expect(screen.getByText("2 tarefa(s) ainda aberta(s)")).toBeInTheDocument()
  })
})
