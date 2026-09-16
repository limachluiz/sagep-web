import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api"
import { NeDiscoveryPanel } from "./ne-discovery-panel"
vi.mock("@/features/auth/auth.store", () => ({ useAuthStore: (select: (s: unknown) => unknown) => select({ hasPermission: () => true }) }))
vi.mock("@/lib/api", async original => ({ ...await original<typeof import("@/lib/api")>(), api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))
const options = (missing = false) => ({ defaultUg: "160016", pregoes: [{ id: "p1", number: "90004", year: "2026", uasg: "160016", type: "Fibra", atas: [1,2].map(i => ({ id: `a${i}`, number: `00${i}`, vendorName: `Fornecedor ${i}`, vendorCnpj: missing ? null : `1234567800010${i}`, validFrom: "2026-01-01", validUntil: "2026-12-31" })) }] })
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><NeDiscoveryPanel /></QueryClientProvider>)
beforeEach(() => { vi.resetAllMocks(); vi.mocked(api.get).mockResolvedValue(options()) })
describe("busca por ATA", () => {
  it("isolates loading for simultaneous CNPJ requests", async () => {
    vi.mocked(api.get).mockResolvedValue(options(true))
    const pending: Array<(v: unknown) => void> = []
    vi.mocked(api.post).mockImplementation(() => new Promise(resolve => pending.push(resolve)))
    mount(); await screen.findByLabelText(/90004\/2026/); fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }))
    fireEvent.click(screen.getAllByRole("button", { name: "Buscar CNPJ" })[0])
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Consultando…" })).toHaveLength(1))
    expect(screen.getByRole("button", { name: "Buscar CNPJ" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Buscar CNPJ" }))
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Consultando…" })).toHaveLength(2))
    await act(async () => { pending[0]({ cnpj: "12345678000101" }) })
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Consultando…" })).toHaveLength(1))
    await act(async () => { pending[1]({ cnpj: "12345678000102" }) })
  })
  it("searches only the chosen ATA, shows a modal, paginates 10 rows and imports selected NEs", async () => {
    const items = Array.from({ length: 12 }, (_, i) => ({ documento: `160016000012026NE${String(i+1).padStart(6,"0")}`, documentoResumido: `2026NE${String(i+1).padStart(6,"0")}` }))
    vi.mocked(api.post).mockImplementation(async (path) => path.endsWith("/page") ? { items, exhausted: true, fingerprint: "page1", fetchedAt: "2026-09-16T12:00:00Z", missingDates: 0 } : {})
    mount(); await screen.findByLabelText(/90004\/2026/); fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }))
    await screen.findByLabelText(/ATA 002/)
    fireEvent.click(screen.getByLabelText(/ATA 002/))
    fireEvent.click(screen.getByRole("button", { name: "Buscar NEs" }))
    expect(await screen.findByRole("dialog")).toHaveTextContent("Buscando Notas de Empenho")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(), { timeout: 4000 })
    expect(api.post).toHaveBeenCalledWith("/financial-execution/discovery/page", expect.objectContaining({ ataIds: ["a1"], cnpj: "12345678000101" }))
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(11)
    expect(screen.getByLabelText("Itens por página")).toHaveValue("10")
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }))
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(3)
    fireEvent.click(screen.getByLabelText("Selecionar 2026NE000011"))
    fireEvent.click(screen.getByRole("button", { name: "Importar selecionadas (1)" }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/financial-execution/discovery/archive/160016000012026NE000011", { origin: "IMPORTED", replaceOrigin: undefined }))
    expect(vi.mocked(api.post).mock.calls.filter(([path]) => path.includes("/archive/"))).toHaveLength(1)
    fireEvent.change(screen.getByLabelText("Itens por página"), { target: { value: "20" } })
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(13)
  })
})
