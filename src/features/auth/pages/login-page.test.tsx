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
  warName: "Lima",
  rank: "3º Sgt",
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

  it("autentica, valida o usuário e abre a página inicial", async () => {
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

      if (url.includes("/dashboard/operational") && init?.method === "GET") {
        return new Response(
          JSON.stringify({
            generatedAt: new Date().toISOString(),
            filters: { staleDays: 15, limit: 100 },
            alerts: {
              summary: {
                total: 0,
                bySeverity: { CRITICAL: 0, WARNING: 0, INFO: 0 },
                byCategory: {},
              },
              bySeverity: {},
              byCategory: {},
              items: [],
            },
            staleProjects: [],
            pendingByStage: {
              awaitingCreditNote: 0,
              awaitingDiex: 0,
              awaitingCommitmentNote: 0,
              awaitingServiceOrder: 0,
              awaitingExecutionStart: 0,
              awaitingAsBuilt: 0,
              awaitingInvoiceAttestation: 0,
            },
            inventory: {
              summary: {
                totalItems: 0,
                lowStockItems: 0,
                insufficientItems: 0,
                itemsWithActiveReserve: 0,
                itemsWithActiveConsumption: 0,
                recentReversals: 0,
                staleReservations: 0,
                totalReservedAmount: "0.00",
                totalConsumedAmount: "0.00",
                totalAvailableAmount: "0.00",
              },
              criticalItems: [],
              staleReservations: [],
              recentReversals: [],
            },
            operationalQueue: [],
            frequentNextActions: [],
            latestMovements: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      }

      if (url.includes("/operational-alerts") && init?.method === "GET") {
        return new Response(
          JSON.stringify({
            generatedAt: new Date().toISOString(),
            summary: { total: 0, bySeverity: { CRITICAL: 0, WARNING: 0, INFO: 0 }, byCategory: {} },
            alerts: [],
            inventoryAlerts: { lowStock: [], insufficient: [] },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      }

      throw new Error(`Requisição inesperada: ${init?.method} ${url}`)
    })

    vi.stubGlobal("fetch", fetchMock)
    const user = userEvent.setup()
    renderApplication()

    await user.type(await screen.findByLabelText("Senha"), "123456")
    await user.click(screen.getByRole("button", { name: /entrar no sistema/i }))

    await waitFor(() => {
      expect(document.querySelector("main")).toBeInTheDocument()
    }, { timeout: 5_000 })
    expect(await screen.findByRole("button", {
      name: /Abrir menu da conta de 3º Sgt Lima/i,
    })).toBeInTheDocument()
    expect(
      screen.getAllByRole("img", {
        name: /Brasão do 4º Centro de Telemática de Área/i,
      }).length,
    ).toBeGreaterThan(0)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/me$/),
      expect.objectContaining({ method: "GET" }),
    )
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

    expect(
      screen.getAllByRole("img", {
        name: /Brasão do 4º Centro de Telemática de Área/i,
      }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText("Sistema de Apoio à Gestão de Projetos").length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText("Desenvolvido pelo 2º Ten Luiz - 4º CTA"),
    ).toBeInTheDocument()

    await user.type(await screen.findByLabelText("Senha"), "senha-errada")
    await user.click(screen.getByRole("button", { name: /entrar no sistema/i }))

    expect(await screen.findByText("E-mail ou senha inválidos")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Acesso ao sistema" })).toBeInTheDocument()

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })
})
