import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router"

import App from "@/app/App"
import { Toaster } from "@/components/ui/sonner"
import { useAuthStore } from "@/features/auth/auth.store"

const authenticatedUser = {
  id: "user-admin",
  name: "Administrador SAGEP",
  email: "admin@sagep.com",
  role: "ADMIN" as const,
  permissions: ["dashboard.view_operational", "sessions.manage_own"],
  access: {
    role: "ADMIN" as const,
    permissions: ["dashboard.view_operational", "sessions.manage_own"],
    isAdmin: true,
  },
}

function renderApplication() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/login"]}>
        <App />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().logout()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("autentica, valida o usuário e abre o dashboard", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url.endsWith("/auth/login") && init?.method === "POST") {
        expect(JSON.parse(String(init.body))).toEqual({
          email: "admin@sagep.com",
          password: "123456",
        })

        return new Response(
          JSON.stringify({
            accessToken: "access-token",
            refreshToken: "refresh-token",
            user: authenticatedUser,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      }

      if (url.endsWith("/auth/me") && init?.method === "GET") {
        expect(new Headers(init.headers).get("Authorization")).toBe(
          "Bearer access-token",
        )

        return new Response(JSON.stringify(authenticatedUser), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }

      throw new Error(`Requisição inesperada: ${init?.method} ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    renderApplication()

    await user.type(screen.getByLabelText("Senha"), "123456")
    await user.click(screen.getByRole("button", { name: /entrar no sistema/i }))

    expect(await screen.findByText("Visão geral da operação")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })
  })

  it("mantém o usuário no login quando as credenciais são inválidas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ message: "E-mail ou senha inválidos" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )

    const user = userEvent.setup()
    renderApplication()

    await user.type(screen.getByLabelText("Senha"), "senha-errada")
    await user.click(screen.getByRole("button", { name: /entrar no sistema/i }))

    expect(await screen.findByText("E-mail ou senha inválidos")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Acesse sua conta" })).toBeInTheDocument()

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })
})
