import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DeliveryReportBuilder } from "./delivery-report-builder"
const mocks = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), preview: vi.fn(), list: vi.fn() }))
vi.mock("../projects.service", () => ({ projectsService: { deliveryReportDraft: mocks.get, updateDeliveryReportDraft: mocks.save, previewDeliveryReport: mocks.preview } }))
vi.mock("@/features/evidences/evidences.service", () => ({ evidencesService: { list: mocks.list } }))
const data = { project: { id: "p1", projectCode: 1, title: "Projeto de teste" }, draft: { version: 2, sections: [{ key: "scope", title: "Escopo técnico", content: "", included: true, reviewed: false }], itemDetails: [], formalization: { requiresOmAcknowledgement: false } }, items: [], documents: {}, readiness: {} }
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><DeliveryReportBuilder projectId="p1" canManage finalization={<button>Emitir versão final</button>} /></QueryClientProvider>)
}
describe("editor modular da entrega", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.get.mockResolvedValue(data); mocks.save.mockImplementation(async (_id, draft) => ({ ...data, draft })); mocks.list.mockResolvedValue([]); mocks.preview.mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })); URL.createObjectURL = vi.fn(() => "blob:preview"); URL.revokeObjectURL = vi.fn() })
  it("exibe um módulo por vez, salva e usa alterações não salvas na prévia", async () => {
    const user = userEvent.setup(); setup()
    await user.click(await screen.findByRole("button", { name: "Escopo técnico" }))
    await user.type(screen.getByPlaceholderText("Redija o conteúdo técnico deste bloco em linguagem formal e objetiva."), "Novo conteúdo técnico")
    await user.click(screen.getByRole("button", { name: "Visualizar prévia atual" }))
    await waitFor(() => expect(mocks.preview).toHaveBeenCalledWith("p1", expect.objectContaining({ sections: [expect.objectContaining({ content: "Novo conteúdo técnico" })] })))
    expect(mocks.save).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: "Salvar memória técnica" }))
    await waitFor(() => expect(mocks.save).toHaveBeenCalledOnce())
    await user.click(screen.getByRole("button", { name: "Emissão e aprovação" }))
    expect(screen.getByRole("button", { name: "Emitir versão final" })).toBeEnabled()
    expect(screen.queryByPlaceholderText("Redija o conteúdo técnico deste bloco em linguagem formal e objetiva.")).not.toBeInTheDocument()
  })
  it("impede emissão quando há alterações não salvas e consulta o acervo existente", async () => {
    const user = userEvent.setup(); setup()
    await user.click(await screen.findByRole("button", { name: "Escopo técnico" }))
    await user.type(screen.getByPlaceholderText("Redija o conteúdo técnico deste bloco em linguagem formal e objetiva."), "Alteração")
    await user.click(screen.getByRole("button", { name: "Emissão e aprovação" }))
    expect(screen.getByRole("button", { name: "Emitir versão final" })).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Evidências e anexos" }))
    expect(await screen.findByText(/Adicione os arquivos na aba Evidências/)).toBeInTheDocument()
    expect(mocks.list).toHaveBeenCalledWith("p1")
  })
  it("baixa a versão para aprovação em DOC e PDF sem salvar ou emitir", async () => {
    const user = userEvent.setup(); setup()
    await user.click(await screen.findByRole("button", { name: "Para aprovação (.doc)" }))
    await waitFor(() => expect(mocks.preview).toHaveBeenCalledWith("p1", data.draft, "doc"))
    await user.click(screen.getByRole("button", { name: "Para aprovação (.pdf)" }))
    await waitFor(() => expect(mocks.preview).toHaveBeenCalledWith("p1", data.draft, "pdf"))
    expect(mocks.save).not.toHaveBeenCalled()
  })

})
