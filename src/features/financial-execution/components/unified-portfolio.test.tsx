import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, within, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api"
import { MemoryRouter } from "react-router"
import { UnifiedPortfolio } from "./unified-portfolio"
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }))
vi.mock("@/features/auth/auth.store", () => ({ useAuthStore: (select: (s: unknown) => unknown) => select({ hasPermission: () => true }) }))
const row = (i: number, supplierName = "Fornecedor", status = "A_CONFERIR") => ({ externalCode: `160016000012026NE${String(i).padStart(6,"0")}`, number: `2026NE${String(i).padStart(6,"0")}`, origin: "IMPORTED", supplierName, current: 100, liquidated: null, paid: null, status, updatedAt: "2026-09-16T12:00:00Z", project: null })
const portfolio = (rows = [row(1)]) => ({ total: rows.length, totals: { committed: rows.length * 100, liquidated: 0, paid: 0, pending: rows.length }, coverage: { committed: rows.length, liquidated: 0, paid: 0 }, rows })
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><UnifiedPortfolio /></MemoryRouter></QueryClientProvider>)
beforeEach(() => vi.resetAllMocks())
describe("carteira consolidada", () => {
  it("shows imported amounts and does not present unknown payment totals as zero", async () => {
    vi.mocked(api.get).mockResolvedValue(portfolio())
    mount()
    expect(await screen.findByText(/Carteira consolidada · 1 NEs únicas/)).toBeInTheDocument()
    expect(screen.getByText(/UG 160016 · Importada/)).toBeInTheDocument()
    expect(screen.getAllByText("Não informado")).toHaveLength(4)
    expect(screen.getByText("1 de 1 NEs com valor utilizável")).toBeInTheDocument()
    expect(within(screen.getByRole("table")).getByText("A conferir")).toBeInTheDocument()
  })
  it("combines supplier, situation and text filters and resets pagination", async () => {
    vi.mocked(api.get).mockResolvedValue(portfolio([...Array.from({ length: 11 }, (_, i) => row(i+1, "Empresa A", "PAGA")), row(12,"Empresa B","LIQUIDADA")]))
    mount(); await screen.findByText(/Carteira consolidada · 12/)
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }))
    fireEvent.change(screen.getByLabelText("Filtrar por empresa"), { target: { value: "Empresa B" } })
    expect(screen.getByText("1 / 1")).toBeInTheDocument()
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2)
    fireEvent.change(screen.getByLabelText("Filtrar por situação"), { target: { value: "PAGA" } })
    expect(screen.getByText(/Nenhuma NE encontrada/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Filtrar por empresa"), { target: { value: "Empresa A" } })
    fireEvent.change(screen.getByLabelText("Buscar na carteira"), { target: { value: "2026NE000003" } })
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2)
    expect(screen.getByRole("button", { name: "2026NE000003" })).toBeInTheDocument()
  })
  it("opens saved financial details directly from the NE without a new government request", async () => {
    vi.mocked(api.get).mockImplementation(async path => path.endsWith("/portfolio") ? portfolio() : ({ updatedAt: "2026-09-16T12:00:00Z", financial: { current: 100, liquidated: 100, paid: 100, status: "PAGA" }, snapshot: { document: { documento: row(1).externalCode }, related: [{ documento: "160016000012026OB000101", fase: "Pagamento" }], financial: { documents: [{ code: "160016000012026OB000101", phase: 3, amount: 100, subitems: [] }] } } }))
    mount(); fireEvent.click(await screen.findByRole("button", { name: "2026NE000001" }))
    const dialog = await screen.findByRole("dialog")
    await waitFor(() => expect(dialog).toHaveTextContent("Situação: Paga"))
    expect(api.get).toHaveBeenCalledWith(`/financial-execution/discovery/archive/${row(1).externalCode}`)
    expect(dialog).toHaveTextContent("Parcela desta NE:")
    expect(dialog).toHaveTextContent("160016000012026OB000101")
  })
  it("refreshes saved NEs and then reloads the dashboard", async () => {
    vi.mocked(api.get).mockResolvedValue(portfolio()); vi.mocked(api.post).mockResolvedValue({})
    mount(); fireEvent.click(await screen.findByRole("button", { name: "Atualizar liquidações e pagamentos" }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(`/financial-execution/discovery/archive/${row(1).externalCode}/sync`))
    await waitFor(() => expect(vi.mocked(api.get).mock.calls.filter(([path]) => path.endsWith("/portfolio")).length).toBeGreaterThan(1))
  })
  it("uses the project detail route and registered UG for a manual NE", async () => {
    const manual = { ...row(1), externalCode: "MANUAL:project-one", origin: "PROJECT", noteId: "note-one", managementUnit: "160016", project: null }
    vi.mocked(api.get).mockImplementation(async path => path.endsWith("/portfolio") ? portfolio([manual]) : ({ currentAmount: 100, liquidatedAmount: 100, paidAmount: 50, financialStatus: "PARCIALMENTE_PAGA", syncStatus: "VALIDADO", rawSnapshot: {}, documents: [], lastSyncAt: "2026-09-16T12:00:00Z" }))
    mount(); fireEvent.click(await screen.findByRole("button", { name: "2026NE000001" }))
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/financial-execution/commitment-notes/note-one"))
    expect(await screen.findByText("Situação: Parcialmente paga")).toBeInTheDocument()
    expect(screen.getByText(/UG 160016 · Projeto/)).toBeInTheDocument()
  })

})
