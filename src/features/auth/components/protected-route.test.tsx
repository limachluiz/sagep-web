import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router"

import { ProtectedRoute } from "@/features/auth/components/protected-route"
import { useAuthStore } from "@/features/auth/auth.store"

const authenticatedUser = {
  id: "user-admin",
  name: "Administrador SAGEP",
  email: "admin@sagep.com",
  role: "ADMIN" as const,
  permissions: [],
}

function renderProtectedRoute(
  configureQueryClient?: (queryClient: QueryClient) => void,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  configureQueryClient?.(queryClient)

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<p>Área protegida</p>} />
          </Route>
          <Route path="/login" element={<p>Tela de login</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().setAuth({
      user: authenticatedUser,
      accessToken: "access-token",
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    useAuthStore.getState().logout()
  })

  it("mantém a sessão e permite tentar novamente quando o backend está indisponível", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch")
      }),
    )

    const user = userEvent.setup()
    renderProtectedRoute()

    expect(
      await screen.findByRole("heading", {
        name: "Não foi possível validar a sessão",
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Não foi possível conectar ao servidor do SAGEP/i),
    ).toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    await user.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    )

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("mantém o login acessível quando não há sessão e o backend está indisponível", async () => {
    useAuthStore.getState().logout()
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch")
      }),
    )

    renderProtectedRoute()

    expect(await screen.findByText("Tela de login")).toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Não foi possível validar a sessão" }),
    ).not.toBeInTheDocument()
  })

  it("mantém a área protegida visível durante atualização da sessão em segundo plano", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)))

    renderProtectedRoute((queryClient) => {
      queryClient.setQueryData(["auth", "me"], authenticatedUser)
    })

    expect(screen.getByText("Área protegida")).toBeInTheDocument()
    expect(screen.queryByText("Validando sessão...")).not.toBeInTheDocument()
  })

  it("encerra a sessão quando a API rejeita as credenciais", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ message: "Sessão expirada" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )

    renderProtectedRoute()

    expect(await screen.findByText("Tela de login")).toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
