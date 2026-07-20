import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProjectFormSheet } from "./project-form-sheet"
import { militaryOrganizationsService } from "../military-organizations.service"
import type { MilitaryOrganization } from "../projects.types"

vi.mock("../military-organizations.service", () => ({
  militaryOrganizationsService: { list: vi.fn() },
}))

const organizations: MilitaryOrganization[] = [
  { id: "om-am", omCode: 1, sigla: "4º CTA", name: "Centro de Telemática", cityName: "Manaus", stateUf: "AM", isActive: true },
  { id: "om-ro", omCode: 2, sigla: "17º B Log Sl", name: "Batalhão Logístico", cityName: "Porto Velho", stateUf: "RO", isActive: true },
  { id: "om-ro-inativa", omCode: 3, sigla: "OM INATIVA", name: "Organização inativa", cityName: "Porto Velho", stateUf: "RO", isActive: false },
]

function response(items = organizations) {
  return {
    items,
    meta: { page: 1, pageSize: 100, totalItems: items.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  }
}

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectFormSheet open onOpenChange={vi.fn()} onSubmit={vi.fn()} />
    </QueryClientProvider>,
  )
}

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByRole("combobox", { name: label }))
  await user.click(await screen.findByRole("option", { name: option }))
}

describe("ProjectFormSheet", () => {
  beforeEach(() => {
    vi.mocked(militaryOrganizationsService.list).mockResolvedValue(response())
  })

  it("restringe CFTV às OMs ativas de Manaus/AM", async () => {
    const user = userEvent.setup()
    renderForm()

    await choose(user, "Tipo do projeto", "CFTV")

    await waitFor(() => expect(militaryOrganizationsService.list).toHaveBeenCalledWith({ stateUf: "AM", cityName: "Manaus", active: true }))
    await user.click(screen.getByRole("combobox", { name: "Organização Militar" }))

    expect(await screen.findByRole("option", { name: /4º CTA/ })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /17º B Log Sl/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /OM INATIVA/ })).not.toBeInTheDocument()
  })

  it("carrega somente OMs ativas do estado escolhido para fibra", async () => {
    const user = userEvent.setup()
    renderForm()

    await choose(user, "Tipo do projeto", "Fibra Óptica / Ponto Lógico")
    await choose(user, "Estado", "Rondônia")

    await waitFor(() => expect(militaryOrganizationsService.list).toHaveBeenLastCalledWith({ stateUf: "RO", cityName: undefined, active: true }))
    await user.click(screen.getByRole("combobox", { name: "Organização Militar" }))

    expect(await screen.findByRole("option", { name: /17º B Log Sl/ })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /4º CTA/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /OM INATIVA/ })).not.toBeInTheDocument()
  })

  it("informa quando o estado não possui OM ativa", async () => {
    vi.mocked(militaryOrganizationsService.list).mockResolvedValue(response([]))
    const user = userEvent.setup()
    renderForm()

    await choose(user, "Tipo do projeto", "Fibra Óptica / Ponto Lógico")
    await choose(user, "Estado", "Acre")

    expect(await screen.findByText("Nenhuma OM ativa disponível para esta seleção.")).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Organização Militar" })).toBeDisabled()
  })
})
