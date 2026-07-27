import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usersService } from "@/features/users/users.service"
import { TaskFormSheet } from "./task-form-sheet"

vi.mock("@/features/users/users.service", () => ({
  usersService: { options: vi.fn() },
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
    vi.mocked(usersService.options).mockResolvedValue({
      items: [
        { id: "user-7", userCode: 7, name: "Fiscal do Projeto", email: "fiscal@sagep.test", role: "PROJETISTA", rank: "Cap", active: true },
      ],
    })
  })

  it("carrega responsáveis elegíveis pelo projeto e envia o id selecionado", async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm()

    await user.type(screen.getByLabelText("Código do projeto"), "12")
    await waitFor(() => expect(usersService.options).toHaveBeenCalledWith({ projectCode: 12 }))

    await user.click(screen.getByRole("combobox", { name: "Responsável pela tarefa" }))
    await user.click(await screen.findByRole("option", { name: /Fiscal do Projeto/ }))
    await user.type(screen.getByLabelText("Título"), "Conferir certificações")
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      projectCode: 12,
      assigneeId: "user-7",
    })))
  })
})
