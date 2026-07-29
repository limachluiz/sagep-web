import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usersService } from "@/features/users/users.service"
import type { ProjectDetailsResponse } from "../projects.types"
import { ProjectTeamCard } from "./project-team-card"

vi.mock("@/features/users/users.service", () => ({
  usersService: { options: vi.fn() },
}))

const details = {
  project: {
    id: "project-1",
    owner: { id: "owner-1", userCode: 1, name: "Gestor Responsável", email: "gestor@sagep.test", role: "GESTOR" },
    members: [{
      id: "member-link-1",
      role: "Fiscal",
      user: { id: "member-1", userCode: 2, name: "Membro Atual", email: "membro@sagep.test", role: "PROJETISTA" },
    }],
  },
} as unknown as ProjectDetailsResponse

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectTeamCard details={details} canManage />
    </QueryClientProvider>,
  )
}

describe("ProjectTeamCard", () => {
  beforeEach(() => {
    vi.mocked(usersService.options).mockResolvedValue({
      items: [
        { id: "owner-1", userCode: 1, name: "Gestor Responsável", email: "gestor@sagep.test", role: "GESTOR", rank: "Maj", active: true },
        { id: "member-1", userCode: 2, name: "Membro Atual", email: "membro@sagep.test", role: "PROJETISTA", rank: "1º Ten", active: true },
        { id: "available-1", userCode: 3, name: "Usuário Disponível", email: "disponivel@sagep.test", role: "PROJETISTA", rank: "2º Ten", active: true },
      ],
    })
  })

  it("lista pelo nome somente usuários ainda disponíveis para a equipe", async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole("button", { name: "Adicionar" }))
    await user.click(await screen.findByRole("combobox", { name: "Usuário da equipe" }))

    expect(await screen.findByRole("option", { name: /Usuário Disponível/ })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Gestor Responsável/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Membro Atual/ })).not.toBeInTheDocument()
  })
})
