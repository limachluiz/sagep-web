import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LookupCommitmentNoteDialog } from "./lookup-commitment-note-dialog"
import { api, ApiError } from "@/lib/api"
import { financialExecutionService } from "../financial-execution.service"

vi.mock("@/features/auth/auth.store", () => ({ useAuthStore: (select: (s: unknown) => unknown) => select({ hasPermission: () => true }) }))
vi.mock("@/lib/api", async original => ({ ...await original<typeof import("@/lib/api")>(), api: { post: vi.fn() } }))

vi.mock("../financial-execution.service", () => ({
  financialExecutionService: { lookup: vi.fn() },
}))

describe("consulta de NE avulsa", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(financialExecutionService.lookup).mockResolvedValue({
      snapshot: {
        source: "PORTAL_TRANSPARENCIA",
        externalCode: "160016000012026NE000534",
        number: "2026NE000534",
        managementUnit: "160016",
        management: "00001",
        supplierName: "EMPRESA TESTE",
        supplierCnpj: "00111222000133",
        issuedAt: "2026-08-13T00:00:00.000Z",
        originalAmount: 1000,
        currentAmount: 1000,
        liquidatedAmount: 1000,
        paidAmount: 0,
        cancelledAmount: 0,
        financialStatus: "LIQUIDADA",
        fetchedAt: "2026-08-13T12:00:00.000Z",
        documents: [],
      },
      registered: null,
    })
  })

  it("consulta sem vincular o documento a um projeto", async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    render(<QueryClientProvider client={queryClient}><LookupCommitmentNoteDialog open onOpenChange={() => undefined} /></QueryClientProvider>)

    await user.type(screen.getByLabelText("Número da NE"), "2026NE000534")
    await user.click(screen.getByRole("button", { name: "Consultar NE" }))

    expect(await screen.findByText("NE 2026NE000534 localizada")).toBeInTheDocument()
    expect(financialExecutionService.lookup).toHaveBeenCalledWith({
      number: "2026NE000534",
      managementUnit: undefined,
      management: undefined,
    })
  })

  it("informa no modal quando a Nota de Empenho não é localizada", async () => {
    vi.mocked(financialExecutionService.lookup).mockRejectedValueOnce(
      new Error("Nota de Empenho não localizada no Portal da Transparência"),
    )
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    render(<QueryClientProvider client={queryClient}><LookupCommitmentNoteDialog open onOpenChange={() => undefined} /></QueryClientProvider>)

    await user.type(screen.getByLabelText("Número da NE"), "2026NE001243")
    await user.click(screen.getByRole("button", { name: "Consultar NE" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Nota de Empenho não localizada no Portal da Transparência")
  })
  it("requires an explicit choice to replace an imported NE with an avulsa", async () => {
    const code = "160016000012026NE000534"
    vi.mocked(api.post).mockRejectedValueOnce(new ApiError("Duplicidade", 409, { details: { existingOrigin: "IMPORTED", externalCode: code } })).mockResolvedValueOnce({})
    render(<QueryClientProvider client={new QueryClient()}><LookupCommitmentNoteDialog open onOpenChange={() => undefined} /></QueryClientProvider>)
    fireEvent.change(screen.getByLabelText("Número da NE"), { target: { value: "2026NE000534" } })
    fireEvent.click(screen.getByRole("button", { name: "Consultar NE" }))
    fireEvent.click(await screen.findByRole("button", { name: "Salvar / atualizar avulsa na carteira" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Duplicidade")
    expect(api.post).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole("button", { name: "Excluir cópia importada e manter avulsa" }))
    await waitFor(() => expect(api.post).toHaveBeenLastCalledWith(`/financial-execution/discovery/archive/${code}`, { origin: "STANDALONE", replaceOrigin: "IMPORTED" }))
  })

})
