import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ProjectWorkflowProgress } from "./project-workflow-progress"
import { getWorkflowProgress } from "../project-workflow"

describe("ProjectWorkflowProgress", () => {
  it("calcula o avanço pelas etapas do workflow", () => {
    expect(getWorkflowProgress("ESTIMATIVA_PRECO", "PLANEJAMENTO")).toBe(0)
    expect(getWorkflowProgress("OS_LIBERADA", "EM_ANDAMENTO")).toBe(36)
    expect(getWorkflowProgress("SERVICO_CONCLUIDO", "CONCLUIDO")).toBe(100)
  })

  it("destaca a etapa atual e a próxima ação", () => {
    render(<ProjectWorkflowProgress stage="DIEX_REQUISITORIO" status="EM_ANDAMENTO" stageLabel="DIEx requisitório" nextAction={{ label: "Emitir DIEx", description: "Formalize a requisição." }} />)

    expect(screen.getByText("Emitir DIEx")).toBeInTheDocument()
    expect(screen.getByText("DIEx").closest("li")).toHaveAttribute("aria-current", "step")
    expect(screen.getByRole("progressbar", { name: /progresso do projeto/i })).toHaveAttribute("aria-valuenow", "18")
  })

  it("comunica o encerramento de um projeto cancelado", () => {
    render(<ProjectWorkflowProgress stage="CANCELADO" status="CANCELADO" stageLabel="Cancelado" nextAction={{ label: "Sem próxima ação", description: "Fluxo encerrado." }} />)

    expect(screen.getByText("Projeto cancelado")).toBeInTheDocument()
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
  })
})
