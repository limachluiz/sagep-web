import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router"

import App from "@/app/App"

function renderSetup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/setup"]}><App /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("SetupPage", () => {
  afterEach(() => vi.restoreAllMocks())

  it("exibe o assistente quando o banco ainda não possui usuários", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      requiresSetup: true,
      setupTokenConfigured: true,
    }), { status: 200, headers: { "Content-Type": "application/json" } }))

    renderSetup()

    expect(await screen.findByRole("heading", { name: "Configurar o SAGEP" })).toBeInTheDocument()
    expect(screen.getByLabelText("Chave de instalação")).toBeRequired()
    expect(screen.getByRole("button", { name: /Concluir configuração/ })).toBeEnabled()
  })

  it("informa quando a chave ainda não está configurada no servidor", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      requiresSetup: true,
      setupTokenConfigured: false,
    }), { status: 200, headers: { "Content-Type": "application/json" } }))

    renderSetup()

    expect(await screen.findByText((_, element) => element?.tagName === "P" && (element.textContent?.includes("Defina SAGEP_SETUP_TOKEN no servidor") ?? false))).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Concluir configuração/ })).toBeDisabled()
  })
})
