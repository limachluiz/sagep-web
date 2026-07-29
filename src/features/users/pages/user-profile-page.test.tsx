import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router"

import { useAuthStore } from "@/features/auth/auth.store"
import type { AuthUser } from "@/features/auth/auth.types"
import { UserProfilePage } from "./user-profile-page"

const profile: AuthUser = {
  id: "user-1",
  userCode: 7,
  name: "Luiz Henrique Chagas de Lima",
  email: "luiz@sagep.mil.br",
  rank: "3º Sgt",
  cpf: "12345678909",
  role: "ADMIN",
  active: true,
  createdAt: "2026-01-10T12:00:00.000Z",
  lastLoginAt: "2026-07-29T22:00:00.000Z",
  permissions: ["projects.view_all", "users.manage"],
  access: {
    role: "ADMIN",
    isAdmin: true,
    permissions: ["projects.view_all", "users.manage"],
    groups: [
      {
        name: "Projetos",
        permissions: [{
          code: "projects.view_all",
          module: "projects",
          action: "view_all",
          description: "Visualizar todos os projetos",
          critical: false,
        }],
      },
      {
        name: "Usuários",
        permissions: [{
          code: "users.manage",
          module: "users",
          action: "manage",
          description: "Administrar usuários",
          critical: true,
        }],
      },
    ],
  },
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("UserProfilePage", () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth({
      user: profile,
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it("shows account data, groups and searchable effective permissions", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole("heading", { name: "Perfil e acessos" })).toBeInTheDocument()
    expect(screen.getByText("Luiz Henrique Chagas de Lima")).toBeInTheDocument()
    expect(screen.getByText("***.456.789-**")).toBeInTheDocument()
    expect(screen.getByText("2 grupos de acesso")).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Permissões (2)" }))
    expect(screen.getByText("Visualizar todos os projetos")).toBeInTheDocument()
    expect(screen.getByText("Administrar usuários")).toBeInTheDocument()

    await user.type(screen.getByRole("textbox", { name: "Buscar permissão" }), "projetos")
    expect(screen.getByText("Visualizar todos os projetos")).toBeInTheDocument()
    expect(screen.queryByText("Administrar usuários")).not.toBeInTheDocument()
  })
})
