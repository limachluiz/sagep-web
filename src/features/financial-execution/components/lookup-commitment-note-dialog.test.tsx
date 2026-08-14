import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LookupCommitmentNoteDialog } from "./lookup-commitment-note-dialog"
import { financialExecutionService } from "../financial-execution.service"

vi.mock("../financial-execution.service", () => ({
  financialExecutionService: { lookup: vi.fn() },
}))

describe("consulta de NE avulsa", () => {
  beforeEach(() => {
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
})
