import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api"
import type { CommitmentNote } from "../financial-execution.types"
import { OfficialNfePanel } from "./official-nfe-panel"
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }))
const note = { id: "note", project: { id: "project" } } as CommitmentNote
const preview = { consultationId: "consultation", queriedAt: "2026-10-12T12:00:00Z", source: "SEFAZ", environment: "PRODUCTION", documentKind: "SUMMARY", fiscalStatus: "AUTHORIZED_IN_SUMMARY", summary: { number: "1", series: "1", supplierCnpj: "fixture", issuerName: "Fornecedor de teste", grossAmount: 100, issuedAt: "2026-10-01T00:00:00Z" }, warnings: ["Itens e assinatura XML não conferidos"], divergences: [], duplicate: null, importAllowed: true, cached: false }
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.get).mockResolvedValue({ configured: true, message: "Consulta configurada" })
  vi.mocked(api.post).mockResolvedValue(preview)
})
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><OfficialNfePanel note={note} notes="Observação" documentLink="" onSaved={vi.fn()} /></QueryClientProvider>)
describe("official NF-e review", () => {
  it("requires review before import and never sends an attestation", async () => {
    mount()
    await screen.findByText("Consulta configurada")
    fireEvent.change(screen.getByLabelText("Chave de acesso da NF-e"), { target: { value: "1".repeat(44) } })
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }))
    const save = await screen.findByRole("button", { name: "Confirmar importação da NF-e" })
    expect(save).toBeDisabled()
    expect(screen.getByText("Resumo fiscal")).toBeInTheDocument()
    expect(screen.getByText("Itens e assinatura XML não conferidos")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("checkbox"))
    fireEvent.click(save)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/financial-execution/invoices/official/import", { consultationId: "consultation", confirmed: true, notes: "Observação" }))
  })
  it("blocks lookup when the institutional certificate is not configured", async () => {
    vi.mocked(api.get).mockResolvedValue({ configured: false, message: "Certificado não configurado" })
    mount()
    await screen.findByText("Certificado não configurado")
    fireEvent.change(screen.getByLabelText("Chave de acesso da NF-e"), { target: { value: "1".repeat(44) } })
    expect(screen.getByRole("button", { name: "Consultar" })).toBeDisabled()
    expect(api.post).not.toHaveBeenCalled()
  })
  it("invalidates an old preview when the key changes", async () => {
    mount()
    await screen.findByText("Consulta configurada")
    fireEvent.change(screen.getByLabelText("Chave de acesso da NF-e"), { target: { value: "1".repeat(44) } })
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }))
    await screen.findByText("Resumo fiscal")
    fireEvent.change(screen.getByLabelText("Chave de acesso da NF-e"), { target: { value: "2".repeat(44) } })
    expect(screen.queryByRole("button", { name: "Confirmar importação da NF-e" })).not.toBeInTheDocument()
  })
})
