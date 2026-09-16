import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api"
import { NeArchivePanel } from "./ne-archive-panel"
vi.mock("@/features/auth/auth.store", () => ({ useAuthStore: (select: (s: unknown) => unknown) => select({ hasPermission: () => true }) }))
vi.mock("@/lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }))
const codes = ["160016000012026NE000001", "160016000012026NE000002"]
beforeEach(() => { vi.resetAllMocks(); vi.mocked(api.get).mockImplementation(async path => path.includes("/keys?") ? codes : { total: 2, pageSize: 10, items: codes.map(externalCode => ({ externalCode, origin: "IMPORTED", updatedAt: "2026-09-16T12:00:00Z" })) }); vi.mocked(api.post).mockResolvedValue({ count: 1 }) })
const mount = () => render(<QueryClientProvider client={new QueryClient()}><NeArchivePanel /></QueryClientProvider>)
describe("exclusão de cópias das NEs", () => {
  it("asks for confirmation and deletes only selected codes", async () => {
    mount(); fireEvent.click(await screen.findByLabelText(`Selecionar ${codes[0]}`))
    fireEvent.click(screen.getByRole("button", { name: "Excluir selecionadas (1)" }))
    expect(await screen.findByRole("dialog")).toHaveTextContent("Excluir 1 NE(s)")
    expect(api.post).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/financial-execution/discovery/archive/delete-selected", { codes: [codes[0]] }))
  })
  it("snapshots all filtered keys before confirming bulk deletion", async () => {
    mount(); await screen.findByLabelText(`Selecionar ${codes[0]}`)
    fireEvent.click(screen.getByRole("button", { name: "Excluir todas do filtro" }))
    expect(await screen.findByRole("dialog")).toHaveTextContent("Excluir 2 NE(s)")
    expect(api.post).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/financial-execution/discovery/archive/delete-selected", { codes }))
  })
})
