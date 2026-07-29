import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import type { ProjectTaskItem } from "../projects.types"
import { ProjectTasksOverview, ProjectTasksPanel } from "./project-tasks-panel"

const tasks: ProjectTaskItem[] = [
  {
    id: "task-1",
    taskCode: 8,
    title: "Conferir certificações",
    status: "EM_ANDAMENTO",
    priority: 5,
    dueDate: "2099-07-30T00:00:00.000Z",
    archivedAt: null,
    createdAt: "2026-07-27T10:00:00.000Z",
    updatedAt: "2026-07-27T10:00:00.000Z",
    assignee: { id: "user-1", userCode: 1, name: "Fiscal do Projeto", email: "fiscal@sagep.test", role: "PROJETISTA" },
  },
  {
    id: "task-2",
    taskCode: 9,
    title: "Validar As-Built",
    status: "CONCLUIDA",
    priority: 3,
    dueDate: null,
    archivedAt: null,
    createdAt: "2026-07-26T10:00:00.000Z",
    updatedAt: "2026-07-27T10:00:00.000Z",
    assignee: null,
  },
]

describe("project tasks panels", () => {
  it("mostra o resumo no contexto do projeto e abre a gestão completa", async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    const onShowAll = vi.fn()

    render(
      <MemoryRouter>
        <ProjectTasksOverview tasks={tasks} canCreate onCreate={onCreate} onShowAll={onShowAll} />
      </MemoryRouter>,
    )

    expect(screen.getByText("Tarefas do projeto")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("Conferir certificações")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Ver todas" }))
    await user.click(screen.getByRole("button", { name: "Nova tarefa" }))
    expect(onShowAll).toHaveBeenCalledOnce()
    expect(onCreate).toHaveBeenCalledOnce()
  })

  it("filtra a aba do projeto e permite alterar o status", async () => {
    const user = userEvent.setup()
    const onStatusChange = vi.fn()

    render(
      <MemoryRouter>
        <ProjectTasksPanel
          tasks={tasks}
          canCreate
          canChangeStatus
          statusPendingId={null}
          onCreate={vi.fn()}
          onStatusChange={onStatusChange}
        />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("combobox", { name: "Status da TSK-8" }))
    await user.click(screen.getByRole("option", { name: "Em revisão" }))
    expect(onStatusChange).toHaveBeenCalledWith("task-1", "REVISAO")

    await user.type(screen.getByRole("textbox", { name: "Buscar tarefas do projeto" }), "As-Built")
    expect(screen.getByText("Validar As-Built")).toBeInTheDocument()
    expect(screen.queryByText("Conferir certificações")).not.toBeInTheDocument()
  })
})
