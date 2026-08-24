import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CommitmentNoteDialog } from "@/features/projects/components/commitment-note-dialog"

const preview = {
  snapshot: {
    source: "PORTAL_TRANSPARENCIA",
    externalCode: "160016000012026NE000534",
    number: "2026NE000534",
    managementUnit: "160016",
    management: "00001",
    supplierName: "EMPRESA TESTE",
    supplierCnpj: "00111222000133",
    issuedAt: "2026-08-13",
    originalAmount: 1000,
    currentAmount: 1000,
    liquidatedAmount: 0,
    paidAmount: 0,
    cancelledAmount: 0,
    financialStatus: "NAO_LIQUIDADA",
    fetchedAt: "2026-08-13T12:00:00.000Z",
    documents: [],
  },
  validation: {
    status: "VALIDADO",
    divergences: [],
    expected: { supplierName: "EMPRESA TESTE", supplierCnpj: "00111222000133", amount: 1000 },
  },
  project: { id: "project-1", projectCode: 42, title: "Projeto teste", stage: "AGUARDANDO_NE" },
}

afterEach(() => vi.unstubAllGlobals())

describe("registro da Nota de Empenho", () => {
  it("consulta a fonte oficial e exige confirmação do impacto financeiro", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(preview), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })))
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <CommitmentNoteDialog projectId="project-1" projectCode={42} open onOpenChange={() => undefined} onSaved={() => undefined} />
      </QueryClientProvider>,
    )

    await user.type(screen.getByLabelText("Número da Nota de Empenho"), "2026NE000534")
    await user.click(screen.getByRole("button", { name: "Consultar e validar no Portal" }))

    const submit = await screen.findByRole("button", { name: "Validar, registrar e liberar OS" })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole("checkbox", { name: /Confirmo os dados oficiais/ }))
    expect(submit).toBeEnabled()
  })

  it("permite registro manual somente com justificativa e confirmação explícita", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ commitmentNote: {} }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }))
    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })

    render(
      <QueryClientProvider client={queryClient}>
        <CommitmentNoteDialog projectId="project-1" projectCode={42} open onOpenChange={() => undefined} onSaved={() => undefined} />
      </QueryClientProvider>,
    )

    await user.type(screen.getByLabelText("Número da Nota de Empenho"), "2026NE000534")
    await user.click(screen.getByRole("button", { name: "Registrar manualmente" }))
    const submit = screen.getByRole("button", { name: "Registrar sem validação e liberar OS" })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText("Justificativa do registro manual"), "Portal indisponível durante o registro")
    await user.click(screen.getByRole("checkbox", { name: /Confirmo que conferi/ }))
    expect(submit).toBeEnabled()
    await user.click(submit)

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/financial-execution/commitment-notes"), expect.objectContaining({
      body: expect.stringContaining('"registrationMode":"MANUAL"'),
    }))
  })
})
