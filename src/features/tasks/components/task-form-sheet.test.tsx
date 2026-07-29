import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usersService } from "@/features/users/users.service"
import { projectsService } from "@/features/projects/projects.service"
import { TaskFormSheet } from "./task-form-sheet"

vi.mock("@/features/users/users.service", () => ({
  usersService: { options: vi.fn() },
}))
vi.mock("@/features/projects/projects.service", () => ({
  projectsService: { list: vi.fn() },
}))

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <TaskFormSheet
        open
        onOpenChange={vi.fn()}
        canAssign
        onSubmit={onSubmit}
      />
    </QueryClientProvider>,
  )
  return onSubmit
}

describe("TaskFormSheet", () => {
  beforeEach(() => {
    vi.mocked(projectsService.list).mockResolvedValue({
      items: [
        {
          id: "project-12",
          projectCode: 12,
          title: "Implantação de fibra",
          description: null,
          projectType: "FIBRA_OPTICA_PONTO_LOGICO",
          omId: "om-1",
          om: { id: "om-1", omCode: 1, sigla: "4º CTA", name: "4º Centro de Telemática de Área", cityName: "Manaus", stateUf: "AM", isActive: true },
          status: "EM_ANDAMENTO",
          stage: "SERVICO_EM_EXECUCAO",
          ownerId: null,
          owner: null,
          startDate: null,
          endDate: null,
          createdAt: "2026-07-27T00:00:00.000Z",
          updatedAt: "2026-07-27T00:00:00.000Z",
          archivedAt: null,
          deletedAt: null,
          _count: { members: 1, tasks: 0, estimates: 1 },
        },
      ],
      meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
      filters: {},
      links: { self: "/projects?page=1&pageSize=100" },
    })
    vi.mocked(usersService.options).mockResolvedValue({
      items: [
        { id: "user-7", userCode: 7, name: "Fiscal do Projeto", email: "fiscal@sagep.test", role: "PROJETISTA", rank: "Cap", active: true },
      ],
    })
  })

  it("carrega responsáveis elegíveis pelo projeto e envia o id selecionado", async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.click(screen.getByRole("combobox", { name: "Projeto da tarefa" }))
    await user.click(await screen.findByRole("option", { name: /PRJ-12 · Implantação de fibra/ }))
    await waitFor(() => expect(usersService.options).toHaveBeenCalledWith({ projectId: "project-12" }))

    await user.click(screen.getByRole("combobox", { name: "Responsável pela tarefa" }))
    await user.click(await screen.findByRole("option", { name: /Fiscal do Projeto/ }))
    await user.type(screen.getByLabelText("Título"), "Conferir certificações")
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      projectId: "project-12",
      assigneeId: "user-7",
    })))
  })

  it("usa um painel lateral compacto no desktop e responsivo no celular", () => {
    renderForm()

    expect(document.querySelector('[data-slot="sheet-content"]')).toHaveClass(
      "w-full",
      "sm:w-[30rem]",
      "sm:max-w-[30rem]",
    )
  })
})
