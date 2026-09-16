import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api"
import { UnifiedPortfolio } from "./unified-portfolio"
vi.mock("@/lib/api", () => ({ api: { get: vi.fn() } }))
describe("carteira consolidada", () => {
  it("shows imported amounts and does not present unknown payment totals as zero", async () => {
    vi.mocked(api.get).mockResolvedValue({ total: 1, totals: { committed: 100, liquidated: 0, paid: 0, pending: 1 }, coverage: { committed: 1, liquidated: 0, paid: 0 }, rows: [{ externalCode: "160016000012026NE000001", number: "2026NE000001", origin: "IMPORTED", supplierName: "Fornecedor", current: 100, liquidated: null, paid: null, status: "A_CONFERIR", updatedAt: "2026-09-16T12:00:00Z", project: null }] })
    render(<QueryClientProvider client={new QueryClient()}><UnifiedPortfolio /></QueryClientProvider>)
    expect(await screen.findByText(/Carteira consolidada · 1 NEs únicas/)).toBeInTheDocument()
    expect(screen.getByText(/UG 160016 · Importada/)).toBeInTheDocument()
    expect(screen.getAllByText("Não informado")).toHaveLength(4)
    expect(screen.getByText("1 de 1 NEs com valor utilizável")).toBeInTheDocument()
    expect(screen.getByText("A CONFERIR")).toBeInTheDocument()
  })
})
